// src/pages/SettingsPage.tsx
// Uses the centralized API client (getProfile / updateProfile / deleteAccount / logout).
// Backend field names: heightCm, weightKg, age (number), goal is lowercase 'lose'|'maintain'|'gain'.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, deleteAccount, logout } from '../api/client';

type GoalType = 'lose' | 'maintain' | 'build' | 'gain';
type UnitSystem = 'metric' | 'us';

const GOAL_OPTIONS: { value: GoalType; label: string; sub: string; icon: string }[] = [
  { value: 'lose',     label: 'Lose weight',   sub: '−500 kcal/day deficit',      icon: '🔻' },
  { value: 'maintain', label: 'Maintain',       sub: 'Keep current weight',         icon: '⚖️' },
  { value: 'build',    label: 'Build muscle',   sub: '+200 kcal, high protein',     icon: '💪' },
  { value: 'gain',     label: 'Gain weight',    sub: '+400 kcal/day surplus',       icon: '📈' },
];

const KG_TO_LBS = 2.20462;
const CM_PER_INCH = 2.54;

function cmToFtIn(cm: number) {
  const totalIn = cm / CM_PER_INCH;
  return { ft: Math.floor(totalIn / 12), inch: Math.round(totalIn % 12) };
}
function ftInToCm(ft: number, inch: number) {
  return Math.round((ft * 12 + inch) * CM_PER_INCH);
}
function kgToLbs(kg: number) { return Math.round(kg * KG_TO_LBS * 10) / 10; }
function lbsToKg(lbs: number) { return Math.round((lbs / KG_TO_LBS) * 10) / 10; }

function SettingsPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [heightCmRaw, setHeightCmRaw] = useState('');   // always cm internally
  const [weightKgRaw, setWeightKgRaw] = useState('');   // always kg internally
  // Display fields — change with unit system
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [weightDisplay, setWeightDisplay] = useState('');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(
    () => (localStorage.getItem('calorific_units') as UnitSystem) || 'us'
  );
  const [activityLevel, setActivityLevel] = useState('');
  const [goal, setGoal] = useState<GoalType | ''>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getProfile()
      .then(data => {
        setEmail(data.email || '');
        setIsVerified(!!data.isVerified);
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setAge(data.age != null ? String(data.age) : '');
        setActivityLevel(data.activityLevel || '');
        setGoal((data.goal as GoalType) || '');

        const cm = data.heightCm ?? 0;
        const kg = data.weightKg ?? 0;
        setHeightCmRaw(cm ? String(cm) : '');
        setWeightKgRaw(kg ? String(kg) : '');

        if (unitSystem === 'us') {
          if (cm) { const { ft, inch } = cmToFtIn(cm); setHeightFt(String(ft)); setHeightIn(String(inch)); }
          if (kg) setWeightDisplay(String(kgToLbs(kg)));
        } else {
          if (cm) setHeightFt(String(cm));
          if (kg) setWeightDisplay(String(kg));
        }
      })
      .catch((err: any) => {
        if (err.message?.includes('Invalid or expired token')) logout();
        else setError('Could not load profile.');
      })
      .finally(() => setLoading(false));
  }, []);

  function switchUnitSystem(u: UnitSystem) {
    setUnitSystem(u);
    localStorage.setItem('calorific_units', u);
    const cm = Number(heightCmRaw);
    const kg = Number(weightKgRaw);
    if (u === 'us') {
      if (cm) { const { ft, inch } = cmToFtIn(cm); setHeightFt(String(ft)); setHeightIn(String(inch)); }
      else { setHeightFt(''); setHeightIn(''); }
      setWeightDisplay(kg ? String(kgToLbs(kg)) : '');
    } else {
      setHeightFt(cm ? String(cm) : '');
      setHeightIn('');
      setWeightDisplay(kg ? String(kg) : '');
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      // Convert display values back to metric for storage
      let finalHeightCm: number | null = null;
      let finalWeightKg: number | null = null;
      if (unitSystem === 'us') {
        const ft = Number(heightFt), inch = Number(heightIn || 0);
        if (ft || inch) { finalHeightCm = ftInToCm(ft, inch); setHeightCmRaw(String(finalHeightCm)); }
        const lbs = Number(weightDisplay);
        if (lbs) { finalWeightKg = lbsToKg(lbs); setWeightKgRaw(String(finalWeightKg)); }
      } else {
        const cm = Number(heightFt);
        if (cm) { finalHeightCm = cm; setHeightCmRaw(String(cm)); }
        const kg = Number(weightDisplay);
        if (kg) { finalWeightKg = kg; setWeightKgRaw(String(kg)); }
      }
      await updateProfile({
        firstName, lastName,
        age: age !== '' ? Number(age) : null,
        heightCm: finalHeightCm,
        weightKg: finalWeightKg,
        activityLevel: activityLevel || null,
        goal: goal || null,
      });
      setMessage('Changes saved!');
    } catch (err: any) {
      setError(err.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      'Delete your account? This permanently removes your profile, food logs, water logs, weight history, and targets. This cannot be undone.'
    );
    if (!confirmed) return;
    setDeleting(true);
    setError('');
    try {
      await deleteAccount();
      logout(); // clears token and redirects to /login
    } catch (err: any) {
      setError(err.message || 'Could not delete account.');
      setDeleting(false);
    }
  }

  const cardStyle = {
    background: '#ffffff',
    borderRadius: '20px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
  };

  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 500, color: '#2D2A26', marginBottom: '6px' };

  const inputStyle = {
    width: '100%',
    background: '#FFF8ED',
    border: '1px solid transparent',
    borderRadius: '12px',
    padding: '11px 14px',
    fontSize: '13px',
    color: '#2D2A26',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const tileStyle = (active: boolean) => ({
    flex: 1,
    padding: '14px 8px',
    borderRadius: '14px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    background: active ? '#188159' : '#FFF8ED',
  });

  const tileLabelStyle = (active: boolean) => ({
    fontSize: '12px',
    fontWeight: 600,
    color: active ? '#fff' : '#2D2A26',
    marginTop: '4px',
  });

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FFF8ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#777167', fontSize: '13px' }}>Loading settings...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFF8ED', padding: '32px 24px' }}>
      {/* NAVBAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '12px 18px', borderRadius: 12, boxShadow: '0 6px 16px rgba(0,0,0,0.05)', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#2D2A26' }}>Calorific</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#77746e', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>Log</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#77746e', cursor: 'pointer' }} onClick={() => navigate('/goals')}>Goals</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#77746e', cursor: 'pointer' }} onClick={() => navigate('/progress')}>Trends</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2D2A26', cursor: 'pointer', borderBottom: '2px solid #188159', paddingBottom: 2 }}>Settings</div>
        </div>
        <button style={{ background: '#c24337', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13 }} onClick={logout}>Logout</button>
      </div>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <a href="/dashboard" style={{ fontSize: '18px', color: '#2D2A26', textDecoration: 'none' }} aria-label="Back to dashboard">
            <i className="ti ti-arrow-left" aria-hidden="true"></i>
          </a>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#2D2A26', margin: 0 }}>Settings</h1>
        </div>

        {message && (
          <div style={{ background: '#E1F5EE', border: '1px solid #188159', color: '#0F6E56', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', marginBottom: '18px' }}>
            {message}
          </div>
        )}
        {error && (
          <div style={{ background: '#FDF0EE', border: '1px solid #DC4C3F', color: '#c24337', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', marginBottom: '18px' }}>
            {error}
          </div>
        )}

        {/* Account */}
        <div style={cardStyle}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#2D2A26', marginBottom: '14px' }}>Account</div>
          <div style={{ background: '#FFF8ED', borderRadius: '12px', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <i className="ti ti-mail" style={{ fontSize: '15px', color: '#b5ac9d' }} aria-hidden="true"></i>
            <span style={{ fontSize: '13px', color: '#2D2A26' }}>{email}</span>
          </div>
          {isVerified ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#188159', fontWeight: 500 }}>
              <i className="ti ti-circle-check" aria-hidden="true"></i>
              Email verified
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#c24337', fontWeight: 500 }}>
              <i className="ti ti-alert-circle" aria-hidden="true"></i>
              Email not verified — check your inbox
            </div>
          )}
        </div>

        {/* Profile */}
        <div style={cardStyle}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#2D2A26', marginBottom: '14px' }}>Profile</div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle} htmlFor="settings-first-name">First name</label>
              <input id="settings-first-name" style={inputStyle} value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle} htmlFor="settings-last-name">Last name</label>
              <input id="settings-last-name" style={inputStyle} value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle} htmlFor="settings-age">Age</label>
              <input id="settings-age" type="number" style={inputStyle} value={age} onChange={e => setAge(e.target.value)} />
            </div>
          </div>

          {/* Unit system toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, background: '#FFF8ED', borderRadius: 12, padding: 4 }}>
            {(['metric', 'us'] as UnitSystem[]).map(u => (
              <button key={u} onClick={() => switchUnitSystem(u)}
                style={{ flex: 1, padding: '8px', borderRadius: 10, border: 'none', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                  background: unitSystem === u ? '#188159' : 'transparent',
                  color: unitSystem === u ? '#fff' : '#777167' }}>
                {u === 'us' ? '🇺🇸 US (lbs, ft/in)' : '📏 Metric (kg, cm)'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
            {unitSystem === 'us' ? (
              <>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Height (ft)</label>
                  <input type="number" style={inputStyle} value={heightFt} onChange={e => setHeightFt(e.target.value)} placeholder="e.g. 5" aria-label="Height in feet" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Height (in)</label>
                  <input type="number" style={inputStyle} value={heightIn} onChange={e => setHeightIn(e.target.value)} placeholder="e.g. 10" aria-label="Height in inches" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Weight (lbs)</label>
                  <input type="number" style={inputStyle} value={weightDisplay} onChange={e => setWeightDisplay(e.target.value)} placeholder="e.g. 160" aria-label="Weight in pounds" />
                </div>
              </>
            ) : (
              <>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Height (cm)</label>
                  <input type="number" style={inputStyle} value={heightFt} onChange={e => setHeightFt(e.target.value)} placeholder="e.g. 175" aria-label="Height in centimeters" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Weight (kg)</label>
                  <input type="number" style={inputStyle} value={weightDisplay} onChange={e => setWeightDisplay(e.target.value)} placeholder="e.g. 70" aria-label="Weight in kilograms" />
                </div>
              </>
            )}
          </div>

        </div>

        {/* Activity level */}
        <div style={cardStyle}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#2D2A26', marginBottom: '14px' }}>Activity level</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {[
              { label: 'Sedentary', icon: 'ti-sofa' },
              { label: 'Lightly active', icon: 'ti-walk' },
              { label: 'Active', icon: 'ti-run' },
              { label: 'Very active', icon: 'ti-barbell' },
            ].map(({ label, icon }) => (
              <div
                key={label}
                onClick={() => setActivityLevel(label)}
                style={{
                  flex: '1 1 45%',
                  padding: '12px 10px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: activityLevel === label ? '#188159' : '#FFF8ED',
                  color: activityLevel === label ? '#fff' : '#2D2A26',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <i className={`ti ${icon}`} aria-hidden="true"></i>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Goal */}
        <div style={cardStyle}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#2D2A26', marginBottom: '14px' }}>Goal</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {GOAL_OPTIONS.map(({ value, label, sub, icon }) => (
              <div key={value} onClick={() => setGoal(value)}
                style={{
                  flex: '1 1 45%', padding: '14px 12px', borderRadius: '14px', cursor: 'pointer',
                  background: goal === value ? '#188159' : '#FFF8ED',
                  border: goal === value ? '2px solid #188159' : '2px solid transparent',
                }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: goal === value ? '#fff' : '#2D2A26' }}>{label}</div>
                <div style={{ fontSize: 11, color: goal === value ? 'rgba(255,255,255,0.8)' : '#777167', marginTop: 2 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            background: '#188159',
            color: '#fff',
            border: 'none',
            borderRadius: '14px',
            padding: '13px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 6px 16px rgba(31,168,115,0.3)',
            marginBottom: '12px',
          }}
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>

        <button
          onClick={() => logout()}
          style={{
            width: '100%',
            background: '#ffffff',
            color: '#2D2A26',
            border: '1px solid #E3E8E5',
            borderRadius: '14px',
            padding: '13px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '28px',
          }}
        >
          <i className="ti ti-logout" aria-hidden="true"></i>
          Log out
        </button>

        {/* Danger zone */}
        <div style={{ ...cardStyle, border: '1px solid #F3D9D5' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#c24337', marginBottom: '6px' }}>Danger zone</div>
          <p style={{ fontSize: '12px', color: '#777167', margin: '0 0 14px 0', lineHeight: 1.5 }}>
            Permanently delete your account and all logged data. This cannot be undone.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            style={{
              width: '100%',
              background: '#FDF0EE',
              color: '#c24337',
              border: '1px solid #DC4C3F',
              borderRadius: '14px',
              padding: '13px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {deleting ? 'Deleting...' : 'Delete account'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
