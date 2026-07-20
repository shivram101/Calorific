// src/pages/OnboardingPage.tsx
import { useState } from 'react';
import { updateProfile } from '../api/client';
import { PAGE_CSS } from './PAGE_CSS';

const ACTIVITIES = [
  { value:'sedentary', label:'Sedentary',    sub:'Little or no exercise',      icon:'🛋️' },
  { value:'light',     label:'Lightly active', sub:'1–3 days/week',            icon:'🚶' },
  { value:'moderate',  label:'Moderate',      sub:'3–5 days/week',             icon:'🏃' },
  { value:'active',    label:'Very active',   sub:'6–7 days/week',             icon:'⚡' },
  { value:'veryActive',label:'Athlete',       sub:'Twice daily / intense',     icon:'🏆' },
];

const GOALS = [
  { value:'lose',     label:'Lose weight',  sub:'Calorie deficit',         icon:'🔻', color:'#DC4C3F' },
  { value:'maintain', label:'Maintain',      sub:'Stay at current weight',  icon:'⚖️', color:'#EF9F27' },
  { value:'build',    label:'Build muscle',  sub:'High protein lean bulk',  icon:'💪', color:'#1FA873' },
  { value:'gain',     label:'Gain weight',   sub:'Calorie surplus',         icon:'📈', color:'#378ADD' },
];

const STEP_META = [
  { icon:'👤', title:'Tell us about you',  subtitle:'Basic info to personalise your targets', color:'#1FA873' },
  { icon:'📏', title:'Your body stats',    subtitle:'Height and weight for accurate calculations', color:'#EF9F27' },
  { icon:'🎯', title:'Your lifestyle',     subtitle:'Activity level and goal to set your plan', color:'#378ADD' },
];

function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [age,           setAge]           = useState('');
  const [sex,           setSex]           = useState('');
  const [heightUnit,    setHeightUnit]    = useState<'cm'|'in'>('in');
  const [height,        setHeight]        = useState('');
  const [heightInches,  setHeightInches]  = useState('');
  const [weightUnit,    setWeightUnit]    = useState<'kg'|'lbs'>('lbs');
  const [weight,        setWeight]        = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [goal,          setGoal]          = useState('');

  const meta = STEP_META[step-1];
  const progress = (step / 3) * 100;

  function nextStep(e: any) {
    e.preventDefault(); setError('');
    if (step===1 && (!age||!sex)) { setError('Please fill in both fields'); return; }
    if (step===2 && (!height||!weight)) { setError('Please enter your height and weight'); return; }
    setStep(s => s+1);
  }

  async function handleFinish(e: any) {
    e.preventDefault(); setError('');
    if (!activityLevel||!goal) { setError('Please select an activity level and a goal'); return; }
    setSaving(true);
    const heightCm = heightUnit==='cm' ? Number(height) : Math.round((Number(height)*12 + Number(heightInches||0))*2.54);
    const weightKg = weightUnit==='kg' ? Number(weight) : Math.round(Number(weight)*0.453592*10)/10;
    try {
      await updateProfile({ age:age?Number(age):null, sex, heightCm, weightKg, activityLevel, goal:goal.toLowerCase() as any });
      window.location.href = '/Dashboard';
    } catch (err:any) { setError(err.message||'Something went wrong'); setSaving(false); }
  }

  const inp: any = { width:'100%', padding:'13px 16px', borderRadius:14, border:'1.5px solid transparent', background:'#F8F5F0', fontSize:14, color:'#2D2A26', fontFamily:'inherit', boxSizing:'border-box' };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#FFF8ED 0%,#F0FBF6 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:"'Inter',Arial,sans-serif" }}>
      <style>{PAGE_CSS}</style>
      <style>{`
        @keyframes slideInRight { from{opacity:0;transform:translateX(32px)} to{opacity:1;transform:translateX(0)} }
        .step-enter { animation: slideInRight 0.35s cubic-bezier(.34,1.4,.64,1) both; }
        .opt-tile { transition:all .2s !important; cursor:pointer; }
        .opt-tile:hover { transform:translateY(-3px); box-shadow:0 10px 24px rgba(0,0,0,.1) !important; }
      `}</style>

      <div style={{ width:'100%', maxWidth:480 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:28, animation:'fadeInUp .5s ease both' }}>
          <span style={{ fontWeight:900, fontSize:24, color:'#1FA873', letterSpacing:'-0.5px' }}>Calorific</span>
          <p style={{ fontSize:13, color:'#aaa', margin:'4px 0 0' }}>Let's personalise your experience</p>
        </div>

        {/* Progress bar */}
        <div style={{ background:'rgba(255,255,255,0.6)', borderRadius:20, height:6, overflow:'hidden', marginBottom:24, animation:'fadeInUp .5s ease 0.1s both' }}>
          <div style={{ height:'100%', width:`${progress}%`, background:'linear-gradient(90deg,#1FA873,#5ECFA2)', borderRadius:20, transition:'width 0.6s cubic-bezier(.34,1.56,.64,1)', boxShadow:'0 2px 8px rgba(31,168,115,.4)' }} />
        </div>

        {/* Step dots */}
        <div style={{ display:'flex', justifyContent:'center', gap:10, marginBottom:24, animation:'fadeInUp .5s ease 0.12s both' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ width:i===step?28:10, height:10, borderRadius:20, background:i<=step?'#1FA873':'#E8E4DC', transition:'all .4s cubic-bezier(.34,1.56,.64,1)', boxShadow:i===step?'0 2px 8px rgba(31,168,115,.4)':'' }} />
          ))}
        </div>

        {/* Card */}
        <div className="step-enter p-card" key={step} style={{ background:'rgba(255,255,255,0.92)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', borderRadius:24, padding:'36px 32px', boxShadow:'0 24px 64px rgba(0,0,0,0.1)', border:'1px solid rgba(255,255,255,.9)' }}>

          {/* Step header */}
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:28 }}>
            <div style={{ width:52, height:52, borderRadius:16, background:`linear-gradient(135deg,${meta.color}22,${meta.color}44)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>{meta.icon}</div>
            <div>
              <div style={{ fontWeight:800, fontSize:18, color:'#2D2A26', letterSpacing:'-0.3px' }}>{meta.title}</div>
              <div style={{ fontSize:12, color:'#aaa', marginTop:2 }}>{meta.subtitle}</div>
            </div>
            <div style={{ marginLeft:'auto', fontSize:12, fontWeight:700, color:'#aaa', background:'#F5F2EE', padding:'4px 12px', borderRadius:20 }}>Step {step}/3</div>
          </div>

          {error && <div className="ani-slideDown" style={{ background:'#FDF0EE', border:'1px solid #DC4C3F', color:'#c24337', borderRadius:12, padding:'10px 14px', fontSize:13, marginBottom:18 }}>{error}</div>}

          {/* STEP 1 */}
          {step===1 && (
            <form onSubmit={nextStep}>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#2D2A26', marginBottom:8 }}>How old are you?</label>
              <input className="p-input" type="number" min="10" max="120" placeholder="e.g. 22" value={age} onChange={e => setAge(e.target.value)} style={inp} required />
              <div style={{ marginTop:20, marginBottom:8 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'#2D2A26' }}>Biological sex</label>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:24 }}>
                {[{v:'male',label:'Male',icon:'♂️'},{v:'female',label:'Female',icon:'♀️'}].map(({ v, label, icon }) => (
                  <div key={v} className="opt-tile" onClick={() => setSex(v)}
                    style={{ padding:'18px', borderRadius:16, border:`2px solid ${sex===v?'#1FA873':'#F0EDE8'}`, background:sex===v?'#F0FBF6':'#FAFAFA', textAlign:'center' }}>
                    <div style={{ fontSize:28, marginBottom:6 }}>{icon}</div>
                    <div style={{ fontWeight:700, fontSize:14, color:sex===v?'#188159':'#2D2A26' }}>{label}</div>
                  </div>
                ))}
              </div>
              <button type="submit" className="p-btn" style={{ width:'100%', padding:14, background:'linear-gradient(135deg,#1FA873,#188159)', color:'#fff', border:'none', borderRadius:14, fontWeight:700, fontSize:15, boxShadow:'0 6px 20px rgba(31,168,115,.35)' }}>
                Continue →
              </button>
            </form>
          )}

          {/* STEP 2 */}
          {step===2 && (
            <form onSubmit={nextStep}>
              {/* Unit toggle */}
              <div style={{ display:'flex', background:'#F5F2EE', borderRadius:12, padding:4, marginBottom:20 }}>
                {[{u:'in' as const,label:'ft / lbs'},{u:'cm' as const,label:'cm / kg'}].map(({ u, label }) => (
                  <button key={u} type="button" onClick={() => { setHeightUnit(u); setWeightUnit(u==='in'?'lbs':'kg'); }}
                    style={{ flex:1, padding:'9px', borderRadius:10, border:'none', fontWeight:700, fontSize:13, cursor:'pointer', transition:'all .2s', background:heightUnit===u?'#1FA873':'transparent', color:heightUnit===u?'#fff':'#777167', boxShadow:heightUnit===u?'0 4px 12px rgba(31,168,115,.3)':'' }}>
                    {label}
                  </button>
                ))}
              </div>

              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#2D2A26', marginBottom:8 }}>Height</label>
              {heightUnit==='in' ? (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
                  <div style={{ position:'relative' }}>
                    <input className="p-input" type="number" placeholder="5" value={height} onChange={e => setHeight(e.target.value)} style={inp} required />
                    <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', fontSize:12, color:'#aaa' }}>ft</span>
                  </div>
                  <div style={{ position:'relative' }}>
                    <input className="p-input" type="number" placeholder="10" value={heightInches} onChange={e => setHeightInches(e.target.value)} style={inp} />
                    <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', fontSize:12, color:'#aaa' }}>in</span>
                  </div>
                </div>
              ) : (
                <div style={{ position:'relative', marginBottom:20 }}>
                  <input className="p-input" type="number" placeholder="175" value={height} onChange={e => setHeight(e.target.value)} style={inp} required />
                  <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', fontSize:12, color:'#aaa' }}>cm</span>
                </div>
              )}

              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#2D2A26', marginBottom:8 }}>Weight</label>
              <div style={{ position:'relative', marginBottom:28 }}>
                <input className="p-input" type="number" step="0.1" placeholder={weightUnit==='lbs'?'160':'72'} value={weight} onChange={e => setWeight(e.target.value)} style={inp} required />
                <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', fontSize:12, color:'#aaa' }}>{weightUnit}</span>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <button type="button" onClick={() => setStep(1)} style={{ padding:14, background:'#F5F2EE', color:'#2D2A26', border:'none', borderRadius:14, fontWeight:600, fontSize:14, cursor:'pointer' }}>← Back</button>
                <button type="submit" className="p-btn" style={{ padding:14, background:'linear-gradient(135deg,#1FA873,#188159)', color:'#fff', border:'none', borderRadius:14, fontWeight:700, fontSize:15, boxShadow:'0 6px 20px rgba(31,168,115,.35)' }}>Continue →</button>
              </div>
            </form>
          )}

          {/* STEP 3 */}
          {step===3 && (
            <form onSubmit={handleFinish}>
              <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#2D2A26', marginBottom:10, textTransform:'uppercase', letterSpacing:0.5 }}>Activity level</label>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
                {ACTIVITIES.map(({ value, label, sub, icon }) => (
                  <div key={value} className="opt-tile" onClick={() => setActivityLevel(value)}
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:14, border:`2px solid ${activityLevel===value?'#1FA873':'#F0EDE8'}`, background:activityLevel===value?'#F0FBF6':'#FAFAFA' }}>
                    <span style={{ fontSize:22 }}>{icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:activityLevel===value?'#188159':'#2D2A26' }}>{label}</div>
                      <div style={{ fontSize:11, color:'#aaa' }}>{sub}</div>
                    </div>
                    {activityLevel===value && <span style={{ color:'#1FA873', fontWeight:700, fontSize:16 }}>✓</span>}
                  </div>
                ))}
              </div>

              <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#2D2A26', marginBottom:10, textTransform:'uppercase', letterSpacing:0.5 }}>Your goal</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:24 }}>
                {GOALS.map(({ value, label, sub, icon, color }) => (
                  <div key={value} className="opt-tile" onClick={() => setGoal(value)}
                    style={{ padding:'14px 10px', borderRadius:14, border:`2px solid ${goal===value?color:'#F0EDE8'}`, background:goal===value?`${color}12`:'#FAFAFA', textAlign:'center' }}>
                    <span style={{ fontSize:20, display:'block', marginBottom:4 }}>{icon}</span>
                    <span style={{ display:'block', fontWeight:700, fontSize:12, color:goal===value?color:'#2D2A26' }}>{label}</span>
                    <span style={{ display:'block', fontSize:10, color:'#bbb', marginTop:2 }}>{sub}</span>
                  </div>
                ))}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <button type="button" onClick={() => setStep(2)} style={{ padding:14, background:'#F5F2EE', color:'#2D2A26', border:'none', borderRadius:14, fontWeight:600, fontSize:14, cursor:'pointer' }}>← Back</button>
                <button type="submit" disabled={saving} className="p-btn" style={{ padding:14, background:'linear-gradient(135deg,#1FA873,#188159)', color:'#fff', border:'none', borderRadius:14, fontWeight:700, fontSize:15, boxShadow:'0 6px 20px rgba(31,168,115,.35)' }}>
                  {saving ? '⏳ Setting up…' : "Let's go! 🎉"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
export default OnboardingPage;
