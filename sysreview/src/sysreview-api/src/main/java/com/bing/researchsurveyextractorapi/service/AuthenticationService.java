package com.bing.researchsurveyextractorapi.service;

import com.bing.researchsurveyextractorapi.exceptions.UserDoesNotExistException;
import com.bing.researchsurveyextractorapi.mapper.UserMapper;
import com.bing.researchsurveyextractorapi.models.User;
import com.bing.researchsurveyextractorapi.models.UserRole;
import com.bing.researchsurveyextractorapi.pojo.auth.AuthenticationRequest;
import com.bing.researchsurveyextractorapi.pojo.auth.AuthenticationResponse;
import com.bing.researchsurveyextractorapi.pojo.auth.PasswordChangeRequest;
import com.bing.researchsurveyextractorapi.pojo.auth.RegisterRequest;
import com.bing.researchsurveyextractorapi.pojo.user.UserRequest;
import com.bing.researchsurveyextractorapi.util.AuthUtils;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JWTService jwtService;
    private final AuthenticationManager authenticationManager;

    @Value("${gateway.session.secret:}")
    private String gatewaySessionSecret;

    public AuthenticationResponse register(RegisterRequest request) {
        String authError = null;
        if (userService.checkUserExistsByUsername(request.getUsername())) {
            authError = String.format("Username already exists: %s", request.getUsername());
        } else if (userService.checkUserExistsByEmail(request.getEmail())) {
            authError = String.format("Email already exists: %s", request.getEmail());
        }
        if (authError != null) {
            return AuthenticationResponse.builder()
                    .authToken(authError)
                    .build();
        } else {
            UserRequest user = UserRequest.builder()
                    .firstName(request.getFirstName())
                    .lastName(request.getLastName())
                    .email(request.getEmail())
                    .username(request.getUsername())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .userRole(UserRole.USER)
                    .build();
            User createdUser = userService.createUser(user);
            return generateAuthResponse(createdUser);
        }
    }


    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        String authError;
        try {
//            1. Find the user, if not we get an exception that user doesn't exist
            User user = userService.loadUserByUsername(request.getUsername());
//            2. Authenticate user's request, if it fails we get an exception that credentials are incorrect (password) since user exists
            authenticationManager.authenticate(createUserAuthToken(request));
//            3. Generate authentication response based on user's details, since we have authenticated and reached this step
            return generateAuthResponse(user);
        } catch (BadCredentialsException badCredentialsException) {
            authError = "[Bad credentials] Incorrect password!";
        } catch (UserDoesNotExistException userDoesNotExistException) {
            authError = String.format("User: %s doesn't exist!", request.getUsername());
        }
        return AuthenticationResponse.builder()
                .authenticated(false)
                .authToken(authError)
                .build();
    }

    public AuthenticationResponse authenticateSharedIdentityFromGatewayToken(String gatewayToken) {
        Map<String, Object> identity;
        try {
            identity = validateGatewayToken(gatewayToken);
        } catch (Exception exception) {
            return AuthenticationResponse.builder()
                    .authenticated(false)
                    .authToken("Invalid trusted identity token")
                    .build();
        }

        String email = (String) identity.get("email");
        String fullName = (String) identity.getOrDefault("name", "Shared User");
        String[] names = fullName.split(" ", 2);
        String firstName = names.length > 0 ? names[0] : "Shared";
        String lastName = names.length > 1 ? names[1] : "User";

        User existingUser = userService.findUserByEmail(email);
        if (existingUser != null) {
            return generateAuthResponse(existingUser);
        }

        String derivedUsername = email.split("@")[0];
        String candidateUsername = derivedUsername;
        int counter = 1;
        while (userService.checkUserExistsByUsername(candidateUsername)) {
            candidateUsername = derivedUsername + counter;
            counter++;
        }

        UserRequest user = UserRequest.builder()
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .username(candidateUsername)
                .password(passwordEncoder.encode("shared-login-placeholder"))
                .userRole(UserRole.USER)
                .build();
        User createdUser = userService.createUser(user);
        return generateAuthResponse(createdUser);
    }

    private Map<String, Object> validateGatewayToken(String gatewayToken) throws Exception {
        if (gatewaySessionSecret == null || gatewaySessionSecret.isBlank()) {
            throw new IllegalStateException("gateway.session.secret must be configured");
        }

        String[] parts = gatewayToken.split("\\.", 2);
        if (parts.length != 2) {
            throw new IllegalArgumentException("Malformed token");
        }

        String payloadPart = parts[0];
        String signaturePart = parts[1];

        Mac hmac = Mac.getInstance("HmacSHA256");
        hmac.init(new SecretKeySpec(gatewaySessionSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] signature = hmac.doFinal(payloadPart.getBytes(StandardCharsets.UTF_8));
        String expectedSignature = Base64.getUrlEncoder().withoutPadding().encodeToString(signature);

        if (!expectedSignature.equals(signaturePart)) {
            throw new IllegalArgumentException("Invalid signature");
        }

        String payloadJson = new String(Base64.getUrlDecoder().decode(payloadPart), StandardCharsets.UTF_8);
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> payload = mapper.readValue(payloadJson, new TypeReference<Map<String, Object>>() {});

        Number exp = (Number) payload.get("exp");
        if (exp == null || exp.longValue() < (System.currentTimeMillis() / 1000L)) {
            throw new IllegalArgumentException("Token expired");
        }
        if (payload.get("email") == null || payload.get("sub") == null) {
            throw new IllegalArgumentException("Missing required claims");
        }
        return payload;
    }

    public void updatePassword(PasswordChangeRequest request) {
        String username = AuthUtils.getLoggedInUsername();
        authenticationManager.authenticate(createUserAuthToken(getAuthenticationRequest(username, request.getOldPassword())));
        userService.changePassword(username, request.getNewPassword());
    }

    private static AuthenticationRequest getAuthenticationRequest(String username, String password) {
        return new AuthenticationRequest(username, password);
    }

    private static UsernamePasswordAuthenticationToken createUserAuthToken(AuthenticationRequest request) {
        return new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword());
    }

    private AuthenticationResponse generateAuthResponse(User user) {
//        Create ObjectMapper instance
        ObjectMapper mapper = new ObjectMapper();
//        Converting POJO to Map
        Map<String, Object> userJson = mapper.convertValue(UserMapper.toDto(user), new TypeReference<Map<String, Object>>() {
        });
//        Creating auth token
        String authToken = jwtService.generateToken(user, userJson);
        return AuthenticationResponse.builder()
                .authenticated(true)
                .authToken(authToken)
                .build();
    }

}
