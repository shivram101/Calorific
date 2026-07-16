// src/pages/GoalsPage.tsx
// FIX: Original saved goals to localStorage only.
// Now syncs with GET/PUT /api/targets so goals persist across devices
// and are available to the backend for progress calculations.
// Falls back to localStorage defaults if API returns null (targets not set yet).

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTargets, setTargets, getSuggestedTargets, updateProfile, getProfile, getStoredFirstName } from '../api/client';

type GoalType = 'lose' | 'maintain' | 'build' | 'gain';

export interface Goals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const DEFAULTS: Record<GoalType, Goals> = {
  lose:     { calories: 1800, protein: 135, carbs: 180, fat: 60 },
  maintain: { calories: 2200, protein: 138, carbs: 248, fat: 73 },
  build:    { calories: 2500, protein: 219, carbs: 250, fat: 69 },
  gain:     { calories: 2700, protein: 169, carbs: 338, fat: 75 },
};

// Still used by DashboardPage as a local fallback
export function loadGoals(): Goals {
  try {
    const saved = localStorage.getItem('calorific_goals');
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULTS.maintain;
}

function GoalsPage() {
  const navigate = useNavigate();
  const [goalType, setGoalType] = useState<GoalType>('maintain');
  const [goals, setGoals] = useState<Goals>(DEFAULTS.maintain);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [suggestedLoading, setSuggestedLoading] = useState(false);

  // On mount: read the user's profile goal (to set the active button) and always
  // recalculate targets from biometrics so the value stays current with their goal.
  // Falls back to saved targets if biometrics are incomplete, then defaults.
  useEffect(() => {
    async function loadAll() {
      try {
        const profile = await getProfile();

        // Set the active goal button from the user's profile
        if (profile.goal) {
          setGoalType(profile.goal as GoalType);
        }

        // Always recalculate from biometrics — this respects the current profile goal
        // so switching from gain→maintain always shows the right number on load
        try {
          const suggested = await getSuggestedTargets();
          const g: Goals = {
            calories: suggested.calorieTarget,
            protein: suggested.proteinTarget,
            carbs: suggested.carbTarget,
            fat: suggested.fatTarget,
          };
          setGoals(g);
          localStorage.setItem('calorific_goals', JSON.stringify(g));
        } catch {
          // Biometrics incomplete — fall back to manually saved targets, then defaults
          const targets = await getTargets().catch(() => null);
          if (targets) {
            setGoals({
              calories: targets.calorieTarget,
              protein: targets.proteinTarget,
              carbs: targets.carbTarget,
              fat: targets.fatTarget,
            });
          } else {
            setGoals(DEFAULTS[(profile.goal as GoalType) ?? 'maintain']);
          }
        }
      } catch {
        // Not logged in or server error — fall back to localStorage
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  async function applyPreset(type: GoalType) {
    setGoalType(type);
    setSaved(false);
    setError('');
    setSuggestedLoading(true);
    try {
      // Save the goal to the user's profile so the backend can calculate from biometrics
      await updateProfile({ goal: type });
      // Fetch targets calculated from their actual height, weight, age, sex, activity level
      const suggested = await getSuggestedTargets();
      const g: Goals = {
        calories: suggested.calorieTarget,
        protein: suggested.proteinTarget,
        carbs: suggested.carbTarget,
        fat: suggested.fatTarget,
      };
      setGoals(g);
    } catch (err: any) {
      // Fall back to hardcoded defaults if biometrics are incomplete
      setGoals(DEFAULTS[type]);
      if (err.message?.includes('Incomplete biometrics')) {
        setError('Complete your profile in Settings to get personalised targets. Showing estimates for now.');
      }
    } finally {
      setSuggestedLoading(false);
    }
  }

  function setField(field: keyof Goals, val: string) {
    setSaved(false);
    setGoals(g => ({ ...g, [field]: val === '' ? 0 : Number(val) }));
  }

  async function handleSave() {
    setError('');
    try {
      await setTargets({
        calorieTarget: goals.calories,
        proteinTarget: goals.protein,
        carbTarget: goals.carbs,
        fatTarget: goals.fat,
      });
      // Mirror to localStorage so DashboardPage can read it without an extra API call
      localStorage.setItem('calorific_goals', JSON.stringify(goals));
      setSaved(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save goals');
    }
  }

  const totalMacroCals = goals.protein * 4 + goals.carbs * 4 + goals.fat * 9;

  function pct(macro: 'protein' | 'carbs' | 'fat') {
    if (totalMacroCals === 0) return 0;
    const cals = macro === 'fat' ? goals.fat * 9 : macro === 'protein' ? goals.protein * 4 : goals.carbs * 4;
    return Math.round((cals / totalMacroCals) * 100);
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFF8ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#777167' }}>Loading your goals...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* NAVBAR */}
      <div style={styles.ribbon}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={styles.brand}>Calorific</div>
          <div style={styles.ribbonItemMuted} onClick={() => navigate('/Dashboard')}>Log</div>
          <div style={styles.ribbonItem}>Goals</div>
          <div style={styles.ribbonItemMuted} onClick={() => navigate('/progress')}>Trends</div>
          <div style={styles.ribbonItemMuted} onClick={() => navigate('/settings')}>Settings</div>
        </div>
        <div style={styles.ribbonRight}>
          <div style={styles.userTag}>Welcome back, {getStoredFirstName() || 'there'} 👋</div>
          <button style={styles.logoutBtn} onClick={() => navigate('/login')}>Logout</button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FDF0EE', border: '1px solid #DC4C3F', color: '#c24337', borderRadius: '12px', padding: '12px 16px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* GOAL TYPE */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Your goal</h2>
        <p style={styles.cardSub}>Pick a goal and we'll suggest targets, or set them manually below.</p>
        <div style={styles.goalRow}>
          {([
            { type: 'lose',     label: 'Lose weight',  sub: '−500 kcal deficit',      icon: '🔻' },
            { type: 'maintain', label: 'Maintain',      sub: 'Keep current weight',     icon: '⚖️' },
            { type: 'build',    label: 'Build muscle',  sub: '+200 kcal, high protein', icon: '💪' },
            { type: 'gain',     label: 'Gain weight',   sub: '+400 kcal surplus',       icon: '📈' },
          ] as { type: GoalType; label: string; sub: string; icon: string }[]).map(({ type, label, sub, icon }) => (
            <button key={type}
              style={goalType === type ? styles.goalBtnActive : styles.goalBtn}
              onClick={() => applyPreset(type)} disabled={suggestedLoading}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <span style={{ display: 'block', fontWeight: 700 }}>{label}</span>
              <span style={{ display: 'block', fontSize: 11, opacity: 0.75, marginTop: 2 }}>{sub}</span>
            </button>
          ))}
        </div>
        {suggestedLoading && (
          <p style={{ fontSize: 13, color: '#188159', marginTop: 12 }}>Calculating your targets...</p>
        )}
      </div>

      {/* CALORIE TARGET */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Daily calorie target</h2>
        <div style={styles.bigInputRow}>
          <input type="number" aria-label="Daily calorie target" value={goals.calories} onChange={e => setField('calories', e.target.value)} style={styles.bigInput} />
          <span style={styles.bigUnit}>kcal / day</span>
        </div>
      </div>

      {/* MACRO TARGETS */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Macro targets</h2>
        <p style={styles.cardSub}>Set daily targets in grams.</p>
        <div style={styles.macroGrid}>
          {[
            { key: 'protein' as const, label: 'Protein', color: '#DC4C3F', mult: 4 },
            { key: 'carbs' as const, label: 'Carbohydrates', color: '#EF9F27', mult: 4 },
            { key: 'fat' as const, label: 'Fat', color: '#378ADD', mult: 9 },
          ].map(({ key, label, color, mult }) => (
            <div key={key} style={styles.macroCard}>
              <div style={{ ...styles.macroBar, background: color }} />
              <div style={styles.macroCardInner}>
                <div style={styles.macroCardLabel}>{label}</div>
                <div style={styles.macroCardPct}>{pct(key)}%</div>
                <div style={styles.macroInputRow}>
                  <input type="number" aria-label={`${label} target in grams`} value={goals[key]} onChange={e => setField(key, e.target.value)}
                    style={{ ...styles.macroInput, borderColor: color }} />
                  <span style={styles.macroUnit}>g</span>
                </div>
                <div style={styles.macroCals}>{goals[key] * mult} kcal</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 14 }}>
        {saved && <span style={styles.savedTag}>✓ Saved</span>}
        <button style={styles.saveBtn} onClick={handleSave}>Save goals</button>
      </div>
    </div>
  );
}

export default GoalsPage;

const styles: any = {
  page: { minHeight: '100vh', background: '#FFF8ED', padding: 20, fontFamily: 'Arial', display: 'flex', flexDirection: 'column', gap: 15 },
  ribbon: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '12px 18px', borderRadius: 12, boxShadow: '0 6px 16px rgba(0,0,0,0.05)' },
  brand: { fontWeight: 700, fontSize: 15, color: '#2D2A26' },
  ribbonItem: { fontSize: 13, fontWeight: 600, color: '#2D2A26', cursor: 'pointer', borderBottom: '2px solid #1FA873', paddingBottom: 2 },
  ribbonItemMuted: { fontSize: 13, fontWeight: 600, color: '#77746e', cursor: 'pointer' },
  ribbonRight: { display: 'flex', alignItems: 'center', gap: 10 },
  userTag: { fontSize: 12, color: '#2D2A26', background: '#FFF8ED', padding: '6px 10px', borderRadius: 10 },
  logoutBtn: { background: '#c24337', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 10, cursor: 'pointer', fontWeight: 600 },
  card: { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 10px 28px rgba(0,0,0,0.07)' },
  cardTitle: { margin: '0 0 4px 0', fontSize: 17, fontWeight: 700, color: '#2D2A26' },
  cardSub: { margin: '0 0 18px 0', fontSize: 13, color: '#777167' },
  goalRow: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  goalBtn: { flex: 1, minWidth: 140, padding: '14px 10px', borderRadius: 12, border: '2px solid #E8E4DC', background: '#FAFAFA', fontSize: 14, fontWeight: 600, color: '#777167', cursor: 'pointer' },
  goalBtnActive: { flex: 1, minWidth: 140, padding: '14px 10px', borderRadius: 12, border: '2px solid #1FA873', background: '#F0FBF6', fontSize: 14, fontWeight: 700, color: '#188159', cursor: 'pointer' },
  bigInputRow: { display: 'flex', alignItems: 'center', gap: 14 },
  bigInput: { fontSize: 36, fontWeight: 700, color: '#2D2A26', background: '#FFF8ED', border: 'none', borderRadius: 12, padding: '10px 18px', width: 180, textAlign: 'center' as const },
  bigUnit: { fontSize: 16, color: '#777167', fontWeight: 600 },
  macroGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 },
  macroCard: { borderRadius: 12, overflow: 'hidden', border: '1px solid #F0EDE8' },
  macroBar: { height: 6 },
  macroCardInner: { padding: '14px 16px' },
  macroCardLabel: { fontSize: 13, fontWeight: 700, color: '#2D2A26', marginBottom: 2 },
  macroCardPct: { fontSize: 22, fontWeight: 700, color: '#2D2A26', margin: '8px 0' },
  macroInputRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  macroInput: { width: '100%', padding: '8px 10px', borderRadius: 8, border: '2px solid', background: '#FFF8ED', fontSize: 16, fontWeight: 600, color: '#2D2A26' },
  macroUnit: { fontSize: 14, color: '#777167', fontWeight: 600, whiteSpace: 'nowrap' as const },
  macroCals: { fontSize: 12, color: '#777167' },
  saveBtn: { background: '#188159', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 16px rgba(31,168,115,0.3)' },
  savedTag: { fontSize: 14, fontWeight: 600, color: '#188159' },
};
