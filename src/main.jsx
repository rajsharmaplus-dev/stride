import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './StrideApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
