// services/apiService.js with fixed URLs and task response format
import axios from 'axios';

// API base URLs for different tools
const API_BASE_URLS = {
  openmanus: process.env.REACT_APP_OPENMANUS_API_URL || 'http://localhost:8010',
  bff: process.env.REACT_APP_BFF_API_URL || 'http://localhost:8000',
  researcher: process.env.REACT_APP_BFF_API_URL || 'http://localhost:8000'
};

// Track the active tool
let activeTool = 'openmanus'; // Default to OpenManus

// Create an axios instance with default config
const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Set the active tool to use for API requests
 * @param {string} tool - The tool to use ('openmanus' or 'bff')
 */
export const setActiveTool = (tool) => {
  if (API_BASE_URLS[tool]) {
    activeTool = tool;
    console.log(`Switched to ${tool} API: ${API_BASE_URLS[tool]}`);
  } else {
    console.error(`Unknown tool: ${tool}`);
  }
};

/**
 * Get the active API base URL
 * @returns {string} - The active API base URL
 */
const getActiveBaseUrl = () => {
  return API_BASE_URLS[activeTool];
};

/**
 * Submit a research query
 * @param {string} token - Authentication token
 * @param {Object} queryData - The query data
 * @returns {Promise<Object>} - Response with task_id
 */
export const submitQuery = async (token, queryData) => {
  try {
    // Include the tool in the console log for debugging
    console.log(`Submitting query using ${activeTool}:`, queryData.query);
    
    const response = await api.post(`${getActiveBaseUrl()}/api/query`, queryData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error submitting query to ${activeTool}:`, error);
    throw error;
  }
};

/**
 * Get the status of a research task
 * @param {string} token - Authentication token
 * @param {string} taskId - The task ID
 * @returns {Promise<Object>} - Task status with all task details
 */
export const getTaskStatus = async (token, taskId) => {
  try {
    const response = await api.get(`${getActiveBaseUrl()}/api/status/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error getting task status from ${activeTool}:`, error);
    throw error;
  }
};

/**
 * Delete a research task
 * @param {string} token - Authentication token
 * @param {string} taskId - The task ID
 * @returns {Promise<Object>} - Response
 */
export const deleteTask = async (token, taskId) => {
  try {
    const response = await api.delete(`${getActiveBaseUrl()}/api/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting task from ${activeTool}:`, error);
    throw error;
  }
};

/**
 * Get all previous tasks
 * @param {string} token - Authentication token
 * @returns {Promise<Array>} - List of tasks with basic info (task_id, status, progress, created_at)
 */
export const getTasks = async (token) => {
  try {
    const response = await api.get(`${getActiveBaseUrl()}/api/tasks`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // The response is of type { tasks: [] }
    return response.data.tasks || [];
  } catch (error) {
    console.error(`Error getting tasks from ${activeTool}:`, error);
    throw error;
  }
};