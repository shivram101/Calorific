// src/pages/VerifyEmailPage.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { verifyEmail } from '../api/client';
import { AUTH_CSS, FLOATERS } from './AuthShared';

function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error,  setError]  = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setError('Invalid verification link'); return; }
    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err: any) => { setStatus('error'); setError(err.message || 'Verification failed'); });
  }, [token]);

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#FFF8ED 0%,#F0FBF6 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative', overflow:'hidden', fontFamily:"'Inter',Arial,sans-serif" }}>
      <style>{AUTH_CSS}</style>
      {FLOATERS.map(({ e, size, anim, dur, delay, ...pos }: any, i) => (
        <div key={i} style={{ position:'absolute', fontSize:size, opacity:0.13, animation:`${anim} ${dur} ease-in-out ${delay} infinite`, pointerEvents:'none', ...pos }}>{e}</div>
      ))}

      <div className="auth-card" style={{ background:'rgba(255,255,255,0.92)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', borderRadius:28, padding:'52px 40px', width:'100%', maxWidth:400, boxShadow:'0 24px 64px rgba(0,0,0,.1)', border:'1px solid rgba(255,255,255,.9)', position:'relative', zIndex:1, textAlign:'center' }}>

        {status === 'loading' && (
          <div style={{ animation:'fadeInUp .4s ease' }}>
            <div style={{ width:80, height:80, borderRadius:24, background:'linear-gradient(135deg,#F5F2EE,#E8E4DC)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, margin:'0 auto 20px', animation:'float0 2s ease-in-out infinite' }}>⏳</div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#2D2A26', marginBottom:8 }}>Verifying your email…</h1>
            <p style={{ fontSize:13, color:'#aaa' }}>Just a moment</p>
          </div>
        )}

        {status === 'success' && (
          <div style={{ animation:'bounceIn .5s ease' }}>
            <div style={{ width:80, height:80, borderRadius:24, background:'linear-gradient(135deg,#E1F5EE,#C8EFE1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, margin:'0 auto 20px' }}>🎉</div>
            <h1 style={{ fontSize:24, fontWeight:800, color:'#2D2A26', margin:'0 0 12px' }}>Email verified!</h1>
            <p style={{ fontSize:14, color:'#777167', marginBottom:28, lineHeight:1.7 }}>
              Your account is now active. Welcome to Calorific — let's hit your goals.
            </p>
            <a href="/login" className="auth-btn" style={{ display:'block', background:'linear-gradient(135deg,#1FA873,#188159)', color:'#fff', textDecoration:'none', borderRadius:16, padding:'15px', fontSize:15, fontWeight:700, boxShadow:'0 8px 24px rgba(31,168,115,.35)' }}>
              Sign in →
            </a>
          </div>
        )}

        {status === 'error' && (
          <div style={{ animation:'scaleIn .4s ease' }}>
            <div style={{ width:80, height:80, borderRadius:24, background:'#FDF0EE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, margin:'0 auto 20px' }}>❌</div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#2D2A26', margin:'0 0 12px' }}>Verification failed</h1>
            <p style={{ fontSize:14, color:'#777167', marginBottom:24, lineHeight:1.7 }}>{error || 'This link may have expired or already been used.'}</p>
            <a href="/login" className="auth-btn" style={{ display:'block', background:'linear-gradient(135deg,#1FA873,#188159)', color:'#fff', textDecoration:'none', borderRadius:16, padding:'15px', fontSize:15, fontWeight:700, boxShadow:'0 8px 24px rgba(31,168,115,.35)', marginBottom:12 }}>
              Back to sign in
            </a>
            <a href="/signup" style={{ display:'block', fontSize:13, color:'#1FA873', textDecoration:'none', fontWeight:600 }}>Create a new account</a>
          </div>
        )}
      </div>
    </div>
  );
}
export default VerifyEmailPage;
