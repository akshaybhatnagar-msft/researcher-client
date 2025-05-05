// components/ResearchResult.js
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './ResearchResult.css';

const ResearchResult = ({ result, onReset }) => {
  const [showRawJSON, setShowRawJSON] = useState(false);
  
  // Extract the content from the result
  const getResultContent = () => {
    if (!result || !result.choices || !result.choices[0] || !result.choices[0].message) {
      return "No content available in the response.";
    }
    
    return result.choices[0].message.content || "No content available in the response.";
  };
  
  const resultContent = getResultContent();
  
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
      const timestamp = result.created * 1000; // Convert seconds to milliseconds
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return '';
    }
  };
  
  return (
    <div className="research-result">
      <div className="result-header">
        <h2>Research Results</h2>
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
          <button 
            className="reset-button"
            onClick={onReset}
          >
            Start New Research
          </button>
        </div>
        {getCompletionTime() && (
          <div className="completion-time">
            Completed at: {getCompletionTime()}
          </div>
        )}
      </div>
      
      <div className="result-content">
        {showRawJSON ? (
          <pre className="raw-json">
            {JSON.stringify(result, null, 2)}
          </pre>
        ) : (
          <div className="markdown-content">
            <ReactMarkdown>{resultContent}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchResult;