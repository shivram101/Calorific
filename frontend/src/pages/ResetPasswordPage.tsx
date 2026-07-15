// src/pages/ResetPasswordPage.tsx
// FIXED: Was reading token as ?token= query param — API expects it as path param.
// Also updated to use centralized API client and check data.error not data.message.

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { resetPassword } from '../api/client';

function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: any) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (!token) {
      setError('Missing or invalid reset link');
      return;
    }

    try {
      // Calls POST /api/reset-password/:token with { newPassword } — matches the backend
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FFF8ED',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', fontSize: '110px', top: '-30px', left: '-30px', opacity: 0.5 }}>🍃</div>
      <div style={{ position: 'absolute', fontSize: '90px', bottom: '-20px', right: '-10px', opacity: 0.5 }}>🥑</div>

      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '40px 34px',
          width: '100%',
          maxWidth: '380px',
          boxShadow: '0 10px 28px rgba(0,0,0,0.07)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {!success ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '26px' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔒</div>
              <h1 style={{ fontSize: '21px', fontWeight: 600, color: '#2D2A26', margin: 0 }}>Reset password</h1>
              <p style={{ fontSize: '12px', color: '#777167', marginTop: '5px' }}>
                Enter your new password below
              </p>
            </div>

            {error && (
              <div
                style={{
                  background: '#FDF0EE',
                  border: '1px solid #DC4C3F',
                  color: '#c24337',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '13px',
                  marginBottom: '18px',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <label htmlFor="reset-password" style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#2D2A26', marginBottom: '6px' }}>
                New password
              </label>
              <div
                style={{
                  background: '#FFF8ED',
                  borderRadius: '12px',
                  padding: '11px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '14px',
                }}
              >
                <i className="ti ti-lock" style={{ fontSize: '15px', color: '#b5ac9d' }} aria-hidden="true"></i>
                <input
                  id="reset-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '13px',
                    color: '#2D2A26',
                    width: '100%',
                  }}
                  required
                />
              </div>

              <label htmlFor="reset-confirm-password" style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#2D2A26', marginBottom: '6px' }}>
                Confirm new password
              </label>
              <div
                style={{
                  background: '#FFF8ED',
                  borderRadius: '12px',
                  padding: '11px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '20px',
                }}
              >
                <i className="ti ti-lock" style={{ fontSize: '15px', color: '#b5ac9d' }} aria-hidden="true"></i>
                <input
                  id="reset-confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '13px',
                    color: '#2D2A26',
                    width: '100%',
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  background: '#188159',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '13px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(31,168,115,0.3)',
                }}
              >
                Reset password
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#2D2A26', margin: 0 }}>Password reset!</h1>
            <p style={{ fontSize: '13px', color: '#777167', marginTop: '10px', lineHeight: 1.6 }}>
              Your password has been updated successfully.
            </p>
            <a
              href="/login"
              style={{
                display: 'block',
                background: '#188159',
                color: '#fff',
                border: 'none',
                borderRadius: '14px',
                padding: '13px',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                marginTop: '24px',
                boxShadow: '0 6px 16px rgba(31,168,115,0.3)',
              }}
            >
              Go to log in
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResetPasswordPage;
