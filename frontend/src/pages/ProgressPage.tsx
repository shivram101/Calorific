// src/pages/ProgressPage.tsx
// Progress/Trends page — stat widgets, a month calendar, weight trend and
// calorie adherence charts.
// Consumes the /progress endpoints (built by Shiv, previously unused):
//   GET /api/progress/weight?range=   -> weight entries
//   GET /api/progress/summary?range=  -> daily calorie/macro totals
//   GET /api/targets                  -> calorie target (adherence)
//   POST /api/progress/weight         -> log today's weight
// Charts are plain inline SVG — no chart library.
// If the backend is unreachable (local dev without .env), the page falls
// back to clearly-labeled sample data so the UI is still reviewable.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getWeightHistory,
  getProgressSummary,
  getTargets,
  getSuggestedTargets,
  logWeight,
  getLogs,
  addLog,
  deleteLog,
  searchFoods,
  logout,
  todayString,
  getStoredFirstName,
  type WeightEntry,
  type DailySummary,
  type LogEntry,
  type Meal,
  type Food,
} from '../api/client';

const RANGES = [7, 30, 90];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// ---- sample fallback (backend offline) ----
function sampleData(range: number) {
  const weights: WeightEntry[] = [];
  const summary: DailySummary[] = [];
  const today = new Date();
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const date = d.toLocaleDateString('en-CA');
    const drift = (range - i) * (1.2 / range);
    if (i % 2 === 0) {
      weights.push({
        _id: date, userId: 'sample', date,
        weightKg: Math.round((82 - drift + Math.sin(i * 1.7) * 0.4) * 10) / 10,
        createdAt: date,
      });
    }
    summary.push({
      date,
      calories: i % 7 === 3 ? 0 : Math.round(1950 + Math.sin(i * 2.3) * 350 + (i % 3) * 90),
      protein: Math.round(140 + Math.sin(i) * 30),
      carbs: Math.round(210 + Math.cos(i) * 40),
      fat: Math.round(65 + Math.sin(i * 1.3) * 12),
    });
  }
  return { weights, summary, calorieTarget: 2186 };
}

function ProgressPage() {
  const navigate = useNavigate();

  const [range, setRange] = useState(30);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [summary, setSummary] = useState<DailySummary[]>([]);
  const [calorieTarget, setCalorieTarget] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sampleMode, setSampleMode] = useState(false);
  const [error, setError] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [savingWeight, setSavingWeight] = useState(false);

  // Day editor modal
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [dayLogs, setDayLogs] = useState<LogEntry[]>([]);
  const [dayTotals, setDayTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [dayLoading, setDayLoading] = useState(false);
  const [dayError, setDayError] = useState('');
  const [dayWeightInput, setDayWeightInput] = useState('');
  const [savingDayWeight, setSavingDayWeight] = useState(false);
  const [daySearch, setDaySearch] = useState('');
  const [daySearchResults, setDaySearchResults] = useState<Food[]>([]);
  const [daySearching, setDaySearching] = useState(false);
  const [daySelectedFood, setDaySelectedFood] = useState<Food | null>(null);
  const [dayQuantity, setDayQuantity] = useState(1);
  const [dayMeal, setDayMeal] = useState<Meal>('breakfast');
  const [dayAdding, setDayAdding] = useState(false);

  // Weight unit preference — backend stores kg; this is display-only.
  // (Onboarding asks kg/lbs but the preference isn't persisted server-side yet
  //  — candidate for the Settings page.)
  const [unit, setUnit] = useState<'kg' | 'lbs'>(
    () => (localStorage.getItem('calorific_weight_unit') as 'kg' | 'lbs') || 'lbs'
  );
  function switchUnit(u: 'kg' | 'lbs') {
    setUnit(u);
    localStorage.setItem('calorific_weight_unit', u);
  }
  const KG_PER_LB = 0.453592;
  const disp = (kg: number) =>
    unit === 'kg' ? Math.round(kg * 10) / 10 : Math.round((kg / KG_PER_LB) * 10) / 10;

  // Calendar state
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(todayString());

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [w, s] = await Promise.all([
        getWeightHistory(range),
        getProgressSummary(range),
      ]);
      setWeights(w.entries ?? []);
      setSummary(s.summary ?? []);

      // Use the live calculated target so it always reflects the current goal,
      // not whatever was last manually saved
      try {
        const suggested = await getSuggestedTargets();
        setCalorieTarget(suggested.calorieTarget);
      } catch {
        const t = await getTargets().catch(() => null);
        setCalorieTarget(t?.calorieTarget ?? null);
      }

      setSampleMode(false);
    } catch {
      const demo = sampleData(range);
      setWeights(demo.weights);
      setSummary(demo.summary);
      setCalorieTarget(demo.calorieTarget);
      setSampleMode(true);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  async function openDayEditor(date: string) {
    setEditingDate(date);
    setDayLoading(true);
    setDayError('');
    setDaySearch('');
    setDaySearchResults([]);
    setDaySelectedFood(null);
    setDayQuantity(1);
    setDayMeal('breakfast');
    const existingKg = weightByDate[date];
    setDayWeightInput(existingKg ? String(disp(existingKg)) : '');
    try {
      const log = await getLogs(date);
      setDayLogs(log.entries);
      setDayTotals(log.totals);
    } catch {
      setDayError('Could not load logs for this day');
    } finally {
      setDayLoading(false);
    }
  }

  async function handleDayLogWeight(e: React.FormEvent) {
    e.preventDefault();
    const entered = Number(dayWeightInput);
    if (!entered || entered <= 0) return;
    const kg = unit === 'kg' ? entered : Math.round(entered * KG_PER_LB * 10) / 10;
    setSavingDayWeight(true);
    setDayError('');
    try {
      await logWeight(kg, editingDate!);
      await load();
    } catch {
      setDayError('Could not save weight');
    } finally {
      setSavingDayWeight(false);
    }
  }

  async function handleDaySearch(e: React.FormEvent) {
    e.preventDefault();
    if (!daySearch.trim()) return;
    setDaySearching(true);
    setDayError('');
    try {
      const results = await searchFoods(daySearch.trim());
      setDaySearchResults(results);
    } catch {
      setDayError('Search failed');
    } finally {
      setDaySearching(false);
    }
  }

  async function handleDayAddLog(e: React.FormEvent) {
    e.preventDefault();
    if (!daySelectedFood || !editingDate) return;
    setDayAdding(true);
    setDayError('');
    try {
      await addLog({ foodId: daySelectedFood._id, quantity: dayQuantity, meal: dayMeal, date: editingDate });
      const log = await getLogs(editingDate);
      setDayLogs(log.entries);
      setDayTotals(log.totals);
      setDaySelectedFood(null);
      setDaySearchResults([]);
      setDaySearch('');
      await load();
    } catch {
      setDayError('Could not add food');
    } finally {
      setDayAdding(false);
    }
  }

  async function handleDayDeleteLog(id: string) {
    setDayError('');
    try {
      await deleteLog(id);
      const log = await getLogs(editingDate!);
      setDayLogs(log.entries);
      setDayTotals(log.totals);
      await load();
    } catch {
      setDayError('Could not delete entry');
    }
  }

  async function handleLogWeight(e: React.FormEvent) {
    e.preventDefault();
    const entered = Number(weightInput);
    if (!entered || entered <= 0) return;
    const kg = unit === 'kg' ? entered : Math.round(entered * KG_PER_LB * 10) / 10;
    setSavingWeight(true);
    try {
      await logWeight(kg);
      setWeightInput('');
      await load();
    } catch {
      setError('Could not save weight — is the backend running?');
    } finally {
      setSavingWeight(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  // ---- derived stats ----
  const latestWeight = weights.length ? weights[weights.length - 1].weightKg : null;
  const firstWeight = weights.length ? weights[0].weightKg : null;
  const weightChange =
    latestWeight !== null && firstWeight !== null
      ? Math.round((latestWeight - firstWeight) * 10) / 10
      : null;

  const loggedDays = summary.filter(d => d.calories > 0);
  const avgCalories = loggedDays.length
    ? Math.round(loggedDays.reduce((a, d) => a + d.calories, 0) / loggedDays.length)
    : 0;
  const adherence =
    calorieTarget && loggedDays.length
      ? Math.round(
          (loggedDays.filter(d => d.calories <= calorieTarget * 1.1).length / loggedDays.length) * 100
        )
      : null;
  const avg = (key: 'protein' | 'carbs' | 'fat') =>
    loggedDays.length
      ? Math.round(loggedDays.reduce((a, d) => a + d[key], 0) / loggedDays.length)
      : 0;

  const summaryByDate: Record<string, DailySummary> = {};
  summary.forEach(d => { summaryByDate[d.date] = d; });
  const weightByDate: Record<string, number> = {};
  weights.forEach(w => { weightByDate[w.date] = w.weightKg; });

  const selectedDay = summaryByDate[selectedDate];
  const selectedWeight = weightByDate[selectedDate];

  const stats = [
    { label: 'Current weight', value: latestWeight !== null ? `${disp(latestWeight)} ${unit}` : '—' },
    {
      label: `Change (${range}d)`,
      value:
        weightChange !== null
          ? `${weightChange > 0 ? '+' : ''}${disp(Math.abs(weightChange)) * Math.sign(weightChange || 1)} ${unit}`
          : '—',
      color: weightChange !== null && weightChange < 0 ? '#188159' : undefined,
    },
    { label: 'Avg calories', value: avgCalories ? avgCalories.toLocaleString() : '—' },
    {
      label: 'On target',
      value: adherence !== null ? `${adherence}%` : '—',
      color: '#188159',
    },
  ];

  return (
    <div style={styles.page}>
      {/* TOP RIBBON */}
      <div style={styles.ribbon}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={styles.brand}>Calorific</div>
          <div style={styles.ribbonItemMuted} onClick={() => navigate('/Dashboard')}>Log</div>
          <div style={styles.ribbonItemMuted} onClick={() => navigate('/goals')}>Goals</div>
          <div style={styles.ribbonItem}>Trends</div>
          <div style={styles.ribbonItemMuted} onClick={() => navigate('/settings')}>Settings</div>
        </div>
        <div style={styles.ribbonRight}>
          <div style={styles.userTag}>Welcome back, {getStoredFirstName() || 'there'} 👋</div>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#FDF0EE', border: '1px solid #DC4C3F', color: '#c24337', borderRadius: '12px', padding: '12px 16px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {sampleMode && (
        <div style={styles.samplePill}>
          Showing sample data — backend not reachable. Fills with real data automatically.
        </div>
      )}

      {/* RANGE + UNIT PICKERS */}
      <div style={styles.rangeRow}>
        <div style={{ display: 'flex', gap: 8 }}>
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={range === r ? styles.rangeActive : styles.rangeBtn}
            >
              {r} days
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['lbs', 'kg'] as const).map(u => (
            <button
              key={u}
              onClick={() => switchUnit(u)}
              style={unit === u ? styles.rangeActive : styles.rangeBtn}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={styles.card}>
          <div style={{ color: '#777167', fontSize: 13, padding: 20, textAlign: 'center' }}>
            Loading your trends...
          </div>
        </div>
      ) : (
        <>
          {/* ===== STAT WIDGETS ===== */}
          <div style={styles.statRow}>
            {stats.map(s => (
              <div key={s.label} style={styles.statCard}>
                <div style={{ ...styles.statValue, color: s.color ?? '#2D2A26' }}>{s.value}</div>
                <div style={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ===== CALENDAR + WEIGHT ===== */}
          <div style={styles.midRow}>
            {/* CALENDAR WIDGET */}
            <div style={styles.calendarCard}>
              <div style={styles.calHeader}>
                <button style={styles.calNav} onClick={() => setMonthDate(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} aria-label="Previous month">‹</button>
                <div style={styles.calTitle}>
                  {monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </div>
                <button style={styles.calNav} onClick={() => setMonthDate(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} aria-label="Next month">›</button>
              </div>

              <div style={styles.calGrid}>
                {DOW.map((d, i) => (
                  <div key={`${d}${i}`} style={styles.calDow}>{d}</div>
                ))}
                {buildMonthCells(monthDate).map(cell =>
                  cell ? (
                    <CalendarDay
                      key={cell}
                      date={cell}
                      day={summaryByDate[cell]}
                      hasWeight={cell in weightByDate}
                      target={calorieTarget}
                      selected={cell === selectedDate}
                      onSelect={() => { setSelectedDate(cell); openDayEditor(cell); }}
                    />
                  ) : (
                    <div key={Math.random()} />
                  )
                )}
              </div>

              {/* Selected day detail */}
              <div style={styles.dayDetail}>
                <div style={styles.dayDetailDate}>
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                {selectedDay && selectedDay.calories > 0 ? (
                  <div style={styles.dayDetailStats}>
                    <span style={{ fontWeight: 700, color: '#2D2A26' }}>{Math.round(selectedDay.calories).toLocaleString()} kcal</span>
                    <span style={{ color: '#c24337' }}>{Math.round(selectedDay.protein)}g P</span>
                    <span style={{ color: '#9b6719' }}>{Math.round(selectedDay.carbs)}g C</span>
                    <span style={{ color: '#2e74ba' }}>{Math.round(selectedDay.fat)}g F</span>
                    {selectedWeight !== undefined && (
                      <span style={{ color: '#777167' }}>{disp(selectedWeight)} {unit}</span>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#777167' }}>
                    {selectedWeight !== undefined ? `Weighed in: ${disp(selectedWeight)} ${unit} — no food logged` : 'Nothing logged this day'}
                  </div>
                )}
              </div>

              <div style={styles.calLegend}>
                <span style={styles.legendItem}><span style={{ ...styles.legendSwatch, background: '#E1F5EE' }} /> on target</span>
                <span style={styles.legendItem}><span style={{ ...styles.legendSwatch, background: '#FAEEDA' }} /> over</span>
                <span style={styles.legendItem}><span style={{ ...styles.legendDot }} /> weigh-in</span>
              </div>
            </div>

            {/* WEIGHT CARD */}
            <div style={styles.chartCard}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>Weight</h2>
                {weightChange !== null && weightChange !== 0 && (
                  <span style={{ ...styles.changeTag, color: weightChange < 0 ? '#188159' : '#777167' }}>
                    {weightChange > 0 ? '+' : ''}{disp(Math.abs(weightChange)) * Math.sign(weightChange)} {unit} over {range} days
                  </span>
                )}
              </div>

              {weights.length >= 2 ? (
                <WeightChart entries={weights.map(w => ({ ...w, weightKg: disp(w.weightKg) }))} />
              ) : (
                <div style={styles.emptyChart}>
                  Not enough weigh-ins yet — log your weight below and the trend builds itself.
                </div>
              )}

              <form onSubmit={handleLogWeight} style={styles.weighRow}>
                <input
                  type="number"
                  step="0.1"
                  aria-label={`Today's weight in ${unit}`}
                  placeholder={`Today's weight (${unit})`}
                  value={weightInput}
                  onChange={e => setWeightInput(e.target.value)}
                  style={styles.weighInput}
                />
                <button type="submit" style={styles.weighBtn} disabled={savingWeight}>
                  {savingWeight ? '...' : 'Log weight'}
                </button>
              </form>
            </div>
          </div>

          {/* ===== CALORIES + MACRO AVERAGES ===== */}
          <div style={styles.midRow}>
            <div style={{ ...styles.chartCard, flex: '2.2 1 380px' }}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>Calories</h2>
                {calorieTarget && (
                  <span style={styles.changeTag}>target {calorieTarget.toLocaleString()} kcal</span>
                )}
              </div>
              {loggedDays.length > 0 ? (
                <CalorieChart days={summary} target={calorieTarget} />
              ) : (
                <div style={styles.emptyChart}>
                  No logged days in this range yet — food you log shows up here.
                </div>
              )}
            </div>

            <div style={styles.macroCol}>
              {[
                { label: 'Avg protein / day', value: avg('protein'), color: '#c24337' },
                { label: 'Avg carbs / day', value: avg('carbs'), color: '#9b6719' },
                { label: 'Avg fat / day', value: avg('fat'), color: '#2e74ba' },
              ].map(m => (
                <div key={m.label} style={styles.macroCard}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: m.color }}>{m.value}g</div>
                  <div style={{ fontSize: 11, color: '#777167' }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ===== DAY EDITOR MODAL ===== */}
      {editingDate && (
        <div style={styles.modalOverlay} onClick={() => setEditingDate(null)}>
          <div style={styles.modalBox} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17, color: '#2D2A26' }}>
                  {new Date(editingDate + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
                <div style={{ fontSize: 12, color: '#777167', marginTop: 2 }}>Click outside to close</div>
              </div>
              <button onClick={() => setEditingDate(null)}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#777167' }}>✕</button>
            </div>

            {dayError && (
              <div style={{ background: '#FDF0EE', border: '1px solid #DC4C3F', color: '#c24337', borderRadius: 10, padding: '8px 12px', fontSize: 13, marginBottom: 14 }}>
                {dayError}
              </div>
            )}

            {/* Weight section */}
            <div style={styles.modalSection}>
              <div style={styles.modalSectionTitle}>⚖️ Weight</div>
              <form onSubmit={handleDayLogWeight} style={{ display: 'flex', gap: 8 }}>
                <input
                  type="number" step="0.1"
                  placeholder={`Weight (${unit})`}
                  value={dayWeightInput}
                  onChange={e => setDayWeightInput(e.target.value)}
                  style={styles.modalInput}
                />
                <button type="submit" disabled={savingDayWeight} style={styles.modalBtn}>
                  {savingDayWeight ? '...' : weightByDate[editingDate] ? 'Update' : 'Log'}
                </button>
              </form>
              {weightByDate[editingDate] && (
                <div style={{ fontSize: 12, color: '#777167', marginTop: 6 }}>
                  Current: {disp(weightByDate[editingDate])} {unit}
                </div>
              )}
            </div>

            {/* Food diary section */}
            <div style={styles.modalSection}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <div style={styles.modalSectionTitle}>🍽️ Food diary</div>
                {dayTotals.calories > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#188159' }}>
                    {Math.round(dayTotals.calories)} kcal · {Math.round(dayTotals.protein)}g P · {Math.round(dayTotals.carbs)}g C · {Math.round(dayTotals.fat)}g F
                  </span>
                )}
              </div>

              {dayLoading ? (
                <div style={{ fontSize: 13, color: '#777167' }}>Loading...</div>
              ) : dayLogs.length === 0 ? (
                <div style={{ fontSize: 13, color: '#777167', padding: '8px 0' }}>No food logged this day.</div>
              ) : (
                <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 10 }}>
                  {dayLogs.map(entry => (
                    <div key={entry._id} style={styles.modalLogRow}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{entry.foodName}</div>
                        <div style={{ fontSize: 11, color: '#777167' }}>{entry.quantity}x · {entry.meal} · {Math.round(entry.calories)} kcal</div>
                      </div>
                      <button onClick={() => handleDayDeleteLog(entry._id)}
                        style={{ background: 'none', border: 'none', color: '#c24337', fontSize: 16, cursor: 'pointer' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Food search */}
              <form onSubmit={handleDaySearch} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  placeholder="Search foods to add..."
                  value={daySearch}
                  onChange={e => setDaySearch(e.target.value)}
                  style={{ ...styles.modalInput, flex: 1 }}
                />
                <button type="submit" disabled={daySearching} style={styles.modalBtn}>
                  {daySearching ? '...' : 'Search'}
                </button>
              </form>

              {/* Search results */}
              {daySearchResults.length > 0 && !daySelectedFood && (
                <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid #eee', borderRadius: 10, marginBottom: 8 }}>
                  {daySearchResults.map(food => (
                    <div key={food._id} onClick={() => setDaySelectedFood(food)}
                      style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}>
                      <strong>{food.name}</strong>
                      {food.brand && <span style={{ color: '#777167', marginLeft: 6 }}>{food.brand}</span>}
                      <span style={{ float: 'right', color: '#188159', fontWeight: 600 }}>{food.calories} kcal</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected food form */}
              {daySelectedFood && (
                <form onSubmit={handleDayAddLog} style={{ background: '#F0FBF6', borderRadius: 10, padding: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong style={{ fontSize: 13 }}>{daySelectedFood.name}</strong>
                    <button type="button" onClick={() => setDaySelectedFood(null)}
                      style={{ background: 'none', border: 'none', color: '#c24337', cursor: 'pointer', fontSize: 16 }}>✕</button>
                  </div>
                  <div style={{ fontSize: 12, color: '#777167', marginBottom: 8 }}>
                    {daySelectedFood.calories} kcal · {daySelectedFood.protein}g P · {daySelectedFood.carbs}g C · {daySelectedFood.fat}g F per serving
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="number" min="0.1" step="0.1" value={dayQuantity}
                      onChange={e => setDayQuantity(Number(e.target.value))}
                      style={{ ...styles.modalInput, width: 70 }} />
                    <select value={dayMeal} onChange={e => setDayMeal(e.target.value as Meal)}
                      style={{ ...styles.modalInput, flex: 1 }}>
                      {(['breakfast', 'lunch', 'dinner', 'snack'] as Meal[]).map(m => (
                        <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                      ))}
                    </select>
                    <button type="submit" disabled={dayAdding} style={styles.modalBtn}>
                      {dayAdding ? '...' : 'Add'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== calendar helpers =====

function buildMonthCells(monthDate: Date): (string | null)[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  return cells;
}

function CalendarDay({
  date, day, hasWeight, target, selected, onSelect,
}: {
  date: string;
  day?: DailySummary;
  hasWeight: boolean;
  target: number | null;
  selected: boolean;
  onSelect: () => void;
}) {
  const isToday = date === todayString();
  const logged = day && day.calories > 0;
  const over = logged && target ? day.calories > target * 1.1 : false;

  let background = 'transparent';
  let color = '#777167';
  if (logged) {
    background = over ? '#FAEEDA' : '#E1F5EE';
    color = over ? '#854F0B' : '#085041';
  }
  if (selected) {
    background = '#188159';
    color = '#fff';
  }

  return (
    <button
      onClick={onSelect}
      title={logged ? `${date}: ${day!.calories} kcal` : date}
      aria-label={`${date}${logged ? `, ${day!.calories} calories` : ', nothing logged'}`}
      style={{
        border: isToday && !selected ? '1.5px solid #1FA873' : '1.5px solid transparent',
        background,
        color,
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 600,
        width: '100%',
        aspectRatio: '1',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        padding: 0,
        fontFamily: 'Arial',
      }}
    >
      {Number(date.slice(8, 10))}
      <span
        style={{
          width: 3.5,
          height: 3.5,
          borderRadius: '50%',
          background: hasWeight ? (selected ? '#fff' : '#378ADD') : 'transparent',
        }}
      />
    </button>
  );
}

// ===== SVG charts (no dependencies) =====

function WeightChart({ entries }: { entries: WeightEntry[] }) {
  const W = 600, H = 150, PAD = 32;
  const values = entries.map(e => e.weightKg);
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => PAD + (i / (entries.length - 1)) * (W - PAD * 2);
  const y = (v: number) => H - PAD - ((v - min) / span) * (H - PAD * 2);
  const points = entries.map((e, i) => `${x(i)},${y(e.weightKg)}`).join(' ');
  const fmt = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} role="img"
      aria-label={`Weight trend from ${entries[0].weightKg} to ${entries[entries.length - 1].weightKg} kilograms`}>
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#EFE9DE" strokeWidth="1" />
      <text x={PAD - 6} y={y(max) + 4} textAnchor="end" fontSize="10" fill="#777167">{max}</text>
      <text x={PAD - 6} y={y(min) + 4} textAnchor="end" fontSize="10" fill="#777167">{min}</text>
      <polyline points={points} fill="none" stroke="#1FA873" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {entries.map((e, i) => (
        <circle key={e._id} cx={x(i)} cy={y(e.weightKg)} r="3" fill="#1FA873">
          <title>{`${e.date}: ${e.weightKg} kg`}</title>
        </circle>
      ))}
      <text x={PAD} y={H - PAD + 15} fontSize="10" fill="#777167">{fmt(entries[0].date)}</text>
      <text x={W - PAD} y={H - PAD + 15} textAnchor="end" fontSize="10" fill="#777167">
        {fmt(entries[entries.length - 1].date)}
      </text>
    </svg>
  );
}

function CalorieChart({ days, target }: { days: DailySummary[]; target: number | null }) {
  const W = 600, H = 150, PAD = 32;
  const maxVal = Math.max(...days.map(d => d.calories), target ?? 0) * 1.1 || 1;
  const innerW = W - PAD * 2;
  const gap = days.length > 40 ? 1 : 3;
  const barW = Math.max(innerW / days.length - gap, 1.5);
  const y = (v: number) => H - PAD - (v / maxVal) * (H - PAD * 2);
  const fmt = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} role="img"
      aria-label={`Daily calories over ${days.length} days${target ? ` against a target of ${target}` : ''}`}>
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#EFE9DE" strokeWidth="1" />
      {days.map((d, i) => (
        <rect
          key={d.date}
          x={PAD + i * (innerW / days.length) + gap / 2}
          y={d.calories > 0 ? y(d.calories) : H - PAD - 1}
          width={barW}
          height={d.calories > 0 ? H - PAD - y(d.calories) : 1}
          rx={barW > 4 ? 2 : 0}
          fill={d.calories > 0 ? '#1FA873' : '#EFE9DE'}
        >
          <title>{`${d.date}: ${Math.round(d.calories)} kcal`}</title>
        </rect>
      ))}
      {target && (
        <>
          <line x1={PAD} y1={y(target)} x2={W - PAD} y2={y(target)}
            stroke="#2D2A26" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.5" />
          <text x={W - PAD} y={y(target) - 5} textAnchor="end" fontSize="10" fill="#777167">
            target {target.toLocaleString()}
          </text>
        </>
      )}
      <text x={PAD} y={H - PAD + 15} fontSize="10" fill="#777167">{fmt(days[0].date)}</text>
      <text x={W - PAD} y={H - PAD + 15} textAnchor="end" fontSize="10" fill="#777167">
        {fmt(days[days.length - 1].date)}
      </text>
    </svg>
  );
}

export default ProgressPage;

/* ================= styles — match DashboardPage conventions ================= */

const styles: any = {
  page: { minHeight: '100vh', background: '#FFF8ED', padding: 20, fontFamily: 'Arial', display: 'flex', flexDirection: 'column', gap: 15 },
  ribbon: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '12px 18px', borderRadius: 12, boxShadow: '0 6px 16px rgba(0,0,0,0.05)' },
  brand: { fontSize: 16, fontWeight: 700, color: '#2D2A26' },
  ribbonItem: { fontSize: 13, fontWeight: 600, color: '#2D2A26', cursor: 'pointer', borderBottom: '2px solid #1FA873', paddingBottom: 2 },
  ribbonItemMuted: { fontSize: 13, fontWeight: 600, color: '#77746e', cursor: 'pointer' },
  ribbonRight: { display: 'flex', alignItems: 'center', gap: 10 },
  userTag: { fontSize: 12, color: '#2D2A26', background: '#FFF8ED', padding: '6px 10px', borderRadius: 10 },
  logoutBtn: { background: '#c24337', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 10, cursor: 'pointer', fontWeight: 600 },

  samplePill: { background: '#FAEEDA', border: '1px solid #EF9F27', color: '#854F0B', borderRadius: 12, padding: '10px 16px', fontSize: 13 },

  rangeRow: { display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' },
  rangeBtn: { padding: '7px 14px', borderRadius: 10, border: '1px solid #EFE9DE', background: '#fff', color: '#777167', fontWeight: 600, fontSize: 12, cursor: 'pointer' },
  rangeActive: { padding: '7px 14px', borderRadius: 10, border: '1px solid #1FA873', background: '#188159', color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer' },

  statRow: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  statCard: { flex: '1 1 140px', background: '#fff', borderRadius: 14, padding: '12px 16px', boxShadow: '0 10px 28px rgba(0,0,0,0.07)' },
  statValue: { fontSize: 20, fontWeight: 700, lineHeight: 1.2 },
  statLabel: { fontSize: 11, color: '#777167', marginTop: 2 },

  midRow: { display: 'flex', gap: 15, alignItems: 'stretch', flexWrap: 'wrap' },

  calendarCard: { flex: '1 1 280px', maxWidth: 360, background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 10px 28px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column' },
  calHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  calTitle: { fontSize: 13, fontWeight: 700, color: '#2D2A26' },
  calNav: { border: 'none', background: '#FFF8ED', color: '#2D2A26', borderRadius: 8, width: 26, height: 26, cursor: 'pointer', fontSize: 14, fontWeight: 700 },
  calGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 },
  calDow: { textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#77746e', padding: '2px 0' },

  dayDetail: { marginTop: 10, background: '#FFF8ED', borderRadius: 10, padding: '8px 12px' },
  dayDetailDate: { fontSize: 11, fontWeight: 700, color: '#777167', marginBottom: 2 },
  dayDetailStats: { display: 'flex', gap: 10, fontSize: 12, fontWeight: 700, flexWrap: 'wrap' },

  calLegend: { display: 'flex', gap: 12, marginTop: 8, fontSize: 10, color: '#777167', alignItems: 'center' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 4 },
  legendSwatch: { width: 10, height: 10, borderRadius: 3, display: 'inline-block' },
  legendDot: { width: 5, height: 5, borderRadius: '50%', background: '#378ADD', display: 'inline-block' },

  chartCard: { flex: '2 1 340px', background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 10px 28px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  cardTitle: { margin: 0, fontSize: 15, color: '#2D2A26' },
  changeTag: { fontSize: 11, color: '#777167', fontWeight: 600 },

  emptyChart: { color: '#777167', fontSize: 12, padding: '24px 10px', textAlign: 'center', background: '#FFF8ED', borderRadius: 12, flex: 1 },

  weighRow: { display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 10 },
  weighInput: { flex: 1, maxWidth: 200, padding: 9, borderRadius: 10, background: '#FFF8ED', border: '1px solid transparent', fontSize: 12 },
  weighBtn: { padding: '9px 14px', background: '#188159', color: '#fff', borderRadius: 10, border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 12 },

  unitToggle: { display: 'flex', background: '#FFF8ED', borderRadius: 8, padding: 2, gap: 2 },
  unitBtn: { border: 'none', background: 'transparent', color: '#777167', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, cursor: 'pointer' },
  unitActive: { border: 'none', background: '#188159', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, cursor: 'pointer' },

  macroCol: { flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: 12 },
  macroCard: { flex: 1, background: '#fff', borderRadius: 14, padding: '10px 16px', boxShadow: '0 10px 28px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', justifyContent: 'center' },

  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalBox: { background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalSection: { marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f0ede8' },
  modalSectionTitle: { fontSize: 13, fontWeight: 700, color: '#2D2A26', marginBottom: 10 },
  modalInput: { padding: '9px 12px', borderRadius: 10, background: '#FFF8ED', border: '1px solid transparent', fontSize: 13, outline: 'none' },
  modalBtn: { padding: '9px 16px', background: '#188159', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' },
  modalLogRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f5f5f5' },
};
