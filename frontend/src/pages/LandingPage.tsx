function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFF8ED' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '56px 24px 8px' }}>
        <div
          style={{
            background: '#E1F5EE',
            color: '#0F6E56',
            fontSize: '11px',
            fontWeight: 600,
            padding: '5px 12px',
            borderRadius: '20px',
            display: 'inline-block',
            marginBottom: '16px',
          }}
        >
          🌱 Built for real results
        </div>
        <h1
          style={{
            fontSize: '38px',
            fontWeight: 600,
            color: '#2D2A26',
            lineHeight: 1.2,
            marginBottom: '14px',
          }}
        >
          Nutrition tracking,<br />made <span style={{ color: '#1FA873' }}>simple.</span>
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: '#8A8378',
            maxWidth: '420px',
            margin: '0 auto 26px',
            lineHeight: 1.6,
          }}
        >
          Log your meals, track your macros, and hit your goals without the spreadsheets.
          Calorific brings clarity to what you eat.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '40px', flexWrap: 'wrap' }}>
          <a
            href="/signup"
            style={{
              background: '#1FA873',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              padding: '13px 30px',
              borderRadius: '14px',
              boxShadow: '0 6px 16px rgba(31,168,115,0.3)',
              textDecoration: 'none',
            }}
          >
            Sign up
          </a>
          <a
            href="/login"
            style={{
              background: '#fff',
              color: '#2D2A26',
              fontSize: '13px',
              fontWeight: 600,
              padding: '13px 30px',
              borderRadius: '14px',
              border: '1px solid #E3E8E5',
              textDecoration: 'none',
            }}
          >
            Log in
          </a>
        </div>
      </div>

      {/* Device mockups */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 24px 76px', position: 'relative' }}>

        {/* Laptop / browser frame */}
        <div style={{ width: '100%', maxWidth: '560px' }}>
          <div
            style={{
              background: 'linear-gradient(180deg, #37332C 0%, #2D2A26 100%)',
              borderRadius: '18px',
              padding: '12px 12px 0',
              boxShadow: '0 24px 50px rgba(0,0,0,0.18)',
              border: '1px solid #46413830',
            }}
          >
            <div style={{ display: 'flex', gap: '6px', padding: '4px 8px 12px' }}>
              <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#E36255' }} />
              <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#E8B84B' }} />
              <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#57C267' }} />
            </div>
            <div style={{ background: '#fff', borderRadius: '10px 10px 0 0', padding: '20px', height: '260px', overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#2D2A26', marginBottom: '12px' }}>Today's summary</div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <div style={{ flex: 2, background: '#FFF8ED', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontSize: '9px', color: '#8A8378', marginBottom: '4px' }}>Calories</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#2D2A26', marginBottom: '6px' }}>
                    1,450 <span style={{ fontSize: '9px', color: '#8A8378', fontWeight: 400 }}>/ 2,100</span>
                  </div>
                  <div style={{ background: '#E3E8E5', borderRadius: '6px', height: '5px', overflow: 'hidden' }}>
                    <div style={{ background: '#1FA873', width: '68%', height: '100%' }} />
                  </div>
                </div>
                <div style={{ flex: 1, background: '#FFF8ED', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: '#8A8378' }}>Protein</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#2D2A26' }}>88g</div>
                </div>
                <div style={{ flex: 1, background: '#FFF8ED', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: '#8A8378' }}>Carbs</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#2D2A26' }}>140g</div>
                </div>
                <div style={{ flex: 1, background: '#FFF8ED', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: '#8A8378' }}>Fat</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#2D2A26' }}>48g</div>
                </div>
              </div>
              <div style={{ background: '#FFF8ED', borderRadius: '10px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#2D2A26' }}>Breakfast</div>
                  <div style={{ fontSize: '8px', color: '#8A8378' }}>Oatmeal, banana</div>
                </div>
                <div style={{ fontSize: '9px', color: '#1FA873', fontWeight: 600 }}>420 cal</div>
              </div>
              <div style={{ background: '#FFF8ED', borderRadius: '10px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#2D2A26' }}>Lunch</div>
                  <div style={{ fontSize: '8px', color: '#8A8378' }}>Chicken salad</div>
                </div>
                <div style={{ fontSize: '9px', color: '#1FA873', fontWeight: 600 }}>560 cal</div>
              </div>
            </div>
          </div>
          {/* Laptop base / keyboard deck */}
          <div
            style={{
              width: '108%',
              marginLeft: '-4%',
              height: '14px',
              background: 'linear-gradient(180deg, #46413A 0%, #2D2A26 100%)',
              clipPath: 'polygon(4% 0, 96% 0, 100% 100%, 0% 100%)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '5px',
                margin: '0 auto',
                background: '#1c1a16',
                borderRadius: '0 0 6px 6px',
              }}
            />
          </div>
        </div>

        {/* Phone overlapping */}
        <div
          style={{
            position: 'absolute',
            right: '10%',
            bottom: '-30px',
            width: '132px',
            height: '268px',
            background: 'linear-gradient(180deg, #1c211e 0%, #111815 100%)',
            borderRadius: '26px',
            padding: '8px',
            boxShadow: '0 16px 32px rgba(0,0,0,0.22)',
            border: '1px solid #33393540',
          }}
        >
          <div style={{ position: 'relative', background: '#fff', borderRadius: '19px', height: '100%', padding: '16px 9px 10px', overflow: 'hidden' }}>
            <div
              style={{
                position: 'absolute',
                top: '6px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '46px',
                height: '14px',
                background: '#111815',
                borderRadius: '10px',
              }}
            />
            <div style={{ fontSize: '8px', color: '#2D2A26', fontWeight: 600, marginBottom: '8px' }}>Today</div>
            <div style={{ background: '#FFF8ED', borderRadius: '8px', padding: '8px', marginBottom: '7px' }}>
              <div style={{ fontSize: '6px', color: '#8A8378', marginBottom: '3px' }}>Calories</div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#2D2A26', marginBottom: '4px' }}>1,450</div>
              <div style={{ background: '#E3E8E5', borderRadius: '5px', height: '4px', overflow: 'hidden' }}>
                <div style={{ background: '#1FA873', width: '68%', height: '100%' }} />
              </div>
            </div>
            <div style={{ background: '#FFF8ED', borderRadius: '7px', padding: '6px', marginBottom: '5px' }}>
              <div style={{ fontSize: '6px', fontWeight: 600, color: '#2D2A26' }}>Breakfast</div>
              <div style={{ fontSize: '6px', color: '#1FA873' }}>420 cal</div>
            </div>
            <div style={{ background: '#FFF8ED', borderRadius: '7px', padding: '6px' }}>
              <div style={{ fontSize: '6px', fontWeight: 600, color: '#2D2A26' }}>Lunch</div>
              <div style={{ fontSize: '6px', color: '#1FA873' }}>560 cal</div>
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: '5px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '38px',
                height: '3px',
                background: '#2D2A26',
                borderRadius: '2px',
                opacity: 0.6,
              }}
            />
          </div>
        </div>
      </div>

      {/* Feature strip */}
      <div
        style={{
          background: '#fff',
          padding: '48px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px',
          maxWidth: '1000px',
          margin: '0 auto',
        }}
      >
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