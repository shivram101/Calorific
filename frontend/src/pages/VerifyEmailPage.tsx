// src/pages/VerifyEmailPage.tsx
// FIX: Original sent token as ?token= query param.
// API expects it as a path param: GET /api/verify-email/:token
// Also updated to use the centralized API client.
//
// The verify link in the email points to /verify-email/<token> (path-based).
// This page reads the token from the URL path using useParams().
// App.tsx route must be: <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { verifyEmail } from '../api/client';

function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }

    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err: Error) => {
        setStatus('error');
        setMessage(err.message || 'Verification failed. The link may have expired.');
      });
  }, [token]);

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
          padding: '44px 34px',
          width: '100%',
          maxWidth: '380px',
          boxShadow: '0 10px 28px rgba(0,0,0,0.07)',
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
        }}
      >
        {status === 'loading' && (
          <>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>⏳</div>
            <h1 style={{ fontSize: '19px', fontWeight: 600, color: '#2D2A26', margin: 0 }}>Verifying your email...</h1>
            <p style={{ fontSize: '13px', color: '#777167', marginTop: '10px' }}>Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#2D2A26', margin: 0 }}>Email verified!</h1>
            <p style={{ fontSize: '13px', color: '#777167', marginTop: '10px', lineHeight: 1.6 }}>
              Your account is now active. You can log in and get started.
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
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>❌</div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#2D2A26', margin: 0 }}>Verification failed</h1>
            <p style={{ fontSize: '13px', color: '#777167', marginTop: '10px', lineHeight: 1.6 }}>{message}</p>
            <a
              href="/signup"
              style={{
                display: 'block',
                background: '#FFF8ED',
                color: '#2D2A26',
                border: 'none',
                borderRadius: '14px',
                padding: '13px',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                marginTop: '24px',
              }}
            >
              Back to sign up
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmailPage;
