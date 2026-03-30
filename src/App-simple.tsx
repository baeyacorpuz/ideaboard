function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ color: 'purple' }}>Ideaboard</h1>
      <p>If you see this, React is working!</p>
      <button
        style={{
          padding: '10px 20px',
          backgroundColor: '#8b5cf6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginTop: '10px'
        }}
        onClick={() => alert('Button clicked!')}
      >
        Test Button
      </button>
    </div>
  )
}

export default App
