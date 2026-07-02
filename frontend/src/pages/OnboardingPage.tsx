import { useState } from 'react';

function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'in'>('cm');
  const [height, setHeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [goal, setGoal] = useState('');

  function nextStep(e: any) {
    e.preventDefault();
    setError('');
    if (step === 1 && (!age || !sex)) {
      setError('Please fill out all fields');
      return;
    }
    if (step === 2 && (!height || !weight)) {
      setError('Please fill out all fields');
      return;
    }
    setStep(step + 1);
  }

  function prevStep() {
    setError('');
    setStep(step - 1);
  }

  async function handleFinish(e: any) {
    e.preventDefault();
    setError('');
    if (!activityLevel || !goal) {
      setError('Please select an activity level and goal');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          age, sex, height, heightUnit, weight, weightUnit, activityLevel, goal,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Something went wrong');
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError('Server error. Please try again.');
    }
  }

  const stepMeta = [
    { icon: '👤', title: 'Tell us about you', subtitle: 'Basic info' },
    { icon: '📏', title: 'Your body stats', subtitle: 'Height and weight' },
    { icon: '🎯', title: 'Set your goal', subtitle: 'Activity and target' },
  ][step - 1];

  const fieldWrapStyle = {
    background: '#FFF8ED',
    borderRadius: '12px',
    padding: '13px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '18px',
    border: '1px solid transparent',
  };

  const inputStyle = {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: '14px',
    color: '#2D2A26',
    width: '100%',
  };

  const tileStyle = (active: boolean) => ({
    flex: 1,
    padding: '16px 10px',
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

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FFF8ED',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', fontSize: '110px', top: '-30px', left: '-30px', opacity: 0.5 }}>🍃</div>
      <div style={{ position: 'absolute', fontSize: '90px', bottom: '-20px', right: '-10px', opacity: 0.5 }}>🥑</div>

      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '44px 44px',
          width: '100%',
          maxWidth: '460px',
          boxShadow: '0 10px 28px rgba(0,0,0,0.07)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header with icon badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: '#E1F5EE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              flexShrink: 0,
            }}
          >
            {stepMeta.icon}
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#2D2A26' }}>{stepMeta.title}</div>
            <div style={{ fontSize: '12px', color: '#8A8378' }}>Step {step} of 3 · {stepMeta.subtitle}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: '6px', margin: '20px 0 28px' }}>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                flex: 1,
                height: '5px',
                borderRadius: '4px',
                background: i <= step ? '#1FA873' : '#F0E9DA',
              }}
            />
          ))}
        </div>

        {error && (
          <div
            style={{
              background: '#FDF0EE',
              border: '1px solid #DC4C3F',
              color: '#DC4C3F',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '13px',
              marginBottom: '18px',
            }}
          >
            {error}
          </div>
        )}

        {/* Step 1: Basic info */}
        {step === 1 && (
          <form onSubmit={nextStep}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#2D2A26', marginBottom: '6px' }}>
              Age
            </label>
            <div style={fieldWrapStyle}>
              <i className="ti ti-calendar" style={{ fontSize: '16px', color: '#b5ac9d' }} aria-hidden="true"></i>
              <input
                type="number"
                placeholder="25"
                value={age}
                onChange={e => setAge(e.target.value)}
                style={inputStyle}
              />
            </div>

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#2D2A26', marginBottom: '10px' }}>
              Sex
            </label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }}>
              <div style={tileStyle(sex === 'Male')} onClick={() => setSex('Male')}>
                <div style={{ fontSize: '20px' }}>♂️</div>
                <div style={tileLabelStyle(sex === 'Male')}>Male</div>
              </div>
              <div style={tileStyle(sex === 'Female')} onClick={() => setSex('Female')}>
                <div style={{ fontSize: '20px' }}>♀️</div>
                <div style={tileLabelStyle(sex === 'Female')}>Female</div>
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: '100%', background: '#1FA873', color: '#fff', border: 'none',
                borderRadius: '14px', padding: '13px', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', boxShadow: '0 6px 16px rgba(31,168,115,0.3)',
              }}
            >
              Continue
            </button>
          </form>
        )}

        {/* Step 2: Body stats */}
        {step === 2 && (
          <form onSubmit={nextStep}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#2D2A26' }}>Height</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span onClick={() => setHeightUnit('cm')} style={{ fontSize: '11px', fontWeight: 600, color: heightUnit === 'cm' ? '#1FA873' : '#8A8378', cursor: 'pointer' }}>cm</span>
                <span style={{ fontSize: '11px', color: '#ddd' }}>|</span>
                <span onClick={() => setHeightUnit('in')} style={{ fontSize: '11px', fontWeight: 600, color: heightUnit === 'in' ? '#1FA873' : '#8A8378', cursor: 'pointer' }}>in</span>
              </div>
            </div>
            <div style={fieldWrapStyle}>
              <i className="ti ti-ruler-2" style={{ fontSize: '16px', color: '#b5ac9d' }} aria-hidden="true"></i>
              <input
                type="number"
                placeholder={heightUnit === 'cm' ? '175' : '69'}
                value={height}
                onChange={e => setHeight(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#2D2A26' }}>Weight</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span onClick={() => setWeightUnit('kg')} style={{ fontSize: '11px', fontWeight: 600, color: weightUnit === 'kg' ? '#1FA873' : '#8A8378', cursor: 'pointer' }}>kg</span>
                <span style={{ fontSize: '11px', color: '#ddd' }}>|</span>
                <span onClick={() => setWeightUnit('lbs')} style={{ fontSize: '11px', fontWeight: 600, color: weightUnit === 'lbs' ? '#1FA873' : '#8A8378', cursor: 'pointer' }}>lbs</span>
              </div>
            </div>
            <div style={{ ...fieldWrapStyle, marginBottom: '28px' }}>
              <i className="ti ti-weight" style={{ fontSize: '16px', color: '#b5ac9d' }} aria-hidden="true"></i>
              <input
                type="number"
                placeholder={weightUnit === 'kg' ? '70' : '155'}
                value={weight}
                onChange={e => setWeight(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={prevStep}
                style={{
                  flex: 1, background: '#FFF8ED', color: '#2D2A26', border: 'none',
                  borderRadius: '14px', padding: '13px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                type="submit"
                style={{
                  flex: 2, background: '#1FA873', color: '#fff', border: 'none',
                  borderRadius: '14px', padding: '13px', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', boxShadow: '0 6px 16px rgba(31,168,115,0.3)',
                }}
              >
                Continue
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Activity + Goal */}
        {step === 3 && (
          <form onSubmit={handleFinish}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#2D2A26', marginBottom: '10px' }}>
              Activity level
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {[
                { label: 'Sedentary', icon: '🛋️' },
                { label: 'Lightly active', icon: '🚶' },
                { label: 'Active', icon: '🏃' },
                { label: 'Very active', icon: '🏋️' },
              ].map(({ label, icon }) => (
                <div
                  key={label}
                  onClick={() => setActivityLevel(label)}
                  style={{
                    padding: '13px 16px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: activityLevel === label ? '#1FA873' : '#FFF8ED',
                    color: activityLevel === label ? '#fff' : '#2D2A26',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{icon}</span>
                  {label}
                </div>
              ))}
            </div>

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#2D2A26', marginBottom: '10px' }}>
              Goal
            </label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }}>
              {[
                { label: 'Lose', icon: '📉' },
                { label: 'Maintain', icon: '⚖️' },
                { label: 'Gain', icon: '📈' },
              ].map(({ label, icon }) => (
                <div key={label} style={tileStyle(goal === label)} onClick={() => setGoal(label)}>
                  <div style={{ fontSize: '20px' }}>{icon}</div>
                  <div style={tileLabelStyle(goal === label)}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={prevStep}
                style={{
                  flex: 1, background: '#FFF8ED', color: '#2D2A26', border: 'none',
                  borderRadius: '14px', padding: '13px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                type="submit"
                style={{
                  flex: 2, background: '#1FA873', color: '#fff', border: 'none',
                  borderRadius: '14px', padding: '13px', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', boxShadow: '0 6px 16px rgba(31,168,115,0.3)',
                }}
              >
                Finish
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default OnboardingPage;