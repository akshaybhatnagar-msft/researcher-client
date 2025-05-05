// App.js
import React, { useEffect, useState } from 'react';
import './App.css';
import QueryForm from './components/QueryForm';
import ResearchProgress from './components/ResearchProgress';
import ResearchResult from './components/ResearchResult';
import { deleteTask, getTaskStatus, getThoughtProcess, submitQuery } from './services/apiService';
import { getAuthToken, getCurrentUser, isAuthenticated, signOut } from './services/authService';

function App() {
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true); // New state for auth loading
  const [taskId, setTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null);
  const [thoughtProcess, setThoughtProcess] = useState([]);
  const [toolCalls, setToolCalls] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  
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
      if (isAuthenticated()) {
        getAuthToken()
          .then(authToken => setToken(authToken))
          .catch(err => console.error("Token refresh error:", err));
      }
    }, 45 * 60 * 1000);
    
    return () => {
      clearInterval(tokenRefreshInterval);
    };
  }, []);
  
  // Poll for task status and thought process when taskId is available
  useEffect(() => {
    let statusInterval;
    let thoughtInterval;
    
    if (taskId && !result && token) {
      // Poll for task status every 2 seconds
      statusInterval = setInterval(async () => {
        try {
          const status = await getTaskStatus(token, taskId);
          setTaskStatus(status);
          
          // If task is completed or failed, stop polling and set the result
          if (status.status === "completed" || status.status === "failed") {
            setResult(status.result);
            clearInterval(statusInterval);
            clearInterval(thoughtInterval);
          }
        } catch (err) {
          setError("Failed to fetch task status.");
          console.error("Status polling error:", err);
        }
      }, 2000);
      
      // Poll for thought process every 1 second
      thoughtInterval = setInterval(async () => {
        try {
          const thoughtData = await getThoughtProcess(token, taskId);
          setThoughtProcess(thoughtData.thought_process);
          setToolCalls(thoughtData.tool_calls);
        } catch (err) {
          console.error("Thought process polling error:", err);
        }
      }, 1000);
    }
    
    return () => {
      clearInterval(statusInterval);
      clearInterval(thoughtInterval);
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
    
    try {
      const response = await submitQuery(token, queryData);
      setTaskId(response.task_id);
    } catch (err) {
      setError("Failed to submit query. Please try again.");
      console.error("Query submission error:", err);
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
    
    setTaskId(null);
    setTaskStatus(null);
    setThoughtProcess([]);
    setToolCalls([]);
    setResult(null);
    setError(null);
  };
  
  const handleSignOut = async () => {
    try {
      await signOut();
      setToken(null);
      setUser(null);
      handleReset();
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
  
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>Deep Researcher Copilot Apps</h1>
          <p>Ask complex questions and get thoroughly researched answers</p>
        </div>
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
      </header>
      
      <main className="app-main">
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
        
        {isAuthenticating ? (
          <div className="loading-message">
            <p>Initializing authentication...</p>
          </div>
        ) : user ? (
          <>
            <QueryForm 
              onSubmit={handleSubmitQuery} 
              isLoading={isLoading} 
              isDisabled={!!taskId && !result}
            />
            
            {taskId && !result && (
              <ResearchProgress 
                status={taskStatus} 
                thoughtProcess={thoughtProcess}
                toolCalls={toolCalls}
              />
            )}
            
            {result && (
              <ResearchResult 
                result={result} 
                onReset={handleReset}
              />
            )}
          </>
        ) : (
          <div className="auth-message">
            <h2>Authentication Required</h2>
            <p>Please sign in to use the Deep Research Assistant.</p>
            <button className="sign-in-button-large" onClick={handleSignIn}>Sign In with Azure AD</button>
          </div>
        )}
      </main>
      
      <footer className="app-footer">
        <p>Powered by Copilot Apps Deep Researcher</p>
      </footer>
    </div>
  );
}

export default App;