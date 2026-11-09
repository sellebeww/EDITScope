import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { Provider } from './store'

createRoot(document.getElementById('root')!).render(<StrictMode><Provider><HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><App /></HashRouter></Provider></StrictMode>)
