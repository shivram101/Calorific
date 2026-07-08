// src/pages/DashboardPage.tsx
// UPDATED: Replaced all mock data with real API calls.
// - Food search hits GET /api/foods/search
// - Diary loads from GET /api/logs?date=today
// - Adding food hits POST /api/logs
// - Deleting a log entry hits DELETE /api/logs/:id
// - Water tracking hits POST /api/water and GET /api/water?date=today
// - Goals loaded from API via loadGoals() (GoalsPage) with localStorage fallback

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  searchFoods,
  getLogs,
  addLog,
  deleteLog,
  getWater,
  addWater,
  logout,
  todayString,
  type Food,
  type LogEntry,
  type Meal,
} from '../api/client';
import { loadGoals } from './GoalsPage';

const MEALS: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_LABELS: Record<Meal, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
};

const TODAY = todayString();

function DashboardPage() {
  const navigate = useNavigate();
  const GOALS = loadGoals();

  // Diary state
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [diaryLoading, setDiaryLoading] = useState(true);

  // Food search state
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [meal, setMeal] = useState<Meal>('breakfast');

  // Water state
  const [waterMl, setWaterMl] = useState(0);
  const [waterInput, setWaterInput] = useState('');

  // Error state
  const [error, setError] = useState('');

  // Load diary and water for today on mount
  const loadDiary = useCallback(async () => {
    try {
      const [log, water] = await Promise.all([
        getLogs(TODAY),
        getWater(TODAY),
      ]);
      setEntries(log.entries);
      setTotals(log.totals);
      setWaterMl(water.totalMl);
    } catch (err: any) {
      if (err.message?.includes('Invalid or expired token')) {
        logout();
      }
    } finally {
      setDiaryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDiary();
  }, [loadDiary]);

  // Food search
  async function handleSearch(e: any) {
    e.preventDefault();
    if (!search.trim()) return;
    setSearching(true);
    setError('');
    try {
      const results = await searchFoods(search.trim());
      setSearchResults(results);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  }

  // Log selected food
  async function handleAddLog(e: any) {
    e.preventDefault();
    if (!selectedFood) return;
    setError('');
    try {
      await addLog({
        foodId: selectedFood._id,
        quantity,
        meal,
        date: TODAY,
      });
      setSelectedFood(null);
      setQuantity(1);
      setSearchResults([]);
      setSearch('');
      await loadDiary();
    } catch (err: any) {
      setError(err.message || 'Failed to log food');
    }
  }

  // Delete log entry
  async function handleDeleteLog(id: string) {
    setError('');
    try {
      await deleteLog(id);
      await loadDiary();
    } catch (err: any) {
      setError(err.message || 'Failed to delete entry');
    }
  }

  // Log water
  async function handleAddWater(e: any) {
    e.preventDefault();
    const amount = Number(waterInput);
    if (!amount || amount <= 0) return;
    setError('');
    try {
      const result = await addWater(amount, TODAY);
      setWaterMl(result.totalMl);
      setWaterInput('');
    } catch (err: any) {
      setError(err.message || 'Failed to log water');
    }
  }

  const grouped = MEALS.reduce((acc, m) => {
    acc[m] = entries.filter(e => e.meal === m);
    return acc;
  }, {} as Record<Meal, LogEntry[]>);

  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div style={styles.page}>
      {/* TOP RIBBON */}
      <div style={styles.ribbon}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={styles.brand}>Calorific</div>
          <div style={styles.ribbonItem}>Log</div>
          <div style={styles.ribbonItemMuted} onClick={() => navigate('/goals')}>Goals</div>
          <div style={styles.ribbonItemMuted} onClick={() => navigate('/progress')}>Trends</div>
          <div style={styles.ribbonItemMuted}>Settings</div>
        </div>
        <div style={styles.ribbonRight}>
          <div style={styles.userTag}>Logged in</div>
          <button style={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FDF0EE', border: '1px solid #DC4C3F', color: '#DC4C3F', borderRadius: '12px', padding: '12px 16px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      <div style={styles.topGrid}>
        {/* LOG FOOD CARD */}
        <div style={styles.card}>
          <div style={styles.header}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Log food</h2>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} style={styles.searchRow}>
            <input placeholder="Search foods..." value={search} onChange={e => setSearch(e.target.value)} style={styles.search} />
            <button type="submit" style={styles.searchBtn} disabled={searching}>
              {searching ? '...' : 'Search'}
            </button>
          </form>

          {/* Search results */}
          {searchResults.length > 0 && !selectedFood && (
            <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 14, border: '1px solid #eee', borderRadius: 10 }}>
              {searchResults.map(food => (
                <div key={food._id}
                  onClick={() => setSelectedFood(food)}
                  style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}
                >
                  <strong>{food.name}</strong>
                  {food.brand && <span style={{ color: '#8A8378', marginLeft: 6 }}>{food.brand}</span>}
                  <span style={{ float: 'right', color: '#1FA873', fontWeight: 600 }}>{food.calories} kcal</span>
                </div>
              ))}
            </div>
          )}

          {/* Selected food form */}
          {selectedFood && (
            <form onSubmit={handleAddLog} style={{ marginBottom: 14, background: '#F0FBF6', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <strong style={{ fontSize: 13 }}>{selectedFood.name}</strong>
                <button type="button" onClick={() => setSelectedFood(null)}
                  style={{ background: 'none', border: 'none', color: '#DC4C3F', cursor: 'pointer', fontSize: 16 }}>✕</button>
              </div>
              <div style={{ fontSize: 12, color: '#8A8378', marginBottom: 10 }}>
                Per serving: {selectedFood.calories} kcal · {selectedFood.protein}g P · {selectedFood.carbs}g C · {selectedFood.fat}g F
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input type="number" min="0.1" step="0.1" value={quantity} onChange={e => setQuantity(Number(e.target.value))}
                  style={{ ...styles.input, maxWidth: 80 }} placeholder="Qty" />
                <select value={meal} onChange={e => setMeal(e.target.value as Meal)} style={styles.select}>
                  {MEALS.map(m => <option key={m} value={m}>{MEAL_LABELS[m]}</option>)}
                </select>
                <button type="submit" style={styles.addBtn}>Add</button>
              </div>
            </form>
          )}

          {/* Water tracker */}
          <div style={{ marginTop: 14, borderTop: '1px solid #eee', paddingTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
              <strong style={{ fontSize: 13 }}>💧 Water today</strong>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#378ADD' }}>{waterMl} ml</span>
            </div>
            <form onSubmit={handleAddWater} style={{ display: 'flex', gap: 8 }}>
              <input type="number" placeholder="ml (e.g. 250)" value={waterInput} onChange={e => setWaterInput(e.target.value)}
                style={{ ...styles.input, flex: 1 }} />
              <button type="submit" style={{ ...styles.addBtn, background: '#378ADD' }}>+ Water</button>
            </form>
          </div>
        </div>

        {/* TODAY SUMMARY */}
        <div style={styles.summaryCol}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryEyebrow}>Today</div>
            <div style={styles.summaryDate}>{today}</div>
            <div style={styles.summaryCalLabel}>Calories</div>
            <div style={styles.summaryCalValue}>{totals.calories.toLocaleString()}</div>
          </div>
          <div style={styles.macroCard}>
            {[
              { label: 'Fat', value: totals.fat, color: '#378ADD' },
              { label: 'Protein', value: totals.protein, color: '#DC4C3F' },
              { label: 'Carbs', value: totals.carbs, color: '#EF9F27' },
            ].map(({ label, value, color }) => (
              <div key={label} style={styles.macroItem}>
                <div style={{ ...styles.macroValue, color }}>{value}g</div>
                <div style={styles.macroLabel}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOD DIARY */}
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Food diary</h2>
          <p style={{ margin: 0, color: '#8A8378' }}>Total calories: {totals.calories}</p>
        </div>

        {diaryLoading ? (
          <p style={{ color: '#8A8378', fontSize: 13 }}>Loading diary...</p>
        ) : (
          MEALS.map(m => {
            const items = grouped[m];
            const mealCalories = items.reduce((s, i) => s + i.calories, 0);
            return (
              <div key={m} style={styles.section}>
                <div style={styles.sectionHeader}>
                  <strong>{MEAL_LABELS[m]}</strong>
                  <span style={{ color: '#8A8378' }}>{mealCalories} kcal</span>
                </div>
                {items.length === 0 ? (
                  <div style={styles.empty}>No entries</div>
                ) : (
                  items.map(item => (
                    <div key={item._id} style={styles.row}>
                      <div>
                        <div style={styles.foodName}>{item.foodName}</div>
                        <div style={styles.meta}>{item.quantity}x serving</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span style={styles.metaBold}>{item.calories} kcal</span>
                        <span style={{ ...styles.macroTag, color: '#DC4C3F' }}>{item.protein}g P</span>
                        <span style={{ ...styles.macroTag, color: '#EF9F27' }}>{item.carbs}g C</span>
                        <span style={{ ...styles.macroTag, color: '#378ADD' }}>{item.fat}g F</span>
                        <button onClick={() => handleDeleteLog(item._id)} style={styles.delete}>✕</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })
        )}
      </div>

      {/* GOALS */}
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Goals</h2>
        </div>
        <div style={styles.ringsRow}>
          <ProgressRing value={totals.calories} max={GOALS.calories} color="#1FA873" label="Calories" unit="kcal" />
          <ProgressRing value={totals.protein} max={GOALS.protein} color="#DC4C3F" label="Protein" unit="g" />
          <ProgressRing value={totals.carbs} max={GOALS.carbs} color="#EF9F27" label="Carbs" unit="g" />
          <ProgressRing value={totals.fat} max={GOALS.fat} color="#378ADD" label="Fat" unit="g" />
        </div>
      </div>
    </div>
  );
}

function ProgressRing({ value, max, color, label, unit }: { value: number; max: number; color: string; label: string; unit: string }) {
  const size = 96, stroke = 9, radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - Math.min(max > 0 ? value / max : 0, 1) * circumference;
  return (
    <div style={styles.ringWrap}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle stroke="#EEEEEE" fill="transparent" strokeWidth={stroke} r={radius} cx={size / 2} cy={size / 2} />
        <circle stroke={color} fill="transparent" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={offset}
          r={radius} cx={size / 2} cy={size / 2}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.4s' }} />
        <text x="50%" y="46%" textAnchor="middle" style={{ fontSize: 18, fontWeight: 700, fill: '#2D2A26' }}>{value}</text>
        <text x="50%" y="63%" textAnchor="middle" style={{ fontSize: 10, fill: '#8A8378' }}>/ {max}{unit}</text>
      </svg>
      <div style={styles.ringLabel}>{label}</div>
    </div>
  );
}

export default DashboardPage;

const styles: any = {
  page: { minHeight: '100vh', background: '#FFF8ED', padding: 20, fontFamily: 'Arial', display: 'flex', flexDirection: 'column', gap: 15 },
  ribbon: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '12px 18px', borderRadius: 12, boxShadow: '0 6px 16px rgba(0,0,0,0.05)' },
  brand: { fontWeight: 700, fontSize: 15, color: '#2D2A26' },
  ribbonItem: { fontSize: 13, fontWeight: 600, color: '#2D2A26', cursor: 'pointer', borderBottom: '2px solid #1FA873', paddingBottom: 2 },
  ribbonItemMuted: { fontSize: 13, fontWeight: 600, color: '#C7C2B8', cursor: 'pointer' },
  ribbonRight: { display: 'flex', alignItems: 'center', gap: 10 },
  userTag: { fontSize: 12, color: '#2D2A26', background: '#FFF8ED', padding: '6px 10px', borderRadius: 10 },
  logoutBtn: { background: '#DC4C3F', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 10, cursor: 'pointer', fontWeight: 600 },
  topGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 15, alignItems: 'start' },
  card: { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 10px 28px rgba(0,0,0,0.07)' },
  summaryCol: { display: 'flex', flexDirection: 'column', gap: 15 },
  summaryCard: { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 10px 28px rgba(0,0,0,0.07)' },
  summaryEyebrow: { fontSize: 11, fontWeight: 700, color: '#1FA873', letterSpacing: 0.5 },
  summaryDate: { fontSize: 13, fontWeight: 600, color: '#2D2A26', marginBottom: 12 },
  summaryCalLabel: { fontSize: 11, color: '#8A8378', textAlign: 'right' },
  summaryCalValue: { fontSize: 28, fontWeight: 700, color: '#2D2A26', textAlign: 'right' },
  macroCard: { background: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 10px 28px rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between' },
  macroItem: { textAlign: 'center' },
  macroValue: { fontSize: 18, fontWeight: 700 },
  macroLabel: { fontSize: 11, color: '#8A8378', marginTop: 2 },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: 15 },
  searchRow: { display: 'flex', gap: 10, marginBottom: 10 },
  search: { flex: 1, padding: 10, borderRadius: 10, background: '#FFF8ED', border: '1px solid transparent', outline: 'none' },
  searchBtn: { padding: '10px 14px', background: '#1FA873', color: '#fff', borderRadius: 10, border: 'none', fontWeight: 600, cursor: 'pointer' },
  input: { flex: 1, padding: 10, borderRadius: 10, background: '#FFF8ED', border: 'none', outline: 'none' },
  select: { padding: 10, borderRadius: 10, background: '#FFF8ED', border: 'none' },
  addBtn: { background: '#1FA873', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  section: { marginBottom: 15 },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', background: '#F3F6FF', padding: 10, borderRadius: 8, marginBottom: 8 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottom: '1px solid #eee' },
  foodName: { fontWeight: 600 },
  meta: { fontSize: 12, color: '#8A8378' },
  metaBold: { fontSize: 13, fontWeight: 700, color: '#2D2A26', minWidth: 70, textAlign: 'right' },
  macroTag: { fontSize: 12, fontWeight: 600 },
  delete: { border: 'none', background: 'transparent', color: '#DC4C3F', fontSize: 16, cursor: 'pointer' },
  empty: { fontSize: 12, color: '#aaa', padding: 10 },
  ringsRow: { display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 20 },
  ringWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  ringLabel: { fontSize: 12, fontWeight: 600, color: '#2D2A26' },
};
