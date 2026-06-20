import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Home from './pages/Home'
import Clientes from './pages/Clientes'
import Relatorio from './pages/Relatorio'
import Guia from './pages/Guia'
import Caderno from './pages/Caderno'

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clientes"
          element={
            <ProtectedRoute>
              <Clientes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/relatorio"
          element={
            <ProtectedRoute>
              <Relatorio />
            </ProtectedRoute>
          }
        />
        <Route
          path="/guia"
          element={
            <ProtectedRoute>
              <Guia />
            </ProtectedRoute>
          }
        />
        <Route
          path="/caderno"
          element={
            <ProtectedRoute>
              <Caderno />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </ThemeProvider>
  )
}
