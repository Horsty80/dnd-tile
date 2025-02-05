import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Board from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Board />
  </StrictMode>,
)
