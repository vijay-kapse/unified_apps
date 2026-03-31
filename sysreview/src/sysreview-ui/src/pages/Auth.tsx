import { Button, Col, Container, Row } from "react-bootstrap";
import { IMAGE_URI_PREFIX, ENABLE_LOCAL_AUTH_FALLBACK, buildGatewayLoginUrl } from "../constants";
import { useEffect } from "react";

const Auth = () => {
  useEffect(() => {
    if (!ENABLE_LOCAL_AUTH_FALLBACK) {
      const nextPath = window.location.pathname + window.location.search;
      window.location.assign(buildGatewayLoginUrl(nextPath));
    }
  }, []);

  return (
    <div className="auth-page">
      <Container className="auth-wrapper rounded-5 shadow-lg">
        <Row>
          <Col>
            <img
              src={`${IMAGE_URI_PREFIX}/auth.png`}
              className="w-100 rounded p-4"
              alt="landing"
            />
          </Col>
          <Col className="d-flex justify-content-center align-items-center">
            <div className="p-4 d-flex flex-column gap-3 align-items-start">
              <h2>Unified Login for Sysreview</h2>
              <p>
                Sysreview uses the shared platform login entry. Continue to the gateway and return here with a shared identity session.
              </p>
              <Button
                className="c-btn-secondary py-2 px-4"
                href={buildGatewayLoginUrl(window.location.pathname)}
              >
                Continue to Unified Login
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Auth;
