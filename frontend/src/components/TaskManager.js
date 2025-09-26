import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

const TaskManager = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [loading, setLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    time: '',
    task_type: 'general'
  });

  const taskTypes = [
    { id: 'general', name: 'General', icon: '📋', color: 'text-gray-400' },
    { id: 'work', name: 'Work', icon: '💼', color: 'text-blue-400' },
    { id: 'personal', name: 'Personal', icon: '🏠', color: 'text-green-400' },
    { id: 'exercise', name: 'Exercise', icon: '💪', color: 'text-red-400' },
    { id: 'meal', name: 'Meal', icon: '🍽️', color: 'text-yellow-400' },
    { id: 'meeting', name: 'Meeting', icon: '👥', color: 'text-purple-400' }
  ];

  useEffect(() => {
    fetchTasks();
  }, [selectedDate]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/tasks?date=${selectedDate}`);
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    try {
      const taskData = {
        ...newTask,
        date: selectedDate + 'T00:00:00Z'
      };

      const response = await axios.post(`${API_BASE}/api/tasks`, taskData);
      
      setTasks(prev => [...prev, response.data.task]);
      setNewTask({ title: '', description: '', time: '', task_type: 'general' });
      setShowAddTask(false);
      
      toast.success(response.data.message || 'Task added successfully!');
    } catch (error) {
      console.error('Failed to add task:', error);
      const message = error.response?.data?.detail || 'Failed to add task';
      toast.error(message);
    }
  };

  const planMyDay = async () => {
    try {
      setPlanLoading(true);
      const response = await axios.post(`${API_BASE}/api/plan-day`, {
        date: selectedDate + 'T00:00:00Z'
      });
      
      setTimeline(response.data.timeline || []);
      toast.success(response.data.message || 'Day planned successfully!');
    } catch (error) {
      console.error('Failed to plan day:', error);
      const message = error.response?.data?.detail || 'Failed to plan day';
      toast.error(message);
    } finally {
      setPlanLoading(false);
    }
  };

  const toggleTaskCompletion = async (taskId) => {
    // For now, just update locally
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
    
    setTimeline(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const getTaskTypeInfo = (type) => {
    return taskTypes.find(t => t.id === type) || taskTypes[0];
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const pendingTasks = tasks.filter(task => !task.completed);

  return (
    <div className="space-y-6">
      {/* Date Selector & Plan Button */}
      <div className="bg-cc-card rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {isToday ? "Today's Tasks" : "Tasks"}
            </h2>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cc-pink focus:border-transparent outline-none"
              data-testid="date-selector"
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setShowAddTask(true)}
              className="btn-cc-secondary flex items-center space-x-2"
              data-testid="add-task-btn"
            >
              <span>+</span>
              <span>Add Task</span>
            </button>
            
            {pendingTasks.length > 0 && (
              <button
                onClick={planMyDay}
                disabled={planLoading}
                className="btn-cc-primary flex items-center space-x-2"
                data-testid="plan-day-btn"
              >
                {planLoading ? (
                  <div className="loading-spinner w-4 h-4"></div>
                ) : (
                  <span>⚡</span>
                )}
                <span>Plan My Day</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-cc-card rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Add New Task</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cc-pink focus:border-transparent outline-none"
                  placeholder="What needs to be done?"
                  autoFocus
                  data-testid="task-title-input"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">Description (Optional)</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cc-pink focus:border-transparent outline-none resize-none"
                  rows="2"
                  placeholder="Add details..."
                  data-testid="task-description-input"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Time (Optional)</label>
                  <input
                    type="time"
                    value={newTask.time}
                    onChange={(e) => setNewTask({...newTask, time: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cc-pink focus:border-transparent outline-none"
                    data-testid="task-time-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Type</label>
                  <select
                    value={newTask.task_type}
                    onChange={(e) => setNewTask({...newTask, task_type: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cc-pink focus:border-transparent outline-none"
                    data-testid="task-type-select"
                  >
                    {taskTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.icon} {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddTask(false)}
                className="flex-1 btn-cc-secondary"
                data-testid="cancel-add-task-btn"
              >
                Cancel
              </button>
              <button
                onClick={addTask}
                className="flex-1 btn-cc-primary"
                data-testid="save-task-btn"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline View */}
      {timeline.length > 0 && (
        <div className="bg-cc-card rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <span>⚡</span>
            <span>Your Day Plan</span>
          </h3>
          
          <div className="space-y-4">
            {timeline.map((task, index) => {
              const typeInfo = getTaskTypeInfo(task.task_type);
              
              return (
                <div key={task.id} className="timeline-item" data-testid={`timeline-task-${index}`}>
                  <div className={`task-card ${task.completed ? 'completed' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <button
                          onClick={() => toggleTaskCompletion(task.id)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            task.completed 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-gray-600 hover:border-cc-pink'
                          }`}
                          data-testid={`toggle-task-${task.id}`}
                        >
                          {task.completed && '✓'}
                        </button>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{typeInfo.icon}</span>
                            <h4 className={`font-semibold ${task.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                              {task.title}
                            </h4>
                            {task.time && (
                              <span className="text-sm text-cc-blue bg-blue-500/20 px-2 py-1 rounded">
                                {formatTime(task.time)}
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Regular Tasks List */}
      {timeline.length === 0 && (
        <div className="bg-cc-card rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">
            All Tasks ({tasks.length})
          </h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="loading-spinner mx-auto mb-4"></div>
              <p className="text-gray-400">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h4 className="text-xl font-semibold text-gray-300 mb-2">No tasks yet</h4>
              <p className="text-gray-400 mb-4">
                {isToday ? "Add your first task to get started!" : "No tasks for this date"}
              </p>
              <button
                onClick={() => setShowAddTask(true)}
                className="btn-cc-primary"
                data-testid="add-first-task-btn"
              >
                Add Your First Task
              </button>
            </div>
          ) : (
            <div className="space-y-3" data-testid="tasks-list">
              {tasks.map(task => {
                const typeInfo = getTaskTypeInfo(task.task_type);
                
                return (
                  <div key={task.id} className={`task-card ${task.completed ? 'completed' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <button
                          onClick={() => toggleTaskCompletion(task.id)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            task.completed 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-gray-600 hover:border-cc-pink'
                          }`}
                          data-testid={`task-checkbox-${task.id}`}
                        >
                          {task.completed && '✓'}
                        </button>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{typeInfo.icon}</span>
                            <h4 className={`font-semibold ${task.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                              {task.title}
                            </h4>
                            {task.time && (
                              <span className="text-sm text-cc-blue bg-blue-500/20 px-2 py-1 rounded">
                                {formatTime(task.time)}
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <span className={`text-sm ${typeInfo.color}`}>
                        {typeInfo.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskManager;