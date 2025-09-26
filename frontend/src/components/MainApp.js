import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CalendarView from './CalendarView';
import ExploreSection from './ExploreSection';
import PersonaChat from './PersonaChat';

const MainApp = () => {
  const { user, trialStatus, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('calendar');
  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    // Welcome message on app load
    if (user?.selected_persona) {
      setCurrentMessage(getWelcomeMessage());
    }
  }, [user]);

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    
    const messages = {
      casualBuddy: `Good ${timeOfDay}! Ready to crush today's schedule?`,
      caringSibling: `Hey there! Hope your ${timeOfDay} is going well. Let's plan something awesome!`,
      goodParent: `Good ${timeOfDay}, sweetheart! Time to organize your day with love and care.`,
      strictProfessional: `Good ${timeOfDay}. Time to review your calendar and execute your plans efficiently.`,
      wildCard: `${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} vibes! Let's make today unpredictably awesome!`
    };
    
    return messages[user?.selected_persona] || `Good ${timeOfDay}! Let's make today productive!`;
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Persona messages for different sections
    const messages = {
      calendar: "Let's see what's on your schedule!",
      explore: "Time to discover what's around you!",
      settings: "Let's fine-tune your preferences."
    };
    
    if (messages[tab]) {
      setCurrentMessage(messages[tab]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="bg-cc-card border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="cc-logo-container">
                <div className="cc-logo"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Hey, {user?.name}!
                </h1>
                <p className="text-sm text-gray-400">
                  {trialStatus?.trial_active 
                    ? `${trialStatus.days_left} days left in trial`
                    : 'Premium Member'
                  }
                </p>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <nav className="hidden md:flex space-x-1 bg-gray-800/50 rounded-lg p-1">
              {[
                { id: 'calendar', name: 'Calendar', icon: '📅' },
                { id: 'explore', name: 'Explore', icon: '🗺️' },
                { id: 'settings', name: 'Settings', icon: '⚙️' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-4 rounded-md transition-all ${
                    activeTab === tab.id
                      ? 'bg-cc-gradient text-white font-semibold'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                  data-testid={`${tab.id}-tab`}
                >
                  <span>{tab.icon}</span>
                  <span className="hidden lg:inline">{tab.name}</span>
                </button>
              ))}
            </nav>
            
            <button
              onClick={logout}
              className="text-gray-400 hover:text-white transition-colors"
              data-testid="logout-btn"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Persona Chat - only show for important messages */}
      <PersonaChat message={currentMessage} persona={user?.selected_persona} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Mobile Tab Navigation */}
        <nav className="md:hidden flex space-x-1 mb-6 bg-gray-800/50 rounded-lg p-1">
          {[
            { id: 'calendar', name: 'Calendar', icon: '📅' },
            { id: 'explore', name: 'Explore', icon: '🗺️' },
            { id: 'settings', name: 'Settings', icon: '⚙️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-2 rounded-md transition-all ${
                activeTab === tab.id
                  ? 'bg-cc-gradient text-white font-semibold'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
              data-testid={`${tab.id}-tab-mobile`}
            >
              <span>{tab.icon}</span>
              <span className="text-sm">{tab.name}</span>
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="fade-in">
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'explore' && <ExploreSection />}
          {activeTab === 'settings' && <SettingsSection />}
        </div>
      </main>
    </div>
  );
};

const SettingsSection = () => {
  const { user, updatePersona } = useAuth();
  const [selectedPersona, setSelectedPersona] = useState(user?.selected_persona || 'casualBuddy');

  const personas = [
    { id: 'casualBuddy', name: 'Casual Buddy', emoji: '😎' },
    { id: 'caringSibling', name: 'Caring Sibling', emoji: '🤗' },
    { id: 'goodParent', name: 'Good Parent', emoji: '🥰' },
    { id: 'strictProfessional', name: 'Strict Professional', emoji: '💼' },
    { id: 'wildCard', name: 'Wild Card', emoji: '🎭' }
  ];

  const handlePersonaChange = async (personaId) => {
    setSelectedPersona(personaId);
    await updatePersona(personaId);
  };

  return (
    <div className="space-y-6">
      <div className="bg-cc-card rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Change Your AI Companion
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personas.map(persona => (
            <div
              key={persona.id}
              onClick={() => handlePersonaChange(persona.id)}
              className={`persona-card ${selectedPersona === persona.id ? 'selected' : ''}`}
              data-testid={`persona-${persona.id}`}
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{persona.emoji}</div>
                <div>
                  <h3 className="font-semibold text-white">{persona.name}</h3>
                  {selectedPersona === persona.id && (
                    <p className="text-sm text-cc-blue">Currently active</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-cc-card rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Calendar Settings
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">Google Calendar Sync</h3>
              <p className="text-sm text-gray-400">Sync your Cc tasks with Google Calendar</p>
            </div>
            <button className="btn-cc-secondary text-sm">
              Connect Google Calendar
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">Default View</h3>
              <p className="text-sm text-gray-400">Choose your preferred calendar view</p>
            </div>
            <select className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm">
              <option value="month">Month View</option>
              <option value="week">Week View</option>
              <option value="day">Day View</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">Smart Notifications</h3>
              <p className="text-sm text-gray-400">Get reminders and suggestions</p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4 text-cc-pink rounded" />
          </div>
        </div>
      </div>

      <div className="bg-cc-card rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Profile Information
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400">Name</label>
            <p className="text-white font-medium">{user?.name}</p>
          </div>
          
          <div>
            <label className="text-sm text-gray-400">Location</label>
            <p className="text-white font-medium">{user?.city || user?.timezone}</p>
          </div>
          
          <div>
            <label className="text-sm text-gray-400">Personality Type</label>
            <p className="text-white font-medium">{user?.personality_type}</p>
          </div>
          
          <div>
            <label className="text-sm text-gray-400">Member Since</label>
            <p className="text-white font-medium">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Today'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-cc-card rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          About Cc Calendar
        </h2>
        
        <div className="text-gray-300 space-y-2">
          <p>Version 2.0.0 - Enhanced Calendar Release</p>
          <p>A comprehensive culture-centric calendar with AI personas</p>
          <p className="text-sm text-gray-500">
            Built with ❤️ for organizing life with personality and intelligence
          </p>
        </div>
      </div>
    </div>
  );
};

export default MainApp;