// src/App.tsx
// Auth0 handles login/signup/verification/password-reset via its own hosted
// Universal Login page for web users. ResetPassword and VerifyEmail pages are
// kept as lightweight public routes for mobile (JWT/SendGrid) users.

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import GoalsPage from './pages/GoalsPage';
import ProgressPage from './pages/ProgressPage';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';

// Catch-all for unmatched URLs. Collapses accidental double slashes
// (e.g. a trailing-slash CLIENT_URL producing domain//something), then
// falls back to the landing page for anything else.
function CatchAll() {
  const { pathname, search } = useLocation();
  if (/\/{2,}/.test(pathname)) {
    return <Navigate to={pathname.replace(/\/{2,}/g, '/') + search} replace />;
  }
  return <Navigate to="/" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      <Route path="/onboarding" element={<ProtectedRoute component={OnboardingPage} />} />
      <Route path="/Dashboard" element={<ProtectedRoute component={DashboardPage} />} />
      <Route path="/goals" element={<ProtectedRoute component={GoalsPage} />} />
      <Route path="/progress" element={<ProtectedRoute component={ProgressPage} />} />
      <Route path="/settings" element={<ProtectedRoute component={SettingsPage} />} />
      <Route path="*" element={<CatchAll />} />
    </Routes>
  );
}

export default App;
