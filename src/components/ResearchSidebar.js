// components/ResearchSidebar.js with result actions
import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './ResearchSidebar.css';

const ResearchSidebar = ({ showThoughtProcess, thoughtProcess, toolCalls, result, status }) => {
  const sidebarEndRef = useRef(null);
  const [activeTab, setActiveTab] = useState('thoughts'); // 'thoughts' or 'tools'
  const [showRawJSON, setShowRawJSON] = useState(false);
  
  // Auto-scroll to the bottom when new content arrives
  useEffect(() => {
    if (sidebarEndRef.current) {
      sidebarEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [thoughtProcess, toolCalls, result, activeTab]);
  
  // Calculate simulated progress for display
  const calculateProgress = () => {
    if (!status) return 0;
    
    // If task is completed or failed, show 100%
    if (status.status === 'completed' || status.status === 'failed') {
      return 100;
    }
    
    // If we have actual progress, use it
    if (status.progress !== undefined && status.progress !== null) {
      return Math.floor(status.progress * 100);
    }
    
    // Otherwise, simulate progress over a 10-minute window
    if (status.created_at) {
      const createdTime = new Date(status.created_at).getTime();
      const currentTime = new Date().getTime();
      const elapsedTime = currentTime - createdTime;
      
      // 10 minutes = 600,000 milliseconds
      const totalDuration = 10 * 60 * 1000;
      const calculatedProgress = Math.min(Math.floor((elapsedTime / totalDuration) * 100), 99);
      
      return calculatedProgress;
    }
    
    return 0;
  };
  
  // Format the progress percentage for display
  const progressPercent = calculateProgress();
  
  // Format timestamps to a readable format
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return '';
    }
  };
  
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
  
  // Format tool call data for display
  const formatToolCall = (toolCall) => {
    if (!toolCall || !toolCall.data || !toolCall.data.length) return null;
    
    const callData = toolCall.data[0];
    if (!callData.function || !callData.function.name) return null;
    
    const functionName = callData.function.name;
    
    try {
      let args = {};
      try {
        args = JSON.parse(callData.function.arguments);
      } catch (e) {
        // If parsing fails, use the raw string
        args = { raw: callData.function.arguments };
      }
      
      // Handle each function type differently
      switch (functionName) {
        case 'search':
        case 'web_search':
          return (
            <div className="tool-call">
              <div className="tool-call-header">
                <span className="tool-icon">🔍</span>
                <span className="tool-title">Web Search</span>
                <span className="tool-timestamp">{formatTimestamp(toolCall.timestamp)}</span>
              </div>
              <div className="tool-call-content">
                <p>Query: <strong>{args.query || ''}</strong></p>
              </div>
            </div>
          );
          
        case 'browser_use':
          return (
            <div className="tool-call browser-use">
              <div className="tool-call-header">
                <span className="tool-icon">🌐</span>
                <span className="tool-title">Browser Use</span>
                <span className="tool-timestamp">{formatTimestamp(toolCall.timestamp)}</span>
              </div>
              <div className="tool-call-content">
                <p>URL: <strong>{args.url || args.raw || ''}</strong></p>
                {args.action && <p>Action: <strong>{args.action}</strong></p>}
              </div>
            </div>
          );
          
        case 'python_execute':
          return (
            <div className="tool-call python-execute">
              <div className="tool-call-header">
                <span className="tool-icon">🐍</span>
                <span className="tool-title">Python Execution</span>
                <span className="tool-timestamp">{formatTimestamp(toolCall.timestamp)}</span>
              </div>
              <div className="tool-call-content">
                <p>Code execution:</p>
                {args.code && (
                  <pre className="code-block">
                    <code>{args.code}</code>
                  </pre>
                )}
                {!args.code && args.raw && (
                  <pre className="code-block">
                    <code>{args.raw}</code>
                  </pre>
                )}
              </div>
            </div>
          );
          
        case 'terminate':
          return (
            <div className="tool-call terminate">
              <div className="tool-call-header">
                <span className="tool-icon">🛑</span>
                <span className="tool-title">Task Termination</span>
                <span className="tool-timestamp">{formatTimestamp(toolCall.timestamp)}</span>
              </div>
              <div className="tool-call-content">
                <p>Reason: <strong>{args.reason || 'Task completed'}</strong></p>
              </div>
            </div>
          );
          
        default:
          // Generic handler for other function types
          return (
            <div className="tool-call generic">
              <div className="tool-call-header">
                <span className="tool-icon">🔧</span>
                <span className="tool-title">{functionName}</span>
                <span className="tool-timestamp">{formatTimestamp(toolCall.timestamp)}</span>
              </div>
              <div className="tool-call-content">
                <p>Arguments: <strong>{JSON.stringify(args)}</strong></p>
              </div>
            </div>
          );
      }
    } catch (e) {
      console.error("Error formatting tool call:", e);
      return null;
    }
  };
  
  // Extract the content from the result
  const getResultContent = () => {
    if (!result || !result.choices || !result.choices[0] || !result.choices[0].message) {
      return "No content available in the response.";
    }
    
    return result.choices[0].message.content || "No content available in the response.";
  };
  
  // Function to handle exporting the research as a markdown file
  const handleExport = () => {
    const content = getResultContent();
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'research-result.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Get the time the research was completed
  const getCompletionTime = () => {
    if (!result || !result.created) return '';
    
    try {
      // Check if created is a timestamp in seconds or milliseconds
      const timestamp = result.created > 1000000000000 ? result.created : result.created * 1000;
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return '';
    }
  };
  
  return (
    <div className="research-sidebar">
      {showThoughtProcess ? (
        <div className="thought-process-view">
          <div className="process-status">
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
          
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'thoughts' ? 'active' : ''}`}
              onClick={() => setActiveTab('thoughts')}
            >
              Thought Process
              {thoughtProcess.length > 0 && (
                <span className="tab-badge">{thoughtProcess.length}</span>
              )}
            </button>
            <button 
              className={`tab ${activeTab === 'tools' ? 'active' : ''}`}
              onClick={() => setActiveTab('tools')}
            >
              Research Actions
              {toolCalls.length > 0 && (
                <span className="tab-badge">{toolCalls.length}</span>
              )}
            </button>
          </div>
          
          <div className="tab-content">
            {activeTab === 'thoughts' ? (
              <div className="thoughts-section">
                {thoughtProcess.length === 0 ? (
                  <p className="empty-state">The thought process will be displayed here as the AI thinks through your question...</p>
                ) : (
                  thoughtProcess.map((thought, index) => (
                    <div key={index} className="thought-item">
                      <div className="thought-time">{formatTimestamp(thought.timestamp)}</div>
                      <div className="thought-content">{thought.content}</div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="tool-calls-section">
                {toolCalls.length === 0 ? (
                  <p className="empty-state">Research actions will appear here as the AI searches for information...</p>
                ) : (
                  <div className="tool-calls-content">
                    {toolCalls.map((toolCall, index) => (
                      <React.Fragment key={index}>
                        {formatToolCall(toolCall)}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div ref={sidebarEndRef} />
        </div>
      ) : (
        <div className="result-view">
          <div className="result-header">
            <div className="result-actions">
              <button 
                className="toggle-raw-button"
                onClick={() => setShowRawJSON(!showRawJSON)}
              >
                {showRawJSON ? 'View Formatted Response' : 'View Raw JSON'}
              </button>
              <button 
                className="export-button"
                onClick={handleExport}
              >
                Export as Markdown
              </button>
            </div>
            {getCompletionTime() && (
              <div className="completion-time">
                Completed at: {getCompletionTime()}
              </div>
            )}
          </div>
          
          {showRawJSON ? (
            <pre className="raw-json">
              {JSON.stringify(result, null, 2)}
            </pre>
          ) : (
            <div className="markdown-result">
              <ReactMarkdown>{getResultContent()}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResearchSidebar;