export default function Loading() {
  return (
    <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ height: '32px', width: '200px', backgroundColor: '#e0e0e0', borderRadius: '4px', marginBottom: '24px' }} />

      <div style={{ marginBottom: '32px' }}>
        <div style={{ height: '24px', width: '150px', backgroundColor: '#e0e0e0', borderRadius: '4px', marginBottom: '16px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i} 
              style={{ height: '100px', backgroundColor: '#eeeeee', borderRadius: '8px' }} 
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        <div style={{ height: '280px', backgroundColor: '#eeeeee', borderRadius: '8px' }} />
        <div style={{ height: '280px', backgroundColor: '#eeeeee', borderRadius: '8px' }} />
      </div>
    </main>
  );
}