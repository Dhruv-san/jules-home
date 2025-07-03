import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import UserProfileSetupPage from './pages/UserProfileSetupPage';
import NotFoundPage from './pages/NotFoundPage';
import './App.css'; // Keep or remove CRA's App.css as needed

function App() {
  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8"> {/* Basic Tailwind container for content */}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile-setup" element={<UserProfileSetupPage />} />
          </Route>

          {/* Catch-all for not found pages */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
