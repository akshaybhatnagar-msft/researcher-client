// components/TaskHistory.js with simplified fix
import React, { useEffect, useState } from 'react';
import './TaskHistory.css';

const TaskHistory = ({ 
  token, 
  getTasks, 
  onSelectTask, 
  onNewChat, 
  onClose,
  activeTool 
}) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch tasks when component mounts or when token/activeTool changes
  useEffect(() => {
    const fetchTasks = async () => {
      if (!token) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await getTasks(token);
        console.log("Tasks data:", response);
        
        // Sort tasks by created_at date (newest first), only if we have items
        if (response && response.length > 0) {
          // Create a copy of the array before sorting
          const sortedTasks = [...response].sort((a, b) => {
            // Handle potential missing created_at values
            if (!a.created_at) return 1;  // Push items without date to the end
            if (!b.created_at) return -1; // Push items without date to the end
            return new Date(b.created_at) - new Date(a.created_at);
          });
          setTasks(sortedTasks);
        } else {
          setTasks([]);
        }
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError("Failed to load previous chats. Please try again.");
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTasks();
  }, [token, getTasks, activeTool]);
  
  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'No date';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleString(undefined, {
        month: 'short', 
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Filter tasks based on search query (only by task_id since we don't have message content)
  const filteredTasks = tasks.filter(task => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    // Search in task ID
    return task.task_id && task.task_id.toLowerCase().includes(query);
  });
  
  // Get status badge color based on status
  const getStatusBadgeClass = (status) => {
    if (!status) return '';
    
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'failed':
        return 'status-failed';
      case 'in_progress':
        return 'status-in-progress';
      case 'pending':
        return 'status-pending';
      default:
        return '';
    }
  };
  
  // Format progress percentage for display - only show integers
  const formatProgress = (progress) => {
    if (progress === undefined || progress === null) return '0%';
    return `${Math.floor(progress * 100)}%`;
  };
  
  return (
    <div className="task-history">
      <div className="task-history-header">
        <h2>Previous Chats</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="task-history-actions">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="clear-search"
              onClick={() => setSearchQuery('')}
            >
              ×
            </button>
          )}
        </div>
        
        <button className="new-chat-button" onClick={onNewChat}>
          + New Chat
        </button>
      </div>
      
      <div className="task-list">
        {isLoading ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Loading previous chats...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => getTasks(token)}>Try Again</button>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            {searchQuery ? (
              <p>No chats match your search query.</p>
            ) : (
              <p>No previous chats found. Start a new conversation!</p>
            )}
          </div>
        ) : (
          filteredTasks.map(task => (
            <div 
              key={task.task_id} 
              className="task-item"
              onClick={() => onSelectTask(task)}
            >
              <div className="task-item-header">
                <span className="task-date">{formatDate(task.created_at)}</span>
                <span className={`task-status ${getStatusBadgeClass(task.status)}`}>
                  {task.status || 'unknown'}
                </span>
              </div>
              
              <div className="task-progress">
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${Math.floor((task.progress || 0) * 100)}%` }}
                  ></div>
                </div>
                <span className="progress-label">{formatProgress(task.progress)}</span>
              </div>
              
              <div className="task-meta">
                <span className="task-tool">{activeTool}</span>
                <span className="task-id">ID: {task.task_id.substring(0, 8)}...</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskHistory;