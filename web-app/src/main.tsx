import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { DemoDataProvider } from './context/DemoDataContext.tsx'
import { RoleProvider } from './context/RoleContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <DemoDataProvider>
        <RoleProvider>
          <App />
        </RoleProvider>
      </DemoDataProvider>
    </BrowserRouter>
  </StrictMode>,
)
