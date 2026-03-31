  // src/Routes.jsx
  import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
  import { useEffect } from 'react';
  import Login from './components/Auth/Login';
  import Register from './components/Auth/Register';
  import HomePage from './components/Home/HomePage';
  import SearchResults from './components/SearchResults/SearchResults';
  import UploadPage from './components/Upload/UploadPage';
  import DocumentViewer from './components/SearchResults/DocumentViewer';
  import { useAuth } from './contexts/AuthContext';
  import { ENABLE_LOCAL_AUTH_FALLBACK, buildGatewayLoginUrl } from './utils/constants';

  const GatewayRedirect = ({ nextPath }) => {
    useEffect(() => {
      window.location.assign(buildGatewayLoginUrl(nextPath));
    }, [nextPath]);
    return null;
  };

  const PrivateRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    return isAuthenticated ? children : <GatewayRedirect nextPath={location.pathname + location.search} />;
  };

  const PublicRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (isAuthenticated) {
      return <Navigate to="/home" />;
    }

    if (!ENABLE_LOCAL_AUTH_FALLBACK) {
      return <GatewayRedirect nextPath={location.pathname + location.search} />;
    }

    return children;
  };

  const AppRoutes = () => {
    return (
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/results" element={<PrivateRoute><SearchResults /></PrivateRoute>} />
        <Route path="/upload" element={<PrivateRoute><UploadPage /></PrivateRoute>} />
        <Route path="/view/:id" element={<PrivateRoute><DocumentViewer /></PrivateRoute>} />

        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    );

  };

  export default AppRoutes;
