// React entry point: yahan se SPA (Single Page Application) start hoti hai.
// Vite is project ka dev server/build tool hai; createRoot React ko #root me render karta hai.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
