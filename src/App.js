// App.js with updated API handling
import React, { useEffect, useState } from 'react';
import './App.css';
import ChatInput from './components/ChatInput';
import ResearchChat from './components/ResearchChat';
import ResearchSidebar from './components/ResearchSidebar';
import TaskHistory from './components/TaskHistory';
import {
  deleteTask,
  getTasks,
  getTaskStatus,
  setActiveTool,
  submitQuery
} from './services/apiService';
import { getAuthToken, getCurrentUser, isAuthenticated, signOut } from './services/authService';

function App() {
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [taskId, setTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null);
  const [toolCalls, setToolCalls] = useState([]);
  const [thoughtProcess, setThoughtProcess] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showThoughtProcess, setShowThoughtProcess] = useState(true);
  const [selectedTool, setSelectedTool] = useState('openmanus'); // Default to OpenManus
  const [showTaskHistory, setShowTaskHistory] = useState(false);
  
  // Fetch auth token on component mount
  useEffect(() => {
    const fetchToken = async () => {
      setIsAuthenticating(true);
      try {
        // Check if user is authenticated
        const authenticated = await isAuthenticated();
        
        if (authenticated) {
          // We already have an authenticated user, just get the token
          const authToken = await getAuthToken();
          const userInfo = await getCurrentUser();
          setToken(authToken);
          setUser(userInfo);
        } else {
          // User isn't authenticated yet, but we don't auto-redirect
          console.log("User is not authenticated");
        }
      } catch (err) {
        console.error("Auth error:", err);
        setError("Authentication error: " + (err.message || "Unknown error"));
      } finally {
        setIsAuthenticating(false);
      }
    };
    
    fetchToken();
    
    // Set up a token refresh timer (every 45 minutes)
    const tokenRefreshInterval = setInterval(() => {
      isAuthenticated().then(authenticated => {
        if (authenticated) {
          getAuthToken()
            .then(authToken => setToken(authToken))
            .catch(err => console.error("Token refresh error:", err));
        }
      });
    }, 45 * 60 * 1000);
    
    return () => {
      clearInterval(tokenRefreshInterval);
    };
  }, []);
  
  // Update API service when selected tool changes
  useEffect(() => {
    setActiveTool(selectedTool);
  }, [selectedTool]);
  
  // Poll for task status when taskId is available
  useEffect(() => {
    let statusInterval;
    
    if (taskId && !result && token) {
      // Poll for task status every 2 seconds
      statusInterval = setInterval(async () => {
        try {
          const status = await getTaskStatus(token, taskId);
          setTaskStatus(status);
          
          // Update thought process and tool calls from the status response
          if (status.thought_process) {
            setThoughtProcess(status.thought_process);
          }
          
          if (status.tool_calls) {
            setToolCalls(status.tool_calls);
          }
          
          // If task is completed or failed, stop polling and set the result
          if (status.status === "completed" || status.status === "failed") {
            setResult(status.result);
            
            // Add result to messages
            if (status.status === "completed" && status.result) {
              const content = status.result.choices?.[0]?.message?.content || "Research completed, but no content was returned.";
              
              setMessages(prevMessages => [
                ...prevMessages, // Remove pending message
                {
                  role: 'assistant',
                  content: content,
                  timestamp: new Date().toISOString()
                }
              ]);
              
              // Auto-switch to result view when complete
              setShowThoughtProcess(false);
            } else if (status.status === "failed") {
              setMessages(prevMessages => [
                ...prevMessages,
                {
                  role: 'assistant',
                  content: `Research failed: ${status.error || 'Unknown error'}`,
                  timestamp: new Date().toISOString(),
                  isError: true
                }
              ]);
            }
            
            clearInterval(statusInterval);
          }
        } catch (err) {
          setError("Failed to fetch task status.");
          console.error("Status polling error:", err);
        }
      }, 2000);
    }
    
    return () => {
      clearInterval(statusInterval);
    };
  }, [taskId, token, result]);
  
  const handleSubmitQuery = async (queryData) => {
    if (!token) {
      setError("You must be authenticated to submit a query.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setTaskId(null);
    setTaskStatus(null);
    setThoughtProcess([]);
    setToolCalls([]);
    setResult(null);
    setShowThoughtProcess(true); // Always show thought process when new query starts
    
    // Add user message to chat
    setMessages(prevMessages => [
      ...prevMessages,
      {
        role: 'user',
        content: queryData.query,
        timestamp: new Date().toISOString(),
        systemPrompt: queryData.system_prompt,
        temperature: queryData.temperature,
        maxTokens: queryData.max_tokens,
        reasoningLevel: queryData.reasoning_level,
        tool: queryData.tool
      }
    ]);
    
    try {
      const response = await submitQuery(token, queryData);
      setTaskId(response.task_id);
      
      // Add a placeholder message for the pending response
      setMessages(prevMessages => [
        ...prevMessages,
        {
          role: 'assistant',
          content: 'Researching your question...',
          timestamp: new Date().toISOString(),
          isPending: true,
          taskId: response.task_id
        }
      ]);
    } catch (err) {
      setError("Failed to submit query. Please try again.");
      console.error("Query submission error:", err);
      
      // Add error message to chat
      setMessages(prevMessages => [
        ...prevMessages,
        {
          role: 'assistant',
          content: `Failed to start research: ${err.message || 'Unknown error'}`,
          timestamp: new Date().toISOString(),
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = async () => {
    if (taskId && token) {
      try {
        await deleteTask(token, taskId);
      } catch (err) {
        console.error("Error deleting task:", err);
      }
    }
    
    // We don't clear messages to keep chat history
    setTaskId(null);
    setTaskStatus(null);
    setThoughtProcess([]);
    setToolCalls([]);
    setResult(null);
    setError(null);
    
    // Update the pending message if there is one
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.isPending ? { ...msg, content: 'Research cancelled', isPending: false, isCancelled: true } : msg
      )
    );
  };
  
  const handleSelectTask = async (task) => {
    // Reset the current state
    setTaskId(null);
    setTaskStatus(null);
    setThoughtProcess([]);
    setToolCalls([]);
    setResult(null);
    setMessages([]);
    setError(null);
    
    try {
      // Load the selected task by fetching the details
      const taskDetails = await getTaskStatus(token, task.task_id);
      
      // Set task ID and status
      setTaskId(task.task_id);
      setTaskStatus(taskDetails);
      
      // Load messages if available
      if (taskDetails.messages && taskDetails.messages.length) {
        setMessages(taskDetails.messages);
      }
      
      // If the task is completed, set the result and switch to result view
      if (taskDetails.status === "completed" && taskDetails.result) {
        setResult(taskDetails.result);
        setShowThoughtProcess(false);
      } else {
        setShowThoughtProcess(true);
      }
      
      // Load thought process if available
      if (taskDetails.thought_process && taskDetails.thought_process.length) {
        setThoughtProcess(taskDetails.thought_process);
      }
      
      // Load tool calls if available
      if (taskDetails.tool_calls && taskDetails.tool_calls.length) {
        setToolCalls(taskDetails.tool_calls);
      }
      
      // Check if the task was created with a specific tool
      if (taskDetails.tool) {
        setSelectedTool(taskDetails.tool);
      }
    } catch (err) {
      console.error("Error loading task details:", err);
      setError("Failed to load task details. Please try again.");
    }
    
    // Close the task history panel
    setShowTaskHistory(false);
  };
  
  const handleNewChat = () => {
    // Reset the current state
    setTaskId(null);
    setTaskStatus(null);
    setThoughtProcess([]);
    setToolCalls([]);
    setResult(null);
    setMessages([]);
    setError(null);
    
    // Close the task history panel
    setShowTaskHistory(false);
  };
  
  const handleSignOut = async () => {
    try {
      await signOut();
      setToken(null);
      setUser(null);
      handleReset();
      // Clear messages on sign out
      setMessages([]);
    } catch (err) {
      console.error("Sign out error:", err);
      setError("Failed to sign out. Please try again.");
    }
  };
  
  const handleSignIn = async () => {
    try {
      setIsAuthenticating(true);
      const authToken = await getAuthToken();
      const userInfo = await getCurrentUser();
      setToken(authToken);
      setUser(userInfo);
      setError(null);
    } catch (err) {
      console.error("Sign in error:", err);
      setError("Failed to sign in: " + (err.message || "Unknown error"));
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  const toggleSidebarView = () => {
    setShowThoughtProcess(!showThoughtProcess);
  };
  
  const toggleTaskHistory = () => {
    setShowTaskHistory(!showTaskHistory);
  };
  
  const handleClearChat = () => {
    setMessages([]);
    handleReset();
  };
  
  const handleToolChange = (tool) => {
    setSelectedTool(tool);
  };
  
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>Microsoft Pipes</h1>
        </div>
        <div className="header-actions">
          <div className="user-section">
            {isAuthenticating ? (
              <span className="authenticating">Authenticating...</span>
            ) : user ? (
              <div className="user-info">
                <span className="user-name">{user.name || user.username || 'Authenticated User'}</span>
                <button className="sign-out-button" onClick={handleSignOut} disabled={isAuthenticating}>Sign Out</button>
              </div>
            ) : (
              <button className="sign-in-button" onClick={handleSignIn} disabled={isAuthenticating}>Sign In</button>
            )}
          </div>
        </div>
      </header>
      
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      {isAuthenticating ? (
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Initializing authentication...</p>
        </div>
      ) : user ? (
        <div className="app-content">
          <div className="chat-panel">
            {showTaskHistory ? (
              <TaskHistory 
                token={token}
                getTasks={getTasks}
                onSelectTask={handleSelectTask}
                onNewChat={handleNewChat}
                onClose={() => setShowTaskHistory(false)}
                activeTool={selectedTool}
              />
            ) : (
              <>
                <ResearchChat 
                  messages={messages}
                  isLoading={!!taskId && !result}
                />
                <ChatInput 
                  onSubmit={handleSubmitQuery}
                  isLoading={isLoading || (!!taskId && !result)}
                  onCancel={handleReset}
                  selectedTool={selectedTool}
                  onToolChange={handleToolChange}
                  onNewChat={handleNewChat}
                  onShowHistory={toggleTaskHistory}
                  onClearChat={handleClearChat}
                  hasMessages={messages.length > 0}
                />
              </>
            )}
          </div>
          
          <div className="sidebar-panel">
            {taskId || result ? (
              <>
                <div className="sidebar-header">
                  <h2>{showThoughtProcess ? 'Research Process' : 'Research Results'}</h2>
                  <button 
                    className="toggle-view-button"
                    onClick={toggleSidebarView}
                  >
                    {showThoughtProcess ? 'Show Results' : 'Show Process'}
                  </button>
                </div>
                
                <ResearchSidebar 
                  showThoughtProcess={showThoughtProcess}
                  thoughtProcess={thoughtProcess}
                  toolCalls={toolCalls}
                  result={result}
                  status={taskStatus}
                />
              </>
            ) : (
              <div className="empty-sidebar">
                <p>Enter a research question to get started.</p>
                <p>You'll see the research process and results here.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="auth-screen">
          <div className="auth-message">
            <h2>Authentication Required</h2>
            <p>Please sign in to use Microsoft Pipes.</p>
            <button className="sign-in-button-large" onClick={handleSignIn}>Sign In with Azure AD</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;