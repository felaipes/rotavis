import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { instalarCapturaGlobal } from './services/errorLog'

// Antes de montar o App, para pegar também o que estourar durante a montagem.
instalarCapturaGlobal()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
