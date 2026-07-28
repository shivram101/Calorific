// src/pages/LoginPage.tsx
// Under Auth0 Universal Login, this page no longer collects credentials
// itself — it just redirects the user to Auth0's hosted login page.
import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { AUTH_CSS, FLOATERS } from './AuthShared';

function LoginPage() {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();

  useEffect(() => {
    // Auto-redirect to Auth0's hosted login as soon as this page loads,
    // unless the user is already authenticated (edge case: back button).
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect();
    }
  }, [isLoading, isAuthenticated, loginWithRedirect]);

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#FFF8ED 0%,#F0FBF6 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative', overflow:'hidden', fontFamily:"'Inter',Arial,sans-serif" }}>
      <style>{AUTH_CSS}</style>
      {FLOATERS.map(({ e, size, anim, dur, delay, ...pos }: any, i) => (
        <div key={i} style={{ position:'absolute', fontSize:size, opacity:0.13, animation:`${anim} ${dur} ease-in-out ${delay} infinite`, pointerEvents:'none', ...pos }}>{e}</div>
      ))}
      <div className="auth-card" style={{ background:'rgba(255,255,255,0.92)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', borderRadius:28, padding:'44px 38px', textAlign:'center', boxShadow:'0 24px 64px rgba(0,0,0,.1)', position:'relative', zIndex:1 }}>
        <div style={{ width:64, height:64, borderRadius:20, background:'linear-gradient(135deg,#1FA873,#0F6E56)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, margin:'0 auto 16px', boxShadow:'0 8px 24px rgba(31,168,115,.3)' }}>🥗</div>
        <p style={{ fontSize:14, color:'#777167', margin:0 }}>Redirecting you to sign in…</p>
      </div>
    </div>
  );
}
export default LoginPage;
