import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';
import OnboardingScreen from './components/OnboardingScreen';
import MainApp from './components/MainApp';
import PaywallScreen from './components/PaywallScreen';
import { AuthProvider, useAuth } from './context/AuthContext';

// PWA Service Worker Registration
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

function AppRoutes() {
  const { user, trialStatus, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="cc-logo-container animate-pulse">
            <div className="cc-logo"></div>
          </div>
          <div className="text-white text-lg font-light">Loading Cc...</div>
        </div>
      </div>
    );
  }

  // If no user, show onboarding
  if (!user) {
    return <OnboardingScreen />;
  }

  // If trial expired and no subscription, show paywall
  if (!trialStatus?.trial_active && !trialStatus?.subscription_active) {
    return <PaywallScreen />;
  }

  // Show main app
  return <MainApp />;
}

function App() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/*" element={<AppRoutes />} />
          </Routes>
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'linear-gradient(135deg, #ec4899 0%, #3b82f6 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '500'
              }
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;