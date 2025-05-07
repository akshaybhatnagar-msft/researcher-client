// components/ResearchProgress.js
import React, { useEffect, useRef, useState } from 'react';
import './ResearchProgress.css';

const ResearchProgress = ({ status, thoughtProcess, toolCalls }) => {
  const progressRef = useRef(null);
  const [progressPercent, setProgressPercent] = useState(0);
  
  // Auto-scroll to the bottom when new thoughts come in
  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.scrollTop = progressRef.current.scrollHeight;
    }
  }, [thoughtProcess, toolCalls]);
  
  // Format the progress percentage for display
  // Increment progress over 10 minutes
  useEffect(() => {
    const totalDuration = 10 * 60 * 1000; // 10 minutes in milliseconds
    const interval = 1000; // Update every second
    const increment = 100 / (totalDuration / interval);

    const timer = setInterval(() => {
      setProgressPercent((prev) => {
        const nextValue = prev + increment;
        if (nextValue >= 100) {
          clearInterval(timer);
          return 100;
        }
        return nextValue;
      });
    }, interval);

    return () => clearInterval(timer);
  }, []);
  
  // Get the status message
  const getStatusMessage = () => {
    if (!status) return 'Initializing research...';
    
    switch (status.status) {
      case 'pending':
        return 'Preparing to start research...';
      case 'in_progress':
        return 'Researching your question...';
      case 'completed':
        return 'Research completed!';
      case 'failed':
        return `Research failed: ${status.error || 'Unknown error'}`;
      default:
        return 'Processing...';
    }
  };
  
  // Format timestamps to a readable format
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    } catch (e) {
      return '';
    }
  };
  
  // Format tool call data for display
  const formatToolCall = (toolCall) => {
    if (!toolCall || !toolCall.data || !toolCall.data.length) return null;
    
    const callData = toolCall.data[0];
    if (callData.function && (callData.function.name === 'search' || callData.function.name === 'web_search' || callData.function.name === 'browser_use')) {
      try {
        const args = JSON.parse(callData.function.arguments);
        return (
          <div className="tool-call">
            <div className="tool-call-header">
              <span className="tool-icon">🔍</span>
              <span className="tool-title">{callData.function.name}</span>
              <span className="tool-timestamp">{formatTimestamp(toolCall.timestamp)}</span>
            </div>
            <div className="tool-call-content">
              <p>Query: <strong>{args.query}</strong></p>
            </div>
          </div>
        );
      } catch (e) {
        return null;
      }
    }

    if (callData.function && callData.function.name === 'python_execute') {
      try {
        const args = JSON.parse(callData.function.arguments);
        return (
          <div className="tool-call">
            <div className="tool-call-header">
              <span className="tool-icon">🐍</span>
              <span className="tool-title">Python Execute</span>
              <span className="tool-timestamp">{formatTimestamp(toolCall.timestamp)}</span>
            </div>
            <div className="tool-call-content">
              <p>Query: <strong>{args.query}</strong></p>
            </div>
          </div>
        );
      } catch (e) {
        return null;
      }
    }

    if (callData.function && callData.function.name === 'terminate') {
      try {
        const args = JSON.parse(callData.function.arguments);
        return (
          <div className="tool-call">
            <div className="tool-call-header">
              <span className="tool-icon">🛑</span>
              <span className="tool-title">Terminate</span>
              <span className="tool-timestamp">{formatTimestamp(toolCall.timestamp)}</span>
            </div>
            <div className="tool-call-content">
              <p>Query: <strong>{args.query}</strong></p>
            </div>
          </div>
        );
      } catch (e) {
        return null;
      }
    }

    
    
    return null;
  };
  
  return (
    <div className="research-progress">
      <div className="progress-header">
        <h2>Research in Progress</h2>
        <div className="progress-status">
          <div className="progress-bar-container">
            <div 
              className="progress-bar" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="progress-label">
            {getStatusMessage()} ({Math.round(progressPercent)}%)
          </div>
        </div>
      </div>
      
      <div className="progress-content" ref={progressRef}>
        <div className="thoughts-header">
          <h3>Thought Process</h3>
          <span className="thoughts-count">{thoughtProcess.length} thoughts</span>
        </div>
        
        <div className="thoughts-content">
          {thoughtProcess.length === 0 ? (
            <p className="empty-state">The research process will be displayed here as the AI thinks through your question...</p>
          ) : (
            thoughtProcess.map((thought, index) => (
              <div key={index} className="thought-item">
                <div className="thought-time">{formatTimestamp(thought.timestamp)}</div>
                <div className="thought-content">{thought.content}</div>
              </div>
            ))
          )}
        </div>
        
        {toolCalls.length > 0 && (
          <div className="tool-calls-section">
            <h3>Research Actions</h3>
            <div className="tool-calls-content">
              {toolCalls.map((toolCall, index) => (
                <React.Fragment key={index}>
                  {formatToolCall(toolCall)}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchProgress;