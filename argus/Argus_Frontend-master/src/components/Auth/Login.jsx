import {
  Box,
  Button,
  VStack,
  Heading,
  Text,
  Link,
  Container,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';

const Login = () => {
  const unifiedLoginUrl = '/unified-login.html?app=argus';
  const directBridgeUrl = 'https://sysrev.cs.binghamton.edu/api/sso/login/?email=researcher@example.edu&next=/argus/home';

  return (
    <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
      <Box
        py={{ base: '8', sm: '8' }}
        px={{ base: '4', sm: '10' }}
        bg="white"
        boxShadow="lg"
        borderRadius="xl"
      >
        <VStack spacing="6" align="stretch">
          <Heading color="brand.700" textAlign="center">Unified Sign In for ARGUS</Heading>
          <Text color="gray.600" textAlign="center">
            ARGUS is being converged into the shared platform login flow. Use the unified portal to sign in once and launch into the app.
          </Text>

          <Button
            as="a"
            href={unifiedLoginUrl}
            colorScheme="brand"
            size="lg"
            fontSize="md"
            w="full"
          >
            Continue to Unified Login
          </Button>

          <Box borderWidth="1px" borderRadius="lg" p="4" bg="gray.50">
            <Text fontWeight="bold" mb="2">Bridge status</Text>
            <Text color="gray.600" fontSize="sm">
              The copied ARGUS backend already exposes shared-login bridge endpoints under <code>/api/sso/login/</code> and <code>/api/sso/callback/</code>.
            </Text>
          </Box>

          <Text color="gray.500" fontSize="sm" textAlign="center">
            For backend-only bridge testing, you can also open the direct mock bridge URL below.
          </Text>
          <Link href={directBridgeUrl} color="brand.600" fontSize="sm" textAlign="center" isExternal>
            Open direct ARGUS mock SSO bridge <ExternalLinkIcon mx="2px" />
          </Link>
        </VStack>
      </Box>
    </Container>
  );
};

export default Login;
