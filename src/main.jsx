import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// StrictMode removido — causava dupla execução de effects e mutations no Appwrite
createRoot(document.getElementById('root')).render(
  <App />
)
