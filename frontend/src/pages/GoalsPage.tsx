// src/pages/GoalsPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTargets, setTargets, getSuggestedTargets, updateProfile,
  getProfile, getStoredFirstName, getWater, getProgressSummary, todayString,
} from '../api/client';
import { PAGE_CSS } from './PAGE_CSS';

type GoalType = 'lose' | 'maintain' | 'build' | 'gain';
export interface Goals { calories:number; protein:number; carbs:number; fat:number; }

const DEFAULTS: Record<GoalType, Goals> = {
  lose:     { calories:1800, protein:135, carbs:180, fat:60  },
  maintain: { calories:2200, protein:138, carbs:248, fat:73  },
  build:    { calories:2500, protein:219, carbs:250, fat:69  },
  gain:     { calories:2700, protein:169, carbs:338, fat:75  },
};

export function loadGoals(): Goals {
  try { const s = localStorage.getItem('calorific_goals'); if (s) return JSON.parse(s); } catch {}
  return DEFAULTS.maintain;
}

const GOAL_OPTIONS = [
  { type:'lose'     as GoalType, label:'Lose weight',  sub:'−500 kcal/day',           icon:'🔻', color:'#DC4C3F', bg:'#FDF0EE' },
  { type:'maintain' as GoalType, label:'Maintain',      sub:'Keep current weight',      icon:'⚖️', color:'#EF9F27', bg:'#FFF6E6' },
  { type:'build'    as GoalType, label:'Build muscle',  sub:'+200 kcal · high protein', icon:'💪', color:'#1FA873', bg:'#F0FBF6' },
  { type:'gain'     as GoalType, label:'Gain weight',   sub:'+400 kcal/day surplus',    icon:'📈', color:'#378ADD', bg:'#EBF3FB' },
];

const MACROS = [
  { key:'protein' as const, label:'Protein', color:'#DC4C3F', mult:4 },
  { key:'carbs'   as const, label:'Carbs',   color:'#EF9F27', mult:4 },
  { key:'fat'     as const, label:'Fat',      color:'#378ADD', mult:9 },
];

function GoalsPage() {
  const navigate = useNavigate();
  const [goalType,         setGoalType]         = useState<GoalType>('maintain');
  const [goals,            setGoals]             = useState<Goals>(DEFAULTS.maintain);
  const [saved,            setSaved]             = useState(false);
  const [loading,          setLoading]           = useState(true);
  const [error,            setError]             = useState('');
  const [suggestedLoading, setSuggestedLoading]  = useState(false);
  const [waterTarget,      setWaterTarget]       = useState(() => Number(localStorage.getItem('calorific_water_target')) || 2000);
  const [waterTodayMl,     setWaterTodayMl]      = useState(0);
  const [waterInput,       setWaterInput]        = useState('');
  const [waterUnit,        setWaterUnit]         = useState<'L'|'gal'>(() =>
    (localStorage.getItem('calorific_water_unit') as 'L'|'gal') || 'L'
  );
  const [streak,           setStreak]            = useState(0);
  const [recentDays,       setRecentDays]        = useState<{date:string;logged:boolean}[]>([]);

  useEffect(() => {
    async function loadAll() {
      try {
        const profile = await getProfile();
        if (profile.goal) setGoalType(profile.goal as GoalType);
        try {
          const s = await getSuggestedTargets();
          const g = { calories:s.calorieTarget, protein:s.proteinTarget, carbs:s.carbTarget, fat:s.fatTarget };
          setGoals(g); localStorage.setItem('calorific_goals', JSON.stringify(g));
        } catch {
          const t = await getTargets().catch(() => null);
          if (t) setGoals({ calories:t.calorieTarget, protein:t.proteinTarget, carbs:t.carbTarget, fat:t.fatTarget });
          else setGoals(DEFAULTS[(profile.goal as GoalType) ?? 'maintain']);
        }
        try { setWaterTodayMl((await getWater(todayString())).totalMl); } catch {}
        try {
          const summary = await getProgressSummary(90);
          const byDate: Record<string,number> = {};
          summary.summary.forEach((d:any) => { byDate[d.date] = d.calories; });
          const today = new Date(); let streakCount = 0;
          const recent: {date:string;logged:boolean}[] = [];
          for (let i = 0; i < 90; i++) {
            const d = new Date(today); d.setDate(d.getDate()-i);
            const dateStr = d.toLocaleDateString('en-CA');
            const logged = (byDate[dateStr]??0) > 0;
            if (i < 14) recent.push({ date:dateStr, logged });
            if (i===0 && !logged) continue;
            if (logged) streakCount++; else break;
          }
          setStreak(streakCount); setRecentDays(recent.reverse());
        } catch {}
      } catch {} finally { setLoading(false); }
    }
    loadAll();
  }, []);

  async function applyPreset(type: GoalType) {
    setGoalType(type); setSaved(false); setError(''); setSuggestedLoading(true);
    try {
      await updateProfile({ goal:type });
      const s = await getSuggestedTargets();
      const g = { calories:s.calorieTarget, protein:s.proteinTarget, carbs:s.carbTarget, fat:s.fatTarget };
      setGoals(g);
    } catch (err:any) {
      setGoals(DEFAULTS[type]);
      if (err.message?.includes('Incomplete biometrics')) setError('Complete your profile in Settings to get personalised targets.');
    } finally { setSuggestedLoading(false); }
  }

  function setField(field: keyof Goals, val: string) {
    setSaved(false); setGoals(g => ({ ...g, [field]: val==='' ? 0 : Number(val) }));
  }

  async function handleSave() {
    setError('');
    try {
      await setTargets({ calorieTarget:goals.calories, proteinTarget:goals.protein, carbTarget:goals.carbs, fatTarget:goals.fat });
      localStorage.setItem('calorific_goals', JSON.stringify(goals)); setSaved(true);
    } catch (err:any) { setError(err.message||'Failed to save'); }
  }

  function saveWaterTarget(ml: number) {
    setWaterTarget(ml);
    localStorage.setItem('calorific_water_target', String(ml));
    setWaterInput('');
  }
  function switchWaterUnit(u: 'L'|'gal') {
    setWaterUnit(u);
    localStorage.setItem('calorific_water_unit', u);
  }

  const totalMacroCals = goals.protein*4 + goals.carbs*4 + goals.fat*9;
  function pct(macro: 'protein'|'carbs'|'fat') {
    if (!totalMacroCals) return 0;
    const cals = macro==='fat' ? goals.fat*9 : macro==='protein' ? goals.protein*4 : goals.carbs*4;
    return Math.round((cals/totalMacroCals)*100);
  }
  const waterPct = Math.min((waterTodayMl/waterTarget)*100, 100);
  function streakMsg(s:number) {
    if (s===0) return 'Log today to start your streak!';
    if (s<3) return 'Great start — keep going!';
    if (s<7) return 'Building momentum 💪';
    if (s<14) return 'One week strong!';
    if (s<30) return 'Two weeks and counting 🔥';
    return 'Incredible consistency! 🏆';
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#FFF8ED', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <style>{PAGE_CSS}</style>
      <div style={{ display:'flex', gap:12 }}>
        {[1,2,3].map(i => <div key={i} className="skeleton ani-pulse" style={{ width:80, height:80, borderRadius:16, animationDelay:`${i*0.15}s` }} />)}
      </div>
      <p style={{ color:'#aaa', fontSize:13 }}>Loading your goals…</p>
    </div>
  );

  return (
    <div className="inner-page" style={{ minHeight:'100vh', background:'linear-gradient(160deg,#FFF8ED 0%,#F5FBF8 100%)', padding:'16px 20px', fontFamily:"'Inter',Arial,sans-serif", display:'flex', flexDirection:'column', gap:16 }}>
      <style>{PAGE_CSS}</style>

      {/* NAVBAR */}
      <nav className="page-nav ani-fadeInUp" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,0.85)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', padding:'12px 20px', borderRadius:16, boxShadow:'0 8px 32px rgba(0,0,0,0.07)', border:'1px solid rgba(255,255,255,.8)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', gap:24, alignItems:'center' }}>
          <span style={{ fontWeight:800, fontSize:16, color:'#1FA873', letterSpacing:'-0.5px' }}>Calorific.</span>
          {[['Log','/Dashboard'],['Goals',null],['Trends','/progress'],['Settings','/settings']].map(([label, path]) => (
            <span key={label} className="nav-link" style={{ fontSize:13, fontWeight:600, color:label==='Goals'?'#2D2A26':'#77746e', borderBottom:label==='Goals'?'2px solid #1FA873':'none', paddingBottom:label==='Goals'?2:0 }}
              onClick={() => path && navigate(path)}>{label}</span>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:12, color:'#2D2A26', background:'linear-gradient(135deg,#FFF8ED,#F5EFE0)', padding:'6px 12px', borderRadius:20, fontWeight:500 }}>👋 {getStoredFirstName()||'there'}</span>
          <button className="p-btn" onClick={logout} style={{ background:'linear-gradient(135deg,#c24337,#a83229)', color:'#fff', border:'none', padding:'7px 14px', borderRadius:20, fontWeight:600, fontSize:12 }}>Logout</button>
        </div>
      </nav>

      {/* HEADER */}
      <div className="ani-fadeInUp" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', animationDelay:'0.05s' }}>
        <div>
          <h1 style={{ margin:0, fontSize:24, fontWeight:900, color:'#2D2A26', letterSpacing:'-0.5px' }}>Your Goals</h1>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#aaa' }}>
            {suggestedLoading ? <span className="ani-pulse">⏳ Calculating personalised targets…</span> : 'Calculated from your biometrics · adjust manually if needed'}
          </p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {saved && <span className="ani-bounceIn" style={{ fontSize:13, fontWeight:700, color:'#188159', background:'#F0FBF6', padding:'6px 14px', borderRadius:20 }}>✓ Saved</span>}
          <button className="p-btn" onClick={handleSave} style={{ background:'linear-gradient(135deg,#1FA873,#188159)', color:'#fff', border:'none', borderRadius:14, padding:'11px 24px', fontSize:14, fontWeight:700, boxShadow:'0 6px 20px rgba(31,168,115,.35)' }}>Save goals</button>
        </div>
      </div>

      {error && <div className="ani-slideDown" style={{ background:'#FDF0EE', border:'1px solid #DC4C3F', color:'#c24337', borderRadius:14, padding:'12px 16px', fontSize:13 }}>{error}</div>}

      {/* GOAL SELECTOR + MACROS */}
      <div className="two-col" style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:16, alignItems:'start' }}>

        {/* Goal tiles */}
        <div className="p-card ani-fadeInUp" style={{ background:'#fff', borderRadius:20, padding:22, boxShadow:'0 12px 32px rgba(0,0,0,0.08)', animationDelay:'0.1s' }}>
          <div style={{ fontWeight:700, fontSize:15, color:'#2D2A26', marginBottom:4 }}>Goal</div>
          <div style={{ fontSize:12, color:'#aaa', marginBottom:16 }}>What are you working toward?</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {GOAL_OPTIONS.map(({ type, label, sub, icon, color, bg }) => (
              <button key={type} onClick={() => applyPreset(type)} disabled={suggestedLoading}
                className={`goal-tile${goalType===type?' active':''}`}
                style={{ padding:'16px 10px', borderRadius:16, border:`2px solid ${goalType===type ? color : '#F0EDE8'}`, background:goalType===type ? bg : '#FAFAFA', textAlign:'center' }}>
                <span style={{ fontSize:24, display:'block', marginBottom:8 }}>{icon}</span>
                <span style={{ display:'block', fontWeight:700, fontSize:13, color:goalType===type ? color : '#2D2A26' }}>{label}</span>
                <span style={{ display:'block', fontSize:11, color:goalType===type ? color : '#bbb', marginTop:4, opacity:0.85 }}>{sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Calorie + Macros */}
        <div className="p-card ani-fadeInUp" style={{ background:'#fff', borderRadius:20, padding:22, boxShadow:'0 12px 32px rgba(0,0,0,0.08)', animationDelay:'0.15s' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, paddingBottom:16, borderBottom:'1px solid #F5F2EE' }}>
            <div>
              <div style={{ fontWeight:700, fontSize:15, color:'#2D2A26' }}>Daily calorie target</div>
              <div style={{ fontSize:12, color:'#aaa', marginTop:2 }}>Total energy per day</div>
            </div>
            <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
              <input type="number" className="p-input" aria-label="Daily calorie target" value={goals.calories} onChange={e => setField('calories', e.target.value)}
                style={{ fontSize:32, fontWeight:900, color:'#2D2A26', background:'#F8F5F0', border:'1.5px solid transparent', borderRadius:14, padding:'8px 14px', width:130, textAlign:'center', fontFamily:'inherit' }} />
              <span style={{ fontSize:13, color:'#aaa', fontWeight:600 }}>kcal</span>
            </div>
          </div>
          <div style={{ fontWeight:700, fontSize:13, color:'#2D2A26', marginBottom:12 }}>Macro split</div>
          <div className="three-col" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {MACROS.map(({ key, label, color, mult }) => (
              <div key={key} style={{ borderRadius:16, overflow:'hidden', border:`1.5px solid ${color}22` }}>
                <div style={{ height:5, background:`linear-gradient(90deg,${color},${color}aa)` }} />
                <div style={{ padding:'12px' }}>
                  <div style={{ fontSize:11, fontWeight:700, color, textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 }}>{label}</div>
                  <div style={{ fontSize:22, fontWeight:900, color:'#2D2A26' }}>{pct(key)}%</div>
                  <div style={{ background:'#F0EDE8', borderRadius:4, height:5, overflow:'hidden', margin:'6px 0 10px' }}>
                    <div style={{ height:'100%', width:`${pct(key)}%`, background:color, borderRadius:4, transition:'width 0.6s cubic-bezier(.34,1.56,.64,1)' }} />
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <input type="number" className="p-input" aria-label={`${label} target`} value={goals[key]} onChange={e => setField(key, e.target.value)}
                      style={{ width:'100%', padding:'6px 8px', borderRadius:10, border:`2px solid ${color}44`, background:'#FFF8ED', fontSize:13, fontWeight:700, color:'#2D2A26', fontFamily:'inherit', transition:'border-color .2s, box-shadow .2s' }} />
                    <span style={{ fontSize:11, color:'#aaa' }}>g</span>
                  </div>
                  <div style={{ fontSize:10, color:'#bbb', marginTop:5 }}>{goals[key]*mult} kcal</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WATER + STREAK */}
      <div className="two-col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

        {/* Water */}
        <div className="p-card ani-fadeInUp" style={{ background:'#fff', borderRadius:20, padding:22, boxShadow:'0 12px 32px rgba(0,0,0,0.08)', animationDelay:'0.2s' }}>
          <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
            <div style={{ position:'relative', width:56, height:78, flexShrink:0 }}>
              <div style={{ position:'absolute', inset:0, border:'3px solid #2e74ba', borderRadius:'5px 5px 12px 12px', overflow:'hidden', background:'#EBF3FB' }}>
                <div style={{ position:'absolute', bottom:0, left:0, right:0, height:`${waterPct}%`, background:'linear-gradient(180deg,#5ba4e5 0%,#2e74ba 100%)', transition:'height 0.9s cubic-bezier(.34,1.56,.64,1)' }}>
                  <div style={{ position:'absolute', top:-6, left:'-25%', width:'150%', height:14, background:'rgba(255,255,255,.3)', borderRadius:'50%', animation:'waveFloat 2s ease-in-out infinite' }} />
                </div>
              </div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:15, color:'#2D2A26', marginBottom:2 }}>💧 Daily water goal</div>
              <div style={{ fontSize:13, fontWeight:700, color:'#2e74ba', marginBottom:10 }}>
                {waterUnit === 'gal'
                    ? `${(waterTodayMl/3785.41).toFixed(2)} gal`
                    : `${(waterTodayMl/1000).toFixed(2)} L`}
                <span style={{ color:'#aaa', fontWeight:400 }}>
                  {' / '}{waterUnit === 'gal'
                    ? `${(waterTarget/3785.41).toFixed(2)} gal`
                    : `${(waterTarget/1000).toFixed(1)} L`}
                </span>
              </div>
              <div style={{ background:'#EBF3FB', borderRadius:8, height:8, overflow:'hidden', marginBottom:12 }}>
                <div style={{ height:'100%', width:`${waterPct}%`, background:'linear-gradient(90deg,#5ba4e5,#2e74ba)', borderRadius:8, transition:'width 0.9s cubic-bezier(.34,1.56,.64,1)' }} />
              </div>
              <div style={{ display:'flex', gap:6, marginBottom:10 }}>
                {[1500,2000,2500,3000].map(ml => (
                  <button key={ml} onClick={() => saveWaterTarget(ml)} className="water-btn"
                    style={{ flex:1, padding:'7px 0', fontSize:11, fontWeight:700, borderRadius:10, background:waterTarget===ml?'#2e74ba':'#EBF3FB', color:waterTarget===ml?'#fff':'#2e74ba', border:`1px solid ${waterTarget===ml?'#2e74ba':'#c5ddf5'}` }}>
                    {ml>=1000?`${ml/1000}L`:ml}
                  </button>
                ))}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <input type="number" step="0.1" placeholder={waterUnit==='L'?'Custom litres...':'Custom gallons...'} value={waterInput} onChange={e => setWaterInput(e.target.value)} className="p-input"
                  style={{ flex:1, padding:'9px 12px', borderRadius:10, border:'1.5px solid #c5ddf5', background:'#EBF3FB', fontSize:13, fontFamily:'inherit' }} />
                <button onClick={() => { const v=Number(waterInput); if(!v||v<=0) return; const ml=waterUnit==='L'?Math.round(v*1000):Math.round(v*3785.41); saveWaterTarget(ml); }} className="p-btn"
                  style={{ padding:'9px 16px', background:'#2e74ba', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:13 }}>Set</button>
              </div>
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="p-card ani-fadeInUp" style={{ background:'#fff', borderRadius:20, padding:22, boxShadow:'0 12px 32px rgba(0,0,0,0.08)', animationDelay:'0.25s' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:15, color:'#2D2A26', marginBottom:4 }}>🔥 Logging streak</div>
              <div style={{ fontSize:12, color:'#aaa' }}>{streakMsg(streak)}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:48, fontWeight:900, lineHeight:1, background:streak>0?'linear-gradient(135deg,#f97316,#dc6004)':'', WebkitBackgroundClip:streak>0?'text':'', WebkitTextFillColor:streak>0?'transparent':'#E0DBCF', backgroundClip:streak>0?'text':'' }}>{streak}</div>
              <div style={{ fontSize:11, color:'#aaa', fontWeight:600 }}>days in a row</div>
            </div>
          </div>
          <div style={{ fontSize:11, color:'#bbb', marginBottom:8, fontWeight:600, letterSpacing:0.5 }}>LAST 14 DAYS</div>
          <div style={{ display:'flex', gap:4 }}>
            {[...Array(Math.max(0, 14-recentDays.length))].map((_,i) => (
              <div key={`e${i}`} style={{ flex:1, height:32, borderRadius:8, background:'#F5F2EE' }} />
            ))}
            {recentDays.map(({ date, logged }, i) => (
              <div key={date} title={date} style={{ flex:1, height:32, borderRadius:8, background:logged?'linear-gradient(135deg,#1FA873,#188159)':'#F5F2EE', boxShadow:logged?'0 2px 8px rgba(31,168,115,.3)':'none', transition:'all 0.2s', animationDelay:`${i*0.04}s` }} />
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
            <span style={{ fontSize:10, color:'#ccc' }}>14 days ago</span>
            <span style={{ fontSize:10, color:'#ccc' }}>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function logout() { localStorage.removeItem('calorific_token'); window.location.href = '/login'; }
export default GoalsPage;
