// src/pages/ResetPasswordPage.tsx
// Public page for JWT-based password reset (mobile users via SendGrid email link).
// Web/Auth0 users never land here — Auth0 handles their reset natively.

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = 'https://calorific-api-begdg4bhf0gga5d2.northcentralus-01.azurewebsites.net';

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setMessage('Passwords do not match.');
      setStatus('error');
      return;
    }
    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch(`${API_URL}/api/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed.');
      setStatus('success');
      setMessage('Password reset! Redirecting to login…');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message);
    }
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 400, margin: '80px auto', padding: '0 16px' }}>
      <h2>Reset Your Password</h2>
      {status === 'success' ? (
        <p style={{ color: 'green' }}>{message}</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label>
              New Password
              <br />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: 8, marginTop: 4 }}
                required
              />
            </label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>
              Confirm Password
              <br />
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                style={{ width: '100%', padding: 8, marginTop: 4 }}
                required
              />
            </label>
          </div>
          {status === 'error' && <p style={{ color: 'red' }}>{message}</p>}
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              background: '#1F3A5F',
              color: '#fff',
              padding: '10px 20px',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            {status === 'loading' ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      )}
    </div>
  );
}
