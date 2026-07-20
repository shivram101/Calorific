// src/pages/ForgotPasswordPage.tsx
import { useState } from 'react';
import { forgotPassword } from '../api/client';
import { AUTH_CSS, FLOATERS } from './AuthShared';

function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [error,   setError]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: any) {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await forgotPassword(email); setSent(true); }
    catch (err: any) { setError(err.message || 'Something went wrong'); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#FFF8ED 0%,#F0FBF6 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative', overflow:'hidden', fontFamily:"'Inter',Arial,sans-serif" }}>
      <style>{AUTH_CSS}</style>

      {FLOATERS.map(({ e, size, anim, dur, delay, ...pos }: any, i) => (
        <div key={i} style={{ position:'absolute', fontSize:size, opacity:0.13, animation:`${anim} ${dur} ease-in-out ${delay} infinite`, pointerEvents:'none', ...pos }}>{e}</div>
      ))}

      <div className="auth-card" style={{ background:'rgba(255,255,255,0.92)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', borderRadius:28, padding:'44px 38px', width:'100%', maxWidth:400, boxShadow:'0 24px 64px rgba(0,0,0,.1)', border:'1px solid rgba(255,255,255,.9)', position:'relative', zIndex:1 }}>

        {!sent ? (
          <>
            <div style={{ textAlign:'center', marginBottom:28 }}>
              <div style={{ width:64, height:64, borderRadius:20, background:'linear-gradient(135deg,#EF9F27,#d4860f)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, margin:'0 auto 16px', boxShadow:'0 8px 24px rgba(239,159,39,.3)' }}>🔑</div>
              <h1 style={{ fontSize:24, fontWeight:800, color:'#2D2A26', margin:'0 0 4px', letterSpacing:'-0.5px' }}>Forgot password?</h1>
              <p style={{ fontSize:13, color:'#aaa', margin:0 }}>No worries — we'll send you reset instructions</p>
            </div>

            {error && <div style={{ background:'#FDF0EE', border:'1px solid #DC4C3F', color:'#c24337', borderRadius:14, padding:'12px 16px', fontSize:13, marginBottom:16, animation:'slideDown .3s ease' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#2D2A26', marginBottom:6 }}>Email address</label>
              <div className="auth-input-wrap" style={{ background:'#F8F5F0', borderRadius:14, padding:'13px 16px', display:'flex', alignItems:'center', gap:10, marginBottom:22, border:'1.5px solid transparent' }}>
                <span style={{ fontSize:16, color:'#C4BFB4' }}>✉️</span>
                <input className="auth-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="auth-btn"
                style={{ width:'100%', background:'linear-gradient(135deg,#1FA873,#188159)', color:'#fff', border:'none', borderRadius:16, padding:'15px', fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:'0 8px 24px rgba(31,168,115,.35)' }}>
                {loading ? '⏳ Sending...' : 'Send reset link →'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign:'center', animation:'bounceIn .5s ease' }}>
            <div style={{ width:80, height:80, borderRadius:24, background:'linear-gradient(135deg,#E1F5EE,#C8EFE1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, margin:'0 auto 20px' }}>📩</div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#2D2A26', margin:'0 0 12px' }}>Check your email</h1>
            <p style={{ fontSize:14, color:'#777167', lineHeight:1.7, marginBottom:24 }}>
              We sent a password reset link to<br /><strong style={{ color:'#2D2A26' }}>{email}</strong>
            </p>
            <div style={{ background:'#F0FBF6', borderRadius:14, padding:'14px 18px', fontSize:13, color:'#0F6E56', fontWeight:500 }}>
              💡 Check your spam folder if you don't see it within a minute
            </div>
          </div>
        )}

        <p style={{ textAlign:'center', fontSize:13, color:'#aaa', marginTop:24 }}>
          <a href="/login" className="auth-link" style={{ color:'#1FA873', fontWeight:700, textDecoration:'none' }}>← Back to sign in</a>
        </p>
      </div>
    </div>
  );
}
export default ForgotPasswordPage;
