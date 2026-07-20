// src/pages/DashboardPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  searchFoods,
  createCustomFood,
  identifyFoodFromPhoto,
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
  type AIFoodResult,
} from '../api/client';
import { loadGoals } from './GoalsPage';

const MEALS: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_LABELS: Record<Meal, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snacks' };
const TODAY = todayString();

function DashboardPage() {
  const navigate = useNavigate();
  const GOALS = loadGoals();

  // Diary state
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [totals, setTotals] = useState({ calories: 0, protein: 0, fat: 0, carbs: 0 });
  const [diaryLoading, setDiaryLoading] = useState(true);

  // Water state
  const WATER_GOAL_ML = 2000;
  const [waterMl, setWaterMl] = useState(0);
  const [waterInput, setWaterInput] = useState('');
  const [waterAdding, setWaterAdding] = useState(false);

  // Error state
  const [error, setError] = useState('');

  // Search modal state
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'search' | 'custom'>('search');
  const [modalQuery, setModalQuery] = useState('');
  const [modalResults, setModalResults] = useState<Food[]>([]);
  const [modalSearching, setModalSearching] = useState(false);
  const [modalSelectedFood, setModalSelectedFood] = useState<Food | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalMeal, setModalMeal] = useState<Meal>('breakfast');
  const [modalAdding, setModalAdding] = useState(false);
  const [modalError, setModalError] = useState('');

  // Custom food state
  const [customName, setCustomName] = useState('');
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');
  const [customServingSize, setCustomServingSize] = useState('1');
  const [customServingUnit, setCustomServingUnit] = useState('serving');
  const [customCreating, setCustomCreating] = useState(false);
  const [customSuccess, setCustomSuccess] = useState('');

  // AI photo recognition state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoMediaType, setPhotoMediaType] = useState<string>('image/jpeg');
  const [aiResult, setAiResult] = useState<AIFoodResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiQuantity, setAiQuantity] = useState(1);
  const [aiMeal, setAiMeal] = useState<Meal>('breakfast');
  const [aiAdding, setAiAdding] = useState(false);

  // Micronutrients state (per-food)
  const [microData, setMicroData] = useState<MicronutrientsResult | null>(null);
  const [microLoading, setMicroLoading] = useState(false);
  const [microError, setMicroError] = useState('');

  // Daily micronutrients state
  const [dailyMicroData, setDailyMicroData] = useState<Record<string, Record<string, { amount: number; unit: string }>> | null>(null);
  const [dailyMicroLoading, setDailyMicroLoading] = useState(false);
  const [dailyMicroError, setDailyMicroError] = useState('');

  const loadDiary = useCallback(async () => {
    try {
      const [log, water] = await Promise.all([getLogs(TODAY), getWater(TODAY)]);
      setEntries(log.entries);
      setTotals(log.totals);
      setWaterMl(water.totalMl);
    } catch (err: any) {
      if (err.message?.includes('Invalid or expired token')) logout();
    } finally {
      setDiaryLoading(false);
    }
  }, []);

  useEffect(() => { loadDiary(); }, [loadDiary]);

  // ─── Search modal ───────────────────────────────────────────
  async function openSearchModal(query = '') {
    setModalQuery(query);
    setModalResults([]);
    setModalSelectedFood(null);
    setModalError('');
    setModalTab('search');
    setSearchModalOpen(true);
    if (query.trim()) {
      setModalSearching(true);
      try {
        setModalResults(await searchFoods(query.trim()));
      } catch (err: any) {
        setModalError(err.message || 'Search failed');
      } finally {
        setModalSearching(false);
      }
    }
  }

  async function handleModalSearch(e: any) {
    e.preventDefault();
    if (!modalQuery.trim()) return;
    setModalSearching(true);
    setModalError('');
    setModalSelectedFood(null);
    try {
      setModalResults(await searchFoods(modalQuery.trim()));
    } catch (err: any) {
      setModalError(err.message || 'Search failed');
    } finally {
      setModalSearching(false);
    }
  }

  async function handleModalAddLog(e: any) {
    e.preventDefault();
    if (!modalSelectedFood) return;
    setModalAdding(true);
    setModalError('');
    try {
      await addLog({ foodId: modalSelectedFood._id, quantity: modalQuantity, meal: modalMeal, date: TODAY });
      await loadDiary();
      setSearchModalOpen(false);
      setModalResults([]);
      setModalQuery('');
      setModalSelectedFood(null);
    } catch (err: any) {
      setModalError(err.message || 'Failed to log food');
    } finally {
      setModalAdding(false);
    }
  }

  async function handleCreateCustomFood(e: any) {
    e.preventDefault();
    if (!customName || !customCalories) return;
    setCustomCreating(true);
    setModalError('');
    setCustomSuccess('');
    try {
      const food = await createCustomFood({
        name: customName,
        calories: Number(customCalories),
        protein: Number(customProtein) || 0,
        carbs: Number(customCarbs) || 0,
        fat: Number(customFat) || 0,
        servingSize: Number(customServingSize) || 1,
        servingSizeUnit: customServingUnit,
      });
      setCustomSuccess(`"${food.name}" created! Switch to Search to find and log it.`);
      setCustomName(''); setCustomCalories(''); setCustomProtein('');
      setCustomCarbs(''); setCustomFat(''); setCustomServingSize('1');
    } catch (err: any) {
      setModalError(err.message || 'Failed to create food');
    } finally {
      setCustomCreating(false);
    }
  }

  function closeModal() {
    setSearchModalOpen(false);
    setModalError('');
    setCustomSuccess('');
    setPhotoPreview(null);
    setPhotoBase64(null);
    setAiResult(null);
    setAiError('');
  }

  function handlePhotoSelect(e: any) {
    const file: File = e.target.files?.[0];
    if (!file) return;
    setAiResult(null);
    setAiError('');
    setPhotoMediaType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      setPhotoPreview(dataUrl);
      // Strip the data:image/...;base64, prefix — API only wants raw base64
      setPhotoBase64(dataUrl.split(',')[1]);
    };
    reader.readAsDataURL(file);
  }

  async function handleIdentifyFood() {
    if (!photoBase64) return;
    setAiLoading(true);
    setAiError('');
    setAiResult(null);
    try {
      const result = await identifyFoodFromPhoto(photoBase64, photoMediaType);
      setAiResult(result);
      setAiQuantity(1);
      setAiMeal('breakfast');
    } catch (err: any) {
      setAiError(err.message || 'Failed to identify food');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleAiAddLog(e: any) {
    e.preventDefault();
    if (!aiResult) return;
    setAiAdding(true);
    setModalError('');
    try {
      // Save as a custom food first so it has a Mongo _id to log against
      const food = await createCustomFood({
        name: aiResult.name,
        calories: aiResult.calories,
        protein: aiResult.protein,
        carbs: aiResult.carbs,
        fat: aiResult.fat,
        servingSize: aiResult.servingSize,
        servingSizeUnit: aiResult.servingSizeUnit,
      });
      await addLog({ foodId: food._id, quantity: aiQuantity, meal: aiMeal, date: TODAY });
      await loadDiary();
      closeModal();
    } catch (err: any) {
      setModalError(err.message || 'Failed to log food');
    } finally {
      setAiAdding(false);
    }
  }

  // ─── Delete log ───────────────────────────────────────────
  async function handleDeleteLog(id: string) {
    setError('');
    try {
      await deleteLog(id);
      await loadDiary();
    } catch (err: any) {
      setError(err.message || 'Failed to delete entry');
    }
  }

  // ─── Micronutrients (per food) ───────────────────────────
  async function handleViewMicronutrients(food: Food) {
    setMicroData(null);
    setMicroError('');
    setMicroLoading(true);
    try {
      setMicroData(await getMicronutrients(food._id));
    } catch (err: any) {
      setMicroError(err.message || 'Failed to load nutrition details');
      setMicroData({ foodId: food._id, foodName: food.name, servingSize: food.servingSize, servingSizeUnit: food.servingSizeUnit, source: food.source, micronutrients: {} });
    } finally {
      setMicroLoading(false);
    }
  }

  // ─── Daily micronutrients ─────────────────────────────────
  async function handleViewDailyMicronutrients() {
    setDailyMicroData(null);
    setDailyMicroError('');
    setDailyMicroLoading(true);
    try {
      if (entries.length === 0) { setDailyMicroData({}); setDailyMicroLoading(false); return; }
      const foodQuantities: Record<string, number> = {};
      entries.forEach(e => { foodQuantities[e.foodId] = (foodQuantities[e.foodId] || 0) + e.quantity; });
      const ids = Object.keys(foodQuantities);
      const results = await Promise.all(ids.map(id => getMicronutrients(id).catch(() => null)));
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
      Object.values(agg).forEach(cat => Object.values(cat).forEach(n => { n.amount = Math.round(n.amount * 100) / 100; }));
      setDailyMicroData(agg);
    } catch (err: any) {
      setDailyMicroError(err.message || 'Failed to load micronutrients');
      setDailyMicroData({});
    } finally {
      setDailyMicroLoading(false);
    }
  }

  // ─── Water ───────────────────────────────────────────────
  async function handleAddWater(e: any) {
    e.preventDefault();
    const amount = Number(waterInput);
    if (!amount || amount <= 0) return;
    setWaterAdding(true);
    try {
      await addWater(amount, TODAY);
      setWaterMl((await getWater(TODAY)).totalMl);
      setWaterInput('');
    } catch (err: any) {
      setError(err.message || 'Failed to log water');
    } finally {
      setWaterAdding(false);
    }
  }

  async function handleQuickAddWater(amount: number) {
    setWaterAdding(true);
    try {
      await addWater(amount, TODAY);
      setWaterMl((await getWater(TODAY)).totalMl);
    } catch (err: any) {
      setError(err.message || 'Failed to log water');
    } finally {
      setWaterAdding(false);
    }
  }

  const grouped = MEALS.reduce((acc, m) => {
    acc[m] = entries.filter(e => e.meal === m);
    return acc;
  }, {} as Record<Meal, LogEntry[]>);

  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

  // ─── Shared input style ───────────────────────────────────
  const fieldStyle: any = { width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #E8E4DC', background: '#FFF8ED', fontSize: 13, boxSizing: 'border-box' };

  return (
    <div style={S.page}>
      {/* NAVBAR */}
      <div style={S.ribbon}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={S.brand}>Calorific</div>
          <div style={S.navActive}>Log</div>
          <div style={S.navMuted} onClick={() => navigate('/goals')}>Goals</div>
          <div style={S.navMuted} onClick={() => navigate('/progress')}>Trends</div>
          <div style={S.navMuted} onClick={() => navigate('/settings')}>Settings</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={S.userTag}>Welcome back, {getStoredFirstName() || 'there'} 👋</div>
          <button style={S.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </div>

      {error && <div style={S.errorBanner}>{error}</div>}

      {/* TOP GRID */}
      <div style={S.topGrid}>
        {/* LOG FOOD CARD */}
        <div style={S.card}>
          <h2 style={{ margin: '0 0 14px', fontSize: 18 }}>Log food</h2>

          {/* Search trigger */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              aria-label="Search foods"
              placeholder="Search foods to log..."
              value={modalQuery}
              onChange={e => setModalQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); openSearchModal(modalQuery); } }}
              style={{ ...S.searchInput, flex: 1 }}
            />
            <button onClick={() => openSearchModal(modalQuery)} style={S.searchBtn}>Search</button>
          </div>
          <button
            onClick={() => { setModalTab('custom'); setModalError(''); setCustomSuccess(''); setSearchModalOpen(true); }}
            style={S.customFoodBtn}>
            + Create custom food
          </button>

          {/* Water tracker */}
          <div style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 14 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 48, height: 64, flexShrink: 0 }}>
                <div style={{ position: 'absolute', inset: 0, border: '2.5px solid #2e74ba', borderRadius: '4px 4px 8px 8px', overflow: 'hidden', background: '#f0f6ff' }}>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${Math.min((waterMl / WATER_GOAL_ML) * 100, 100)}%`, background: 'linear-gradient(180deg,#5ba4e5 0%,#2e74ba 100%)', transition: 'height 0.5s ease' }} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <strong style={{ fontSize: 13 }}>💧 Water today</strong>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#2e74ba' }}>{waterMl} <span style={{ fontWeight: 400, color: '#777167' }}>/ {WATER_GOAL_ML} ml</span></span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  {[250, 500, 750].map(amt => (
                    <button key={amt} type="button" disabled={waterAdding} onClick={() => handleQuickAddWater(amt)}
                      style={{ flex: 1, padding: '6px 0', background: '#EBF3FB', color: '#2e74ba', border: '1px solid #c5ddf5', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      +{amt}ml
                    </button>
                  ))}
                </div>
                <form onSubmit={handleAddWater} style={{ display: 'flex', gap: 8 }}>
                  <input type="number" aria-label="Water amount ml" placeholder="Custom ml..." value={waterInput} onChange={e => setWaterInput(e.target.value)}
                    style={{ flex: 1, padding: 10, borderRadius: 10, background: '#FFF8ED', border: 'none', outline: 'none' }} />
                  <button type="submit" disabled={waterAdding}
                    style={{ padding: '10px 14px', background: '#2e74ba', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
                    {waterAdding ? '...' : '+ Add'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* TODAY SUMMARY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {/* Calories card */}
          <div style={S.card}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#188159', letterSpacing: 0.5 }}>Today</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#2D2A26', marginBottom: 12 }}>{todayLabel}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#2D2A26', lineHeight: 1 }}>{Math.round(totals.calories).toLocaleString()}</div>
              <div style={{ fontSize: 12, color: '#777167', textAlign: 'right' }}>
                <div>kcal</div>
                <div>/ {GOALS.calories} goal</div>
              </div>
            </div>
            <div style={{ background: '#F0EDE8', borderRadius: 6, height: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(GOALS.calories > 0 ? (totals.calories / GOALS.calories) * 100 : 0, 100)}%`, background: totals.calories > GOALS.calories ? '#c24337' : '#1FA873', borderRadius: 6, transition: 'width 0.4s' }} />
            </div>
          </div>

          {/* Macros card */}
          <div style={{ ...S.card, display: 'flex', justifyContent: 'space-between' }}>
            {[
              { label: 'Fat',     value: totals.fat,     goal: GOALS.fat,     color: '#2e74ba' },
              { label: 'Protein', value: totals.protein, goal: GOALS.protein, color: '#c24337' },
              { label: 'Carbs',   value: totals.carbs,   goal: GOALS.carbs,   color: '#9b6719' },
            ].map(({ label, value, goal, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color }}>{Math.round(value)}g</div>
                <div style={{ fontSize: 10, color: '#bbb', marginBottom: 4 }}>/ {goal}g</div>
                <div style={{ background: '#F0EDE8', borderRadius: 4, height: 5, overflow: 'hidden', width: '100%' }}>
                  <div style={{ height: '100%', width: `${Math.min(goal > 0 ? (value / goal) * 100 : 0, 100)}%`, background: color, borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 11, color: '#777167', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Daily micronutrients button */}
          <button onClick={handleViewDailyMicronutrients}
            style={{ padding: '12px', background: '#fff', border: '1.5px solid #1FA873', borderRadius: 12, color: '#188159', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            🔬 View Today's Micronutrients
          </button>
        </div>
      </div>

      {/* FOOD DIARY */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Food diary</h2>
          <p style={{ margin: 0, color: '#777167' }}>Total: {Math.round(totals.calories)} kcal</p>
        </div>
        {diaryLoading ? (
          <p style={{ color: '#777167', fontSize: 13 }}>Loading diary...</p>
        ) : (
          MEALS.map(m => {
            const items = grouped[m];
            const mealCalories = items.reduce((s, i) => s + i.calories, 0);
            return (
              <div key={m} style={{ marginBottom: 15 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#F3F6FF', padding: 10, borderRadius: 8, marginBottom: 8 }}>
                  <strong>{MEAL_LABELS[m]}</strong>
                  <span style={{ color: '#777167' }}>{Math.round(mealCalories)} kcal</span>
                </div>
                {items.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#767676', padding: 10 }}>No entries</div>
                ) : (
                  items.map(item => (
                    <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottom: '1px solid #eee' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.foodName}</div>
                        <div style={{ fontSize: 12, color: '#777167' }}>{item.quantity}x serving</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#2D2A26', minWidth: 70, textAlign: 'right' }}>{Math.round(item.calories)} kcal</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#c24337' }}>{Math.round(item.protein)}g P</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#9b6719' }}>{Math.round(item.carbs)}g C</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#2e74ba' }}>{Math.round(item.fat)}g F</span>
                        <button onClick={() => handleDeleteLog(item._id)} style={{ border: 'none', background: 'transparent', color: '#c24337', fontSize: 16, cursor: 'pointer' }}>✕</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })
        )}
      </div>

      {/* GOALS RINGS */}
      <div style={S.card}>
        <h2 style={{ margin: '0 0 20px', fontSize: 18 }}>Goals</h2>
        <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 20 }}>
          <ProgressRing value={Math.round(totals.calories)} max={GOALS.calories} color="#1FA873" label="Calories" unit="kcal" />
          <ProgressRing value={Math.round(totals.protein)} max={GOALS.protein} color="#DC4C3F" label="Protein" unit="g" />
          <ProgressRing value={Math.round(totals.carbs)} max={GOALS.carbs} color="#EF9F27" label="Carbs" unit="g" />
          <ProgressRing value={Math.round(totals.fat)} max={GOALS.fat} color="#378ADD" label="Fat" unit="g" />
        </div>
      </div>

      {/* ── SEARCH & CUSTOM FOOD MODAL ── */}
      {searchModalOpen && (
        <div style={S.overlay} onClick={closeModal}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#2D2A26' }}>Add Food</div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#777167' }}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', background: '#F5F2EE', borderRadius: 12, padding: 4, marginBottom: 20 }}>
              {(['search', 'photo', 'custom'] as Array<'search' | 'photo' | 'custom'>).map(tab => (
                <button key={tab} onClick={() => { setModalTab(tab as any); setModalError(''); setCustomSuccess(''); setAiError(''); }}
                  style={{ flex: 1, padding: 9, borderRadius: 10, border: 'none', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                    background: modalTab === tab ? '#1FA873' : 'transparent',
                    color: modalTab === tab ? '#fff' : '#777167' }}>
                  {tab === 'search' ? '🔍 Search' : tab === 'photo' ? '📷 AI Photo' : '✏️ Create'}
                </button>
              ))}
            </div>

            {modalError && <div style={S.errorBanner}>{modalError}</div>}

            {/* ── AI Photo tab ── */}
            {modalTab === 'photo' && (
              <div>
                {/* Upload area */}
                {!photoPreview ? (
                  <label style={{ display: 'block', cursor: 'pointer' }}>
                    <div style={{ border: '2px dashed #1FA873', borderRadius: 14, padding: '40px 20px', textAlign: 'center', background: '#F0FBF6' }}>
                      <div style={{ fontSize: 48, marginBottom: 10 }}>📷</div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#2D2A26', marginBottom: 4 }}>Take or upload a food photo</div>
                      <div style={{ fontSize: 13, color: '#777167' }}>Claude will identify the food and estimate its nutrition</div>
                    </div>
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} style={{ display: 'none' }} />
                  </label>
                ) : (
                  <div>
                    {/* Image preview */}
                    <div style={{ position: 'relative', marginBottom: 14 }}>
                      <img src={photoPreview} alt="Food preview"
                        style={{ width: '100%', maxHeight: 260, objectFit: 'cover', borderRadius: 12 }} />
                      <button onClick={() => { setPhotoPreview(null); setPhotoBase64(null); setAiResult(null); setAiError(''); }}
                        style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 16 }}>✕</button>
                    </div>

                    {/* Identify button */}
                    {!aiResult && !aiLoading && (
                      <button onClick={handleIdentifyFood}
                        style={{ width: '100%', padding: 13, background: '#1FA873', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 14 }}>
                        🤖 Identify with Claude AI
                      </button>
                    )}

                    {/* Loading state */}
                    {aiLoading && (
                      <div style={{ textAlign: 'center', padding: '20px 0', marginBottom: 14 }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🧠</div>
                        <div style={{ fontWeight: 600, color: '#2D2A26', marginBottom: 4 }}>Claude is analysing your food...</div>
                        <div style={{ fontSize: 12, color: '#777167' }}>Identifying ingredients and estimating nutrition</div>
                      </div>
                    )}

                    {aiError && (
                      <div style={{ background: '#FDF0EE', border: '1px solid #DC4C3F', color: '#c24337', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>
                        {aiError}
                        <button onClick={() => { setPhotoPreview(null); setPhotoBase64(null); setAiError(''); }}
                          style={{ display: 'block', marginTop: 6, background: 'none', border: 'none', color: '#c24337', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>
                          Try a different photo
                        </button>
                      </div>
                    )}

                    {/* AI Result */}
                    {aiResult && !aiLoading && (
                      <form onSubmit={handleAiAddLog}>
                        <div style={{ background: '#F0FBF6', border: '1.5px solid #1FA873', borderRadius: 14, padding: 16, marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: 15, color: '#2D2A26' }}>{aiResult.name}</div>
                              <div style={{ fontSize: 12, color: '#777167', marginTop: 3 }}>{aiResult.description}</div>
                            </div>
                            {/* Confidence badge */}
                            <div style={{ background: aiResult.confidence >= 0.8 ? '#1FA873' : aiResult.confidence >= 0.6 ? '#EF9F27' : '#DC4C3F',
                              color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, flexShrink: 0, marginLeft: 10 }}>
                              {Math.round(aiResult.confidence * 100)}% confident
                            </div>
                          </div>

                          {/* Nutrition grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
                            {[
                              { label: 'Calories', value: aiResult.calories, unit: 'kcal', color: '#2D2A26' },
                              { label: 'Protein',  value: aiResult.protein,  unit: 'g',    color: '#DC4C3F' },
                              { label: 'Carbs',    value: aiResult.carbs,    unit: 'g',    color: '#EF9F27' },
                              { label: 'Fat',      value: aiResult.fat,      unit: 'g',    color: '#378ADD' },
                            ].map(({ label, value, unit, color }) => (
                              <div key={label} style={{ background: '#fff', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                                <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}{unit}</div>
                                <div style={{ fontSize: 10, color: '#777167', marginTop: 2 }}>{label}</div>
                              </div>
                            ))}
                          </div>

                          <div style={{ fontSize: 11, color: '#777167', marginBottom: 12 }}>
                            Per {aiResult.servingSize}{aiResult.servingSizeUnit} serving · AI estimates may vary
                          </div>

                          <div style={{ display: 'flex', gap: 8 }}>
                            <input type="number" min="0.1" step="0.1" value={aiQuantity}
                              onChange={e => setAiQuantity(Number(e.target.value))}
                              aria-label="Servings" style={{ padding: 10, borderRadius: 10, background: '#fff', border: 'none', width: 80 }} />
                            <select value={aiMeal} onChange={e => setAiMeal(e.target.value as Meal)}
                              aria-label="Meal" style={{ flex: 1, padding: 10, borderRadius: 10, background: '#fff', border: 'none' }}>
                              {MEALS.map(m => <option key={m} value={m}>{MEAL_LABELS[m]}</option>)}
                            </select>
                            <button type="submit" disabled={aiAdding}
                              style={{ padding: '10px 14px', background: '#188159', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
                              {aiAdding ? '...' : 'Log it'}
                            </button>
                          </div>
                        </div>

                        <label style={{ display: 'block', cursor: 'pointer', textAlign: 'center' }}>
                          <span style={{ fontSize: 13, color: '#777167', textDecoration: 'underline' }}>Try a different photo</span>
                          <input type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} style={{ display: 'none' }} />
                        </label>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Search tab ── */}
            {modalTab === 'search' && (
              <div>
                <form onSubmit={handleModalSearch} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <input autoFocus placeholder="Search foods..." value={modalQuery} onChange={e => setModalQuery(e.target.value)}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: '#FFF8ED', border: '1px solid #E8E4DC', fontSize: 14 }} />
                  <button type="submit" disabled={modalSearching}
                    style={{ padding: '10px 18px', background: '#1FA873', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                    {modalSearching ? '...' : 'Search'}
                  </button>
                </form>

                {modalResults.length > 0 && !modalSelectedFood && (
                  <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #eee', borderRadius: 12, marginBottom: 14 }}>
                    {modalResults.map(food => (
                      <div key={food._id}
                        onClick={() => { setModalSelectedFood(food); setModalQuantity(1); setModalMeal('breakfast'); }}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#2D2A26' }}>{food.name}</div>
                          {food.brand && <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{food.brand}</div>}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#188159' }}>{food.calories} kcal</div>
                          <div style={{ fontSize: 11, color: '#aaa' }}>{food.protein}g P · {food.carbs}g C · {food.fat}g F</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {modalResults.length === 0 && !modalSearching && modalQuery.trim() && (
                  <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: '20px 0' }}>
                    No results — try a different term or create a custom food.
                  </p>
                )}

                {modalSelectedFood && (
                  <form onSubmit={handleModalAddLog} style={{ background: '#F0FBF6', borderRadius: 12, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#2D2A26' }}>{modalSelectedFood.name}</div>
                        <div style={{ fontSize: 12, color: '#777167', marginTop: 3 }}>
                          {modalSelectedFood.calories} kcal · {modalSelectedFood.protein}g P · {modalSelectedFood.carbs}g C · {modalSelectedFood.fat}g F per serving
                        </div>
                      </div>
                      <button type="button" onClick={() => setModalSelectedFood(null)}
                        style={{ background: 'none', border: 'none', color: '#c24337', cursor: 'pointer', fontSize: 18 }}>✕</button>
                    </div>
                    <button type="button" onClick={() => handleViewMicronutrients(modalSelectedFood)}
                      style={{ background: 'none', border: 'none', color: '#188159', fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 12, textDecoration: 'underline' }}>
                      View full micronutrients
                    </button>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="number" min="0.1" step="0.1" value={modalQuantity} onChange={e => setModalQuantity(Number(e.target.value))}
                        aria-label="Servings" style={{ padding: 10, borderRadius: 10, background: '#fff', border: 'none', width: 80 }} />
                      <select value={modalMeal} onChange={e => setModalMeal(e.target.value as Meal)}
                        aria-label="Meal" style={{ flex: 1, padding: 10, borderRadius: 10, background: '#fff', border: 'none' }}>
                        {MEALS.map(m => <option key={m} value={m}>{MEAL_LABELS[m]}</option>)}
                      </select>
                      <button type="submit" disabled={modalAdding}
                        style={{ padding: '10px 14px', background: '#188159', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
                        {modalAdding ? '...' : 'Add to log'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ── Create custom tab ── */}
            {modalTab === 'custom' && (
              <form onSubmit={handleCreateCustomFood}>
                {customSuccess && (
                  <div style={{ background: '#F0FBF6', border: '1px solid #1FA873', color: '#0F6E56', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>
                    {customSuccess}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#2D2A26', display: 'block', marginBottom: 4 }}>Food name *</label>
                    <input required value={customName} onChange={e => setCustomName(e.target.value)}
                      placeholder="e.g. Homemade granola" style={fieldStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#2D2A26', display: 'block', marginBottom: 4 }}>Calories *</label>
                    <input required type="number" min="0" value={customCalories} onChange={e => setCustomCalories(e.target.value)}
                      placeholder="kcal" style={fieldStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                  {[
                    { label: 'Protein (g)', val: customProtein, setter: setCustomProtein },
                    { label: 'Carbs (g)',   val: customCarbs,   setter: setCustomCarbs },
                    { label: 'Fat (g)',     val: customFat,     setter: setCustomFat },
                  ].map(({ label, val, setter }) => (
                    <div key={label}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#2D2A26', display: 'block', marginBottom: 4 }}>{label}</label>
                      <input type="number" min="0" step="0.1" value={val} onChange={e => setter(e.target.value)}
                        placeholder="0" style={fieldStyle} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#2D2A26', display: 'block', marginBottom: 4 }}>Serving size</label>
                    <input type="number" min="0.1" step="0.1" value={customServingSize} onChange={e => setCustomServingSize(e.target.value)} style={fieldStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#2D2A26', display: 'block', marginBottom: 4 }}>Unit</label>
                    <select value={customServingUnit} onChange={e => setCustomServingUnit(e.target.value)} style={fieldStyle}>
                      {['serving', 'g', 'oz', 'cup', 'tbsp', 'tsp', 'piece', 'slice', 'ml'].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={customCreating}
                  style={{ width: '100%', padding: 12, background: '#1FA873', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  {customCreating ? 'Creating...' : 'Create Food'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── DAILY MICRONUTRIENTS MODAL ── */}
      {(dailyMicroLoading || dailyMicroData !== null) && (
        <div style={S.overlay} onClick={() => { setDailyMicroData(null); setDailyMicroError(''); }}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
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
                ? <p style={{ color: '#777167', fontSize: 13 }}>No micronutrient data available. Try logging more items.</p>
                : Object.entries(dailyMicroData).map(([category, nutrients]) => (
                  <div key={category} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#188159', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid #eee' }}>{category}</div>
                    {Object.entries(nutrients).map(([name, { amount, unit }]) => (
                      <div key={name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '1px solid #f9f9f9' }}>
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

      {/* ── PER-FOOD MICRONUTRIENTS MODAL ── */}
      {(microLoading || microData) && (
        <div style={S.overlay} onClick={() => { setMicroData(null); setMicroError(''); }}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#2D2A26' }}>{microData?.foodName ?? 'Loading...'}</div>
                {microData && <div style={{ fontSize: 12, color: '#777167', marginTop: 2 }}>Per {microData.servingSize}{microData.servingSizeUnit} serving</div>}
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
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#188159', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid #eee' }}>{category}</div>
                    {nutrients.map(n => (
                      <div key={n.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '1px solid #f9f9f9' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle stroke="#EEEEEE" fill="transparent" strokeWidth={stroke} r={radius} cx={size / 2} cy={size / 2} />
        <circle stroke={color} fill="transparent" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={offset}
          r={radius} cx={size / 2} cy={size / 2}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.4s' }} />
        <text x="50%" y="46%" textAnchor="middle" style={{ fontSize: 18, fontWeight: 700, fill: '#2D2A26' }}>{value}</text>
        <text x="50%" y="63%" textAnchor="middle" style={{ fontSize: 10, fill: '#777167' }}>/ {max}{unit}</text>
      </svg>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#2D2A26' }}>{label}</div>
    </div>
  );
}

export default DashboardPage;

const S: any = {
  page:         { minHeight: '100vh', background: '#FFF8ED', padding: 20, fontFamily: 'Arial', display: 'flex', flexDirection: 'column', gap: 15 },
  ribbon:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '12px 18px', borderRadius: 12, boxShadow: '0 6px 16px rgba(0,0,0,0.05)' },
  brand:        { fontWeight: 700, fontSize: 15, color: '#2D2A26' },
  navActive:    { fontSize: 13, fontWeight: 600, color: '#2D2A26', borderBottom: '2px solid #1FA873', paddingBottom: 2 },
  navMuted:     { fontSize: 13, fontWeight: 600, color: '#77746e', cursor: 'pointer' },
  userTag:      { fontSize: 12, color: '#2D2A26', background: '#FFF8ED', padding: '6px 10px', borderRadius: 10 },
  logoutBtn:    { background: '#c24337', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 10, cursor: 'pointer', fontWeight: 600 },
  topGrid:      { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 15, alignItems: 'start' },
  card:         { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 10px 28px rgba(0,0,0,0.07)' },
  searchInput:  { padding: 10, borderRadius: 10, background: '#FFF8ED', border: '1px solid transparent', outline: 'none', fontSize: 14 },
  searchBtn:    { padding: '10px 14px', background: '#188159', color: '#fff', borderRadius: 10, border: 'none', fontWeight: 600, cursor: 'pointer' },
  customFoodBtn:{ width: '100%', padding: 9, background: '#fff', border: '1.5px dashed #ccc', borderRadius: 10, color: '#777167', fontSize: 13, cursor: 'pointer', marginBottom: 14 },
  errorBanner:  { background: '#FDF0EE', border: '1px solid #DC4C3F', color: '#c24337', borderRadius: 12, padding: '12px 16px', fontSize: 13 },
  overlay:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal:        { background: '#fff', borderRadius: 16, padding: 24, maxWidth: 540, width: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
};
