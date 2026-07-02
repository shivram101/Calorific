import { useState } from 'react';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleLogin(e: any) {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Login failed');
      } else {
        localStorage.setItem('token', data.token);
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError('Server error. Please try again.');
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
      {/* Decorative food emoji */}
      <div style={{ position: 'absolute', fontSize: '110px', top: '-30px', left: '-30px', opacity: 0.5 }}>🍃</div>
      <div style={{ position: 'absolute', fontSize: '90px', bottom: '-20px', right: '-10px', opacity: 0.5 }}>🥑</div>
      <div style={{ position: 'absolute', fontSize: '60px', top: '65%', left: '6%', opacity: 0.4 }}>🍊</div>
      <div style={{ position: 'absolute', fontSize: '50px', top: '10%', right: '12%', opacity: 0.35 }}>🍓</div>

      {/* Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '44px 36px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.07)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🥗</div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#2D2A26', margin: 0 }}>Calorific</h1>
          <p style={{ fontSize: '13px', color: '#8A8378', marginTop: '6px' }}>Good food starts here</p>
        </div>

        {error && (
          <div
            style={{
              background: '#FDF0EE',
              border: '1px solid #DC4C3F',
              color: '#DC4C3F',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '13px',
              marginBottom: '18px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#2D2A26', marginBottom: '6px' }}>
              Email address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: '100%',
                background: '#FFF8ED',
                border: '1px solid transparent',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                color: '#2D2A26',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.border = '1px solid #1FA873')}
              onBlur={e => (e.target.style.border = '1px solid transparent')}
              required
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: '#2D2A26' }}>Password</label>
              <a href="/forgot-password" style={{ fontSize: '12px', color: '#1FA873', textDecoration: 'none' }}>
                Forgot password?
              </a>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width: '100%',
                background: '#FFF8ED',
                border: '1px solid transparent',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                color: '#2D2A26',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.border = '1px solid #1FA873')}
              onBlur={e => (e.target.style.border = '1px solid transparent')}
              required
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              background: '#1FA873',
              color: '#fff',
              border: 'none',
              borderRadius: '14px',
              padding: '13px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '6px',
            }}
          >
            Log In
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#8A8378', marginTop: '22px' }}>
          Don't have an account?{' '}
          <a href="/signup" style={{ color: '#1FA873', fontWeight: 600, textDecoration: 'none' }}>
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;