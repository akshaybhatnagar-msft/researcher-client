// components/ChatInput.js with fixed temperature
import React, { useState } from 'react';
import './ChatInput.css';

const ChatInput = ({ 
  onSubmit, 
  isLoading, 
  onCancel, 
  selectedTool, 
  onToolChange, 
  onNewChat, 
  onShowHistory, 
  onClearChat,
  hasMessages
}) => {
  const [query, setQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(
    'You are a helpful researcher with access to web search capabilities. Provide detailed, well-structured answers with citations and explanation of your research process.'
  );
  // Temperature is now fixed at 1.0
  const temperature = 1.0;
  const [maxTokens, setMaxTokens] = useState(20000);
  const [reasoningLevel, setReasoningLevel] = useState('high');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!query.trim() || isLoading) return;
    
    onSubmit({
      query,
      system_prompt: systemPrompt,
      temperature: 1.0, // Always send temperature as 1.0
      max_tokens: maxTokens,
      reasoning_level: reasoningLevel,
      tool: selectedTool
    });
    
    // Close any open panels
    setShowMenu(false);
    setShowAdvanced(false);
    
    // Clear input after submission
    setQuery('');
  };
  
  const handleKeyDown = (e) => {
    // Submit on Enter without Shift key
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const handleToggleMenu = () => {
    setShowMenu(!showMenu);
    // Close advanced options if opening menu
    if (!showMenu) {
      setShowAdvanced(false);
    }
  };
  
  const handleToggleAdvanced = () => {
    setShowAdvanced(!showAdvanced);
    // Close menu if opening advanced options
    if (!showAdvanced) {
      setShowMenu(false);
    }
  };
  
  const handleNewChat = () => {
    onNewChat();
    setShowMenu(false);
  };
  
  const handleShowHistory = () => {
    onShowHistory();
    setShowMenu(false);
  };
  
  const handleClearChat = () => {
    onClearChat();
    setShowMenu(false);
  };
  
  return (
    <div className="chat-input-container">
      {showMenu && (
        <div className="menu-dropdown">
          <button className="menu-item" onClick={handleNewChat}>
            <span className="menu-icon">📄</span>
            New Chat
          </button>
          <button className="menu-item" onClick={handleShowHistory}>
            <span className="menu-icon">📚</span>
            History
          </button>
          {hasMessages && (
            <button className="menu-item" onClick={handleClearChat}>
              <span className="menu-icon">🗑️</span>
              Clear Chat
            </button>
          )}
        </div>
      )}
      
      {showAdvanced && (
        <div className="advanced-options">
          <div className="advanced-options-header">
            <h3>Advanced Options</h3>
            <button 
              type="button"
              className="close-advanced-button"
              onClick={() => setShowAdvanced(false)}
            >
              <span>×</span>
            </button>
          </div>
          
          <div className="advanced-options-content">
            <div className="option-group">
              <label htmlFor="system-prompt">System Prompt</label>
              <textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={2}
                disabled={isLoading}
              />
            </div>
            
            <div className="option-row">
              <div className="option-group">
                <label htmlFor="temperature">
                  Temperature: {temperature} (Fixed)
                </label>
                <input
                  type="range"
                  id="temperature"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  disabled={true}
                  className="disabled-range"
                />
              </div>
              
              <div className="option-group">
                <label htmlFor="max-tokens">Response Length</label>
                <select
                  id="max-tokens"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  disabled={isLoading}
                >
                  <option value="1000">Short (~1 page)</option>
                  <option value="4000">Medium (~2-3 pages)</option>
                  <option value="10000">Long (~5-7 pages)</option>
                  <option value="20000">Extra Long (10+ pages)</option>
                </select>
              </div>
            </div>
            
            <div className="option-group">
              <label htmlFor="reasoning-level">Reasoning Depth</label>
              <select
                id="reasoning-level"
                value={reasoningLevel}
                onChange={(e) => setReasoningLevel(e.target.value)}
                disabled={isLoading}
              >
                <option value="low">Basic (Faster)</option>
                <option value="medium">Standard</option>
                <option value="high">Thorough (Recommended)</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="chat-form">
        <div className="input-wrapper">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a research question... (Shift+Enter for new line)"
            rows={1}
            disabled={isLoading}
            className="chat-textarea"
          />
          
          <div className="input-actions">
            <div className="input-left-actions">
              <button
                type="button"
                className="menu-button"
                onClick={handleToggleMenu}
                disabled={isLoading}
                title="Menu"
              >
                <span className="hamburger-icon">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </button>
              
              <button
                type="button"
                className="advanced-button"
                onClick={handleToggleAdvanced}
                disabled={isLoading}
                title="Advanced Options"
              >
                <span className="icon">⚙️</span>
                <span className="text">{showAdvanced ? 'Hide Options' : 'Options'}</span>
              </button>
              
              <div className="tool-selector">
                <select
                  value={selectedTool}
                  onChange={(e) => onToolChange(e.target.value)}
                  disabled={isLoading}
                  className="tool-select"
                  title="Select Research Tool"
                >
                  <option value="openmanus">OpenManus</option>
                  <option value="bff">BFF</option>
                  <option value="researcher">Researcher+Sales</option>
                </select>
              </div>
            </div>
            
            <div className="input-right-actions">
              {isLoading ? (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={onCancel}
                >
                  Cancel
                </button>
              ) : (
                <button
                  type="submit"
                  className="submit-button"
                  disabled={!query.trim()}
                >
                  <span className="icon">▶</span>
                  <span className="text">Send</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;