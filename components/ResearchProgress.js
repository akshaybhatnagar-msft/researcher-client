// components/ResearchProgress.js
import React, { useRef, useEffect } from 'react';
import './ResearchProgress.css';

const ResearchProgress = ({ status, thoughtProcess, toolCalls }) => {
  const progressRef = useRef(null);
  
  // Auto-scroll to the bottom when new thoughts come in
  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.scrollTop = progressRef.current.scrollHeight;
    }
  }, [thoughtProcess, toolCalls]);
  
  // Format the progress percentage for display
  const progressPercent = status?.progress ? Math.round(status.progress * 100) : 0;
  
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
    if (callData.function && callData.function.name === 'search') {
      try {
        const args = JSON.parse(callData.function.arguments);
        return (
          <div className="tool-call">
            <div className="tool-call-header">
              <span className="tool-icon">🔍</span>
              <span className="tool-title">Web Search</span>
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
            {getStatusMessage()} ({progressPercent}%)
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