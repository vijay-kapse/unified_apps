import { useEffect } from "react";
import { validateToken } from "../api/utility";
import { buildGatewayLoginUrl } from "../constants";

const Protected = ({ children }) => {
  useEffect(() => {
    if (!validateToken()) {
      const nextPath = window.location.pathname + window.location.search;
      window.location.assign(buildGatewayLoginUrl(nextPath));
    }
  }, []);

  if (!validateToken()) {
    return null;
  }

  return <>{children}</>;
};

export default Protected;
