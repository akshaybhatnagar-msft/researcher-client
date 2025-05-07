// components/QueryForm.js
import React, { useState } from 'react';
import './QueryForm.css';

const QueryForm = ({ onSubmit, isLoading, isDisabled }) => {
  const [query, setQuery] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(
    'You are a helpful researcher with access to web search capabilities. Provide detailed, well-structured answers with citations and explanation of your research process.'
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [temperature, setTemperature] = useState(1.0);
  const [maxTokens, setMaxTokens] = useState(10000);
  const [reasoningLevel, setReasoningLevel] = useState('high');
  const [mcpServer, setMCPServer] = useState('http://localhost:8000');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    onSubmit({
      query,
      system_prompt: systemPrompt,
      temperature,
      max_tokens: maxTokens,
      reasoning_level: reasoningLevel,
      mcpServer: mcpServer,
    });
  };
  
  return (
    <div className="query-form-container">
      <form onSubmit={handleSubmit} className="query-form">
        <div className="form-group">
          <label htmlFor="query">Research Question</label>
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your research question or topic to explore..."
            rows={3}
            required
            disabled={isDisabled}
          />
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="toggle-advanced"
            onClick={() => setShowAdvanced(!showAdvanced)}
            disabled={isDisabled}
          >
            {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
          </button>
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading || isDisabled || !query.trim()}
          >
            {isLoading ? 'Submitting...' : 'Start Research'}
          </button>
        </div>
        
        {showAdvanced && (
          <div className="advanced-options">
            <div className="form-group">
              <label htmlFor="system-prompt">System Prompt</label>
              <textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Enter system instructions for the AI researcher..."
                rows={2}
                disabled={isDisabled}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="temperature">Creativity (Temperature)</label>
                <div className="slider-container">
                  <input
                    type="range"
                    id="temperature"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    disabled={true}
                  />
                  <span>{temperature}</span>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="max-tokens">Response Length (Max Tokens)</label>
                <select
                  id="max-tokens"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  disabled={isDisabled}
                >
                  <option value="1000">Short (~1 page)</option>
                  <option value="4000">Medium (~2-3 pages)</option>
                  <option value="10000">Long (~5-7 pages)</option>
                  <option value="20000">Extra Long (10+ pages)</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="reasoning-level">Reasoning Depth</label>
              <select
                id="reasoning-level"
                value={reasoningLevel}
                onChange={(e) => setReasoningLevel(e.target.value)}
                disabled={isDisabled}
              >
                <option value="low">Basic (Faster)</option>
                <option value="medium">Standard</option>
                <option value="high">Thorough (Recommended)</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="reasoning-level">MCP Agent</label>
              <select
                id="mcp-server"
                value={mcpServer}
                onChange={(e) => setMCPServer(e.target.value)}
                disabled={isDisabled}
              >
                <option value="http://localhost:8001">Open Manus</option>
                <option value="http://localhost:8000">BFF</option>
              </select>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default QueryForm;