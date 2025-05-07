// services/apiService.js
import axios from 'axios';

// Base API URL - This should be configured based on your deployment
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Submit a research query
 * @param {string} token - Authentication token
 * @param {Object} queryData - The query data
 * @returns {Promise<Object>} - Response with task_id
 */
export const submitQuery = async (token, queryData, url) => {
  try {
    const apiClient = axios.create({
      baseURL: url,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const response = await apiClient.post('/api/query', queryData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting query:', error);
    throw error;
  }
};

/**
 * Get the status of a research task
 * @param {string} token - Authentication token
 * @param {string} taskId - The task ID
 * @returns {Promise<Object>} - Task status
 */
export const getTaskStatus = async (token, taskId, url) => {
  try {
    const apiClient = axios.create({
      baseURL: url,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const response = await apiClient.get(`/api/status/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting task status:', error);
    throw error;
  }
};

/**
 * Get the thought process of a research task
 * @param {string} token - Authentication token
 * @param {string} taskId - The task ID
 * @returns {Promise<Object>} - Thought process data
 */
export const getThoughtProcess = async (token, taskId, url) => {
  try {
    const apiClient = axios.create({
      baseURL: url,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const response = await apiClient.get(`/api/thought-process/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting thought process:', error);
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
    const response = await api.delete(`/api/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};