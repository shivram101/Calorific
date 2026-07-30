// src/pages/VerifyEmailPage.tsx
// Public page for JWT-based email verification (mobile users via SendGrid email link).
// Web/Auth0 users never land here — Auth0 handles their verification natively.

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = 'https://calorific-api-begdg4bhf0gga5d2.northcentralus-01.azurewebsites.net';

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/verify-email/${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setStatus('success');
        setMessage('Email verified! Redirecting to login…');
        setTimeout(() => navigate('/login'), 2500);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.message);
      });
  }, [token]);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 400, margin: '80px auto', padding: '0 16px' }}>
      <h2>Email Verification</h2>
      {status === 'loading' && <p>Verifying your email…</p>}
      {status === 'success' && <p style={{ color: 'green' }}>{message}</p>}
      {status === 'error' && <p style={{ color: 'red' }}>{message}</p>}
    </div>
  );
}
