import { useState } from 'react';
import { forgotPassword } from '../api/client';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: any) {
    e.preventDefault();
    setError('');
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFF8ED', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', fontSize: '110px', top: '-30px', left: '-30px', opacity: 0.5 }}>🍃</div>
      <div style={{ position: 'absolute', fontSize: '90px', bottom: '-20px', right: '-10px', opacity: 0.5 }}>🥑</div>

      <div style={{ background: '#ffffff', borderRadius: '24px', padding: '40px 34px', width: '100%', maxWidth: '380px', boxShadow: '0 10px 28px rgba(0,0,0,0.07)', position: 'relative', zIndex: 1 }}>
        {!sent ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '26px' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔑</div>
              <h1 style={{ fontSize: '21px', fontWeight: 600, color: '#2D2A26', margin: 0 }}>Forgot password?</h1>
              <p style={{ fontSize: '12px', color: '#8A8378', marginTop: '5px' }}>No worries, we'll send you reset instructions</p>
            </div>

            {error && (
              <div style={{ background: '#FDF0EE', border: '1px solid #DC4C3F', color: '#DC4C3F', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', marginBottom: '18px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#2D2A26', marginBottom: '6px' }}>Email address</label>
              <div style={{ background: '#FFF8ED', borderRadius: '12px', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <i className="ti ti-mail" style={{ fontSize: '15px', color: '#b5ac9d' }} />
                <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: '#2D2A26', width: '100%' }} required />
              </div>
              <button type="submit" style={{ width: '100%', background: '#1FA873', color: '#fff', border: 'none', borderRadius: '14px', padding: '13px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 6px 16px rgba(31,168,115,0.3)' }}>
                Reset password
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📩</div>
            <h1 style={{ fontSize: '19px', fontWeight: 600, color: '#2D2A26', margin: 0 }}>Check your email</h1>
            <p style={{ fontSize: '13px', color: '#8A8378', marginTop: '10px', lineHeight: 1.6 }}>
              We've sent a password reset link to <strong style={{ color: '#2D2A26' }}>{email}</strong>
            </p>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#8A8378', marginTop: '22px' }}>
          <a href="/login" style={{ color: '#1FA873', fontWeight: 600, textDecoration: 'none' }}>← Back to log in</a>
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
