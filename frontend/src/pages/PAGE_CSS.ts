// Shared animation CSS for inner pages (Goals, Trends, Settings, Onboarding)
export const PAGE_CSS = `
  @keyframes fadeInUp   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn     { from{opacity:0} to{opacity:1} }
  @keyframes scaleIn    { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }
  @keyframes slideRight { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
  @keyframes slideLeft  { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
  @keyframes slideDown  { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes bounceIn   { 0%{transform:scale(0.75);opacity:0} 65%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
  @keyframes shimmer    { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
  @keyframes waveFloat  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
  @keyframes pulse      { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes spin       { to{transform:rotate(360deg)} }
  @keyframes shine      { 0%{left:-100%} 100%{left:200%} }
  @keyframes checkPop   { 0%{transform:scale(0)} 70%{transform:scale(1.2)} 100%{transform:scale(1)} }

  .ani-fadeInUp  { animation:fadeInUp  0.45s ease both; }
  .ani-scaleIn   { animation:scaleIn   0.3s  ease both; }
  .ani-bounceIn  { animation:bounceIn  0.4s  cubic-bezier(.34,1.56,.64,1) both; }
  .ani-slideDown { animation:slideDown 0.3s  ease both; }
  .ani-pulse     { animation:pulse     1.4s  ease-in-out infinite; }
  .ani-spin      { animation:spin      0.8s  linear infinite; display:inline-block; }

  .skeleton { background:linear-gradient(90deg,#f0ede8 25%,#e8e4dc 50%,#f0ede8 75%); background-size:600px 100%; animation:shimmer 1.5s ease-in-out infinite; border-radius:10px; }

  /* Navbar */
  .page-nav  { transition:box-shadow .3s !important; }
  .nav-link  { transition:color .15s !important; cursor:pointer; }
  .nav-link:hover { color:#1FA873 !important; }

  /* Cards */
  .p-card { transition:transform .2s ease, box-shadow .2s ease !important; }
  .p-card:hover { transform:translateY(-3px); box-shadow:0 22px 52px rgba(0,0,0,0.11) !important; }

  /* Buttons */
  .p-btn { position:relative; overflow:hidden; transition:transform .15s, box-shadow .15s, filter .15s !important; cursor:pointer; }
  .p-btn:hover  { filter:brightness(1.07); transform:translateY(-2px); }
  .p-btn:active { transform:scale(0.97); }
  .p-btn::after { content:''; position:absolute; top:0; left:-100%; width:60%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent); transform:skewX(-20deg); transition:left .5s ease; }
  .p-btn:hover::after { left:200%; }

  /* Inputs */
  .p-input { transition:border-color .2s, box-shadow .2s, background .2s !important; }
  .p-input:focus { border-color:#1FA873 !important; box-shadow:0 0 0 4px rgba(31,168,115,.12) !important; background:#fff !important; outline:none !important; }

  /* Goal/option tiles */
  .goal-tile { transition:transform .2s, box-shadow .2s, border-color .2s, background .2s !important; cursor:pointer; }
  .goal-tile:hover { transform:translateY(-3px); box-shadow:0 12px 28px rgba(0,0,0,.1) !important; }
  .goal-tile.active { animation:bounceIn .35s cubic-bezier(.34,1.56,.64,1); }

  /* Water buttons */
  .water-btn { transition:all .15s !important; cursor:pointer; }
  .water-btn:hover { background:#2e74ba !important; color:#fff !important; transform:translateY(-2px); box-shadow:0 4px 12px rgba(46,116,186,.35); }

  /* Responsive */
  @media (max-width:900px) {
    .two-col { grid-template-columns:1fr !important; }
    .three-col { grid-template-columns:1fr 1fr !important; }
  }
  @media (max-width:600px) {
    .inner-page { padding:12px !important; gap:12px !important; }
    .page-nav   { padding:10px 14px !important; border-radius:12px !important; }
  }
`;
