import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './components/HomePage'
import LoginPage from './components/LoginPage'
import AdminDashboard from './components/AdminDashboard'
import VolunteerDashboard from './components/VolunteerDashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/volunteer" element={<VolunteerDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
