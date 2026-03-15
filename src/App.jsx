import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './components/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Employees from './pages/Employees'
import EmployeeDetails from './pages/EmployeeDetails'
import Analytics from './pages/Analytics'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/list" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
          <Route path="/details/:id" element={<ProtectedRoute><EmployeeDetails /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/list" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
