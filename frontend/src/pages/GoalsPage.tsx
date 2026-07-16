// src/pages/GoalsPage.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTargets, setTargets, getSuggestedTargets, updateProfile,
  getProfile, getStoredFirstName, getWater, getProgressSummary, todayString,
  logout,
} from '../api/client';

type GoalType = 'lose' | 'maintain' | 'build' | 'gain';

export interface Goals {
  calories: number; protein: number; carbs: number; fat: number;
}

const DEFAULTS: Record<GoalType, Goals> = {
  lose:     { calories: 1800, protein: 135, carbs: 180, fat: 60 },
  maintain: { calories: 2200, protein: 138, carbs: 248, fat: 73 },
  build:    { calories: 2500, protein: 219, carbs: 250, fat: 69 },
  gain:     { calories: 2700, protein: 169, carbs: 338, fat: 75 },
};

export function loadGoals(): Goals {
  try {
    const saved = localStorage.getItem('calorific_goals');
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULTS.maintain;
}

function GoalsPage() {
  const navigate = useNavigate();
  const [goalType, setGoalType]   = useState<GoalType>('maintain');
  const [goals, setGoals]         = useState<Goals>(DEFAULTS.maintain);
  const [saved, setSaved]         = useState(false);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [suggestedLoading, setSuggestedLoading] = useState(false);

  // Water goal
  const [waterTarget, setWaterTarget] = useState<number>(
    () => Number(localStorage.getItem('calorific_water_target')) || 2000
  );
  const [waterTodayMl, setWaterTodayMl] = useState(0);
  const [waterInput, setWaterInput]     = useState('');

  // Streak
  const [streak, setStreak]           = useState(0);
  const [recentDays, setRecentDays]   = useState<{ date: string; logged: boolean }[]>([]);

  useEffect(() => {
    async function loadAll() {
      try {
        const profile = await getProfile();
        if (profile.goal) setGoalType(profile.goal as GoalType);

        try {
          const suggested = await getSuggestedTargets();
          const g: Goals = { calories: suggested.calorieTarget, protein: suggested.proteinTarget, carbs: suggested.carbTarget, fat: suggested.fatTarget };
          setGoals(g);
          localStorage.setItem('calorific_goals', JSON.stringify(g));
        } catch {
          const targets = await getTargets().catch(() => null);
          if (targets) setGoals({ calories: targets.calorieTarget, protein: targets.proteinTarget, carbs: targets.carbTarget, fat: targets.fatTarget });
          else setGoals(DEFAULTS[(profile.goal as GoalType) ?? 'maintain']);
        }

        // Water today
        try {
          const water = await getWater(todayString());
          setWaterTodayMl(water.totalMl);
        } catch {}

        // Streak — look at last 90 days of logs
        try {
          const summary = await getProgressSummary(90);
          const byDate: Record<string, number> = {};
          summary.summary.forEach((d: any) => { byDate[d.date] = d.calories; });

          const today = new Date();
          let streakCount = 0;
          const recent: { date: string; logged: boolean }[] = [];

          for (let i = 0; i < 90; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-CA');
            const logged = (byDate[dateStr] ?? 0) > 0;

            if (i < 14) recent.push({ date: dateStr, logged });

            // Don't break streak for today if not yet logged
            if (i === 0 && !logged) continue;
            if (logged) streakCount++;
            else break;
          }

          setStreak(streakCount);
          setRecentDays(recent.reverse()); // oldest first for display
        } catch {}

      } catch { /* fall back to localStorage */ }
      finally { setLoading(false); }
    }
    loadAll();
  }, []);

  async function applyPreset(type: GoalType) {
    setGoalType(type); setSaved(false); setError(''); setSuggestedLoading(true);
    try {
      await updateProfile({ goal: type });
      const suggested = await getSuggestedTargets();
      const g: Goals = { calories: suggested.calorieTarget, protein: suggested.proteinTarget, carbs: suggested.carbTarget, fat: suggested.fatTarget };
      setGoals(g);
    } catch (err: any) {
      setGoals(DEFAULTS[type]);
      if (err.message?.includes('Incomplete biometrics'))
        setError('Complete your profile in Settings to get personalised targets. Showing estimates for now.');
    } finally { setSuggestedLoading(false); }
  }

  function setField(field: keyof Goals, val: string) {
    setSaved(false);
    setGoals(g => ({ ...g, [field]: val === '' ? 0 : Number(val) }));
  }

  async function handleSave() {
    setError('');
    try {
      await setTargets({ calorieTarget: goals.calories, proteinTarget: goals.protein, carbTarget: goals.carbs, fatTarget: goals.fat });
      localStorage.setItem('calorific_goals', JSON.stringify(goals));
      setSaved(true);
    } catch (err: any) { setError(err.message || 'Failed to save goals'); }
  }

  function saveWaterTarget(ml: number) {
    setWaterTarget(ml);
    localStorage.setItem('calorific_water_target', String(ml));
    setWaterInput('');
  }

  const totalMacroCals = goals.protein * 4 + goals.carbs * 4 + goals.fat * 9;
  function pct(macro: 'protein' | 'carbs' | 'fat') {
    if (totalMacroCals === 0) return 0;
    const cals = macro === 'fat' ? goals.fat * 9 : macro === 'protein' ? goals.protein * 4 : goals.carbs * 4;
    return Math.round((cals / totalMacroCals) * 100);
  }

  const waterPct = Math.min((waterTodayMl / waterTarget) * 100, 100);

  function streakMessage(s: number) {
    if (s === 0) return 'Log today to start your streak!';
    if (s < 3)  return 'Great start — keep going!';
    if (s < 7)  return 'Building momentum 💪';
    if (s < 14) return 'One week strong!';
    if (s < 30) return 'Two weeks and counting 🔥';
    return 'Incredible consistency! 🏆';
  }

  const GOAL_OPTIONS = [
    { type: 'lose'     as GoalType, label: 'Lose weight',  sub: '−500 kcal/day',           icon: '🔻' },
    { type: 'maintain' as GoalType, label: 'Maintain',      sub: 'Keep current weight',      icon: '⚖️' },
    { type: 'build'    as GoalType, label: 'Build muscle',  sub: '+200 kcal · high protein', icon: '💪' },
    { type: 'gain'     as GoalType, label: 'Gain weight',   sub: '+400 kcal/day surplus',    icon: '📈' },
  ];

  const MACROS = [
    { key: 'protein' as const, label: 'Protein', color: '#DC4C3F', mult: 4 },
    { key: 'carbs'   as const, label: 'Carbs',   color: '#EF9F27', mult: 4 },
    { key: 'fat'     as const, label: 'Fat',      color: '#378ADD', mult: 9 },
  ];

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FFF8ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#777167' }}>Loading your goals...</p>
    </div>
  );

  return (
    <div style={S.page}>

      {/* NAVBAR */}
      <div style={S.ribbon}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={S.brand}>Calorific</div>
          <div style={S.navMuted} onClick={() => navigate('/Dashboard')}>Log</div>
          <div style={S.navActive}>Goals</div>
          <div style={S.navMuted} onClick={() => navigate('/progress')}>Trends</div>
          <div style={S.navMuted} onClick={() => navigate('/settings')}>Settings</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={S.userTag}>Welcome back, {getStoredFirstName() || 'there'} 👋</div>
          <button style={S.logoutBtn} onClick={() => logout()}>Logout</button>
        </div>
      </div>

      {/* PAGE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#2D2A26' }}>Your Goals</h1>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: '#777167' }}>
            {suggestedLoading ? '⏳ Calculating personalised targets…' : 'Calculated from your biometrics · adjust manually if needed'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {saved && <span style={{ fontSize: 13, fontWeight: 600, color: '#188159' }}>✓ Saved</span>}
          <button style={S.saveBtn} onClick={handleSave}>Save goals</button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FDF0EE', border: '1px solid #DC4C3F', color: '#c24337', borderRadius: 12, padding: '10px 14px', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* TOP ROW — Goal selector + Calorie & Macros */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16, alignItems: 'start' }}>

        {/* Goal selector */}
        <div style={S.card}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#2D2A26' }}>Goal</div>
            <div style={{ fontSize: 12, color: '#777167', marginTop: 2 }}>What are you working toward?</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {GOAL_OPTIONS.map(({ type, label, sub, icon }) => (
              <button key={type} onClick={() => applyPreset(type)} disabled={suggestedLoading}
                style={{ padding: '14px 10px', borderRadius: 12, border: `2px solid ${goalType === type ? '#1FA873' : '#E8E4DC'}`,
                  background: goalType === type ? '#F0FBF6' : '#FAFAFA', cursor: 'pointer', textAlign: 'center' as const }}>
                <span style={{ fontSize: 22, display: 'block', marginBottom: 6 }}>{icon}</span>
                <span style={{ display: 'block', fontWeight: 700, fontSize: 13, color: goalType === type ? '#188159' : '#2D2A26' }}>{label}</span>
                <span style={{ display: 'block', fontSize: 11, color: goalType === type ? '#1FA873' : '#aaa', marginTop: 3 }}>{sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Calorie + Macros */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid #f0ede8' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#2D2A26' }}>Daily calorie target</div>
              <div style={{ fontSize: 12, color: '#777167', marginTop: 2 }}>Total energy per day</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <input type="number" aria-label="Daily calorie target" value={goals.calories}
                onChange={e => setField('calories', e.target.value)}
                style={{ fontSize: 30, fontWeight: 800, color: '#2D2A26', background: '#FFF8ED', border: 'none', borderRadius: 10, padding: '6px 12px', width: 120, textAlign: 'center' as const }} />
              <span style={{ fontSize: 13, color: '#777167', fontWeight: 600 }}>kcal</span>
            </div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#2D2A26', marginBottom: 12 }}>Macro targets</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {MACROS.map(({ key, label, color, mult }) => (
              <div key={key} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #F0EDE8' }}>
                <div style={{ height: 5, background: color }} />
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#2D2A26', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#2D2A26' }}>{pct(key)}%</div>
                  <div style={{ background: '#F0EDE8', borderRadius: 4, height: 4, overflow: 'hidden', margin: '6px 0 8px' }}>
                    <div style={{ height: '100%', width: `${pct(key)}%`, background: color, borderRadius: 4 }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input type="number" aria-label={`${label} target`} value={goals[key]}
                      onChange={e => setField(key, e.target.value)}
                      style={{ width: '100%', padding: '5px 8px', borderRadius: 8, border: `2px solid ${color}`, background: '#FFF8ED', fontSize: 13, fontWeight: 600, color: '#2D2A26', minWidth: 0 }} />
                    <span style={{ fontSize: 12, color: '#777167' }}>g</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>{goals[key] * mult} kcal</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW — Water goal + Streak */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Water goal */}
        <div style={S.card}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {/* Glass fill visual */}
            <div style={{ position: 'relative', width: 52, height: 72, flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, border: '3px solid #2e74ba', borderRadius: '4px 4px 10px 10px', overflow: 'hidden', background: '#f0f6ff' }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${waterPct}%`, background: 'linear-gradient(180deg,#5ba4e5 0%,#2e74ba 100%)', transition: 'height 0.5s ease' }} />
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#2D2A26', marginBottom: 2 }}>💧 Daily water goal</div>
              <div style={{ fontSize: 12, color: '#2e74ba', fontWeight: 600, marginBottom: 10 }}>
                {waterTodayMl} <span style={{ color: '#777167', fontWeight: 400 }}>/ {waterTarget} ml today</span>
              </div>

              {/* Quick presets */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {[1500, 2000, 2500, 3000].map(ml => (
                  <button key={ml} onClick={() => saveWaterTarget(ml)}
                    style={{ flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 600, borderRadius: 8, cursor: 'pointer',
                      background: waterTarget === ml ? '#2e74ba' : '#EBF3FB',
                      color: waterTarget === ml ? '#fff' : '#2e74ba',
                      border: `1px solid ${waterTarget === ml ? '#2e74ba' : '#c5ddf5'}` }}>
                    {ml >= 1000 ? `${ml / 1000}L` : `${ml}`}
                  </button>
                ))}
              </div>

              {/* Custom input */}
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" placeholder="Custom ml..." value={waterInput}
                  onChange={e => setWaterInput(e.target.value)}
                  style={{ flex: 1, padding: '7px 10px', borderRadius: 9, border: '1px solid #c5ddf5', background: '#f0f6ff', fontSize: 13 }} />
                <button onClick={() => { const v = Number(waterInput); if (v > 0) saveWaterTarget(v); }}
                  style={{ padding: '7px 14px', background: '#2e74ba', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  Set
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Streak */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#2D2A26', marginBottom: 2 }}>🔥 Logging streak</div>
              <div style={{ fontSize: 12, color: '#777167' }}>{streakMessage(streak)}</div>
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <div style={{ fontSize: 42, fontWeight: 900, color: streak > 0 ? '#f97316' : '#ccc', lineHeight: 1 }}>{streak}</div>
              <div style={{ fontSize: 11, color: '#777167', fontWeight: 600 }}>days in a row</div>
            </div>
          </div>

          {/* Last 14 days mini heatmap */}
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>Last 14 days</div>
            <div style={{ display: 'flex', gap: 5 }}>
              {recentDays.map(({ date, logged }) => (
                <div key={date} title={date}
                  style={{ flex: 1, height: 28, borderRadius: 6, background: logged ? '#1FA873' : '#F0EDE8', transition: 'background 0.2s' }} />
              ))}
              {/* Fill remaining slots if fewer than 14 days of data */}
              {Array.from({ length: Math.max(0, 14 - recentDays.length) }).map((_, i) => (
                <div key={`empty-${i}`} style={{ flex: 1, height: 28, borderRadius: 6, background: '#F0EDE8' }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 10, color: '#bbb' }}>14 days ago</span>
              <span style={{ fontSize: 10, color: '#bbb' }}>Today</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default GoalsPage;

const S: any = {
  page:      { minHeight: '100vh', background: '#FFF8ED', padding: '16px 20px', fontFamily: 'Arial', display: 'flex', flexDirection: 'column', gap: 16 },
  ribbon:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '12px 18px', borderRadius: 12, boxShadow: '0 6px 16px rgba(0,0,0,0.05)' },
  brand:     { fontWeight: 700, fontSize: 15, color: '#2D2A26' },
  navActive: { fontSize: 13, fontWeight: 600, color: '#2D2A26', cursor: 'pointer', borderBottom: '2px solid #1FA873', paddingBottom: 2 },
  navMuted:  { fontSize: 13, fontWeight: 600, color: '#77746e', cursor: 'pointer' },
  userTag:   { fontSize: 12, color: '#2D2A26', background: '#FFF8ED', padding: '6px 10px', borderRadius: 10 },
  logoutBtn: { background: '#c24337', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 10, cursor: 'pointer', fontWeight: 600 },
  card:      { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 10px 28px rgba(0,0,0,0.07)' },
  saveBtn:   { background: '#188159', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 16px rgba(31,168,115,0.3)' },
};
