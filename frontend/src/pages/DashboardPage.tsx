// src/pages/DashboardPage.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  searchFoods, createCustomFood, getLogs, addLog, deleteLog, updateLog,
  getWater, addWater, deleteWater, logout, todayString, getMicronutrients,
  getStoredFirstName,
  type Food, type LogEntry, type Meal, type MicronutrientsResult,
} from '../api/client';
import { loadGoals } from './GoalsPage';
import { PAGE_CSS } from './PAGE_CSS';

const MEALS: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_LABELS: Record<Meal, string> = { breakfast:'Breakfast', lunch:'Lunch', dinner:'Dinner', snack:'Snacks' };
const MEAL_ICONS:  Record<Meal, string> = { breakfast:'🌅', lunch:'☀️', dinner:'🌙', snack:'🍎' };
const MEAL_COLORS: Record<Meal, string> = { breakfast:'#EF9F27', lunch:'#1FA873', dinner:'#378ADD', snack:'#DC4C3F' };
const TODAY = todayString();

function DashboardPage() {
  const navigate   = useNavigate();
  const GOALS      = loadGoals();

  const [entries,      setEntries]      = useState<LogEntry[]>([]);
  const [totals,       setTotals]       = useState({ calories:0, protein:0, fat:0, carbs:0 });
  const [diaryLoading, setDiaryLoading] = useState(true);

  // An older Goals page stored the raw typed number (e.g. "4" meaning 4 L)
  // instead of ml. Treat legacy values under 100 as litres and convert.
  const readWaterTarget = () => {
    const v = Number(localStorage.getItem('calorific_water_target')) || 2000;
    return v > 0 && v < 100 ? Math.round(v * 1000) : v;
  };
  const [WATER_GOAL_ML, setWATER_GOAL_ML] = useState(readWaterTarget);
  const [waterUnit, setWaterUnit] = useState<'L'|'gal'>(() =>
    (localStorage.getItem('calorific_water_unit') as 'L'|'gal') || 'L'
  );
  useEffect(() => {
    const sync = () => {
      setWATER_GOAL_ML(readWaterTarget());
      setWaterUnit((localStorage.getItem('calorific_water_unit') as 'L'|'gal') || 'L');
    };
    window.addEventListener('focus', sync);
    return () => window.removeEventListener('focus', sync);
  }, []);
  const [waterEntries, setWaterEntries] = useState<{_id:string;amountMl:number}[]>([]);
  const [waterMl,      setWaterMl]      = useState(0);
  const [waterInput,   setWaterInput]   = useState('');
  const [waterAdding,  setWaterAdding]  = useState(false);
  const [waterDel,     setWaterDel]     = useState<string|null>(null);

  const [error, setError] = useState('');

  // Search modal
  const [searchModalOpen,   setSearchModalOpen]   = useState(false);
  const [modalTab,          setModalTab]           = useState<'search'|'custom'>('search');
  const [modalQuery,        setModalQuery]         = useState('');
  const [modalResults,      setModalResults]       = useState<Food[]>([]);
  const [modalSearching,    setModalSearching]     = useState(false);
  const [modalSelectedFood, setModalSelectedFood]  = useState<Food|null>(null);
  const [modalQuantity,     setModalQuantity]      = useState(1);
  const [modalMeal,         setModalMeal]          = useState<Meal>('breakfast');
  const [modalAdding,       setModalAdding]        = useState(false);
  const [modalError,        setModalError]         = useState('');

  // Custom food
  const [customName,        setCustomName]        = useState('');
  const [customCalories,    setCustomCalories]    = useState('');
  const [customProtein,     setCustomProtein]     = useState('');
  const [customCarbs,       setCustomCarbs]       = useState('');
  const [customFat,         setCustomFat]         = useState('');
  const [customServingSize, setCustomServingSize] = useState('1');
  const [customServingUnit, setCustomServingUnit] = useState('serving');
  const [customCreating,    setCustomCreating]    = useState(false);
  const [customSuccess,     setCustomSuccess]     = useState('');

  // Inline edit servings
  const [editingId,  setEditingId]  = useState<string|null>(null);
  const [editingQty, setEditingQty] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Deleting diary entry
  const [deletingId, setDeletingId] = useState<string|null>(null);

  // Micronutrients
  const [microData,         setMicroData]         = useState<MicronutrientsResult|null>(null);
  const [microLoading,      setMicroLoading]      = useState(false);
  const [microError,        setMicroError]        = useState('');
  const [dailyMicroData,    setDailyMicroData]    = useState<Record<string,Record<string,{amount:number;unit:string}>>|null>(null);
  const [dailyMicroLoading, setDailyMicroLoading] = useState(false);
  const [dailyMicroError,   setDailyMicroError]   = useState('');

  const loadDiary = useCallback(async () => {
    try {
      const [log, water] = await Promise.all([getLogs(TODAY), getWater(TODAY)]);
      setEntries(log.entries);
      setTotals(log.totals);
      setWaterMl(water.totalMl);
      setWaterEntries(water.entries);
    } catch (err:any) { if (err.message?.includes('Invalid or expired token')) logout(); }
    finally { setDiaryLoading(false); }
  }, []);

  useEffect(() => { loadDiary(); }, [loadDiary]);

  // Live debounced search
  const searchTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(() => {
    if (!searchModalOpen || modalTab !== 'search') return;
    if (!modalQuery.trim()) { setModalResults([]); return; }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setModalSearching(true);
      setModalSelectedFood(null);
      try { setModalResults(await searchFoods(modalQuery.trim())); } catch { /* silent */ }
      finally { setModalSearching(false); }
    }, 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [modalQuery, searchModalOpen, modalTab]);

  // Open search modal, optionally pre-select a meal
  function openSearchModal(query = '', meal?: Meal) {
    setModalQuery(query); setModalResults([]); setModalSelectedFood(null);
    setModalError(''); setModalTab('search'); setSearchModalOpen(true);
    if (meal) setModalMeal(meal);
  }

  async function handleModalAddLog(e:any) {
    e.preventDefault();
    if (!modalSelectedFood) return;
    setModalAdding(true); setModalError('');
    try {
      await addLog({ foodId:modalSelectedFood._id, quantity:modalQuantity, meal:modalMeal, date:TODAY });
      await loadDiary();
      setSearchModalOpen(false); setModalResults([]); setModalQuery(''); setModalSelectedFood(null);
    } catch (err:any) { setModalError(err.message||'Failed to log food'); }
    finally { setModalAdding(false); }
  }

  async function handleCreateCustomFood(e:any) {
    e.preventDefault();
    if (!customName||!customCalories) return;
    setCustomCreating(true); setModalError(''); setCustomSuccess('');
    try {
      const food = await createCustomFood({ name:customName, calories:Number(customCalories), protein:Number(customProtein)||0, carbs:Number(customCarbs)||0, fat:Number(customFat)||0, servingSize:Number(customServingSize)||1, servingSizeUnit:customServingUnit });
      setCustomSuccess(`"${food.name}" created! Switch to Search to find and log it.`);
      setCustomName(''); setCustomCalories(''); setCustomProtein(''); setCustomCarbs(''); setCustomFat('');
    } catch (err:any) { setModalError(err.message||'Failed to create food'); }
    finally { setCustomCreating(false); }
  }

  function closeModal() { setSearchModalOpen(false); setModalError(''); setCustomSuccess(''); }

  // Delete diary entry with slide-out animation
  async function handleDeleteLog(id:string) {
    setDeletingId(id);
    await new Promise(r => setTimeout(r, 220));
    try { await deleteLog(id); await loadDiary(); }
    catch (err:any) { setError(err.message||'Failed to delete'); }
    finally { setDeletingId(null); }
  }

  // Edit servings inline
  function startEdit(entry: LogEntry) { setEditingId(entry._id); setEditingQty(String(entry.quantity)); }
  async function saveEdit(id:string) {
    const qty = Number(editingQty);
    if (!qty || qty <= 0) { setEditingId(null); return; }
    setSavingEdit(true);
    try { await updateLog(id, { quantity: qty }); await loadDiary(); setEditingId(null); }
    catch (err:any) { setError(err.message||'Failed to update'); }
    finally { setSavingEdit(false); }
  }

  // Water
  async function handleAddWater(e:any) {
    e.preventDefault();
    const amt = Number(waterInput);
    if (!amt||amt<=0) return;
    setWaterAdding(true);
    try {
      await addWater(amt, TODAY);
      const w = await getWater(TODAY);
      setWaterMl(w.totalMl); setWaterEntries(w.entries); setWaterInput('');
    } catch (err:any) { setError(err.message||''); }
    finally { setWaterAdding(false); }
  }
  async function handleQuickAddWater(amt:number) {
    setWaterAdding(true);
    try { await addWater(amt, TODAY); const w=await getWater(TODAY); setWaterMl(w.totalMl); setWaterEntries(w.entries); }
    catch (err:any) { setError(err.message||''); }
    finally { setWaterAdding(false); }
  }
  async function handleDeleteWater(id:string) {
    setWaterDel(id);
    await new Promise(r => setTimeout(r, 180));
    try { await deleteWater(id); const w=await getWater(TODAY); setWaterMl(w.totalMl); setWaterEntries(w.entries); }
    catch { /* silent */ }
    finally { setWaterDel(null); }
  }

  // Micronutrients
  async function handleViewMicronutrients(food:Food) {
    setMicroData(null); setMicroError(''); setMicroLoading(true);
    try { setMicroData(await getMicronutrients(food._id)); }
    catch (err:any) { setMicroError(err.message||''); setMicroData({ foodId:food._id, foodName:food.name, servingSize:food.servingSize, servingSizeUnit:food.servingSizeUnit, source:food.source, micronutrients:{} }); }
    finally { setMicroLoading(false); }
  }
  async function handleViewDailyMicronutrients() {
    setDailyMicroData(null); setDailyMicroError(''); setDailyMicroLoading(true);
    try {
      if (!entries.length) { setDailyMicroData({}); setDailyMicroLoading(false); return; }
      const fq: Record<string,number> = {};
      entries.forEach(e => { fq[e.foodId]=(fq[e.foodId]||0)+e.quantity; });
      const ids = Object.keys(fq);
      const results = await Promise.all(ids.map(id => getMicronutrients(id).catch(()=>null)));
      const agg: Record<string,Record<string,{amount:number;unit:string}>> = {};
      results.forEach((r,i) => {
        if (!r) return; const qty=fq[ids[i]];
        Object.entries(r.micronutrients).forEach(([cat,nuts]) => {
          if (!agg[cat]) agg[cat]={};
          nuts.forEach(n => { if (!agg[cat][n.name]) agg[cat][n.name]={amount:0,unit:n.unit}; agg[cat][n.name].amount+=n.amount*qty; });
        });
      });
      Object.values(agg).forEach(c => Object.values(c).forEach(n => { n.amount=Math.round(n.amount*100)/100; }));
      setDailyMicroData(agg);
    } catch (err:any) { setDailyMicroError(err.message||''); setDailyMicroData({}); }
    finally { setDailyMicroLoading(false); }
  }

  const grouped = MEALS.reduce((acc,m) => { acc[m]=entries.filter(e=>e.meal===m); return acc; }, {} as Record<Meal,LogEntry[]>);
  const todayLabel = new Date().toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'});
  const calPct = Math.min(GOALS.calories>0?(totals.calories/GOALS.calories)*100:0, 100);
  const waterPct = Math.min((waterMl/WATER_GOAL_ML)*100, 100);
  const fieldStyle:any = { width:'100%', padding:'10px 12px', borderRadius:12, border:'1.5px solid transparent', background:'#F8F5F0', fontSize:13, color:'#2D2A26', fontFamily:'inherit', boxSizing:'border-box', transition:'border-color .2s, box-shadow .2s' };

  return (
    <div className="inner-page" style={{ minHeight:'100vh', background:'linear-gradient(160deg,#FFF8ED 0%,#F5FBF8 100%)', padding:'16px 20px', fontFamily:"'Inter',Arial,sans-serif", display:'flex', flexDirection:'column', gap:16 }}>
      <style>{PAGE_CSS}</style>

      {/* NAVBAR */}
      <nav className="page-nav ani-fadeInUp" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,0.85)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', padding:'12px 20px', borderRadius:16, boxShadow:'0 8px 32px rgba(0,0,0,0.07)', border:'1px solid rgba(255,255,255,.8)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', gap:24, alignItems:'center' }}>
          <span style={{ fontWeight:800, fontSize:16, color:'#1FA873', letterSpacing:'-0.5px' }}>Calorific.</span>
          {[['Log',null],['Goals','/goals'],['Trends','/progress'],['Settings','/settings']].map(([label,path]) => (
            <span key={label} className="nav-link" style={{ fontSize:13, fontWeight:600, color:label==='Log'?'#2D2A26':'#77746e', borderBottom:label==='Log'?'2px solid #1FA873':'none', paddingBottom:label==='Log'?2:0 }}
              onClick={() => path && navigate(path)}>{label}</span>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:12, color:'#2D2A26', background:'linear-gradient(135deg,#FFF8ED,#F5EFE0)', padding:'6px 12px', borderRadius:20, fontWeight:500 }}>👋 {getStoredFirstName()||'there'}</span>
          <button className="p-btn" onClick={logout} style={{ background:'linear-gradient(135deg,#c24337,#a83229)', color:'#fff', border:'none', padding:'7px 14px', borderRadius:20, fontWeight:600, fontSize:12 }}>Logout</button>
        </div>
      </nav>

      {error && <div className="ani-slideDown" style={{ background:'#FDF0EE', border:'1px solid #DC4C3F', color:'#c24337', borderRadius:14, padding:'12px 16px', fontSize:13 }}>{error}</div>}

      {/* TOP GRID */}
      <div className="two-col" style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, alignItems:'start' }}>

        {/* LOG FOOD */}
        <div className="p-card ani-fadeInUp" style={{ background:'#fff', borderRadius:20, padding:22, boxShadow:'0 12px 32px rgba(0,0,0,0.08)', animationDelay:'0.05s' }}>
          <h2 style={{ margin:'0 0 16px', fontSize:17, fontWeight:800, color:'#2D2A26', letterSpacing:'-0.3px' }}>🍽 Log food</h2>
          <div style={{ display:'flex', gap:8, marginBottom:10 }}>
            <input aria-label="Search foods" placeholder="Search foods to log..." value={modalQuery}
              onChange={e => { setModalQuery(e.target.value); if (!searchModalOpen) { setModalTab('search'); setSearchModalOpen(true); } }}
              onFocus={() => { setModalTab('search'); setModalError(''); setCustomSuccess(''); setSearchModalOpen(true); }}
              className="p-input" style={{ ...fieldStyle, flex:1, borderRadius:12, padding:'11px 16px', fontSize:14, background:'#F8F5F0' }} />
            <button className="p-btn" onClick={() => openSearchModal(modalQuery)}
              style={{ padding:'11px 18px', background:'linear-gradient(135deg,#1FA873,#188159)', color:'#fff', border:'none', borderRadius:12, fontWeight:700, fontSize:14, boxShadow:'0 4px 14px rgba(31,168,115,.3)' }}>
              Search
            </button>
          </div>
          <button className="p-btn" onClick={() => { setModalTab('custom'); setModalError(''); setCustomSuccess(''); setSearchModalOpen(true); }}
            style={{ width:'100%', padding:'10px', background:'#fff', border:'1.5px dashed #D0CCBF', borderRadius:12, color:'#8A8378', fontSize:13, fontWeight:500, marginBottom:18 }}>
            ✏️ Create custom food
          </button>

          {/* WATER TRACKER */}
          <div style={{ borderTop:'1px solid #F0EDE8', paddingTop:16 }}>
            <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
              {/* Animated glass */}
              <div style={{ position:'relative', width:52, height:72, flexShrink:0 }}>
                <div style={{ position:'absolute', inset:0, border:'3px solid #2e74ba', borderRadius:'5px 5px 10px 10px', overflow:'hidden', background:'#EBF3FB' }}>
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, height:`${waterPct}%`, background:'linear-gradient(180deg,rgba(91,164,229,.9)0%,#2e74ba 100%)', transition:'height 0.9s cubic-bezier(.34,1.56,.64,1)' }}>
                    <div style={{ position:'absolute', top:-6, left:'-25%', width:'150%', height:14, background:'rgba(255,255,255,.3)', borderRadius:'50%', animation:'waveFloat 2s ease-in-out infinite' }} />
                  </div>
                </div>
                {waterPct>=100 && <div style={{ position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)', fontSize:16 }}>✨</div>}
              </div>

              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
                  <strong style={{ fontSize:13, color:'#2D2A26' }}>💧 Water today</strong>
                  <span style={{ fontSize:13, fontWeight:700, color:'#2e74ba' }}>{waterMl}<span style={{ color:'#aaa', fontWeight:400 }}> / {WATER_GOAL_ML} ml</span></span>
                </div>
                <div style={{ background:'#EBF3FB', borderRadius:6, height:6, overflow:'hidden', marginBottom:10 }}>
                  <div style={{ height:'100%', width:`${waterPct}%`, background:'linear-gradient(90deg,#5ba4e5,#2e74ba)', borderRadius:6, transition:'width 0.9s cubic-bezier(.34,1.56,.64,1)' }} />
                </div>
                <div style={{ display:'flex', gap:6, marginBottom:8 }}>
                  {[250,500,750].map(amt => (
                    <button key={amt} type="button" disabled={waterAdding} onClick={() => handleQuickAddWater(amt)} className="water-btn"
                      style={{ flex:1, padding:'7px 0', background:'#EBF3FB', color:'#2e74ba', border:'1px solid #c5ddf5', borderRadius:10, fontSize:12, fontWeight:700 }}>
                      +{amt}ml
                    </button>
                  ))}
                </div>
                <form onSubmit={handleAddWater} style={{ display:'flex', gap:8, marginBottom:10 }}>
                  <input type="number" aria-label="Water ml" placeholder="Custom ml..." value={waterInput} onChange={e => setWaterInput(e.target.value)}
                    className="p-input" style={{ flex:1, padding:'9px 12px', borderRadius:10, background:'#EBF3FB', border:'1.5px solid transparent', fontSize:13, fontFamily:'inherit' }} />
                  <button type="submit" disabled={waterAdding} className="p-btn"
                    style={{ padding:'9px 14px', background:'#2e74ba', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:13 }}>
                    {waterAdding?'...':'+ Add'}
                  </button>
                </form>
                {/* Water entries list */}
                {waterEntries.length > 0 && (
                  <div style={{ maxHeight:120, overflowY:'auto' }}>
                    {waterEntries.map(w => (
                      <div key={w._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 8px', borderRadius:8, marginBottom:3, background:'#F0F6FF', opacity:waterDel===w._id?0:1, transform:waterDel===w._id?'translateX(20px)':'none', transition:'all .18s ease' }}>
                        <span style={{ fontSize:12, color:'#2e74ba', fontWeight:600 }}>💧 {w.amountMl} ml</span>
                        <button onClick={() => handleDeleteWater(w._id)} style={{ background:'none', border:'none', color:'#aaa', fontSize:14, cursor:'pointer', padding:'0 4px', lineHeight:1 }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* STATS COLUMN */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Calories */}
          <div className="p-card ani-fadeInUp" style={{ background:'linear-gradient(135deg,#fff 60%,#F0FBF6)', borderRadius:20, padding:20, boxShadow:'0 12px 32px rgba(0,0,0,0.08)', animationDelay:'0.1s' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#1FA873', letterSpacing:1, marginBottom:2 }}>TODAY</div>
            <div style={{ fontSize:12, color:'#aaa', marginBottom:14 }}>{todayLabel}</div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:10 }}>
              <div style={{ fontSize:42, fontWeight:900, color:'#2D2A26', lineHeight:1, letterSpacing:'-1px' }}>{Math.round(totals.calories).toLocaleString()}</div>
              <div style={{ textAlign:'right', fontSize:12, color:'#aaa', lineHeight:1.6 }}><div>kcal</div><div>/ {GOALS.calories} goal</div></div>
            </div>
            <div style={{ background:'#F0EDE8', borderRadius:8, height:10, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${calPct}%`, background:totals.calories>GOALS.calories?'linear-gradient(90deg,#c24337,#e05a4f)':'linear-gradient(90deg,#1FA873,#5ECFA2)', borderRadius:8, transition:'width 0.9s cubic-bezier(.34,1.56,.64,1)', boxShadow:totals.calories>GOALS.calories?'0 2px 8px rgba(194,67,55,.4)':'0 2px 8px rgba(31,168,115,.4)' }} />
            </div>
            <div style={{ fontSize:11, color:'#aaa', marginTop:6, textAlign:'right' }}>
              {GOALS.calories-Math.round(totals.calories)>0 ? `${(GOALS.calories-Math.round(totals.calories)).toLocaleString()} remaining` : `${(Math.round(totals.calories)-GOALS.calories).toLocaleString()} over goal`}
            </div>
          </div>
          {/* Macros */}
          <div className="p-card ani-fadeInUp" style={{ background:'#fff', borderRadius:20, padding:'16px 18px', boxShadow:'0 12px 32px rgba(0,0,0,0.08)', animationDelay:'0.15s' }}>
            <div style={{ display:'flex', justifyContent:'space-between', gap:10 }}>
              {[{label:'Fat',val:totals.fat,goal:GOALS.fat,color:'#378ADD',bg:'#EBF3FB'},{label:'Protein',val:totals.protein,goal:GOALS.protein,color:'#DC4C3F',bg:'#FDF0EE'},{label:'Carbs',val:totals.carbs,goal:GOALS.carbs,color:'#EF9F27',bg:'#FFF6E6'}].map(({label,val,goal,color,bg}) => (
                <div key={label} style={{ flex:1, background:bg, borderRadius:14, padding:'12px 10px', textAlign:'center' }}>
                  <div style={{ fontSize:20, fontWeight:800, color }}>{Math.round(val)}g</div>
                  <div style={{ background:'rgba(255,255,255,0.6)', borderRadius:4, height:4, overflow:'hidden', margin:'5px 0' }}>
                    <div style={{ height:'100%', width:`${Math.min(goal>0?(val/goal)*100:0,100)}%`, background:color, borderRadius:4, transition:'width 0.9s cubic-bezier(.34,1.56,.64,1)' }} />
                  </div>
                  <div style={{ fontSize:10, color, fontWeight:600, opacity:0.8 }}>/ {goal}g {label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Micronutrients */}
          <button className="p-btn ani-fadeInUp" onClick={handleViewDailyMicronutrients}
            style={{ padding:'13px', background:'linear-gradient(135deg,#fff,#F0FBF6)', border:'1.5px solid #1FA873', borderRadius:16, color:'#188159', fontWeight:700, fontSize:13, boxShadow:'0 4px 14px rgba(31,168,115,.12)', animationDelay:'0.2s' }}>
            🔬 View Today's Micronutrients
          </button>
        </div>
      </div>

      {/* FOOD DIARY */}
      <div className="p-card ani-fadeInUp" style={{ background:'#fff', borderRadius:20, padding:22, boxShadow:'0 12px 32px rgba(0,0,0,0.08)', animationDelay:'0.15s' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:'#2D2A26', letterSpacing:'-0.3px' }}>📒 Food diary</h2>
          <span style={{ fontSize:13, fontWeight:700, color:'#188159', background:'#F0FBF6', padding:'4px 12px', borderRadius:20 }}>{Math.round(totals.calories).toLocaleString()} kcal</span>
        </div>

        {diaryLoading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:52, width:'100%' }} />)}
          </div>
        ) : MEALS.map((m, mi) => {
          const items = grouped[m];
          const mealCals = items.reduce((s,i)=>s+i.calories,0);
          return (
            <div key={m} style={{ marginBottom:18 }}>
              {/* Meal header with + button */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:`${MEAL_COLORS[m]}12`, padding:'9px 14px', borderRadius:12, marginBottom:6, border:`1px solid ${MEAL_COLORS[m]}22` }}>
                <span style={{ fontWeight:700, fontSize:14, color:'#2D2A26' }}>{MEAL_ICONS[m]} {MEAL_LABELS[m]}</span>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:12, color:'#8A8378', fontWeight:600, background:'rgba(255,255,255,0.7)', padding:'2px 10px', borderRadius:20 }}>{Math.round(mealCals)} kcal</span>
                  <button className="p-btn" onClick={() => openSearchModal('', m)}
                    style={{ width:28, height:28, borderRadius:8, background:MEAL_COLORS[m], color:'#fff', border:'none', fontSize:16, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1, boxShadow:`0 3px 8px ${MEAL_COLORS[m]}55` }}>+</button>
                </div>
              </div>

              {items.length===0 ? (
                <div style={{ fontSize:12, color:'#C4BFB4', padding:'8px 14px', fontStyle:'italic' }}>Nothing logged yet · tap + to add</div>
              ) : items.map((item,ii) => (
                <div key={item._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', borderRadius:10, marginBottom:4, opacity:deletingId===item._id?0:1, transform:deletingId===item._id?'translateX(30px)':'none', transition:'opacity .22s ease, transform .22s ease', animation:`slideRight 0.3s ease ${mi*0.04+ii*0.05}s both`, background:'#FAFAFA' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='#F0FBF6')} onMouseLeave={e=>(e.currentTarget.style.background='#FAFAFA')}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:14, color:'#2D2A26' }}>{item.foodName}</div>
                    {/* Inline edit servings */}
                    {editingId===item._id ? (
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
                        <input type="number" min="0.1" step="0.1" value={editingQty} onChange={e=>setEditingQty(e.target.value)}
                          onKeyDown={e=>{if(e.key==='Enter')saveEdit(item._id);if(e.key==='Escape')setEditingId(null);}}
                          autoFocus style={{ width:70, padding:'4px 8px', borderRadius:8, border:'1.5px solid #1FA873', fontSize:13, fontFamily:'inherit', outline:'none' }} />
                        <span style={{ fontSize:11, color:'#aaa' }}>servings</span>
                        <button onClick={()=>saveEdit(item._id)} disabled={savingEdit} style={{ background:'#1FA873', color:'#fff', border:'none', borderRadius:6, padding:'4px 10px', fontSize:11, fontWeight:700, cursor:'pointer' }}>{savingEdit?'…':'✓'}</button>
                        <button onClick={()=>setEditingId(null)} style={{ background:'none', border:'none', color:'#aaa', cursor:'pointer', fontSize:13 }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ fontSize:11, color:'#aaa', marginTop:1, display:'flex', alignItems:'center', gap:6 }}>
                        {item.quantity}× serving
                        <button onClick={()=>startEdit(item)} style={{ background:'none', border:'none', color:'#bbb', cursor:'pointer', fontSize:11, padding:0 }}>✏️</button>
                      </div>
                    )}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', justifyContent:'flex-end' }}>
                    <span style={{ fontWeight:700, color:'#2D2A26', fontSize:13 }}>{Math.round(item.calories)} kcal</span>
                    <span style={{ fontSize:11, fontWeight:700, color:'#DC4C3F', background:'#FDF0EE', padding:'2px 8px', borderRadius:10 }}>{Math.round(item.protein)}g P</span>
                    <span style={{ fontSize:11, fontWeight:700, color:'#EF9F27', background:'#FFF6E6', padding:'2px 8px', borderRadius:10 }}>{Math.round(item.carbs)}g C</span>
                    <span style={{ fontSize:11, fontWeight:700, color:'#378ADD', background:'#EBF3FB', padding:'2px 8px', borderRadius:10 }}>{Math.round(item.fat)}g F</span>
                    <button onClick={()=>handleDeleteLog(item._id)} style={{ background:'none', border:'none', color:'#ddd', fontSize:16, cursor:'pointer', padding:'0 4px', transition:'color .15s' }}
                      onMouseEnter={e=>(e.currentTarget.style.color='#c24337')} onMouseLeave={e=>(e.currentTarget.style.color='#ddd')}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* GOALS RINGS */}
      <div className="p-card ani-fadeInUp" style={{ background:'#fff', borderRadius:20, padding:22, boxShadow:'0 12px 32px rgba(0,0,0,0.08)', animationDelay:'0.2s' }}>
        <h2 style={{ margin:'0 0 20px', fontSize:17, fontWeight:800, color:'#2D2A26', letterSpacing:'-0.3px' }}>🎯 Goals</h2>
        <div style={{ display:'flex', justifyContent:'space-around', flexWrap:'wrap', gap:20 }}>
          <ProgressRing value={Math.round(totals.calories)} max={GOALS.calories} color="#1FA873" label="Calories" unit="kcal" delay={0} />
          <ProgressRing value={Math.round(totals.protein)}  max={GOALS.protein}  color="#DC4C3F" label="Protein"  unit="g"    delay={0.05} />
          <ProgressRing value={Math.round(totals.carbs)}    max={GOALS.carbs}    color="#EF9F27" label="Carbs"    unit="g"    delay={0.1} />
          <ProgressRing value={Math.round(totals.fat)}      max={GOALS.fat}      color="#378ADD" label="Fat"      unit="g"    delay={0.15} />
        </div>
      </div>

      {/* SEARCH MODAL */}
      {searchModalOpen && (
        <div className="ani-fadeIn" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={closeModal}>
          <div className="ani-slideUp" onClick={e=>e.stopPropagation()}
            style={{ background:'#fff', borderRadius:'24px 24px 0 0', padding:24, width:'100%', maxWidth:620, maxHeight:'88vh', overflowY:'auto', boxShadow:'0 -8px 48px rgba(0,0,0,.2)' }}>
            <div style={{ width:40, height:5, background:'#E8E4DC', borderRadius:3, margin:'0 auto 18px' }} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <div style={{ fontWeight:800, fontSize:18, color:'#2D2A26' }}>Add Food</div>
              <button onClick={closeModal} className="p-btn" style={{ background:'#F5F2EE', border:'none', borderRadius:'50%', width:32, height:32, fontSize:16, color:'#777167' }}>✕</button>
            </div>
            <div style={{ display:'flex', background:'#F5F2EE', borderRadius:14, padding:4, marginBottom:20 }}>
              {(['search','custom'] as const).map(tab => (
                <button key={tab} onClick={()=>{setModalTab(tab);setModalError('');setCustomSuccess('');}}
                  style={{ flex:1, padding:'10px 0', borderRadius:12, border:'none', fontWeight:700, fontSize:13, cursor:'pointer', transition:'all .2s', background:modalTab===tab?'#1FA873':'transparent', color:modalTab===tab?'#fff':'#777167', boxShadow:modalTab===tab?'0 4px 12px rgba(31,168,115,.3)':'' }}>
                  {tab==='search'?'🔍 Search Foods':'✏️ Create Custom'}
                </button>
              ))}
            </div>
            {modalError && <div className="ani-slideDown" style={{ background:'#FDF0EE', border:'1px solid #DC4C3F', color:'#c24337', borderRadius:12, padding:'10px 14px', fontSize:13, marginBottom:14 }}>{modalError}</div>}

            {/* Search tab */}
            {modalTab==='search' && (
              <div>
                <div style={{ position:'relative', marginBottom:16 }}>
                  <input autoFocus placeholder="Type to search foods..." value={modalQuery} onChange={e=>setModalQuery(e.target.value)}
                    className="p-input" style={{ width:'100%', padding:'13px 48px 13px 16px', borderRadius:14, background:'#F8F5F0', border:'1.5px solid transparent', fontSize:15, fontFamily:'inherit', boxSizing:'border-box' }} />
                  <div style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', fontSize:16, color:'#aaa', pointerEvents:'none' }}>
                    {modalSearching ? <span style={{ display:'inline-block', animation:'spin .8s linear infinite' }}>⏳</span> : '🔍'}
                  </div>
                </div>
                {modalResults.length>0 && !modalSelectedFood && (
                  <div className="ani-scaleIn" style={{ maxHeight:280, overflowY:'auto', border:'1px solid #F0EDE8', borderRadius:16, marginBottom:14 }}>
                    {modalResults.map((food,i) => (
                      <div key={food._id} onClick={()=>{setModalSelectedFood(food);setModalQuantity(1);}}
                        style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom:'1px solid #F5F2EE', cursor:'pointer', transition:'background .12s', animation:`slideRight .25s ease ${i*0.04}s both` }}
                        onMouseEnter={e=>(e.currentTarget.style.background='#F0FBF6')} onMouseLeave={e=>(e.currentTarget.style.background='')}>
                        <div>
                          <div style={{ fontSize:14, fontWeight:600, color:'#2D2A26' }}>{food.name}</div>
                          {food.brand && <div style={{ fontSize:11, color:'#bbb', marginTop:1 }}>{food.brand}</div>}
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0, marginLeft:12 }}>
                          <div style={{ fontSize:15, fontWeight:800, color:'#188159' }}>{food.calories} kcal</div>
                          <div style={{ fontSize:10, color:'#bbb' }}>{food.protein}g P · {food.carbs}g C · {food.fat}g F</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {modalResults.length===0 && !modalSearching && modalQuery.trim() && (
                  <div style={{ textAlign:'center', padding:'28px 0', color:'#bbb', fontSize:14 }}>
                    <div style={{ fontSize:36, marginBottom:8 }}>🔍</div>No results — try a different term.
                  </div>
                )}
                {modalSelectedFood && (
                  <form onSubmit={handleModalAddLog} className="ani-bounceIn" style={{ background:'linear-gradient(135deg,#F0FBF6,#E8F8F2)', border:'1.5px solid #1FA873', borderRadius:18, padding:18 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:15, color:'#2D2A26' }}>{modalSelectedFood.name}</div>
                        <div style={{ fontSize:12, color:'#777167', marginTop:3 }}>{modalSelectedFood.calories} kcal · {modalSelectedFood.protein}g P · {modalSelectedFood.carbs}g C · {modalSelectedFood.fat}g F</div>
                      </div>
                      <button type="button" onClick={()=>setModalSelectedFood(null)} style={{ background:'rgba(255,255,255,.7)', border:'none', borderRadius:'50%', width:28, height:28, fontSize:14, color:'#c24337', cursor:'pointer' }}>✕</button>
                    </div>
                    <button type="button" onClick={()=>handleViewMicronutrients(modalSelectedFood)} style={{ background:'none', border:'none', color:'#188159', fontSize:12, cursor:'pointer', padding:0, marginBottom:14, textDecoration:'underline', fontWeight:500 }}>
                      View full micronutrients ↗
                    </button>
                    <div style={{ display:'flex', gap:8 }}>
                      <input type="number" min="0.1" step="0.1" value={modalQuantity} onChange={e=>setModalQuantity(Number(e.target.value))}
                        aria-label="Servings" style={{ padding:'10px 12px', borderRadius:12, background:'rgba(255,255,255,.8)', border:'none', width:80, fontSize:14, fontWeight:600, fontFamily:'inherit' }} />
                      <select value={modalMeal} onChange={e=>setModalMeal(e.target.value as Meal)}
                        style={{ flex:1, padding:'10px 12px', borderRadius:12, background:'rgba(255,255,255,.8)', border:'none', fontSize:14, fontFamily:'inherit' }}>
                        {MEALS.map(m=><option key={m} value={m}>{MEAL_ICONS[m]} {MEAL_LABELS[m]}</option>)}
                      </select>
                      <button type="submit" disabled={modalAdding} className="p-btn"
                        style={{ padding:'10px 18px', background:'linear-gradient(135deg,#1FA873,#188159)', color:'#fff', border:'none', borderRadius:12, fontWeight:700, fontSize:14, boxShadow:'0 4px 14px rgba(31,168,115,.35)' }}>
                        {modalAdding?'…':'Add to log'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Create custom tab */}
            {modalTab==='custom' && (
              <form onSubmit={handleCreateCustomFood} className="ani-scaleIn">
                {customSuccess && <div className="ani-bounceIn" style={{ background:'#F0FBF6', border:'1px solid #1FA873', color:'#0F6E56', borderRadius:12, padding:'12px 14px', fontSize:13, marginBottom:14 }}>✓ {customSuccess}</div>}
                <div style={{ display:'flex', gap:10, marginBottom:12 }}>
                  <div style={{ flex:2 }}>
                    <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#2D2A26', marginBottom:5 }}>Food name *</label>
                    <input required value={customName} onChange={e=>setCustomName(e.target.value)} placeholder="e.g. Homemade granola" className="p-input" style={fieldStyle} />
                  </div>
                  <div style={{ flex:1 }}>
                    <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#2D2A26', marginBottom:5 }}>Calories *</label>
                    <input required type="number" min="0" value={customCalories} onChange={e=>setCustomCalories(e.target.value)} placeholder="kcal" className="p-input" style={fieldStyle} />
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:12 }}>
                  {[['Protein (g)',customProtein,setCustomProtein],['Carbs (g)',customCarbs,setCustomCarbs],['Fat (g)',customFat,setCustomFat]].map(([label,val,setter]:any)=>(
                    <div key={label as string}>
                      <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#2D2A26', marginBottom:5 }}>{label}</label>
                      <input type="number" min="0" step="0.1" value={val} onChange={(e:any)=>setter(e.target.value)} placeholder="0" className="p-input" style={fieldStyle} />
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', gap:10, marginBottom:20 }}>
                  <div style={{ flex:1 }}>
                    <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#2D2A26', marginBottom:5 }}>Serving size</label>
                    <input type="number" min="0.1" step="0.1" value={customServingSize} onChange={e=>setCustomServingSize(e.target.value)} className="p-input" style={fieldStyle} />
                  </div>
                  <div style={{ flex:1 }}>
                    <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#2D2A26', marginBottom:5 }}>Unit</label>
                    <select value={customServingUnit} onChange={e=>setCustomServingUnit(e.target.value)} className="p-input" style={fieldStyle}>
                      {['serving','g','oz','cup','tbsp','tsp','piece','slice','ml'].map(u=><option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={customCreating} className="p-btn"
                  style={{ width:'100%', padding:13, background:'linear-gradient(135deg,#1FA873,#188159)', color:'#fff', border:'none', borderRadius:14, fontWeight:700, fontSize:15, boxShadow:'0 4px 16px rgba(31,168,115,.35)' }}>
                  {customCreating?'⏳ Creating…':'✓ Create Food'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DAILY MICROS MODAL */}
      {(dailyMicroLoading||dailyMicroData!==null) && (
        <MicroModal title="Today's Micronutrients" subtitle="Aggregated across all foods logged today"
          loading={dailyMicroLoading} loadingText="Calculating…" error={dailyMicroError}
          onClose={()=>{setDailyMicroData(null);setDailyMicroError('');}}>
          {dailyMicroData&&!dailyMicroLoading&&(Object.keys(dailyMicroData).length===0
            ?<p style={{color:'#777167',fontSize:13}}>No micronutrient data yet.</p>
            :Object.entries(dailyMicroData).map(([cat,nuts])=>(
              <MicroCat key={cat} category={cat}>{Object.entries(nuts).map(([name,{amount,unit}])=><MicroRow key={name} name={name} amount={amount} unit={unit}/>)}</MicroCat>
            )))}
        </MicroModal>
      )}

      {/* PER-FOOD MICROS MODAL */}
      {(microLoading||microData)&&(
        <MicroModal title={microData?.foodName??'Loading…'} subtitle={microData?`Per ${microData.servingSize}${microData.servingSizeUnit} serving`:''}
          loading={microLoading} loadingText="Loading nutrition…" error={microError}
          onClose={()=>{setMicroData(null);setMicroError('');}}>
          {microData&&!microLoading&&(Object.keys(microData.micronutrients).length===0
            ?<p style={{color:'#777167',fontSize:13}}>No micronutrient data.</p>
            :Object.entries(microData.micronutrients).map(([cat,nuts])=>(
              <MicroCat key={cat} category={cat}>{nuts.map(n=><MicroRow key={n.name} name={n.name} amount={n.amount} unit={n.unit}/>)}</MicroCat>
            )))}
        </MicroModal>
      )}
    </div>
  );
}

function ProgressRing({value,max,color,label,unit,delay=0}:{value:number;max:number;color:string;label:string;unit:string;delay?:number}) {
  const size=100,stroke=9,r=(size-stroke)/2;
  const circ=r*2*Math.PI;
  const offset=circ-Math.min(max>0?value/max:0,1)*circ;
  return (
    <div className="ani-fadeInUp" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, animationDelay:`${delay}s` }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle stroke="#F0EDE8" fill="transparent" strokeWidth={stroke} r={r} cx={size/2} cy={size/2}/>
        <circle stroke={color} fill="transparent" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset} r={r} cx={size/2} cy={size/2}
          style={{ transform:'rotate(-90deg)', transformOrigin:'50% 50%', transition:'stroke-dashoffset 1s cubic-bezier(.34,1.56,.64,1)', filter:`drop-shadow(0 2px 6px ${color}55)` }}/>
        <text x="50%" y="44%" textAnchor="middle" style={{ fontSize:17, fontWeight:800, fill:'#2D2A26' }}>{value}</text>
        <text x="50%" y="62%" textAnchor="middle" style={{ fontSize:9, fill:'#aaa' }}>/ {max}{unit}</text>
      </svg>
      <div style={{ fontSize:11, fontWeight:700, color, letterSpacing:0.5 }}>{label.toUpperCase()}</div>
    </div>
  );
}

function MicroModal({title,subtitle,loading,loadingText,error,onClose,children}:any) {
  return (
    <div className="ani-fadeIn" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)', zIndex:1100, display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={onClose}>
      <div className="ani-slideUp" onClick={(e:any)=>e.stopPropagation()}
        style={{ background:'#fff', borderRadius:'24px 24px 0 0', padding:24, width:'100%', maxWidth:540, maxHeight:'80vh', overflowY:'auto', boxShadow:'0 -8px 48px rgba(0,0,0,.18)' }}>
        <div style={{ width:40, height:5, background:'#E8E4DC', borderRadius:3, margin:'0 auto 18px' }} />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div>
            <div style={{ fontWeight:800, fontSize:16, color:'#2D2A26' }}>{title}</div>
            {subtitle&&<div style={{ fontSize:12, color:'#aaa', marginTop:2 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} className="p-btn" style={{ background:'#F5F2EE', border:'none', borderRadius:'50%', width:32, height:32, fontSize:16, color:'#777167' }}>✕</button>
        </div>
        {error&&<p style={{ color:'#c24337', fontSize:13 }}>{error}</p>}
        {loading&&<p className="ani-pulse" style={{ color:'#aaa', fontSize:13 }}>{loadingText}</p>}
        {children}
      </div>
    </div>
  );
}

function MicroCat({category,children}:any) {
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ fontSize:10, fontWeight:800, color:'#1FA873', textTransform:'uppercase', letterSpacing:1.2, marginBottom:8, paddingBottom:4, borderBottom:'1px solid #F0EDE8' }}>{category}</div>
      {children}
    </div>
  );
}

function MicroRow({name,amount,unit}:any) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'5px 0', borderBottom:'1px solid #F8F5F0' }}>
      <span style={{ color:'#2D2A26' }}>{name}</span>
      <span style={{ fontWeight:700, color:'#188159' }}>{amount}{unit}</span>
    </div>
  );
}

export default DashboardPage;
