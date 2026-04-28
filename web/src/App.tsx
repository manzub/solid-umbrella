import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Login from './pages/Login.tsx'
import Register from './pages/Register.tsx'
import Vault from './pages/Vault.tsx'


const queryClient = new QueryClient()

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  return token ? <>{children}</> : <Navigate to="/login" />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/vault" element={
            <PrivateRoute>
              <Vault />
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/vault" />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}