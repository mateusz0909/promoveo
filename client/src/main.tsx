import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { BrowserRouter } from 'react-router-dom'
import { BreadcrumbProvider } from './context/BreadcrumbContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <BreadcrumbProvider>
          <App />
        </BreadcrumbProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
