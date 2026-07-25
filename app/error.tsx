'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Agri-Tech error:', error);
  }, [error]);

  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh',
        padding: '20px',
        textAlign: 'center'
      }}
    >
      <div 
        style={{ 
          border: '1px solid #ffcccc', 
          backgroundColor: '#fff0f0', 
          borderRadius: '8px', 
          padding: '30px', 
          maxWidth: '480px' 
        }}
      >
        <h2 style={{ color: '#c0392b', marginTop: 0 }}>Something went wrong!</h2>
        <p style={{ color: '#555', marginBottom: '20px' }}>
          {error.message || 'An error occurred while loading Agri-Tech.'}
        </p>
        <button
          onClick={() => reset()}
          style={{
            backgroundColor: '#27ae60',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            fontSize: '1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}