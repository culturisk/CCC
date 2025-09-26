import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

const PersonaChat = ({ message, persona }) => {
  const [currentMessage, setCurrentMessage] = useState(message || '');
  const [isVisible, setIsVisible] = useState(false);
  const [messageHistory, setMessageHistory] = useState([]);

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);
      setIsVisible(true);
      
      // Add to message history
      setMessageHistory(prev => [...prev.slice(-4), {
        text: message,
        timestamp: new Date(),
        persona
      }]);
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [message, persona]);

  const getPersonaInfo = () => {
    const personas = {
      casualBuddy: { emoji: '😎', name: 'Buddy', color: 'from-orange-400 to-red-400' },
      caringSibling: { emoji: '🤗', name: 'Sibling', color: 'from-green-400 to-blue-400' },
      goodParent: { emoji: '🥰', name: 'Parent', color: 'from-pink-400 to-purple-400' },
      strictProfessional: { emoji: '💼', name: 'Pro', color: 'from-blue-400 to-indigo-400' },
      wildCard: { emoji: '🎭', name: 'Wild', color: 'from-purple-400 to-pink-400' }
    };
    
    return personas[persona] || { emoji: '🤖', name: 'Assistant', color: 'from-gray-400 to-gray-600' };
  };

  const fetchPersonaMessage = async (messageType) => {
    try {
      const response = await axios.get(`${API_BASE}/api/persona-message/${messageType}`);
      setCurrentMessage(response.data.message);
      setIsVisible(true);
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    } catch (error) {
      console.error('Failed to fetch persona message:', error);
    }
  };

  const triggerMessage = (type) => {
    fetchPersonaMessage(type);
  };

  const personaInfo = getPersonaInfo();

  if (!currentMessage && messageHistory.length === 0) {
    return null;
  }

  return (
    <>
      {/* Main Persona Message */}
      {isVisible && currentMessage && (
        <div className="sticky top-16 z-40 mx-4 mb-4">
          <div className="max-w-4xl mx-auto">
            <div 
              className="bg-cc-card backdrop-blur-lg rounded-2xl p-4 border border-white/10 shadow-lg animate-pulse fade-in"
              data-testid="persona-message"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 bg-gradient-to-r ${personaInfo.color} rounded-full flex items-center justify-center text-xl shadow-lg`}>
                  {personaInfo.emoji}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-semibold text-white">
                      {personaInfo.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-white font-medium leading-relaxed">
                    {currentMessage}
                  </p>
                </div>
                
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                  data-testid="dismiss-message-btn"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          <button
            className={`w-14 h-14 bg-gradient-to-r ${personaInfo.color} rounded-full shadow-lg flex items-center justify-center text-xl hover:scale-110 transition-transform notification-badge`}
            onClick={() => triggerMessage('nudge_break')}
            data-testid="persona-floating-btn"
          >
            {personaInfo.emoji}
          </button>
          
          {/* Quick message options (could be expanded) */}
          <div className="absolute bottom-16 right-0 opacity-0 hover:opacity-100 transition-opacity">
            <div className="bg-cc-card backdrop-blur-lg rounded-lg p-2 shadow-xl border border-white/10 mb-2 w-48">
              <div className="text-xs text-gray-400 mb-2 px-2">Quick Messages</div>
              
              <button
                onClick={() => triggerMessage('nudge_break')}
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded transition-colors"
                data-testid="quick-break-msg"
              >
                💆 Break reminder
              </button>
              
              <button
                onClick={() => triggerMessage('nudge_drink_water')}
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded transition-colors"
                data-testid="quick-water-msg"
              >
                💧 Water reminder
              </button>
              
              <button
                onClick={() => triggerMessage('celebrate_win')}
                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded transition-colors"
                data-testid="quick-celebrate-msg"
              >
                🎉 Celebrate
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Message History Toggle (Optional) */}
      {messageHistory.length > 0 && (
        <div className="fixed bottom-24 right-6 z-40">
          <button
            onClick={() => {
              // Could toggle a message history panel
              console.log('Message history:', messageHistory);
            }}
            className="w-10 h-10 bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors text-sm"
            title="Message History"
            data-testid="message-history-btn"
          >
            💬
          </button>
        </div>
      )}
    </>
  );
};

export default PersonaChat;