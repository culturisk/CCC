import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const PERSONAS = [
  {
    id: 'casualBuddy',
    name: 'Casual Buddy',
    description: 'Laid-back friend who keeps it real',
    emoji: '😎',
    sample: "Yo, let's get this day sorted without stress!"
  },
  {
    id: 'caringSibling',
    name: 'Caring Sibling',
    description: 'Supportive and encouraging companion',
    emoji: '🤗',
    sample: "I've got your back! Let's make today amazing."
  },
  {
    id: 'goodParent',
    name: 'Good Parent',
    description: 'Gentle guidance with loving care',
    emoji: '🥰',
    sample: "Take your time, sweetheart. You're doing great."
  },
  {
    id: 'strictProfessional',
    name: 'Strict Professional',
    description: 'Direct and focused on results',
    emoji: '💼',
    sample: "Time is valuable. Let's execute efficiently."
  },
  {
    id: 'wildCard',
    name: 'Wild Card',
    description: 'Unpredictable and fun-loving',
    emoji: '🎭',
    sample: "Life's a game. Let's play it with style!"
  }
];

const PERSONALITY_TYPES = [
  'Shy & Introverted',
  'Bold & Outgoing',
  'Structured & Organized',
  'Creative & Flexible',
  'Analytical & Detail-oriented'
];

const TIMEZONES = [
  'UTC-8 (PST)',
  'UTC-7 (MST)',
  'UTC-6 (CST)',
  'UTC-5 (EST)',
  'UTC+0 (GMT)',
  'UTC+1 (CET)',
  'UTC+5:30 (IST)',
  'UTC+8 (CST)',
  'UTC+9 (JST)'
];

const OnboardingScreen = () => {
  const { onboardUser, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    timezone: 'UTC-5 (EST)',
    personality_type: '',
    selected_persona: ''
  });

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.personality_type || !formData.selected_persona) {
      return;
    }

    await onboardUser(formData);
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.name.trim() && formData.timezone;
      case 2:
        return formData.personality_type;
      case 3:
        return formData.selected_persona;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 fade-in">
          <div className="cc-logo-container cc-logo-large mb-4">
            <div className="cc-logo"></div>
          </div>
          <h1 className="text-3xl font-bold text-cc-gradient mb-2">
            Welcome to Cc
          </h1>
          <p className="text-gray-400">
            Your quirky culture-centric calendar
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 fade-in-delayed">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Step {step} of 3</span>
            <span className="text-sm text-cc-pink">{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className="bg-cc-gradient h-2 rounded-full transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-cc-card rounded-2xl p-6 mb-6 fade-in">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Let's get to know you
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  What should we call you?
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cc-pink focus:border-transparent outline-none transition-all"
                  placeholder="Enter your name"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your timezone
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cc-pink focus:border-transparent outline-none transition-all"
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                What describes you best?
              </h2>
              
              <div className="space-y-3">
                {PERSONALITY_TYPES.map(type => (
                  <div
                    key={type}
                    onClick={() => setFormData({...formData, personality_type: type})}
                    className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${
                      formData.personality_type === type
                        ? 'border-cc-blue bg-blue-500/10 text-cc-blue'
                        : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    <div className="font-medium">{type}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Choose your AI companion
              </h2>
              
              <div className="space-y-4">
                {PERSONAS.map(persona => (
                  <div
                    key={persona.id}
                    onClick={() => setFormData({...formData, selected_persona: persona.id})}
                    className={`persona-card ${formData.selected_persona === persona.id ? 'selected' : ''}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{persona.emoji}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{persona.name}</h3>
                        <p className="text-sm text-gray-400 mb-2">{persona.description}</p>
                        <p className="text-sm italic text-cc-pink">"{persona.sample}"</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between fade-in-delayed">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="btn-cc-secondary"
              disabled={loading}
            >
              Back
            </button>
          ) : (
            <div></div>
          )}
          
          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={!isStepValid() || loading}
              className={`btn-cc-primary ${!isStepValid() ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!isStepValid() || loading}
              className={`btn-cc-primary ${!isStepValid() ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="loading-spinner"></div>
                  <span>Setting up...</span>
                </div>
              ) : (
                'Start My Journey'
              )}
            </button>
          )}
        </div>

        {/* Trial Info */}
        <div className="text-center mt-8 fade-in-delayed">
          <p className="text-sm text-gray-500">
            🎉 3-day free trial • No credit card required
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;