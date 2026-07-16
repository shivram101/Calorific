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
  getMicronutrients,
  getStoredFirstName,
  type Food,
  type LogEntry,
  type Meal,
  type MicronutrientsResult,
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
  const WATER_GOAL_ML = 2000;
  const [waterMl, setWaterMl] = useState(0);
  const [waterInput, setWaterInput] = useState('');
  const [waterAdding, setWaterAdding] = useState(false);

  // Error state
  const [error, setError] = useState('');

  // Micronutrients modal state
  const [microData, setMicroData] = useState<MicronutrientsResult | null>(null);
  const [microLoading, setMicroLoading] = useState(false);
  const [microError, setMicroError] = useState('');

  // Daily micronutrients modal state
  const [dailyMicroData, setDailyMicroData] = useState<Record<string, Record<string, { amount: number; unit: string }>> | null>(null);
  const [dailyMicroLoading, setDailyMicroLoading] = useState(false);
  const [dailyMicroError, setDailyMicroError] = useState('');

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

  // Fetch and display micronutrients for a food
  async function handleViewMicronutrients(food: Food) {
    setMicroData(null);
    setMicroError('');
    setMicroLoading(true);
    try {
      const data = await getMicronutrients(food._id);
      setMicroData(data);
    } catch (err: any) {
      setMicroError(err.message || 'Failed to load nutrition details');
      setMicroData({ foodId: food._id, foodName: food.name, servingSize: food.servingSize, servingSizeUnit: food.servingSizeUnit, source: food.source, micronutrients: {} });
    } finally {
      setMicroLoading(false);
    }
  }

  // Log water — POST only returns the single entry, so re-fetch the daily total after
  async function handleAddWater(e: any) {
    e.preventDefault();
    const amount = Number(waterInput);
    if (!amount || amount <= 0) return;
    setWaterAdding(true);
    setError('');
    try {
      await addWater(amount, TODAY);
      const updated = await getWater(TODAY);
      setWaterMl(updated.totalMl);
      setWaterInput('');
    } catch (err: any) {
      setError(err.message || 'Failed to log water');
    } finally {
      setWaterAdding(false);
    }
  }

  async function handleQuickAddWater(amount: number) {
    setWaterAdding(true);
    setError('');
    try {
      await addWater(amount, TODAY);
      const updated = await getWater(TODAY);
      setWaterMl(updated.totalMl);
    } catch (err: any) {
      setError(err.message || 'Failed to log water');
    } finally {
      setWaterAdding(false);
    }
  }

  // Aggregate micronutrients across all foods logged today
  async function handleViewDailyMicronutrients() {
    setDailyMicroData(null);
    setDailyMicroError('');
    setDailyMicroLoading(true);
    try {
      if (entries.length === 0) { setDailyMicroData({}); return; }

      // Sum quantities per unique food (a food may be logged multiple times)
      const foodQuantities: Record<string, number> = {};
      entries.forEach(e => { foodQuantities[e.foodId] = (foodQuantities[e.foodId] || 0) + e.quantity; });

      const ids = Object.keys(foodQuantities);
      const results = await Promise.all(ids.map(id => getMicronutrients(id).catch(() => null)));

      // Aggregate, weighted by quantity logged
      const agg: Record<string, Record<string, { amount: number; unit: string }>> = {};
      results.forEach((result, idx) => {
        if (!result) return;
        const qty = foodQuantities[ids[idx]];
        Object.entries(result.micronutrients).forEach(([cat, nutrients]) => {
          if (!agg[cat]) agg[cat] = {};
          nutrients.forEach(n => {
            if (!agg[cat][n.name]) agg[cat][n.name] = { amount: 0, unit: n.unit };
            agg[cat][n.name].amount += n.amount * qty;
          });
        });
      });

      // Round amounts to 2 decimal places
      Object.values(agg).forEach(cat => Object.values(cat).forEach(n => { n.amount = Math.round(n.amount * 100) / 100; }));
      setDailyMicroData(agg);
    } catch (err: any) {
      setDailyMicroError(err.message || 'Failed to load micronutrients');
      setDailyMicroData({});
    } finally {
      setDailyMicroLoading(false);
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
          <div style={styles.ribbonItemMuted} onClick={() => navigate('/settings')}>Settings</div>
        </div>
        <div style={styles.ribbonRight}>
          <div style={styles.userTag}>Welcome back, {getStoredFirstName() || 'there'} 👋</div>
          <button style={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FDF0EE', border: '1px solid #DC4C3F', color: '#c24337', borderRadius: '12px', padding: '12px 16px', fontSize: '13px' }}>
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
            <input aria-label="Search foods" placeholder="Search foods..." value={search} onChange={e => setSearch(e.target.value)} style={styles.search} />
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
                  {food.brand && <span style={{ color: '#777167', marginLeft: 6 }}>{food.brand}</span>}
                  <span style={{ float: 'right', color: '#188159', fontWeight: 600 }}>{food.calories} kcal</span>
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
                  style={{ background: 'none', border: 'none', color: '#c24337', cursor: 'pointer', fontSize: 16 }}>✕</button>
              </div>
              <div style={{ fontSize: 12, color: '#777167', marginBottom: 6 }}>
                Per serving: {selectedFood.calories} kcal · {selectedFood.protein}g P · {selectedFood.carbs}g C · {selectedFood.fat}g F
              </div>
              <button type="button" onClick={() => handleViewMicronutrients(selectedFood)}
                style={{ background: 'none', border: 'none', color: '#188159', fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 10, textDecoration: 'underline' }}>
                View full nutrition details
              </button>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input type="number" min="0.1" step="0.1" value={quantity} onChange={e => setQuantity(Number(e.target.value))}
                  aria-label="Quantity" style={{ ...styles.input, maxWidth: 80 }} placeholder="Qty" />
                <select value={meal} onChange={e => setMeal(e.target.value as Meal)} aria-label="Meal" style={styles.select}>
                  {MEALS.map(m => <option key={m} value={m}>{MEAL_LABELS[m]}</option>)}
                </select>
                <button type="submit" style={styles.addBtn}>Add</button>
              </div>
            </form>
          )}

          {/* Water tracker */}
          <div style={{ marginTop: 14, borderTop: '1px solid #eee', paddingTop: 14 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {/* Water glass fill widget */}
              <div style={{ position: 'relative', width: 48, height: 64, flexShrink: 0 }}>
                <div style={{ position: 'absolute', inset: 0, border: '2.5px solid #2e74ba', borderRadius: '4px 4px 8px 8px', overflow: 'hidden', background: '#f0f6ff' }}>
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    height: `${Math.min((waterMl / WATER_GOAL_ML) * 100, 100)}%`,
                    background: 'linear-gradient(180deg, #5ba4e5 0%, #2e74ba 100%)',
                    transition: 'height 0.5s ease',
                  }} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <strong style={{ fontSize: 13 }}>💧 Water today</strong>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#2e74ba' }}>
                    {waterMl} <span style={{ fontWeight: 400, color: '#777167' }}>/ {WATER_GOAL_ML} ml</span>
                  </span>
                </div>
                {/* Quick add buttons */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  {[250, 500, 750].map(amt => (
                    <button key={amt} type="button" disabled={waterAdding}
                      onClick={() => handleQuickAddWater(amt)}
                      style={{ flex: 1, padding: '6px 0', background: '#EBF3FB', color: '#2e74ba', border: '1px solid #c5ddf5', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      +{amt}ml
                    </button>
                  ))}
                </div>
                {/* Custom amount input */}
                <form onSubmit={handleAddWater} style={{ display: 'flex', gap: 8 }}>
                  <input type="number" aria-label="Water amount in milliliters" placeholder="Custom ml..." value={waterInput}
                    onChange={e => setWaterInput(e.target.value)} style={{ ...styles.input, flex: 1 }} />
                  <button type="submit" disabled={waterAdding} style={{ ...styles.addBtn, background: '#2e74ba' }}>
                    {waterAdding ? '...' : '+ Add'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* TODAY SUMMARY */}
        <div style={styles.summaryCol}>
          {/* Calories card */}
          <div style={styles.summaryCard}>
            <div style={styles.summaryEyebrow}>Today</div>
            <div style={styles.summaryDate}>{today}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#2D2A26', lineHeight: 1 }}>
                {Math.round(totals.calories).toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: '#777167', textAlign: 'right' }}>
                <div>kcal</div>
                <div>/ {GOALS.calories} goal</div>
              </div>
            </div>
            <div style={{ background: '#F0EDE8', borderRadius: 6, height: 8, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(GOALS.calories > 0 ? (totals.calories / GOALS.calories) * 100 : 0, 100)}%`,
                background: totals.calories > GOALS.calories ? '#c24337' : '#1FA873',
                borderRadius: 6, transition: 'width 0.4s',
              }} />
            </div>
          </div>

          {/* Macros card */}
          <div style={styles.macroCard}>
            {[
              { label: 'Fat', value: totals.fat, goal: GOALS.fat, color: '#2e74ba' },
              { label: 'Protein', value: totals.protein, goal: GOALS.protein, color: '#c24337' },
              { label: 'Carbs', value: totals.carbs, goal: GOALS.carbs, color: '#9b6719' },
            ].map(({ label, value, goal, color }) => (
              <div key={label} style={styles.macroItem}>
                <div style={{ ...styles.macroValue, color }}>{Math.round(value)}g</div>
                <div style={{ fontSize: 10, color: '#bbb', marginBottom: 4 }}>/ {goal}g</div>
                <div style={{ background: '#F0EDE8', borderRadius: 4, height: 5, overflow: 'hidden', width: '100%' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(goal > 0 ? (value / goal) * 100 : 0, 100)}%`,
                    background: color, borderRadius: 4,
                  }} />
                </div>
                <div style={styles.macroLabel}>{label}</div>
              </div>
            ))}
          </div>

          {/* Micronutrients button */}
          <button
            onClick={handleViewDailyMicronutrients}
            style={{ width: '100%', padding: '12px', background: '#fff', border: '1.5px solid #1FA873', borderRadius: 12, color: '#188159', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            🔬 View Today's Micronutrients
          </button>
        </div>
      </div>

      {/* FOOD DIARY */}
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Food diary</h2>
          <p style={{ margin: 0, color: '#777167' }}>Total calories: {totals.calories}</p>
        </div>

        {diaryLoading ? (
          <p style={{ color: '#777167', fontSize: 13 }}>Loading diary...</p>
        ) : (
          MEALS.map(m => {
            const items = grouped[m];
            const mealCalories = items.reduce((s, i) => s + i.calories, 0);
            return (
              <div key={m} style={styles.section}>
                <div style={styles.sectionHeader}>
                  <strong>{MEAL_LABELS[m]}</strong>
                  <span style={{ color: '#777167' }}>{mealCalories} kcal</span>
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
                        <span style={{ ...styles.macroTag, color: '#c24337' }}>{item.protein}g P</span>
                        <span style={{ ...styles.macroTag, color: '#9b6719' }}>{item.carbs}g C</span>
                        <span style={{ ...styles.macroTag, color: '#2e74ba' }}>{item.fat}g F</span>
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
      {/* DAILY MICRONUTRIENTS MODAL */}
      {(dailyMicroLoading || dailyMicroData !== null) && (
        <div style={styles.modalOverlay} onClick={() => { setDailyMicroData(null); setDailyMicroError(''); }}>
          <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#2D2A26' }}>Today's Micronutrients</div>
                <div style={{ fontSize: 12, color: '#777167', marginTop: 2 }}>Aggregated across all foods logged today</div>
              </div>
              <button onClick={() => { setDailyMicroData(null); setDailyMicroError(''); }}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#777167' }}>✕</button>
            </div>

            {dailyMicroError && <p style={{ color: '#c24337', fontSize: 13 }}>{dailyMicroError}</p>}
            {dailyMicroLoading && <p style={{ color: '#777167', fontSize: 13 }}>Calculating micronutrients...</p>}

            {dailyMicroData && !dailyMicroLoading && (
              Object.keys(dailyMicroData).length === 0
                ? <p style={{ color: '#777167', fontSize: 13 }}>No micronutrient data available for today's foods. Try logging more items.</p>
                : Object.entries(dailyMicroData).map(([category, nutrients]) => (
                  <div key={category} style={{ marginBottom: 16 }}>
                    <div style={styles.microCategory}>{category}</div>
                    {Object.entries(nutrients).map(([name, { amount, unit }]) => (
                      <div key={name} style={styles.microRow}>
                        <span style={{ color: '#2D2A26' }}>{name}</span>
                        <span style={{ fontWeight: 600, color: '#188159' }}>{amount}{unit}</span>
                      </div>
                    ))}
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* MICRONUTRIENTS MODAL */}
      {(microLoading || microData) && (
        <div style={styles.modalOverlay} onClick={() => { setMicroData(null); setMicroError(''); }}>
          <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#2D2A26' }}>
                  {microData?.foodName ?? 'Loading...'}
                </div>
                {microData && (
                  <div style={{ fontSize: 12, color: '#777167', marginTop: 2 }}>
                    Per {microData.servingSize}{microData.servingSizeUnit} serving
                  </div>
                )}
              </div>
              <button onClick={() => { setMicroData(null); setMicroError(''); }}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#777167' }}>✕</button>
            </div>

            {microLoading && <p style={{ color: '#777167', fontSize: 13 }}>Loading nutrition details...</p>}

            {microError && <p style={{ color: '#c24337', fontSize: 13 }}>{microError}</p>}

            {microData && !microLoading && (
              Object.keys(microData.micronutrients).length === 0
                ? <p style={{ color: '#777167', fontSize: 13 }}>No detailed micronutrient data available for this food.</p>
                : Object.entries(microData.micronutrients).map(([category, nutrients]) => (
                  <div key={category} style={{ marginBottom: 16 }}>
                    <div style={styles.microCategory}>{category}</div>
                    {nutrients.map(n => (
                      <div key={n.name} style={styles.microRow}>
                        <span style={{ color: '#2D2A26' }}>{n.name}</span>
                        <span style={{ fontWeight: 600, color: '#188159' }}>{n.amount}{n.unit}</span>
                      </div>
                    ))}
                  </div>
                ))
            )}
          </div>
        </div>
      )}
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
        <text x="50%" y="63%" textAnchor="middle" style={{ fontSize: 10, fill: '#777167' }}>/ {max}{unit}</text>
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
  ribbonItemMuted: { fontSize: 13, fontWeight: 600, color: '#77746e', cursor: 'pointer' },
  ribbonRight: { display: 'flex', alignItems: 'center', gap: 10 },
  userTag: { fontSize: 12, color: '#2D2A26', background: '#FFF8ED', padding: '6px 10px', borderRadius: 10 },
  logoutBtn: { background: '#c24337', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 10, cursor: 'pointer', fontWeight: 600 },
  topGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 15, alignItems: 'start' },
  card: { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 10px 28px rgba(0,0,0,0.07)' },
  summaryCol: { display: 'flex', flexDirection: 'column', gap: 15 },
  summaryCard: { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 10px 28px rgba(0,0,0,0.07)' },
  summaryEyebrow: { fontSize: 11, fontWeight: 700, color: '#188159', letterSpacing: 0.5 },
  summaryDate: { fontSize: 13, fontWeight: 600, color: '#2D2A26', marginBottom: 12 },
  summaryCalLabel: { fontSize: 11, color: '#777167', textAlign: 'right' },
  summaryCalValue: { fontSize: 28, fontWeight: 700, color: '#2D2A26', textAlign: 'right' },
  macroCard: { background: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 10px 28px rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between' },
  macroItem: { textAlign: 'center' },
  macroValue: { fontSize: 18, fontWeight: 700 },
  macroLabel: { fontSize: 11, color: '#777167', marginTop: 2 },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: 15 },
  searchRow: { display: 'flex', gap: 10, marginBottom: 10 },
  search: { flex: 1, padding: 10, borderRadius: 10, background: '#FFF8ED', border: '1px solid transparent', outline: 'none' },
  searchBtn: { padding: '10px 14px', background: '#188159', color: '#fff', borderRadius: 10, border: 'none', fontWeight: 600, cursor: 'pointer' },
  input: { flex: 1, padding: 10, borderRadius: 10, background: '#FFF8ED', border: 'none', outline: 'none' },
  select: { padding: 10, borderRadius: 10, background: '#FFF8ED', border: 'none' },
  addBtn: { background: '#188159', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  section: { marginBottom: 15 },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', background: '#F3F6FF', padding: 10, borderRadius: 8, marginBottom: 8 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottom: '1px solid #eee' },
  foodName: { fontWeight: 600 },
  meta: { fontSize: 12, color: '#777167' },
  metaBold: { fontSize: 13, fontWeight: 700, color: '#2D2A26', minWidth: 70, textAlign: 'right' },
  macroTag: { fontSize: 12, fontWeight: 600 },
  delete: { border: 'none', background: 'transparent', color: '#c24337', fontSize: 16, cursor: 'pointer' },
  empty: { fontSize: 12, color: '#767676', padding: 10 },
  ringsRow: { display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 20 },
  ringWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  ringLabel: { fontSize: 12, fontWeight: 600, color: '#2D2A26' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalBox: { background: '#fff', borderRadius: 16, padding: 24, maxWidth: 480, width: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  microCategory: { fontSize: 11, fontWeight: 700, color: '#188159', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid #eee' },
  microRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '1px solid #f9f9f9' },
};
