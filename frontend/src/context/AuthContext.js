import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const API_BASE = process.env.REACT_APP_BACKEND_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [trialStatus, setTrialStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Axios interceptor for adding token
  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      checkUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const checkUserProfile = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/user/profile`);
      setUser(response.data.user);
      setTrialStatus(response.data.trial_status);
    } catch (error) {
      console.error('Profile check failed:', error);
      localStorage.removeItem('cc_token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const onboardUser = async (onboardingData) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE}/api/onboarding`, onboardingData);
      
      const { token, user: userData, message } = response.data;
      
      // Store token and set axios header
      localStorage.setItem('cc_token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(userData);
      setTrialStatus({
        trial_active: true,
        subscription_active: false,
        days_left: 3
      });
      
      toast.success(message);
      return { success: true };
    } catch (error) {
      console.error('Onboarding failed:', error);
      const message = error.response?.data?.detail || 'Onboarding failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const updatePersona = async (persona) => {
    try {
      const response = await axios.put(`${API_BASE}/api/user/persona?persona=${persona}`);
      
      setUser(prev => ({ ...prev, selected_persona: persona }));
      toast.success(response.data.welcome_message);
      
      return { success: true };
    } catch (error) {
      console.error('Persona update failed:', error);
      toast.error('Failed to update persona');
      return { success: false };
    }
  };

  const subscribe = async (planType) => {
    try {
      // Simulate PayPal payment for now
      const paymentData = { plan: planType };
      const response = await axios.post(`${API_BASE}/api/payment/subscribe`, paymentData);
      
      setTrialStatus({
        trial_active: false,
        subscription_active: true,
        days_left: 0
      });
      
      toast.success('Subscription activated successfully!');
      return { success: true };
    } catch (error) {
      console.error('Subscription failed:', error);
      toast.error('Payment failed. Please try again.');
      return { success: false };
    }
  };

  const logout = () => {
    localStorage.removeItem('cc_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setTrialStatus(null);
  };

  const value = {
    user,
    trialStatus,
    loading,
    onboardUser,
    updatePersona,
    subscribe,
    logout,
    checkUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};