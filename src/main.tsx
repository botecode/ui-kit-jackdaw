import './tokens/reset.css'
import './tokens/global.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './gallery/App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
