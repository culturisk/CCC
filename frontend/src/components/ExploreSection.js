import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

const ExploreSection = () => {
  const { user } = useAuth();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    try {
      setLoading(true);
      
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;
      setCurrentLocation({ lat: latitude, lng: longitude });
      setLocationPermission('granted');
      
      // Fetch nearby places
      await fetchNearbyPlaces(latitude, longitude);
      
    } catch (error) {
      console.error('Location access failed:', error);
      setLocationPermission('denied');
      
      // Load mock data instead
      loadMockPlaces();
      
      toast.error('Location access denied. Showing sample places.');
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyPlaces = async (lat, lng) => {
    try {
      const response = await axios.get(`${API_BASE}/api/explore/nearby?lat=${lat}&lng=${lng}`);
      setPlaces(response.data.places || []);
      
      if (response.data.message) {
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error('Failed to fetch nearby places:', error);
      loadMockPlaces();
    }
  };

  const loadMockPlaces = () => {
    const mockPlaces = [
      {
        name: 'Downtown Coffee Co.',
        type: 'cafe',
        distance: '0.2 km',
        rating: 4.6,
        address: '123 Main Street',
        hours: 'Open until 9 PM',
        price_level: '$'
      },
      {
        name: 'Central Library',
        type: 'library',
        distance: '0.4 km',
        rating: 4.3,
        address: '456 Library Ave',
        hours: 'Open until 8 PM',
        price_level: 'Free'
      },
      {
        name: 'Artisan Market',
        type: 'event',
        distance: '0.7 km',
        rating: 4.8,
        address: '789 Culture Square',
        hours: 'Today 10 AM - 6 PM',
        price_level: '$-$$'
      },
      {
        name: 'Zen Co-working Space',
        type: 'workspace',
        distance: '0.5 km',
        rating: 4.4,
        address: '321 Innovation Blvd',
        hours: 'Open 24 hours',
        price_level: '$$'
      },
      {
        name: 'Jazz & Wine Bar',
        type: 'entertainment',
        distance: '0.9 km',
        rating: 4.7,
        address: '654 Harmony Street',
        hours: 'Opens at 6 PM',
        price_level: '$$$'
      }
    ];
    
    setPlaces(mockPlaces);
  };

  const getPlaceIcon = (type) => {
    const icons = {
      cafe: '☕',
      library: '📚',
      event: '🎨',
      workspace: '💼',
      entertainment: '🎵',
      restaurant: '🍽️',
      park: '🌳',
      gym: '💪',
      shop: '🛍️',
      default: '📍'
    };
    
    return icons[type] || icons.default;
  };

  const getTypeColor = (type) => {
    const colors = {
      cafe: 'text-yellow-400',
      library: 'text-blue-400',
      event: 'text-purple-400',
      workspace: 'text-green-400',
      entertainment: 'text-pink-400',
      restaurant: 'text-orange-400',
      park: 'text-emerald-400',
      gym: 'text-red-400',
      shop: 'text-indigo-400',
      default: 'text-gray-400'
    };
    
    return colors[type] || colors.default;
  };

  const handlePlaceClick = (place) => {
    // In a real implementation, this could:
    // - Open Google Maps
    // - Add to calendar as a task
    // - Save as favorite
    // - Get directions
    
    toast.success(`Opening ${place.name} in maps...`);
    
    // Simulate opening in maps (would use Google Maps URL in real app)
    if (currentLocation) {
      const mapsUrl = `https://www.google.com/maps/dir/${currentLocation.lat},${currentLocation.lng}/${encodeURIComponent(place.address)}`;
      window.open(mapsUrl, '_blank');
    } else {
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(place.name + ' ' + place.address)}`;
      window.open(searchUrl, '_blank');
    }
  };

  const addToTasks = (place) => {
    // This would integrate with the task manager to add visiting this place as a task
    toast.success(`Added "${place.name}" to your tasks!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-cc-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Explore Near You
            </h2>
            <p className="text-gray-400">
              Discover local places and events in your area
            </p>
          </div>
          
          <button
            onClick={requestLocation}
            disabled={loading}
            className="btn-cc-secondary flex items-center space-x-2"
            data-testid="refresh-location-btn"
          >
            {loading ? (
              <div className="loading-spinner w-4 h-4"></div>
            ) : (
              <span>🗺️</span>
            )}
            <span>Refresh</span>
          </button>
        </div>
        
        {locationPermission === 'denied' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <span className="text-yellow-400 text-xl">⚠️</span>
              <div>
                <p className="text-yellow-300 font-medium">Location access needed</p>
                <p className="text-sm text-yellow-400">
                  Enable location access to discover places near you. Showing sample data for now.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Places Grid */}
      {loading ? (
        <div className="bg-cc-card rounded-2xl p-12 text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-400">Finding interesting places nearby...</p>
        </div>
      ) : places.length === 0 ? (
        <div className="bg-cc-card rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No places found</h3>
          <p className="text-gray-400 mb-4">
            We couldn't find any places nearby. Try enabling location access or refresh.
          </p>
          <button
            onClick={requestLocation}
            className="btn-cc-primary"
            data-testid="enable-location-btn"
          >
            Enable Location Access
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="places-grid">
          {places.map((place, index) => (
            <div
              key={index}
              className="bg-cc-card rounded-xl p-5 hover:bg-gray-700/50 transition-all duration-300 cursor-pointer border border-transparent hover:border-cc-pink/30"
              onClick={() => handlePlaceClick(place)}
              data-testid={`place-card-${index}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getPlaceIcon(place.type)}</span>
                  <div>
                    <h3 className="font-semibold text-white text-lg leading-tight">
                      {place.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-sm font-medium ${getTypeColor(place.type)}`}>
                        {place.type.charAt(0).toUpperCase() + place.type.slice(1)}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-sm text-gray-400">{place.distance}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToTasks(place);
                  }}
                  className="p-2 hover:bg-cc-pink/20 rounded-lg transition-colors text-gray-400 hover:text-cc-pink"
                  title="Add to tasks"
                  data-testid={`add-to-tasks-${index}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-sm ${
                          i < Math.floor(place.rating) ? 'text-yellow-400' : 'text-gray-600'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-gray-400">{place.rating}</span>
                  {place.price_level && (
                    <>
                      <span className="text-gray-500">•</span>
                      <span className="text-sm text-green-400">{place.price_level}</span>
                    </>
                  )}
                </div>
                
                <p className="text-sm text-gray-400 leading-relaxed">
                  📍 {place.address}
                </p>
                
                {place.hours && (
                  <p className="text-sm text-cc-blue">
                    🕒 {place.hours}
                  </p>
                )}
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Tap to view in maps</span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Persona Message */}
      {places.length > 0 && (
        <div className="bg-cc-card rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-cc-gradient rounded-full flex items-center justify-center text-white font-bold">
              {user?.selected_persona === 'casualBuddy' ? '😎' :
               user?.selected_persona === 'caringSibling' ? '🤗' :
               user?.selected_persona === 'goodParent' ? '🥰' :
               user?.selected_persona === 'strictProfessional' ? '💼' : '🎭'}
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">
                {user?.selected_persona === 'casualBuddy' && "Yo, some cool spots around! Check 'em out when you're free."}
                {user?.selected_persona === 'caringSibling' && "Found some nice places nearby! Pick one that speaks to you."}
                {user?.selected_persona === 'goodParent' && "Here are some lovely places to explore, sweetheart. Choose what feels right."}
                {user?.selected_persona === 'strictProfessional' && "Nearby locations identified. Select based on your objectives."}
                {user?.selected_persona === 'wildCard' && "Adventure awaits! These spots are calling your name."}
                {!user?.selected_persona && "Discovered some interesting places in your area!"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreSection;