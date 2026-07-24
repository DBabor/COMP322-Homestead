export default function Loading() {
  return (
    <div>
      <header style={{ padding: '20px', backgroundColor: '#f5f5f5' }}>
        <div 
          style={{ 
            height: '32px', 
            width: '180px', 
            backgroundColor: '#e0e0e0', 
            borderRadius: '4px',
            animation: 'pulse 1.5s infinite' 
          }} 
        />
      </header>

      <main className="siteLayout" style={{ padding: '20px' }}>
        {/* Weather Skeleton */}
        <section className="weatherInsert" style={{ marginBottom: '30px' }}>
          <div style={{ height: '24px', width: '140px', backgroundColor: '#e0e0e0', borderRadius: '4px', marginBottom: '15px' }} />
          <div style={{ display: 'flex', gap: '10px' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i} 
                style={{ 
                  flex: 1, 
                  height: '110px', 
                  backgroundColor: '#eee', 
                  borderRadius: '8px', 
                  animation: 'pulse 1.5s infinite' 
                }} 
              />
            ))}
          </div>
        </section>

        {/* Form & Table Skeleton */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
          <div style={{ height: '300px', backgroundColor: '#eee', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
          <div style={{ height: '300px', backgroundColor: '#eee', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
        </section>
      </main>

      <style jsx global>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}