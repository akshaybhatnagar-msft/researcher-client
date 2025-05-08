// components/ResearchChat.js
import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './ResearchChat.css';

const ResearchChat = ({ messages, isLoading }) => {
  const chatEndRef = useRef(null);
  
  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };
  
  return (
    <div className="research-chat">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <div className="welcome-message">
              <h2>Welcome to Deep Research Assistant</h2>
              <p>Ask complex questions that require in-depth research, such as:</p>
              <ul>
                <li>What are the latest developments in fusion energy technology?</li>
                <li>Analyze the economic impact of remote work on major cities</li>
                <li>Compare different approaches to quantum computing and their potential applications</li>
                <li>What are the most effective strategies for reducing carbon emissions in the transportation sector?</li>
              </ul>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'} ${message.isPending ? 'pending' : ''} ${message.isError ? 'error' : ''} ${message.isCancelled ? 'cancelled' : ''}`}
            >
              <div className="message-header">
                <span className="message-author">
                  {message.role === 'user' ? 'You' : 'Research Assistant'}
                </span>
                <span className="message-time">{formatTimestamp(message.timestamp)}</span>
              </div>
              
              <div className="message-content">
                {message.isPending ? (
                  <div className="pending-message">
                    <p>{message.content}</p>
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                ) : (
                  message.role === 'user' ? (
                    <p>{message.content}</p>
                  ) : (
                    <div className="markdown-content">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  )
                )}
              </div>
              
              {message.role === 'user' && message.systemPrompt && (
                <div className="message-details">
                  <div className="message-detail">
                    <span className="detail-label">System Prompt:</span> 
                    <span className="detail-value">{message.systemPrompt?.substring(0, 100)}...</span>
                  </div>
                  <div className="message-detail">
                    <span className="detail-label">Settings:</span> 
                    <span className="detail-value">
                      Temp: {message.temperature} | 
                      Length: {message.maxTokens} tokens | 
                      Reasoning: {message.reasoningLevel}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>
    </div>
  );
};

export default ResearchChat;