// src/pages/ResetPasswordPage.tsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { resetPassword } from '../api/client';
import { AUTH_CSS, FLOATERS } from './AuthShared';

function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw,          setShowPw]          = useState(false);
  const [error,           setError]           = useState('');
  const [success,         setSuccess]         = useState(false);
  const [loading,         setLoading]         = useState(false);

  const pwMatch = confirmPassword && password === confirmPassword;

  async function handleSubmit(e: any) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { setError("Passwords don't match"); return; }
    if (!token) { setError('Missing or invalid reset link'); return; }
    setLoading(true);
    try { await resetPassword(token, password); setSuccess(true); }
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

        {!success ? (
          <>
            <div style={{ textAlign:'center', marginBottom:28 }}>
              <div style={{ width:64, height:64, borderRadius:20, background:'linear-gradient(135deg,#378ADD,#1a5fa0)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, margin:'0 auto 16px', boxShadow:'0 8px 24px rgba(55,138,221,.3)' }}>🔒</div>
              <h1 style={{ fontSize:24, fontWeight:800, color:'#2D2A26', margin:'0 0 4px', letterSpacing:'-0.5px' }}>Set new password</h1>
              <p style={{ fontSize:13, color:'#aaa', margin:0 }}>Choose something strong and memorable</p>
            </div>

            {error && <div style={{ background:'#FDF0EE', border:'1px solid #DC4C3F', color:'#c24337', borderRadius:14, padding:'12px 16px', fontSize:13, marginBottom:16, animation:'slideDown .3s ease' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#2D2A26', marginBottom:6 }}>New password</label>
                <div className="auth-input-wrap" style={{ background:'#F8F5F0', borderRadius:14, padding:'13px 16px', display:'flex', alignItems:'center', gap:10, border:'1.5px solid transparent' }}>
                  <span style={{ fontSize:16, color:'#C4BFB4' }}>🔒</span>
                  <input className="auth-input" type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, color:'#C4BFB4', padding:0 }}>{showPw ? '🙈' : '👁️'}</button>
                </div>
              </div>

              <div style={{ marginBottom:24 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#2D2A26', marginBottom:6 }}>
                  Confirm password {confirmPassword && (pwMatch ? '✅' : '❌')}
                </label>
                <div className="auth-input-wrap" style={{ background:'#F8F5F0', borderRadius:14, padding:'13px 16px', display:'flex', alignItems:'center', gap:10, border:`1.5px solid ${confirmPassword ? (pwMatch ? '#1FA873' : '#DC4C3F') : 'transparent'}` }}>
                  <span style={{ fontSize:16, color:'#C4BFB4' }}>🔒</span>
                  <input className="auth-input" type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                </div>
              </div>

              <button type="submit" disabled={loading} className="auth-btn"
                style={{ width:'100%', background:'linear-gradient(135deg,#1FA873,#188159)', color:'#fff', border:'none', borderRadius:16, padding:'15px', fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:'0 8px 24px rgba(31,168,115,.35)' }}>
                {loading ? '⏳ Updating...' : 'Update password →'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign:'center', animation:'bounceIn .5s ease' }}>
            <div style={{ width:80, height:80, borderRadius:24, background:'linear-gradient(135deg,#E1F5EE,#C8EFE1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, margin:'0 auto 20px' }}>✅</div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#2D2A26', margin:'0 0 12px' }}>Password updated!</h1>
            <p style={{ fontSize:14, color:'#777167', marginBottom:28, lineHeight:1.7 }}>Your password has been reset successfully. You can now sign in with your new password.</p>
            <a href="/login" className="auth-btn" style={{ display:'block', background:'linear-gradient(135deg,#1FA873,#188159)', color:'#fff', textDecoration:'none', borderRadius:16, padding:'15px', fontSize:15, fontWeight:700, boxShadow:'0 8px 24px rgba(31,168,115,.35)' }}>
              Sign in →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
export default ResetPasswordPage;
