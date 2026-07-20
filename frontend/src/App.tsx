// src/App.tsx
// FIX: /verify-email route changed to /verify-email/:token (path param)
// so VerifyEmailPage can read the token via useParams() instead of useSearchParams().
// This matches the API endpoint: GET /api/verify-email/:token

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { getToken } from './api/client';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import OnboardingPage from './pages/OnboardingPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import DashboardPage from './pages/DashboardPage';
import GoalsPage from './pages/GoalsPage';
import ProgressPage from './pages/ProgressPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SettingsPage from './pages/SettingsPage';

// Wraps pages that need a logged-in user: if there's no JWT in storage,
// redirect to /login instead of rendering an empty page.
function RequireAuth({ children }: { children: React.ReactElement }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

// Catch-all for unmatched URLs. Email links can arrive with duplicate slashes
// (e.g. a CLIENT_URL with a trailing slash produces domain//verify-email/...),
// which would otherwise render a blank page. Collapse the slashes and retry;
// anything else goes to the landing page.
function CatchAll() {
  const { pathname, search } = useLocation();
  if (/\/{2,}/.test(pathname)) {
    return <Navigate to={pathname.replace(/\/{2,}/g, '/') + search} replace />;
  }
  return <Navigate to="/" replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/Dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path="/goals" element={<RequireAuth><GoalsPage /></RequireAuth>} />
        <Route path="/progress" element={<RequireAuth><ProgressPage /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
        <Route path="*" element={<CatchAll />} />
      </Routes>
    </Router>
  );
}

export default App;
