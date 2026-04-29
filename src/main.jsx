import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from 'react-router-dom';
import App from './StrideAppContext.jsx';
import ErrorBoundary from './components/Common/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.VITE_BASE_PATH || '/'}>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
