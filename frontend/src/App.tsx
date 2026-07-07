// src/App.tsx
// FIX: /verify-email route changed to /verify-email/:token (path param)
// so VerifyEmailPage can read the token via useParams() instead of useSearchParams().
// This matches the API endpoint: GET /api/verify-email/:token

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import OnboardingPage from './pages/OnboardingPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import DashboardPage from './pages/DashboardPage';
import GoalsPage from './pages/GoalsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/Dashboard" element={<DashboardPage />} />
        <Route path="/goals" element={<GoalsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
