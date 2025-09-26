import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import TaskModal from './TaskModal';
import EventRecommendations from './EventRecommendations';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);
const API_BASE = process.env.REACT_APP_BACKEND_URL;

const CalendarView = () => {
  const { user } = useAuth();
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  // Load events when date or view changes
  useEffect(() => {
    loadEvents();
    loadRecommendations();
  }, [date, view]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on current view
      let startDate, endDate;
      const currentDate = moment(date);
      
      switch (view) {
        case 'week':
          startDate = currentDate.clone().startOf('week');
          endDate = currentDate.clone().endOf('week');
          break;
        case 'day':
          startDate = currentDate.clone().startOf('day');
          endDate = currentDate.clone().endOf('day');
          break;
        default: // month
          startDate = currentDate.clone().startOf('month').startOf('week');
          endDate = currentDate.clone().endOf('month').endOf('week');
      }

      const response = await axios.get(`${API_BASE}/api/tasks`, {
        params: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        }
      });

      // Transform tasks to calendar events
      const calendarEvents = response.data.tasks.map(task => ({
        id: task.id,
        title: task.title,
        start: new Date(task.date),
        end: task.time ? 
          moment(task.date).set({
            hour: parseInt(task.time.split(':')[0]),
            minute: parseInt(task.time.split(':')[1])
          }).add(1, 'hour').toDate() :
          moment(task.date).add(1, 'hour').toDate(),
        allDay: !task.time,
        resource: {
          type: task.task_type,
          completed: task.completed,
          description: task.description,
          hasDeadline: task.deadline ? true : false,
          hasReminder: task.reminder ? true : false,
          hasTimer: task.timer_duration ? true : false
        }
      }));

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      // Get user's location for recommendations
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
              // Load nearby events and recommendations
              const [nearbyResponse, holidaysResponse] = await Promise.all([
                axios.get(`${API_BASE}/api/explore/nearby?lat=${latitude}&lng=${longitude}`),
                axios.get(`${API_BASE}/api/recommendations/holidays`, {
                  params: { date: date.toISOString() }
                })
              ]);
              
              setRecommendations([
                ...nearbyResponse.data.places.slice(0, 3),
                ...holidaysResponse.data.holidays || []
              ]);
            } catch (error) {
              console.error('Failed to load recommendations:', error);
            }
          },
          (error) => {
            console.log('Location access denied, using default recommendations');
          }
        );
      }
    } catch (error) {
      console.error('Geolocation not supported');
    }
  };

  const handleSelectSlot = useCallback(({ start, end }) => {
    setSelectedEvent({
      start,
      end,
      allDay: moment(end).diff(moment(start), 'hours') >= 24
    });
    setShowTaskModal(true);
  }, []);

  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event);
    setShowTaskModal(true);
  }, []);

  const handleEventSave = async (eventData) => {
    try {
      if (selectedEvent.id) {
        // Update existing event
        await axios.put(`${API_BASE}/api/tasks/${selectedEvent.id}`, eventData);
        toast.success('Task updated successfully!');
      } else {
        // Create new event
        await axios.post(`${API_BASE}/api/tasks`, eventData);
        toast.success('Task created successfully!');
      }
      
      setShowTaskModal(false);
      setSelectedEvent(null);
      loadEvents(); // Reload events
    } catch (error) {
      console.error('Failed to save task:', error);
      toast.error('Failed to save task');
    }
  };

  const handleEventDelete = async (eventId) => {
    try {
      await axios.delete(`${API_BASE}/api/tasks/${eventId}`);
      toast.success('Task deleted successfully!');
      setShowTaskModal(false);
      setSelectedEvent(null);
      loadEvents();
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  };

  // Custom event style based on task type and completion
  const eventStyleGetter = (event) => {
    const resource = event.resource || {};
    let backgroundColor = '#ec4899'; // Default pink
    
    switch (resource.type) {
      case 'work':
        backgroundColor = '#3b82f6'; // Blue
        break;
      case 'personal':
        backgroundColor = '#10b981'; // Green
        break;
      case 'exercise':
        backgroundColor = '#ef4444'; // Red
        break;
      case 'meal':
        backgroundColor = '#f59e0b'; // Yellow
        break;
      case 'meeting':
        backgroundColor = '#8b5cf6'; // Purple
        break;
    }

    return {
      style: {
        backgroundColor: resource.completed ? '#6b7280' : backgroundColor,
        borderRadius: '4px',
        opacity: resource.completed ? 0.6 : 1,
        color: 'white',
        border: 'none',
        fontSize: '12px',
        padding: '2px 4px'
      }
    };
  };

  // Custom toolbar with view controls
  const CustomToolbar = ({ label, onNavigate, onView }) => (
    <div className="bg-cc-card rounded-xl p-4 mb-4 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => onNavigate('PREV')}
          className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        >
          ←
        </button>
        <h2 className="text-xl font-bold text-white min-w-[200px] text-center">{label}</h2>
        <button
          onClick={() => onNavigate('NEXT')}
          className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        >
          →
        </button>
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-4 py-2 bg-cc-gradient rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
        >
          Today
        </button>
        
        <div className="flex border border-gray-600 rounded-lg overflow-hidden">
          {['month', 'week', 'day'].map(viewType => (
            <button
              key={viewType}
              onClick={() => onView(viewType)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                view === viewType
                  ? 'bg-cc-gradient text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const formats = {
    timeGutterFormat: 'HH:mm',
    eventTimeRangeFormat: ({ start, end }, culture, local) => {
      return `${local.format(start, 'HH:mm', culture)} - ${local.format(end, 'HH:mm', culture)}`;
    },
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header with Quick Actions */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="bg-cc-card rounded-2xl p-6" style={{ height: '700px' }}>
            {loading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-2xl">
                <div className="loading-spinner"></div>
              </div>
            )}
            
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              view={view}
              date={date}
              onView={setView}
              onNavigate={setDate}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              selectable={true}
              eventPropGetter={eventStyleGetter}
              formats={formats}
              components={{
                toolbar: CustomToolbar
              }}
              className="cc-calendar"
            />
          </div>
        </div>
        
        {/* Sidebar with Quick Actions & Recommendations */}
        <div className="lg:w-80 space-y-4">
          {/* Quick Add Task */}
          <div className="bg-cc-card rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setSelectedEvent({ 
                    start: new Date(), 
                    end: moment().add(1, 'hour').toDate(),
                    allDay: false 
                  });
                  setShowTaskModal(true);
                }}
                className="w-full btn-cc-primary text-sm"
              >
                + Add New Task
              </button>
              
              <button
                onClick={() => {
                  setSelectedEvent({ 
                    start: moment().add(1, 'day').startOf('day').toDate(), 
                    end: moment().add(1, 'day').endOf('day').toDate(),
                    allDay: true 
                  });
                  setShowTaskModal(true);
                }}
                className="w-full btn-cc-secondary text-sm"
              >
                + Add All-day Event
              </button>
            </div>
          </div>

          {/* Today's Summary */}
          <div className="bg-cc-card rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Today's Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Total Tasks:</span>
                <span className="text-white font-semibold">
                  {events.filter(e => moment(e.start).isSame(moment(), 'day')).length}
                </span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Completed:</span>
                <span className="text-green-400 font-semibold">
                  {events.filter(e => moment(e.start).isSame(moment(), 'day') && e.resource?.completed).length}
                </span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Upcoming:</span>
                <span className="text-cc-blue font-semibold">
                  {events.filter(e => moment(e.start).isAfter(moment()) && moment(e.start).isSame(moment(), 'day')).length}
                </span>
              </div>
            </div>
          </div>

          {/* Event Recommendations */}
          <EventRecommendations recommendations={recommendations} />

          {/* Persona Message */}
          <div className="bg-cc-card rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-cc-gradient rounded-full flex items-center justify-center text-white">
                {user?.selected_persona === 'casualBuddy' ? '😎' :
                 user?.selected_persona === 'caringSibling' ? '🤗' :
                 user?.selected_persona === 'goodParent' ? '🥰' :
                 user?.selected_persona === 'strictProfessional' ? '💼' : '🎭'}
              </div>
              <div>
                <p className="text-sm text-white">
                  {view === 'month' && "Looking good! Your month is shaping up nicely."}
                  {view === 'week' && "This week's looking solid! Stay focused."}
                  {view === 'day' && "One day at a time - you've got this!"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          event={selectedEvent}
          onSave={handleEventSave}
          onDelete={selectedEvent?.id ? handleEventDelete : null}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
};

export default CalendarView;