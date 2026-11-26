import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted fonts: Nunito as one variable font for every weight in use, Ubuntu bold for the logo only.
import '@fontsource-variable/nunito/wght.css'
import '@fontsource/ubuntu/latin-700.css'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { AppProviders } from './contexts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <App />
      </AppProviders>
    </ErrorBoundary>
  </StrictMode>,
)
