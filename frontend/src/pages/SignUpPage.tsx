// src/pages/SignUpPage.tsx
import { useState } from 'react';
import { register } from '../api/client';
import { AUTH_CSS, FLOATERS } from './AuthShared';

function strengthOf(pw: string) {
  if (!pw) return { score:0, label:'', color:'#E8E4DC' };
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const lvl = [
    { label:'Very weak',   color:'#DC4C3F' },
    { label:'Weak',        color:'#DC4C3F' },
    { label:'Fair',        color:'#EF9F27' },
    { label:'Good',        color:'#EFC927' },
    { label:'Strong',      color:'#8BC34A' },
    { label:'Very strong', color:'#188159' },
  ];
  return { score:s, ...lvl[s] };
}

function SignUpPage() {
  const [name,            setName]            = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw,          setShowPw]          = useState(false);
  const [error,           setError]           = useState('');
  const [success,         setSuccess]         = useState('');
  const [loading,         setLoading]         = useState(false);

  const strength = strengthOf(password);
  const pwMatch  = confirmPassword && password === confirmPassword;

  async function handleSignUp(e: any) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    const parts = name.trim().split(' ');
    try {
      await register(email, password, parts[0] || '', parts.slice(1).join(' ') || '');
      setSuccess('Account created! Check your email to verify before logging in.');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#FFF8ED 0%,#F0FBF6 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:'32px 24px', position:'relative', overflow:'hidden', fontFamily:"'Inter',Arial,sans-serif" }}>
      <style>{AUTH_CSS}</style>

      {FLOATERS.map(({ e, size, anim, dur, delay, ...pos }: any, i) => (
        <div key={i} style={{ position:'absolute', fontSize:size, opacity:0.13, animation:`${anim} ${dur} ease-in-out ${delay} infinite`, pointerEvents:'none', ...pos }}>{e}</div>
      ))}

      <div className="auth-card" style={{ background:'rgba(255,255,255,0.92)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', borderRadius:28, padding:'44px 38px', width:'100%', maxWidth:420, boxShadow:'0 24px 64px rgba(0,0,0,.1)', border:'1px solid rgba(255,255,255,.9)', position:'relative', zIndex:1 }}>

        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:64, height:64, borderRadius:20, background:'linear-gradient(135deg,#1FA873,#0F6E56)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, margin:'0 auto 16px', boxShadow:'0 8px 24px rgba(31,168,115,.3)' }}>✨</div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#2D2A26', margin:'0 0 4px', letterSpacing:'-0.5px' }}>Create account</h1>
          <p style={{ fontSize:13, color:'#aaa', margin:0 }}>No subscription required to get started</p>
        </div>

        {error   && <div style={{ background:'#FDF0EE', border:'1px solid #DC4C3F', color:'#c24337',   borderRadius:14, padding:'12px 16px', fontSize:13, marginBottom:16, animation:'slideDown .3s ease' }}>{error}</div>}
        {success && <div style={{ background:'#E1F5EE', border:'1px solid #1FA873', color:'#0F6E56',   borderRadius:14, padding:'12px 16px', fontSize:13, marginBottom:16, animation:'bounceIn .5s ease' }}>🎉 {success}</div>}

        {!success && (
          <form onSubmit={handleSignUp}>
            {[
              { id:'name',  label:'Full name',      type:'text',     val:name,            set:setName,            ph:'John Doe',        icon:'👤' },
              { id:'email', label:'Email address',  type:'email',    val:email,           set:setEmail,           ph:'you@example.com', icon:'✉️' },
            ].map(({ id, label, type, val, set, ph, icon }) => (
              <div key={id} style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#2D2A26', marginBottom:6 }}>{label}</label>
                <div className="auth-input-wrap" style={{ background:'#F8F5F0', borderRadius:14, padding:'13px 16px', display:'flex', alignItems:'center', gap:10, border:'1.5px solid transparent' }}>
                  <span style={{ fontSize:16, color:'#C4BFB4' }}>{icon}</span>
                  <input className="auth-input" type={type} placeholder={ph} value={val} onChange={e => set(e.target.value)} required />
                </div>
              </div>
            ))}

            <div style={{ marginBottom:8 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#2D2A26', marginBottom:6 }}>Password</label>
              <div className="auth-input-wrap" style={{ background:'#F8F5F0', borderRadius:14, padding:'13px 16px', display:'flex', alignItems:'center', gap:10, border:'1.5px solid transparent' }}>
                <span style={{ fontSize:16, color:'#C4BFB4' }}>🔒</span>
                <input className="auth-input" type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, color:'#C4BFB4', padding:0 }}>{showPw ? '🙈' : '👁️'}</button>
              </div>
            </div>

            {password && (
              <div style={{ marginBottom:16 }}>
                <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                  {[0,1,2,3,4].map(i => (
                    <div key={i} style={{ flex:1, height:5, borderRadius:3, background: i < strength.score ? strength.color : '#E8E4DC', transition:'background .25s ease' }} />
                  ))}
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:strength.color }}>{strength.label}</div>
              </div>
            )}

            <div style={{ marginBottom:22 }}>
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
              {loading ? '⏳ Creating account...' : 'Create free account →'}
            </button>
          </form>
        )}

        <p style={{ textAlign:'center', fontSize:13, color:'#aaa', marginTop:20 }}>
          Already have an account?{' '}
          <a href="/login" className="auth-link" style={{ color:'#1FA873', fontWeight:700, textDecoration:'none' }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}
export default SignUpPage;
