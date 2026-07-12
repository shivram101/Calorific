import { useEffect, useState } from 'react';

function SettingsPage() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setEmail(data.email || '');
          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
          setAge(data.age || '');
          setHeight(data.height || '');
          setWeight(data.weight || '');
          setActivityLevel(data.activityLevel || '');
          setGoal(data.goal || '');
        }
      } catch (err) {
        setError('Could not load profile.');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ firstName, lastName, age, height, weight, activityLevel, goal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Could not save changes.');
      } else {
        setMessage('Changes saved!');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
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
          <a href="/dashboard" style={{ fontSize: '18px', color: '#2D2A26', textDecoration: 'none' }}>
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
          <div style={{ background: '#FDF0EE', border: '1px solid #DC4C3F', color: '#DC4C3F', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', marginBottom: '18px' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#1FA873', fontWeight: 500 }}>
            <i className="ti ti-circle-check" aria-hidden="true"></i>
            Email verified
          </div>
        </div>

        {/* Profile */}
        <div style={cardStyle}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#2D2A26', marginBottom: '14px' }}>Profile</div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>First name</label>
              <input style={inputStyle} value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Last name</label>
              <input style={inputStyle} value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Age</label>
              <input type="number" style={inputStyle} value={age} onChange={e => setAge(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Height (cm)</label>
              <input type="number" style={inputStyle} value={height} onChange={e => setHeight(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Weight (kg)</label>
              <input type="number" style={inputStyle} value={weight} onChange={e => setWeight(e.target.value)} />
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
            {[
              { label: 'Lose', icon: 'ti-trending-down' },
              { label: 'Maintain', icon: 'ti-scale' },
              { label: 'Gain', icon: 'ti-trending-up' },
            ].map(({ label, icon }) => (
              <div key={label} style={tileStyle(goal === label)} onClick={() => setGoal(label)}>
                <i className={`ti ${icon}`} style={{ fontSize: '20px' }} aria-hidden="true"></i>
                <div style={tileLabelStyle(goal === label)}>{label}</div>
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
          onClick={handleLogout}
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
          }}
        >
          <i className="ti ti-logout" aria-hidden="true"></i>
          Log out
        </button>
      </div>
    </div>
  );
}

export default SettingsPage;