import React from 'react'
import ReactDOM from 'react-dom/client'
import Popup from './popup/Popup.jsx'

// Render the popup component
const container = document.getElementById('popup-root')
if (container) {
  const root = ReactDOM.createRoot(container)
  root.render(<Popup />)
}
