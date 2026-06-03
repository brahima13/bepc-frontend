import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// PWA Install automatique
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  window.deferredPrompt = e
  // Afficher automatiquement après 3 secondes
  setTimeout(async () => {
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt()
      const choice = await window.deferredPrompt.userChoice
      window.deferredPrompt = null
    }
  }, 3000)
})
