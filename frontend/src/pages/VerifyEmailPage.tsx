import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`http://localhost:5000/api/verify-email?token=${token}`, {
          method: 'GET',
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus('error');
          setMessage(data.message || 'Verification failed. The link may have expired.');
        } else {
          setStatus('success');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Server error. Please try again later.');
      }
    }

    verify();
  }, [searchParams]);

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
            <p style={{ fontSize: '13px', color: '#8A8378', marginTop: '10px' }}>
              Please wait a moment.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#2D2A26', margin: 0 }}>Email verified!</h1>
            <p style={{ fontSize: '13px', color: '#8A8378', marginTop: '10px', lineHeight: 1.6 }}>
              Your account is now active. You can log in and get started.
            </p>
            <a
              href="/login"
              style={{
                display: 'block',
                background: '#1FA873',
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
            <p style={{ fontSize: '13px', color: '#8A8378', marginTop: '10px', lineHeight: 1.6 }}>
              {message}
            </p>
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