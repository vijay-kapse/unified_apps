  export const API_ENDPOINTS = {
    LOGIN: '/api/login/',
    REGISTER: '/api/register/',
    UPLOAD: '/api/upload/',
    RESULTS: '/api/results/',
    VIEW_DOCUMENT: (id) => `/api/view/${id}`,
    SAVE_SESSION: '/api/save_session/',
    LOAD_SESSION: '/api/load_session/',
  };

  export const ENABLE_LOCAL_AUTH_FALLBACK =
    String(process.env.REACT_APP_ENABLE_LOCAL_AUTH_FALLBACK || 'false').toLowerCase() === 'true';

  export const PORTAL_HOME_URL = process.env.REACT_APP_PORTAL_HOME_URL || '/';

  export const buildGatewayLoginUrl = (nextPath = '/home') => {
    const base = process.env.REACT_APP_GATEWAY_LOGIN_URL || '/unified-login.html';
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}app=argus&next=${encodeURIComponent(nextPath)}`;
  };
  
  export const FILE_TYPES = {
    PDF: 'application/pdf',
    WORD: 'application/msword',
    DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    TEXT: 'text/plain',
  };
