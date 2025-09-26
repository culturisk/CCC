import React, { useState, useEffect } from 'react';
import DateTimePicker from 'react-datetime-picker';
import moment from 'moment';

const TaskModal = ({ event, onSave, onDelete, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start: new Date(),
    end: new Date(),
    allDay: false,
    task_type: 'general',
    priority: 'medium',
    deadline: null,
    reminder: null,
    timer_duration: '',
    repeat: 'none',
    tags: '',
    location: '',
    notes: ''
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [timerActive, setTimerActive] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState(0);

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.resource?.description || '',
        start: event.start || new Date(),
        end: event.end || moment(event.start).add(1, 'hour').toDate(),
        allDay: event.allDay || false,
        task_type: event.resource?.type || 'general',
        priority: event.resource?.priority || 'medium',
        deadline: event.resource?.deadline || null,
        reminder: event.resource?.reminder || null,
        timer_duration: event.resource?.timer_duration || '',
        repeat: event.resource?.repeat || 'none',
        tags: event.resource?.tags || '',
        location: event.resource?.location || '',
        notes: event.resource?.notes || ''
      });
    }
  }, [event]);

  const taskTypes = [
    { id: 'general', name: 'General', icon: '📋', color: 'text-gray-400' },
    { id: 'work', name: 'Work', icon: '💼', color: 'text-blue-400' },
    { id: 'personal', name: 'Personal', icon: '🏠', color: 'text-green-400' },
    { id: 'exercise', name: 'Exercise', icon: '💪', color: 'text-red-400' },
    { id: 'meal', name: 'Meal', icon: '🍽️', color: 'text-yellow-400' },
    { id: 'meeting', name: 'Meeting', icon: '👥', color: 'text-purple-400' },
    { id: 'learning', name: 'Learning', icon: '📚', color: 'text-indigo-400' },
    { id: 'creative', name: 'Creative', icon: '🎨', color: 'text-pink-400' }
  ];

  const priorities = [
    { id: 'low', name: 'Low', color: 'text-green-400' },
    { id: 'medium', name: 'Medium', color: 'text-yellow-400' },
    { id: 'high', name: 'High', color: 'text-red-400' }
  ];

  const repeatOptions = [
    { id: 'none', name: 'No Repeat' },
    { id: 'daily', name: 'Daily' },
    { id: 'weekly', name: 'Weekly' },
    { id: 'biweekly', name: 'Bi-weekly' },
    { id: 'monthly', name: 'Monthly' }
  ];

  const handleSave = () => {
    if (!formData.title.trim()) {
      return;
    }

    const eventData = {
      title: formData.title,
      description: formData.description,
      date: formData.start.toISOString(),
      time: formData.allDay ? null : moment(formData.start).format('HH:mm'),
      task_type: formData.task_type,
      priority: formData.priority,
      deadline: formData.deadline ? formData.deadline.toISOString() : null,
      reminder: formData.reminder ? formData.reminder.toISOString() : null,
      timer_duration: formData.timer_duration,
      repeat: formData.repeat,
      tags: formData.tags,
      location: formData.location,
      notes: formData.notes,
      all_day: formData.allDay
    };

    onSave(eventData);
  };

  const startTimer = () => {
    if (formData.timer_duration) {
      const duration = parseInt(formData.timer_duration);
      setTimerRemaining(duration * 60); // Convert to seconds
      setTimerActive(true);
    }
  };

  const stopTimer = () => {
    setTimerActive(false);
    setTimerRemaining(0);
  };

  // Timer countdown effect
  useEffect(() => {
    let interval;
    if (timerActive && timerRemaining > 0) {
      interval = setInterval(() => {
        setTimerRemaining(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            // Timer completed - could trigger notification here
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerRemaining]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const tabs = [
    { id: 'basic', name: 'Basic', icon: '📝' },
    { id: 'timing', name: 'Timing', icon: '⏰' },
    { id: 'advanced', name: 'Advanced', icon: '⚙️' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-cc-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">
              {event?.id ? 'Edit Task' : 'Create New Task'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-2xl"
            >
              ×
            </button>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-all text-sm ${
                  activeTab === tab.id
                    ? 'bg-cc-gradient text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-96">
          {/* Basic Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Task Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cc-pink focus:border-transparent outline-none"
                  placeholder="What needs to be done?"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cc-pink focus:border-transparent outline-none resize-none"
                  rows="3"
                  placeholder="Add details about this task..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Task Type</label>
                  <select
                    value={formData.task_type}
                    onChange={(e) => setFormData({...formData, task_type: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cc-pink focus:border-transparent outline-none"
                  >
                    {taskTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.icon} {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cc-pink focus:border-transparent outline-none"
                  >
                    {priorities.map(priority => (
                      <option key={priority.id} value={priority.id}>
                        {priority.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Location (Optional)</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cc-pink focus:border-transparent outline-none"
                  placeholder="Where will this happen?"
                />
              </div>
            </div>
          )}

          {/* Timing Tab */}
          {activeTab === 'timing' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  checked={formData.allDay}
                  onChange={(e) => setFormData({...formData, allDay: e.target.checked})}
                  className="w-4 h-4 text-cc-pink bg-gray-800 border-gray-600 rounded focus:ring-cc-pink"
                />
                <label className="text-sm text-gray-300">All-day event</label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Start Time</label>
                  <DateTimePicker
                    onChange={(date) => setFormData({...formData, start: date})}
                    value={formData.start}
                    className="w-full"
                    format={formData.allDay ? "MM/dd/yyyy" : "MM/dd/yyyy h:mm a"}
                    disableClock={formData.allDay}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">End Time</label>
                  <DateTimePicker
                    onChange={(date) => setFormData({...formData, end: date})}
                    value={formData.end}
                    className="w-full"
                    format={formData.allDay ? "MM/dd/yyyy" : "MM/dd/yyyy h:mm a"}
                    disableClock={formData.allDay}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Deadline (Optional)</label>
                <DateTimePicker
                  onChange={(date) => setFormData({...formData, deadline: date})}
                  value={formData.deadline}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Reminder (Optional)</label>
                <DateTimePicker
                  onChange={(date) => setFormData({...formData, reminder: date})}
                  value={formData.reminder}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Repeat</label>
                <select
                  value={formData.repeat}
                  onChange={(e) => setFormData({...formData, repeat: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cc-pink focus:border-transparent outline-none"
                >
                  {repeatOptions.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Timer Section */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3 flex items-center space-x-2">
                  <span>⏱️</span>
                  <span>Pomodoro Timer</span>
                </h4>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    value={formData.timer_duration}
                    onChange={(e) => setFormData({...formData, timer_duration: e.target.value})}
                    className="w-20 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-center"
                    placeholder="25"
                    min="1"
                    max="120"
                  />
                  <span className="text-gray-400 text-sm">minutes</span>
                  
                  {timerRemaining > 0 ? (
                    <div className="flex items-center space-x-3">
                      <span className="text-cc-pink font-mono text-lg">
                        {formatTimer(timerRemaining)}
                      </span>
                      <button
                        onClick={stopTimer}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                      >
                        Stop
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={startTimer}
                      disabled={!formData.timer_duration}
                      className="px-3 py-1 bg-cc-gradient text-white rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      Start Timer
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Tags</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cc-pink focus:border-transparent outline-none"
                  placeholder="work, important, meeting (comma separated)"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Additional Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cc-pink focus:border-transparent outline-none resize-none"
                  rows="4"
                  placeholder="Any additional information..."
                />
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Google Calendar Integration</h4>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-cc-pink bg-gray-800 border-gray-600 rounded focus:ring-cc-pink"
                  />
                  <label className="text-sm text-gray-300">Sync with Google Calendar</label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This will create/update the event in your Google Calendar
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-700 flex justify-between">
          <div>
            {onDelete && (
              <button
                onClick={() => onDelete(event.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Task
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-cc-gradient text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              {event?.id ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;