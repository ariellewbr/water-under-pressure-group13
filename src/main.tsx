import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './styles.css'
import './auth.css'
import App from './App'
import AuthGate from './AuthGate'

const authEnabled = import.meta.env.VITE_AUTH_ENABLED === 'true'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {authEnabled ? <AuthGate><App /></AuthGate> : <App />}
  </StrictMode>,
)
