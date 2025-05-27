// AccessRequest.js - Component for requesting access to the app
import React, { useState } from 'react';
import './AccessRequest.css'; // We'll create this CSS file

const AccessRequest = ({ user }) => {
  const [requestSent, setRequestSent] = useState(false);
  const [message, setMessage] = useState('');
  const [reason, setReason] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Here you would typically send the access request to a backend API
    // For now, we'll just simulate a successful request
    
    // Log the request details (can be replaced with actual API call)
    console.log('Access request submitted:', {
      userName: user?.name || user?.username || 'Unknown User',
      userId: user?.id || user?.objectId || 'Unknown ID',
      reason,
      requestTime: new Date().toISOString()
    });
    
    // Set success message and mark as sent
    setMessage('Your access request has been sent to Akshay.');
    setRequestSent(true);
  };
  
  const userName = user?.name || user?.username || 'Unknown User';
  
  return (
    <div className="access-request-container">
      <div className="access-request-card">
        <h2>Access Required</h2>
        
        {!requestSent ? (
          <>
            <p>
              Hello <strong>{userName}</strong>, you don't currently have access to the Copilot Apps Deep Research tool.
            </p>
            <p>
              Please fill out the form below to request access from Akshay.
            </p>
            
            <form onSubmit={handleSubmit} className="access-request-form">
              <div className="form-group">
                <label htmlFor="userName">Your Name:</label>
                <input 
                  type="text" 
                  id="userName" 
                  value={userName} 
                  disabled 
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="reason">Reason for Access:</label>
                <textarea 
                  id="reason" 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                  required
                  placeholder="Please explain why you need access to this tool..."
                  className="form-control"
                  rows={4}
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="submit-button">
                  Request Access
                </button>
              </div>
              
              <div className="contact-info">
                <p>
                  Alternatively, you can contact Akshay directly via Teams to request access.
                </p>
              </div>
            </form>
          </>
        ) : (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h3>Request Submitted</h3>
            <p>{message}</p>
            <p>You'll be notified when access is granted.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessRequest;