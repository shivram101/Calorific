// src/pages/SettingsPage.tsx
// Uses the centralized API client (getProfile / updateProfile / deleteAccount / logout).
// Backend field names: heightCm, weightKg, age (number), goal is lowercase 'lose'|'maintain'|'gain'.

import { useEffect, useState } from 'react';
import { getProfile, updateProfile, deleteAccount, logout } from '../api/client';

type GoalType = 'lose' | 'maintain' | 'gain';

const GOAL_OPTIONS: { value: GoalType; label: string; icon: string }[] = [
  { value: 'lose', label: 'Lose', icon: 'ti-trending-down' },
  { value: 'maintain', label: 'Maintain', icon: 'ti-scale' },
  { value: 'gain', label: 'Gain', icon: 'ti-trending-up' },
];

function SettingsPage() {
  const [email, setEmail] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
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
        setHeight(data.heightCm != null ? String(data.heightCm) : '');
        setWeight(data.weightKg != null ? String(data.weightKg) : '');
        setActivityLevel(data.activityLevel || '');
        setGoal((data.goal as GoalType) || '');
      })
      .catch((err: any) => {
        if (err.message?.includes('Invalid or expired token')) {
          logout(); // clears token and redirects to /login
        } else {
          setError('Could not load profile.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await updateProfile({
        firstName,
        lastName,
        age: age !== '' ? Number(age) : null,
        heightCm: height !== '' ? Number(height) : null,
        weightKg: weight !== '' ? Number(weight) : null,
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
    background: active ? '#1FA873' : '#FFF8ED',
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
        <p style={{ color: '#8A8378', fontSize: '13px' }}>Loading settings...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFF8ED', padding: '32px 24px' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <a href="/dashboard" style={{ fontSize: '18px', color: '#2D2A26', textDecoration: 'none' }} aria-label="Back to dashboard">
            <i className="ti ti-arrow-left" aria-hidden="true"></i>
          </a>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#2D2A26', margin: 0 }}>Settings</h1>
        </div>

        {message && (
          <div style={{ background: '#E1F5EE', border: '1px solid #1FA873', color: '#0F6E56', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', marginBottom: '18px' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#1FA873', fontWeight: 500 }}>
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
            <div style={{ flex: 1 }}>
              <label style={labelStyle} htmlFor="settings-height">Height (cm)</label>
              <input id="settings-height" type="number" style={inputStyle} value={height} onChange={e => setHeight(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle} htmlFor="settings-weight">Weight (kg)</label>
              <input id="settings-weight" type="number" style={inputStyle} value={weight} onChange={e => setWeight(e.target.value)} />
            </div>
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
                  background: activityLevel === label ? '#1FA873' : '#FFF8ED',
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
          <div style={{ display: 'flex', gap: '10px' }}>
            {GOAL_OPTIONS.map(({ value, label, icon }) => (
              <div key={value} style={tileStyle(goal === value)} onClick={() => setGoal(value)}>
                <i className={`ti ${icon}`} style={{ fontSize: '20px', color: goal === value ? '#fff' : '#2D2A26' }} aria-hidden="true"></i>
                <div style={tileLabelStyle(goal === value)}>{label}</div>
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
            background: '#1FA873',
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
          <p style={{ fontSize: '12px', color: '#8A8378', margin: '0 0 14px 0', lineHeight: 1.5 }}>
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
