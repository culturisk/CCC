import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

const EventRecommendations = ({ recommendations = [] }) => {
  const { user } = useAuth();
  const [holidays, setHolidays] = useState([]);
  const [culturalEvents, setCulturalEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      
      // Load holidays and cultural events
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      
      // Mock holiday/cultural data (in real app, this would come from APIs)
      const mockHolidays = [
        {
          date: new Date(currentYear, currentMonth - 1, 25),
          name: "Christmas Day",
          type: "holiday",
          description: "Christian holiday celebrating the birth of Jesus",
          cultural: true
        },
        {
          date: new Date(currentYear, currentMonth - 1, 31),
          name: "New Year's Eve",
          type: "celebration",
          description: "Last day of the year celebration",
          cultural: true
        },
        {
          date: new Date(currentYear, currentMonth - 1, 14),
          name: "Valentine's Day",
          type: "celebration",
          description: "Day of romance and love",
          cultural: true
        }
      ];

      const mockCulturalEvents = [
        {
          name: "Local Art Exhibition",
          date: new Date(currentYear, currentMonth - 1, 20),
          location: "Downtown Gallery",
          type: "art",
          description: "Contemporary local artists showcase"
        },
        {
          name: "Food Festival",
          date: new Date(currentYear, currentMonth - 1, 28),
          location: "City Park",
          type: "food",
          description: "International cuisine festival"
        },
        {
          name: "Music Concert",
          date: new Date(currentYear, currentMonth - 1, 22),
          location: "Concert Hall",
          type: "music",
          description: "Classical music evening"
        }
      ];

      setHolidays(mockHolidays);
      setCulturalEvents(mockCulturalEvents);
      
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCalendar = async (event) => {
    try {
      const taskData = {
        title: event.name,
        description: event.description || '',
        date: event.date.toISOString(),
        task_type: event.type || 'general',
        all_day: true
      };

      await axios.post(`${API_BASE}/api/tasks`, taskData);
      toast.success(`Added "${event.name}" to your calendar!`);
    } catch (error) {
      console.error('Failed to add event:', error);
    }
  };

  const getEventIcon = (type) => {
    const icons = {
      holiday: '🎄',
      celebration: '🎉',
      art: '🎨',
      food: '🍽️',
      music: '🎵',
      cultural: '🏛️',
      festival: '🎪',
      default: '📅'
    };
    return icons[type] || icons.default;
  };

  const upcomingHolidays = holidays.filter(h => h.date >= new Date()).slice(0, 3);
  const upcomingCultural = culturalEvents.filter(e => e.date >= new Date()).slice(0, 2);

  return (
    <div className="space-y-4">
      {/* Holidays & Special Days */}
      {upcomingHolidays.length > 0 && (
        <div className="bg-cc-card rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
            <span>🎯</span>
            <span>Upcoming Holidays</span>
          </h3>
          
          <div className="space-y-3">
            {upcomingHolidays.map((holiday, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getEventIcon(holiday.type)}</span>
                  <div>
                    <h4 className="text-white font-medium text-sm">{holiday.name}</h4>
                    <p className="text-xs text-gray-400">
                      {holiday.date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => addToCalendar(holiday)}
                  className="p-1 text-gray-400 hover:text-cc-pink transition-colors"
                  title="Add to calendar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cultural Events */}
      {upcomingCultural.length > 0 && (
        <div className="bg-cc-card rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
            <span>🎭</span>
            <span>Cultural Events</span>
          </h3>
          
          <div className="space-y-3">
            {upcomingCultural.map((event, index) => (
              <div key={index} className="p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start space-x-3">
                    <span className="text-xl">{getEventIcon(event.type)}</span>
                    <div>
                      <h4 className="text-white font-medium text-sm">{event.name}</h4>
                      <p className="text-xs text-gray-400">{event.location}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => addToCalendar(event)}
                    className="p-1 text-gray-400 hover:text-cc-pink transition-colors"
                    title="Add to calendar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-500">{event.description}</p>
                <p className="text-xs text-cc-blue mt-1">
                  {event.date.toLocaleDateString('en-US', { 
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nearby Places from props */}
      {recommendations.length > 0 && (
        <div className="bg-cc-card rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
            <span>📍</span>
            <span>Nearby Places</span>
          </h3>
          
          <div className="space-y-3">
            {recommendations.slice(0, 3).map((place, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">
                    {place.type === 'cafe' ? '☕' :
                     place.type === 'restaurant' ? '🍽️' :
                     place.type === 'park' ? '🌳' :
                     place.type === 'gym' ? '💪' :
                     place.type === 'library' ? '📚' : '📍'}
                  </span>
                  <div>
                    <h4 className="text-white font-medium text-sm">{place.name}</h4>
                    <p className="text-xs text-gray-400">{place.distance || 'Nearby'}</p>
                    {place.rating && (
                      <div className="flex items-center space-x-1 mt-1">
                        <span className="text-yellow-400 text-xs">⭐</span>
                        <span className="text-xs text-gray-400">{place.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    const visitEvent = {
                      name: `Visit ${place.name}`,
                      description: `Check out this ${place.type}`,
                      date: new Date(),
                      type: 'personal'
                    };
                    addToCalendar(visitEvent);
                  }}
                  className="p-1 text-gray-400 hover:text-cc-pink transition-colors"
                  title="Plan a visit"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Persona Suggestions */}
      <div className="bg-cc-card rounded-xl p-4">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center space-x-2">
          <span>
            {user?.selected_persona === 'casualBuddy' ? '😎' :
             user?.selected_persona === 'caringSibling' ? '🤗' :
             user?.selected_persona === 'goodParent' ? '🥰' :
             user?.selected_persona === 'strictProfessional' ? '💼' : '🎭'}
          </span>
          <span>Smart Suggestions</span>
        </h3>
        
        <div className="space-y-2">
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <p className="text-sm text-gray-300 mb-2">
              {user?.selected_persona === 'casualBuddy' && "Yo! How about adding some workout time? Your future self will thank you."}
              {user?.selected_persona === 'caringSibling' && "Hey! Don't forget to schedule some self-care time this week."}
              {user?.selected_persona === 'goodParent' && "Sweetheart, remember to plan some relaxation time between your busy schedule."}
              {user?.selected_persona === 'strictProfessional' && "Consider blocking focus time for important projects. Productivity requires planning."}
              {user?.selected_persona === 'wildCard' && "Plot twist: What if you tried something completely new this week?"}
              {!user?.selected_persona && "Based on your schedule, we suggest adding some balance to your week."}
            </p>
            <button className="text-xs text-cc-blue hover:text-cc-pink transition-colors">
              Add suggested time blocks →
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default EventRecommendations;