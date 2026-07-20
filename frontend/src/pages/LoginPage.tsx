// src/pages/LoginPage.tsx
import { useState } from 'react';
import { login, getProfile, resendVerification } from '../api/client';
import { AUTH_CSS, FLOATERS } from './AuthShared';

function LoginPage() {
  const [email,            setEmail]            = useState('');
  const [password,         setPassword]         = useState('');
  const [showPassword,     setShowPassword]     = useState(false);
  const [error,            setError]            = useState('');
  const [loading,          setLoading]          = useState(false);
  const [needsVerification,setNeedsVerification]= useState(false);
  const [resendStatus,     setResendStatus]     = useState<'idle'|'sending'|'sent'>('idle');

  async function handleLogin(e: any) {
    e.preventDefault();
    setError(''); setNeedsVerification(false); setLoading(true);
    try {
      await login(email, password);
      const profile = await getProfile();
      window.location.href = profile.goal ? '/Dashboard' : '/onboarding';
    } catch (err: any) {
      const msg = err.message || 'Login failed';
      setError(msg);
      if (msg.includes('verify your email')) setNeedsVerification(true);
    } finally { setLoading(false); }
  }

  async function handleResend() {
    setResendStatus('sending');
    try { await resendVerification(email); setResendStatus('sent'); }
    catch { setResendStatus('idle'); }
  }

  return (
    <main style={{ minHeight:'100vh', background:'linear-gradient(160deg,#FFF8ED 0%,#F0FBF6 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative', overflow:'hidden', fontFamily:"'Inter',Arial,sans-serif" }}>
      <style>{AUTH_CSS}</style>

      {FLOATERS.map(({ e, size, anim, dur, delay, ...pos }: any, i) => (
        <div key={i} style={{ position:'absolute', fontSize:size, opacity:0.13, animation:`${anim} ${dur} ease-in-out ${delay} infinite`, pointerEvents:'none', ...pos }}>{e}</div>
      ))}

      <div className="auth-card" style={{ background:'rgba(255,255,255,0.92)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', borderRadius:28, padding:'44px 38px', width:'100%', maxWidth:400, boxShadow:'0 24px 64px rgba(0,0,0,.1)', border:'1px solid rgba(255,255,255,.9)', position:'relative', zIndex:1 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:64, height:64, borderRadius:20, background:'linear-gradient(135deg,#1FA873,#0F6E56)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, margin:'0 auto 16px', boxShadow:'0 8px 24px rgba(31,168,115,.3)' }}>🥗</div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#2D2A26', margin:'0 0 4px', letterSpacing:'-0.5px' }}>Welcome back</h1>
          <p style={{ fontSize:13, color:'#aaa', margin:0 }}>Sign in to your Calorific account</p>
        </div>

        {error && (
          <div style={{ background:'#FDF0EE', border:'1px solid #DC4C3F', color:'#c24337', borderRadius:14, padding:'12px 16px', fontSize:13, marginBottom:18, animation:'slideDown .3s ease' }}>
            {error}
            {needsVerification && (
              <div style={{ marginTop:8 }}>
                {resendStatus === 'sent'
                  ? <span style={{ color:'#188159', fontWeight:600 }}>✓ Verification email sent!</span>
                  : <button onClick={handleResend} disabled={resendStatus==='sending'} style={{ background:'none', border:'none', color:'#c24337', fontWeight:700, textDecoration:'underline', cursor:'pointer', padding:0, fontSize:13 }}>
                      {resendStatus==='sending' ? 'Sending...' : 'Resend verification email'}
                    </button>
                }
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#2D2A26', marginBottom:6 }}>Email address</label>
          <div className="auth-input-wrap" style={{ background:'#F8F5F0', borderRadius:14, padding:'13px 16px', display:'flex', alignItems:'center', gap:10, marginBottom:16, border:'1.5px solid transparent' }}>
            <span style={{ fontSize:16, color:'#C4BFB4' }}>✉️</span>
            <input className="auth-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <label style={{ fontSize:12, fontWeight:600, color:'#2D2A26' }}>Password</label>
            <a href="/forgot-password" className="auth-link" style={{ fontSize:12, color:'#1FA873', textDecoration:'none', fontWeight:600 }}>Forgot password?</a>
          </div>
          <div className="auth-input-wrap" style={{ background:'#F8F5F0', borderRadius:14, padding:'13px 16px', display:'flex', alignItems:'center', gap:10, marginBottom:24, border:'1.5px solid transparent' }}>
            <span style={{ fontSize:16, color:'#C4BFB4' }}>🔒</span>
            <input className="auth-input" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, color:'#C4BFB4', padding:0, flexShrink:0 }}>
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          <button type="submit" disabled={loading} className="auth-btn"
            style={{ width:'100%', background:'linear-gradient(135deg,#1FA873,#188159)', color:'#fff', border:'none', borderRadius:16, padding:'15px', fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:'0 8px 24px rgba(31,168,115,.35)', letterSpacing:'0.2px' }}>
            {loading ? '⏳ Signing in...' : 'Sign in →'}
          </button>
        </form>

        <p style={{ textAlign:'center', fontSize:13, color:'#aaa', marginTop:22 }}>
          New to Calorific?{' '}
          <a href="/signup" className="auth-link" style={{ color:'#1FA873', fontWeight:700, textDecoration:'none' }}>Create a free account</a>
        </p>
      </div>
    </main>
  );
}
export default LoginPage;
