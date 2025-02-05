import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './tests/OtherSample'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
