import { datasourceKeyType } from "./api/types";

const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  // remove all the console logs in production
  console.log = function () {};
}

//names
export const APP_NAME = "sysreview";
export const ANALYSER_APP_NAME = "argus";

//api
export const API_URI = isProd
  ? `/${APP_NAME}/api/v1`
  : `http://localhost:8080/${APP_NAME}/api/v1`;

export const ANALYSER_API_URI = isProd
  ? `/${ANALYSER_APP_NAME}/openapp`
  : "http://sysrev2.cs.binghamton.edu:3002/openapp";

//assets
export const APP_URI_PREFIX = `/${APP_NAME}/ui`;
export const IMAGE_URI_PREFIX = `/${APP_NAME}/images`;

export const ENABLE_LOCAL_AUTH_FALLBACK =
  String(process.env.REACT_APP_ENABLE_LOCAL_AUTH_FALLBACK || 'false').toLowerCase() === 'true';

export const PORTAL_HOME_URL = process.env.REACT_APP_PORTAL_HOME_URL || '/';

export const buildGatewayLoginUrl = (nextPath: string = APP_URI_PREFIX + '/dashboard') => {
  const base = process.env.REACT_APP_GATEWAY_LOGIN_URL || '/unified-login.html';
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}app=${APP_NAME}&next=${encodeURIComponent(nextPath)}`;
};

export const datasourcesLogos: { [key in datasourceKeyType]: string } = {
  IEEE: `${IMAGE_URI_PREFIX}/ieee_logo.svg`,
  PUBMED: `${IMAGE_URI_PREFIX}/pubmed_logo.svg`,
  WOS: `${IMAGE_URI_PREFIX}/wos_logo.svg`,
  SCOPUS: `${IMAGE_URI_PREFIX}/scopus_logo.svg`,
  MANUAL: "",
};

//external links
export const DOCS_URI = `https://${APP_NAME}.readthedocs.io/en/latest/index.html`;
export const AUTHORS_URI = `https://${APP_NAME}.readthedocs.io/en/latest/about/authors.html`;
export const TUTORIAL_URI = `https://${APP_NAME}.readthedocs.io/en/latest/tutorials/index.html`;
export const ANALYSER_DOCS_URI = `https://${ANALYSER_APP_NAME}.readthedocs.io/en/latest/index.html`;
