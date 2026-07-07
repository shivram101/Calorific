function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFF8ED' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '56px 24px 8px' }}>
        <div style={{ background: '#E1F5EE', color: '#0F6E56', fontSize: '11px', fontWeight: 600, padding: '5px 12px', borderRadius: '20px', display: 'inline-block', marginBottom: '16px' }}>
          🌱 Built for real results
        </div>
        <h1 style={{ fontSize: '38px', fontWeight: 600, color: '#2D2A26', lineHeight: 1.2, marginBottom: '14px' }}>
          Nutrition tracking,<br />made <span style={{ color: '#1FA873' }}>simple.</span>
        </h1>
        <p style={{ fontSize: '14px', color: '#8A8378', maxWidth: '420px', margin: '0 auto 26px', lineHeight: 1.6 }}>
          Log your meals, track your macros, and hit your goals without the spreadsheets. Calorific brings clarity to what you eat.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '40px', flexWrap: 'wrap' }}>
          <a href="/signup" style={{ background: '#1FA873', color: '#fff', fontSize: '13px', fontWeight: 600, padding: '13px 30px', borderRadius: '14px', boxShadow: '0 6px 16px rgba(31,168,115,0.3)', textDecoration: 'none' }}>Sign up</a>
          <a href="/login" style={{ background: '#fff', color: '#2D2A26', fontSize: '13px', fontWeight: 600, padding: '13px 30px', borderRadius: '14px', border: '1px solid #E3E8E5', textDecoration: 'none' }}>Log in</a>
        </div>
      </div>

      {/* Feature strip */}
      <div style={{ background: '#fff', padding: '48px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
        <div>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '12px' }}>🍽️</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#2D2A26', marginBottom: '6px' }}>Log meals fast</div>
          <div style={{ fontSize: '12px', color: '#8A8378', lineHeight: 1.5 }}>Search thousands of foods or add your own custom recipes in seconds.</div>
        </div>
        <div>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '12px' }}>📊</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#2D2A26', marginBottom: '6px' }}>Track your macros</div>
          <div style={{ fontSize: '12px', color: '#8A8378', lineHeight: 1.5 }}>See protein, carbs, and fat broken down against your daily targets.</div>
        </div>
        <div>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', marginBottom: '12px' }}>📈</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#2D2A26', marginBottom: '6px' }}>Watch your progress</div>
          <div style={{ fontSize: '12px', color: '#8A8378', lineHeight: 1.5 }}>Trend charts show your weight and adherence over time, not just today.</div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
