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

  const fieldWrapStyle = {
    background: '#FFF8ED',
    borderRadius: '12px',
    padding: '11px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '14px',
    border: '1px solid transparent',
  };

  const inputStyle = {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: '13px',
    color: '#2D2A26',
    width: '100%',
  };

  const optionStyle = (active: boolean) => ({
    flex: 1,
    padding: '10px',
    borderRadius: '12px',
    textAlign: 'center' as const,
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    background: active ? '#1FA873' : '#FFF8ED',
    color: active ? '#fff' : '#2D2A26',
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
      <div style={{ position: 'absolute', fontSize: '50px', top: '10%', right: '12%', opacity: 0.35 }}>🍓</div>

      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '40px 34px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 10px 28px rgba(0,0,0,0.07)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo + progress */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '32px', marginBottom: '6px' }}>🥗</div>
          <h1 style={{ fontSize: '19px', fontWeight: 600, color: '#2D2A26', margin: 0 }}>Let's set you up</h1>
          <p style={{ fontSize: '12px', color: '#8A8378', marginTop: '4px' }}>
            Step {step} of 3
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                flex: 1,
                height: '4px',
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
              marginBottom: '16px',
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
              <i className="ti ti-calendar" style={{ fontSize: '15px', color: '#b5ac9d' }} aria-hidden="true"></i>
              <input
                type="number"
                placeholder="25"
                value={age}
                onChange={e => setAge(e.target.value)}
                style={inputStyle}
              />
            </div>

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#2D2A26', marginBottom: '6px' }}>
              Sex
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <div style={optionStyle(sex === 'Male')} onClick={() => setSex('Male')}>Male</div>
              <div style={optionStyle(sex === 'Female')} onClick={() => setSex('Female')}>Female</div>
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
                <span onClick={() => setHeightUnit('cm')} style={{ fontSize: '11px', color: heightUnit === 'cm' ? '#1FA873' : '#8A8378', cursor: 'pointer' }}>cm</span>
                <span style={{ fontSize: '11px', color: '#ddd' }}>|</span>
                <span onClick={() => setHeightUnit('in')} style={{ fontSize: '11px', color: heightUnit === 'in' ? '#1FA873' : '#8A8378', cursor: 'pointer' }}>in</span>
              </div>
            </div>
            <div style={fieldWrapStyle}>
              <i className="ti ti-ruler-2" style={{ fontSize: '15px', color: '#b5ac9d' }} aria-hidden="true"></i>
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
                <span onClick={() => setWeightUnit('kg')} style={{ fontSize: '11px', color: weightUnit === 'kg' ? '#1FA873' : '#8A8378', cursor: 'pointer' }}>kg</span>
                <span style={{ fontSize: '11px', color: '#ddd' }}>|</span>
                <span onClick={() => setWeightUnit('lbs')} style={{ fontSize: '11px', color: weightUnit === 'lbs' ? '#1FA873' : '#8A8378', cursor: 'pointer' }}>lbs</span>
              </div>
            </div>
            <div style={{ ...fieldWrapStyle, marginBottom: '20px' }}>
              <i className="ti ti-weight" style={{ fontSize: '15px', color: '#b5ac9d' }} aria-hidden="true"></i>
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
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#2D2A26', marginBottom: '8px' }}>
              Activity level
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {['Sedentary', 'Lightly active', 'Active', 'Very active'].map(level => (
                <div
                  key={level}
                  onClick={() => setActivityLevel(level)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    background: activityLevel === level ? '#1FA873' : '#FFF8ED',
                    color: activityLevel === level ? '#fff' : '#2D2A26',
                  }}
                >
                  {level}
                </div>
              ))}
            </div>

            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#2D2A26', marginBottom: '8px' }}>
              Goal
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <div style={optionStyle(goal === 'Lose')} onClick={() => setGoal('Lose')}>Lose</div>
              <div style={optionStyle(goal === 'Maintain')} onClick={() => setGoal('Maintain')}>Maintain</div>
              <div style={optionStyle(goal === 'Gain')} onClick={() => setGoal('Gain')}>Gain</div>
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