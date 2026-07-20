// Shared CSS and components for auth pages
export const AUTH_CSS = `
  @keyframes float0 { 0%,100%{transform:translateY(0) rotate(-5deg)} 50%{transform:translateY(-20px) rotate(5deg)} }
  @keyframes float1 { 0%,100%{transform:translateY(0) rotate(8deg)} 50%{transform:translateY(-16px) rotate(-4deg)} }
  @keyframes float2 { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-24px) rotate(6deg)} }
  @keyframes float3 { 0%,100%{transform:translateY(0) rotate(6deg)} 50%{transform:translateY(-14px) rotate(-8deg)} }
  @keyframes fadeInUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scaleIn  { from{opacity:0;transform:scale(0.93)} to{opacity:1;transform:scale(1)} }
  @keyframes slideDown{ from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes bounceIn { 0%{transform:scale(0.7);opacity:0} 65%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
  @keyframes checkmark{ to{stroke-dashoffset:0} }
  @keyframes shine   { 0%{left:-100%} 100%{left:200%} }

  .auth-input-wrap { transition:border-color .2s, box-shadow .2s !important; }
  .auth-input-wrap:focus-within {
    border-color: #1FA873 !important;
    box-shadow: 0 0 0 4px rgba(31,168,115,.12) !important;
    background: #fff !important;
  }
  .auth-input { border:none; outline:none; background:transparent; font-size:14px; color:#2D2A26; width:100%; font-family:inherit; }
  .auth-btn {
    position:relative; overflow:hidden;
    transition: transform .15s, box-shadow .15s, filter .15s !important;
  }
  .auth-btn:hover { transform:translateY(-2px); filter:brightness(1.06); }
  .auth-btn:active { transform:translateY(0); filter:brightness(0.97); }
  .auth-btn::after {
    content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent);
    transform:skewX(-20deg);
    transition:left .5s ease;
  }
  .auth-btn:hover::after { left:200%; }
  .auth-link { transition:color .15s !important; }
  .auth-link:hover { color:#0F6E56 !important; }
  .auth-card { animation: scaleIn 0.4s cubic-bezier(.34,1.4,.64,1) both; }
`;

export const FLOATERS = [
  { e:'🍃', top:'8%',  left:'4%',  size:80, anim:'float0', dur:'7s',   delay:'0s'   },
  { e:'🥑', top:'70%', left:'2%',  size:64, anim:'float1', dur:'6s',   delay:'1s'   },
  { e:'🍓', top:'15%', right:'5%', size:52, anim:'float2', dur:'8s',   delay:'0.5s' },
  { e:'🌽', top:'72%', right:'4%', size:56, anim:'float3', dur:'5.5s', delay:'2s'   },
  { e:'🫐', top:'40%', left:'1%',  size:44, anim:'float0', dur:'9s',   delay:'3s'   },
  { e:'🍊', top:'45%', right:'2%', size:48, anim:'float1', dur:'7.5s', delay:'1.5s' },
];
