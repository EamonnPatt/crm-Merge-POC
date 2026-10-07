import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { DemoDataProvider } from './context/DemoDataContext.tsx'
import { RoleProvider } from './context/RoleContext.tsx'
import { AuthGate } from './components/AuthScreens.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AuthGate>
          <DemoDataProvider>
            <RoleProvider>
              <App />
            </RoleProvider>
          </DemoDataProvider>
        </AuthGate>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
