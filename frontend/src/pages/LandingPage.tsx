// src/pages/LandingPage.tsx
function LandingPage() {
  const CSS = `
    @keyframes float0 { 0%,100%{transform:translateY(0) rotate(-5deg)} 50%{transform:translateY(-22px) rotate(5deg)} }
    @keyframes float1 { 0%,100%{transform:translateY(0) rotate(8deg)} 50%{transform:translateY(-18px) rotate(-4deg)} }
    @keyframes float2 { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-28px) rotate(6deg)} }
    @keyframes float3 { 0%,100%{transform:translateY(0) rotate(6deg)} 50%{transform:translateY(-15px) rotate(-8deg)} }
    @keyframes float4 { 0%,100%{transform:translateY(0) rotate(-8deg)} 50%{transform:translateY(-20px) rotate(3deg)} }
    @keyframes fadeInUp { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
    @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
    @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(31,168,115,0.4)} 50%{box-shadow:0 0 0 12px rgba(31,168,115,0)} }
    @keyframes slideInLeft { from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)} }

    .land-btn-primary { transition:all .2s ease !important; }
    .land-btn-primary:hover { transform:translateY(-3px); box-shadow:0 12px 28px rgba(31,168,115,.45) !important; filter:brightness(1.05); }
    .land-btn-primary:active { transform:translateY(0); }
    .land-btn-secondary:hover { transform:translateY(-3px); box-shadow:0 10px 24px rgba(0,0,0,.1) !important; background:#F8F5F0 !important; }
    .feat-card { transition:all .25s ease !important; }
    .feat-card:hover { transform:translateY(-6px); box-shadow:0 20px 48px rgba(0,0,0,.1) !important; }
    .stat-num {
      background: linear-gradient(135deg, #1FA873, #0F6E56);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  `;

  const emojis = [
    { e:'🥑', top:'8%',  left:'5%',  size:64, anim:'float0', dur:'6s',  delay:'0s'   },
    { e:'🍇', top:'15%', right:'6%', size:52, anim:'float1', dur:'7.5s', delay:'1s'   },
    { e:'🌽', top:'65%', left:'3%',  size:48, anim:'float2', dur:'5.5s', delay:'2s'   },
    { e:'🍓', top:'70%', right:'4%', size:56, anim:'float3', dur:'8s',   delay:'0.5s' },
    { e:'🥦', top:'40%', left:'2%',  size:44, anim:'float4', dur:'6.5s', delay:'1.5s' },
    { e:'🍊', top:'30%', right:'3%', size:50, anim:'float0', dur:'7s',   delay:'3s'   },
  ];

  const features = [
    { icon:'🍽️', title:'Log meals fast',       desc:'Search 400K+ USDA foods, scan barcodes, or snap a photo — AI identifies your meal instantly.' },
    { icon:'🎯', title:'Personalised targets',  desc:'Calorie and macro goals calculated from your biometrics using the Mifflin-St Jeor formula.' },
    { icon:'📊', title:'Deep nutrition data',   desc:'60+ micronutrients tracked across vitamins, minerals, amino acids, and more.' },
    { icon:'📈', title:'Beautiful trends',      desc:'Weight charts, logging streaks, and calorie adherence over 7, 30, or 90 days.' },
    { icon:'💧', title:'Hydration tracking',    desc:'Set a daily water goal and log with one tap. Animated glass fills as you drink.' },
    { icon:'🆓', title:'Completely free',       desc:'No subscription. No ads. No paywalls. Just the tool you need.' },
  ];

  const stats = [
    { num:'400K+', label:'Foods in database' },
    { num:'60+',   label:'Micronutrients tracked' },
    { num:'3',     label:'Platforms — iOS, Android, Web' },
    { num:'$0',    label:'Forever free' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#FFF8ED', fontFamily:"'Inter',Arial,sans-serif", overflow:'hidden' }}>
      <style>{CSS}</style>

      {/* NAVBAR */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 5%', background:'rgba(255,248,237,0.85)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', borderBottom:'1px solid rgba(31,168,115,0.08)' }}>
        <div style={{ fontWeight:800, fontSize:20, color:'#1FA873', letterSpacing:'-0.5px' }}>Calorific.</div>
        <div style={{ display:'flex', gap:12 }}>
          <a href="/login" className="land-btn-secondary" style={{ padding:'9px 20px', borderRadius:12, fontSize:13, fontWeight:600, color:'#2D2A26', textDecoration:'none', background:'#fff', border:'1px solid #E8E4DC', transition:'all .2s' }}>Log in</a>
          <a href="/signup" className="land-btn-primary" style={{ padding:'9px 20px', borderRadius:12, fontSize:13, fontWeight:700, color:'#fff', textDecoration:'none', background:'linear-gradient(135deg,#1FA873,#188159)', boxShadow:'0 4px 14px rgba(31,168,115,.3)' }}>Get started free</a>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'120px 5% 80px', position:'relative' }}>
        {/* Floating emojis */}
        {emojis.map(({ e, size, anim, dur, delay, ...pos }: any, i) => (
          <div key={i} style={{ position:'absolute', fontSize:size, opacity:0.18, animation:`${anim} ${dur} ease-in-out ${delay} infinite`, ...pos, pointerEvents:'none' }}>{e}</div>
        ))}

        <div style={{ animation:'fadeInUp 0.6s ease both', animationDelay:'0.1s' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'linear-gradient(135deg,#E1F5EE,#C8EFE1)', color:'#0F6E56', fontSize:12, fontWeight:700, padding:'6px 14px', borderRadius:20, marginBottom:24, letterSpacing:0.5 }}>
            🌱 Free forever · No credit card required
          </div>
        </div>

        <h1 style={{ fontSize:'clamp(36px,6vw,72px)', fontWeight:900, color:'#2D2A26', lineHeight:1.1, margin:'0 0 24px', letterSpacing:'-2px', animation:'fadeInUp 0.6s ease 0.2s both', maxWidth:800 }}>
          Nutrition tracking,<br />
          <span style={{ background:'linear-gradient(135deg,#1FA873,#0F6E56)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            made simple.
          </span>
        </h1>

        <p style={{ fontSize:'clamp(15px,2vw,20px)', color:'#777167', maxWidth:520, margin:'0 auto 40px', lineHeight:1.7, animation:'fadeInUp 0.6s ease 0.3s both' }}>
          Log meals, track macros, and hit your goals without paying $10/month to apps that do the same thing.
        </p>

        <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', animation:'fadeInUp 0.6s ease 0.4s both' }}>
          <a href="/signup" className="land-btn-primary" style={{ padding:'16px 36px', borderRadius:16, fontSize:15, fontWeight:700, color:'#fff', textDecoration:'none', background:'linear-gradient(135deg,#1FA873,#188159)', boxShadow:'0 8px 24px rgba(31,168,115,.4)', animation:'pulse 3s ease-in-out 2s infinite' }}>
            Start tracking free →
          </a>
          <a href="/login" className="land-btn-secondary" style={{ padding:'16px 36px', borderRadius:16, fontSize:15, fontWeight:600, color:'#2D2A26', textDecoration:'none', background:'#fff', border:'1.5px solid #E8E4DC', boxShadow:'0 4px 14px rgba(0,0,0,.06)', transition:'all .2s' }}>
            Log in
          </a>
        </div>

        {/* Stats */}
        <div style={{ display:'flex', gap:'clamp(24px,4vw,60px)', marginTop:64, flexWrap:'wrap', justifyContent:'center', animation:'fadeInUp 0.6s ease 0.5s both' }}>
          {stats.map(({ num, label }) => (
            <div key={num} style={{ textAlign:'center' }}>
              <div className="stat-num" style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:900, letterSpacing:'-1px' }}>{num}</div>
              <div style={{ fontSize:12, color:'#aaa', marginTop:2, fontWeight:500 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div style={{ background:'#fff', padding:'80px 5%' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <h2 style={{ fontSize:'clamp(28px,4vw,42px)', fontWeight:800, color:'#2D2A26', margin:'0 0 12px', letterSpacing:'-1px' }}>Everything you need</h2>
          <p style={{ fontSize:15, color:'#777167', maxWidth:480, margin:'0 auto' }}>Built to replace every paid nutrition app you've ever tried</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24, maxWidth:1000, margin:'0 auto' }}>
          {features.map(({ icon, title, desc }) => (
            <div key={title} className="feat-card" style={{ background:'#FFF8ED', borderRadius:20, padding:28, boxShadow:'0 4px 16px rgba(0,0,0,.05)', border:'1px solid rgba(31,168,115,.08)' }}>
              <div style={{ width:52, height:52, borderRadius:16, background:'linear-gradient(135deg,#E1F5EE,#C8EFE1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, marginBottom:16 }}>{icon}</div>
              <div style={{ fontSize:16, fontWeight:700, color:'#2D2A26', marginBottom:8 }}>{title}</div>
              <div style={{ fontSize:13, color:'#777167', lineHeight:1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA BANNER */}
      <div style={{ background:'linear-gradient(135deg,#1FA873,#0F6E56)', padding:'64px 5%', textAlign:'center' }}>
        <h2 style={{ fontSize:'clamp(24px,4vw,40px)', fontWeight:800, color:'#fff', margin:'0 0 12px', letterSpacing:'-1px' }}>Ready to start?</h2>
        <p style={{ fontSize:15, color:'rgba(255,255,255,.8)', marginBottom:32 }}>It's free. It's fast. No credit card needed.</p>
        <a href="/signup" style={{ display:'inline-block', padding:'16px 48px', borderRadius:16, fontSize:15, fontWeight:700, color:'#1FA873', textDecoration:'none', background:'#fff', boxShadow:'0 8px 24px rgba(0,0,0,.2)', transition:'all .2s' }}>
          Create your free account →
        </a>
      </div>

      {/* FOOTER */}
      <div style={{ background:'#2D2A26', padding:'24px 5%', textAlign:'center' }}>
        <span style={{ fontSize:12, color:'rgba(255,255,255,.4)' }}>© 2026 Calorific · COP 4331 Group 22 · University of Central Florida</span>
      </div>
    </div>
  );
}
export default LandingPage;
