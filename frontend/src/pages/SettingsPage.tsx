// src/pages/SettingsPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { getProfile, updateProfile, deleteAccount, getStoredFirstName } from '../api/client';
import { PAGE_CSS } from './PAGE_CSS';

type GoalType = 'lose' | 'maintain' | 'build' | 'gain';
type UnitSystem = 'metric' | 'us';

const GOAL_OPTIONS = [
  { value:'lose'     as GoalType, label:'Lose weight',  sub:'−500 kcal/day', icon:'🔻', color:'#DC4C3F' },
  { value:'maintain' as GoalType, label:'Maintain',      sub:'Hold steady',   icon:'⚖️', color:'#EF9F27' },
  { value:'build'    as GoalType, label:'Build muscle',  sub:'+200 kcal',     icon:'💪', color:'#1FA873' },
  { value:'gain'     as GoalType, label:'Gain weight',   sub:'+400 kcal',     icon:'📈', color:'#378ADD' },
];

const ACTIVITY_OPTIONS = [
  { value:'sedentary',  label:'Sedentary',     icon:'🛋️' },
  { value:'light',      label:'Light',          icon:'🚶' },
  { value:'moderate',   label:'Moderate',       icon:'🏃' },
  { value:'active',     label:'Active',         icon:'⚡' },
  { value:'veryActive', label:'Very active',    icon:'🏆' },
];

const KG_TO_LBS = 2.20462, CM_PER_INCH = 2.54;
function cmToFtIn(cm:number) { const t=cm/CM_PER_INCH; return { ft:Math.floor(t/12), inch:Math.round(t%12) }; }
function ftInToCm(ft:number,inch:number) { return Math.round((ft*12+inch)*CM_PER_INCH); }
function kgToLbs(kg:number) { return Math.round(kg*KG_TO_LBS*10)/10; }
function lbsToKg(lbs:number) { return Math.round((lbs/KG_TO_LBS)*10)/10; }

function SettingsPage() {
  const { logout, user } = useAuth0();
  const navigate = useNavigate();
  const [email,        setEmail]        = useState('');
  const [firstName,    setFirstName]    = useState('');
  const [lastName,     setLastName]     = useState('');
  const [age,          setAge]          = useState('');
  const [heightCmRaw,  setHeightCmRaw]  = useState('');
  const [weightKgRaw,  setWeightKgRaw]  = useState('');
  const [heightFt,     setHeightFt]     = useState('');
  const [heightIn,     setHeightIn]     = useState('');
  const [weightDisplay,setWeightDisplay]= useState('');
  const [unitSystem,   setUnitSystem]   = useState<UnitSystem>(() => (localStorage.getItem('calorific_units') as UnitSystem)||'us');
  const [activityLevel,setActivityLevel]= useState('');
  const [goal,         setGoal]         = useState<GoalType|''>('');
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [message,      setMessage]      = useState('');
  const [error,        setError]        = useState('');

  useEffect(() => {
    getProfile().then(data => {
      setEmail(data.email||'');
      setFirstName(data.firstName||''); setLastName(data.lastName||'');
      setAge(data.age!=null?String(data.age):'');
      setActivityLevel(data.activityLevel||''); setGoal((data.goal as GoalType)||'');
      const cm=data.heightCm??0, kg=data.weightKg??0;
      setHeightCmRaw(cm?String(cm):''); setWeightKgRaw(kg?String(kg):'');
      if (unitSystem==='us') {
        if (cm) { const {ft,inch}=cmToFtIn(cm); setHeightFt(String(ft)); setHeightIn(String(inch)); }
        if (kg) setWeightDisplay(String(kgToLbs(kg)));
      } else {
        if (cm) setHeightFt(String(cm));
        if (kg) setWeightDisplay(String(kg));
      }
    }).catch((err:any) => {
      // Auth0's ProtectedRoute handles session expiry automatically,
      // so we no longer check for a stale JWT here — just surface any error.
      setError('Could not load profile.');
    }).finally(() => setLoading(false));
  }, []);

  function switchUnit(u:UnitSystem) {
    setUnitSystem(u); localStorage.setItem('calorific_units',u);
    const cm=Number(heightCmRaw), kg=Number(weightKgRaw);
    if (u==='us') {
      if (cm) { const {ft,inch}=cmToFtIn(cm); setHeightFt(String(ft)); setHeightIn(String(inch)); } else { setHeightFt(''); setHeightIn(''); }
      setWeightDisplay(kg?String(kgToLbs(kg)):'');
    } else {
      setHeightFt(cm?String(cm):''); setHeightIn('');
      setWeightDisplay(kg?String(kg):'');
    }
  }

  async function handleSave() {
    setSaving(true); setMessage(''); setError('');
    try {
      let finalHeightCm:number|null=null, finalWeightKg:number|null=null;
      if (unitSystem==='us') {
        const ft=Number(heightFt),inch=Number(heightIn||0);
        if (ft||inch) { finalHeightCm=ftInToCm(ft,inch); setHeightCmRaw(String(finalHeightCm)); }
        const lbs=Number(weightDisplay);
        if (lbs) { finalWeightKg=lbsToKg(lbs); setWeightKgRaw(String(finalWeightKg)); }
      } else {
        const cm=Number(heightFt); if (cm) { finalHeightCm=cm; setHeightCmRaw(String(cm)); }
        const kg=Number(weightDisplay); if (kg) { finalWeightKg=kg; setWeightKgRaw(String(kg)); }
      }
      await updateProfile({ firstName, lastName, age:age!==''?Number(age):null, heightCm:finalHeightCm, weightKg:finalWeightKg, activityLevel:activityLevel||null, goal:goal||null });
      setMessage('Changes saved!');
    } catch (err:any) { setError(err.message||'Could not save changes.'); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!window.confirm('Delete your account? This permanently removes everything and cannot be undone.')) return;
    setDeleting(true);
    try { await deleteAccount(); logout({ logoutParams: { returnTo: window.location.origin } }); }
    catch (err:any) { setError(err.message||'Could not delete account.'); setDeleting(false); }
  }

  const inp:any = { width:'100%', padding:'12px 14px', borderRadius:12, border:'1.5px solid transparent', background:'#F8F5F0', fontSize:13, color:'#2D2A26', fontFamily:'inherit', boxSizing:'border-box', transition:'border-color .2s, box-shadow .2s' };
  const sel:any = { ...inp };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#FFF8ED', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <style>{PAGE_CSS}</style>
      <div className="skeleton ani-pulse" style={{ width:320, height:200, borderRadius:20 }} />
      <p style={{ color:'#aaa', fontSize:13 }}>Loading settings…</p>
    </div>
  );

  const section = (title:string, subtitle:string, icon:string, children:any, delay='0s') => (
    <div className="p-card ani-fadeInUp" style={{ background:'#fff', borderRadius:20, padding:24, boxShadow:'0 12px 32px rgba(0,0,0,0.08)', animationDelay:delay }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, paddingBottom:16, borderBottom:'1px solid #F5F2EE' }}>
        <div style={{ width:40, height:40, borderRadius:12, background:'#F0FBF6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{icon}</div>
        <div>
          <div style={{ fontWeight:700, fontSize:15, color:'#2D2A26' }}>{title}</div>
          <div style={{ fontSize:12, color:'#aaa', marginTop:1 }}>{subtitle}</div>
        </div>
      </div>
      {children}
    </div>
  );

  return (
    <div className="inner-page" style={{ minHeight:'100vh', background:'linear-gradient(160deg,#FFF8ED 0%,#F5FBF8 100%)', padding:'16px 20px', fontFamily:"'Inter',Arial,sans-serif", display:'flex', flexDirection:'column', gap:16 }}>
      <style>{PAGE_CSS}</style>

      {/* NAVBAR */}
      <nav className="page-nav ani-fadeInUp" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,0.85)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', padding:'12px 20px', borderRadius:16, boxShadow:'0 8px 32px rgba(0,0,0,0.07)', border:'1px solid rgba(255,255,255,.8)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', gap:24, alignItems:'center' }}>
          <span style={{ fontWeight:800, fontSize:16, color:'#1FA873', letterSpacing:'-0.5px' }}>Calorific.</span>
          {[['Log','/Dashboard'],['Goals','/goals'],['Trends','/progress'],['Settings',null]].map(([label,path]) => (
            <span key={label} className="nav-link" style={{ fontSize:13, fontWeight:600, color:label==='Settings'?'#2D2A26':'#77746e', borderBottom:label==='Settings'?'2px solid #1FA873':'none', paddingBottom:label==='Settings'?2:0 }}
              onClick={() => path && navigate(path)}>{label}</span>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:12, color:'#2D2A26', background:'linear-gradient(135deg,#FFF8ED,#F5EFE0)', padding:'6px 12px', borderRadius:20, fontWeight:500 }}>👋 {getStoredFirstName()||'there'}</span>
          <button className="p-btn" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })} style={{ background:'linear-gradient(135deg,#c24337,#a83229)', color:'#fff', border:'none', padding:'7px 14px', borderRadius:20, fontWeight:600, fontSize:12 }}>Logout</button>
        </div>
      </nav>

      {/* HEADER + SAVE */}
      <div className="ani-fadeInUp" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', animationDelay:'0.05s' }}>
        <div>
          <h1 style={{ margin:0, fontSize:24, fontWeight:900, color:'#2D2A26', letterSpacing:'-0.5px' }}>Settings</h1>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#aaa' }}>Manage your profile, biometrics, and preferences</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          {message && <span className="ani-bounceIn" style={{ fontSize:13, fontWeight:700, color:'#188159', background:'#F0FBF6', padding:'6px 14px', borderRadius:20 }}>✓ {message}</span>}
          {error && <span className="ani-slideDown" style={{ fontSize:13, color:'#c24337' }}>{error}</span>}
          <button className="p-btn" onClick={handleSave} disabled={saving}
            style={{ background:'linear-gradient(135deg,#1FA873,#188159)', color:'#fff', border:'none', borderRadius:14, padding:'11px 24px', fontSize:14, fontWeight:700, boxShadow:'0 6px 20px rgba(31,168,115,.35)' }}>
            {saving ? '⏳ Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }} className="two-col">

        {/* Profile */}
        {section('Profile', 'Your name and email', '👤', (
          <>
            <div style={{ background:'#F0FBF6', borderRadius:12, padding:'12px 14px', marginBottom:16, display:'flex', alignItems:'center', gap:10, fontSize:13 }}>
              <span style={{ fontSize:16 }}>{user?.email_verified?'✅':'⚠️'}</span>
              <span style={{ color:user?.email_verified?'#0F6E56':'#8A6000', fontWeight:600 }}>{email}</span>
              {!user?.email_verified && <span style={{ fontSize:11, color:'#aaa' }}>· Unverified</span>}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[['First name', firstName, setFirstName, 'Shivram'],['Last name', lastName, setLastName, 'Sundar']].map(([label, val, set, ph]:any) => (
                <div key={label as string}>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#2D2A26', marginBottom:6 }}>{label}</label>
                  <input className="p-input" value={val} onChange={(e:any) => set(e.target.value)} placeholder={ph} style={inp} />
                </div>
              ))}
            </div>
          </>
        ), '0.1s')}

        {/* Biometrics */}
        {section('Biometrics', 'Used to calculate your calorie targets', '📏', (
          <>
            {/* Unit toggle */}
            <div style={{ display:'flex', background:'#F5F2EE', borderRadius:12, padding:4, marginBottom:16 }}>
              {([['us','🇺🇸 US (lbs, ft/in)'],['metric','📏 Metric (kg, cm)']] as [UnitSystem,string][]).map(([u,label]) => (
                <button key={u} onClick={() => switchUnit(u)} style={{ flex:1, padding:'9px', borderRadius:10, border:'none', fontWeight:700, fontSize:12, cursor:'pointer', transition:'all .2s', background:unitSystem===u?'#1FA873':'transparent', color:unitSystem===u?'#fff':'#777167', boxShadow:unitSystem===u?'0 4px 12px rgba(31,168,115,.3)':'' }}>{label}</button>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#2D2A26', marginBottom:6 }}>Age</label>
                <input className="p-input" type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="22" style={inp} />
              </div>
              {unitSystem==='us' ? (
                <>
                  <div>
                    <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#2D2A26', marginBottom:6 }}>Height (ft)</label>
                    <input className="p-input" type="number" value={heightFt} onChange={e => setHeightFt(e.target.value)} placeholder="5" style={inp} />
                  </div>
                </>
              ) : (
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#2D2A26', marginBottom:6 }}>Height (cm)</label>
                  <input className="p-input" type="number" value={heightFt} onChange={e => setHeightFt(e.target.value)} placeholder="175" style={inp} />
                </div>
              )}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {unitSystem==='us' && (
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#2D2A26', marginBottom:6 }}>Height (in)</label>
                  <input className="p-input" type="number" value={heightIn} onChange={e => setHeightIn(e.target.value)} placeholder="10" style={inp} />
                </div>
              )}
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#2D2A26', marginBottom:6 }}>Weight ({unitSystem==='us'?'lbs':'kg'})</label>
                <input className="p-input" type="number" step="0.1" value={weightDisplay} onChange={e => setWeightDisplay(e.target.value)} placeholder={unitSystem==='us'?'160':'72'} style={inp} />
              </div>
            </div>
          </>
        ), '0.15s')}

        {/* Activity */}
        {section('Activity level', 'How active are you on a typical week?', '⚡', (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {ACTIVITY_OPTIONS.map(({ value, label, icon }) => (
              <div key={value} className="opt-tile" onClick={() => setActivityLevel(value)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:14, border:`2px solid ${activityLevel===value?'#1FA873':'#F0EDE8'}`, background:activityLevel===value?'#F0FBF6':'#FAFAFA', transition:'all .2s' }}>
                <span style={{ fontSize:18 }}>{icon}</span>
                <span style={{ fontSize:13, fontWeight:600, color:activityLevel===value?'#188159':'#2D2A26', flex:1 }}>{label}</span>
                {activityLevel===value && <span style={{ color:'#1FA873', fontWeight:700 }}>✓</span>}
              </div>
            ))}
          </div>
        ), '0.2s')}

        {/* Goal */}
        {section('Goal', 'What are you working toward?', '🎯', (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {GOAL_OPTIONS.map(({ value, label, sub, icon, color }) => (
              <div key={value} className="opt-tile" onClick={() => setGoal(value)}
                style={{ padding:'16px 12px', borderRadius:16, border:`2px solid ${goal===value?color:'#F0EDE8'}`, background:goal===value?`${color}12`:'#FAFAFA', textAlign:'center', transition:'all .2s' }}>
                <span style={{ fontSize:24, display:'block', marginBottom:6 }}>{icon}</span>
                <span style={{ display:'block', fontWeight:700, fontSize:13, color:goal===value?color:'#2D2A26' }}>{label}</span>
                <span style={{ display:'block', fontSize:11, color:'#bbb', marginTop:3 }}>{sub}</span>
              </div>
            ))}
          </div>
        ), '0.25s')}
      </div>

      {/* Danger zone */}
      <div className="p-card ani-fadeInUp" style={{ background:'#fff', borderRadius:20, padding:24, boxShadow:'0 12px 32px rgba(0,0,0,0.08)', border:'1.5px solid #FDF0EE', animationDelay:'0.3s' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:'#FDF0EE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>⚠️</div>
          <div>
            <div style={{ fontWeight:700, fontSize:15, color:'#c24337' }}>Danger zone</div>
            <div style={{ fontSize:12, color:'#aaa', marginTop:1 }}>Permanent actions that cannot be undone</div>
          </div>
        </div>
        <button onClick={handleDelete} disabled={deleting} className="p-btn"
          style={{ padding:'13px 24px', background:'#FDF0EE', color:'#c24337', border:'1.5px solid #DC4C3F', borderRadius:14, fontWeight:700, fontSize:14, cursor:'pointer' }}>
          {deleting ? 'Deleting…' : '🗑 Delete my account'}
        </button>
      </div>
    </div>
  );
}
export default SettingsPage;
