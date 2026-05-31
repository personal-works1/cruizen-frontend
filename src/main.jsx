import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// import { AuthProvider } from '../Context/AuthContext.jsx'
// import { ModeProvider } from '../Context/modeContext.jsx'
import { AuthProvider } from './Component/Context/AuthContext.jsx'
import { ModeProvider } from './Component/Context/modeContext.jsx'
import { ThemeProvider } from './Component/Context/ThemeContext.jsx'
import { SocketProvider } from './Component/Context/SocketContext.jsx'


createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <ModeProvider >
      <SocketProvider >
      <ThemeProvider >
    <App />
    </ThemeProvider>
    </SocketProvider>
    </ModeProvider>
  </AuthProvider>
)

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )
