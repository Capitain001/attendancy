import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'

// Base propre — le code métier desktop sera reconstruit sur le contrat
// @attendancy/types (ApiOutput<'...'>), pas sur les anciens tests.
function App() {
  return <div className="min-h-screen bg-background text-foreground" />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
