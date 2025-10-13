import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

const ExploreSection = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_type: 'cultural',
    location: '',
    city: user?.city || '',
    date: '',
    rating: null
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/api/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEvents(response.data.events || []);
      
      if (response.data.message) {
        // toast.success(response.data.message);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setEventForm({
      title: '',
      description: '',
      event_type: 'cultural',
      location: '',
      city: user?.city || '',
      date: '',
      rating: null
    });
    setShowAddModal(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      event_type: event.event_type,
      location: event.location,
      city: event.city,
      date: event.date || '',
      rating: event.rating || null
    });
    setShowAddModal(true);
  };

  const handleSaveEvent = async () => {
    if (!eventForm.title || !eventForm.location) {
      toast.error('Please fill in title and location');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (editingEvent && !editingEvent.is_default) {
        // Update existing event
        await axios.put(`${API_BASE}/api/events/${editingEvent.id}`, eventForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Event updated successfully');
      } else {
        // Create new event
        await axios.post(`${API_BASE}/api/events`, eventForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Event added successfully');
      }
      
      setShowAddModal(false);
      loadEvents();
    } catch (error) {
      console.error('Failed to save event:', error);
      toast.error('Failed to save event');
    }
  };

  const handleDeleteEvent = async (eventId, isDefault) => {
    if (isDefault) {
      toast.error('Cannot delete default events');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Event deleted successfully');
      loadEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error('Failed to delete event');
    }
  };

  const getEventIcon = (type) => {
    const icons = {
      cafe: '☕',
      restaurant: '🍽️',
      cultural: '🎭',
      festival: '🎪',
      museum: '🏛️',
      park: '🌳',
      library: '📚',
      event: '🎉',
      other: '📍'
    };
    return icons[type] || icons.other;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Explore {user?.city || 'Your City'}</h2>
          <p className="text-gray-400 mt-1">Discover local events and places</p>
        </div>
        <button
          onClick={handleAddEvent}
          className="bg-cc-gradient text-white px-4 py-2 rounded-lg hover:opacity-90 transition-all"
        >
          + Add Event
        </button>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cc-pink mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-cc-card rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🎭</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Events Yet</h3>
          <p className="text-gray-400 mb-4">Start adding places and events you want to explore!</p>
          <button
            onClick={handleAddEvent}
            className="bg-cc-gradient text-white px-6 py-3 rounded-lg hover:opacity-90 transition-all"
          >
            Add Your First Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <div key={event.id} className="bg-cc-card rounded-xl p-4 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-3xl mr-3">{getEventIcon(event.event_type)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                    <span className="text-xs text-cc-pink capitalize">{event.event_type}</span>
                  </div>
                </div>
                {event.is_default && (
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                    Default
                  </span>
                )}
              </div>
              
              {event.description && (
                <p className="text-gray-400 text-sm mb-3">{event.description}</p>
              )}
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-300">
                  <span className="mr-2">📍</span>
                  <span>{event.location}</span>
                </div>
                {event.date && (
                  <div className="flex items-center text-gray-300">
                    <span className="mr-2">📅</span>
                    <span>{event.date}</span>
                  </div>
                )}
                {event.rating && (
                  <div className="flex items-center text-gray-300">
                    <span className="mr-2">⭐</span>
                    <span>{event.rating}/5</span>
                  </div>
                )}
              </div>
              
              {!event.is_default && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => handleEditEvent(event)}
                    className="flex-1 bg-blue-500/20 text-blue-400 px-3 py-2 rounded-lg text-sm hover:bg-blue-500/30 transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id, event.is_default)}
                    className="flex-1 bg-red-500/20 text-red-400 px-3 py-2 rounded-lg text-sm hover:bg-red-500/30 transition-all"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingEvent && !editingEvent.is_default ? 'Edit Event' : 'Add New Event'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cc-pink focus:border-transparent outline-none"
                  placeholder="e.g., Coffee Shop, Art Gallery"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cc-pink focus:border-transparent outline-none"
                  placeholder="Brief description..."
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type
                </label>
                <select
                  value={eventForm.event_type}
                  onChange={(e) => setEventForm({...eventForm, event_type: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cc-pink focus:border-transparent outline-none"
                >
                  <option value="cafe">Cafe</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="cultural">Cultural</option>
                  <option value="festival">Festival</option>
                  <option value="museum">Museum</option>
                  <option value="park">Park</option>
                  <option value="library">Library</option>
                  <option value="event">Event</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cc-pink focus:border-transparent outline-none"
                  placeholder="e.g., 123 Main Street"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={eventForm.city}
                  onChange={(e) => setEventForm({...eventForm, city: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cc-pink focus:border-transparent outline-none"
                  placeholder={user?.city || 'Your city'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date (Optional)
                </label>
                <input
                  type="text"
                  value={eventForm.date}
                  onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cc-pink focus:border-transparent outline-none"
                  placeholder="e.g., Ongoing, Every Saturday, Dec 25"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rating (1-5)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={eventForm.rating || ''}
                  onChange={(e) => setEventForm({...eventForm, rating: parseFloat(e.target.value) || null})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cc-pink focus:border-transparent outline-none"
                  placeholder="e.g., 4.5"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEvent}
                className="flex-1 bg-cc-gradient text-white px-4 py-3 rounded-lg hover:opacity-90 transition-all"
              >
                Save Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreSection;
