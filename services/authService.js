// services/authService.js
import axios from 'axios';

/**
 * Get an authentication token for the API using client credentials flow
 * @returns {Promise<string>} - The authentication token
 */
export const getAuthToken = async () => {
  try {
    // Configuration from environment variables
    const tenantId = process.env.REACT_APP_AZURE_TENANT_ID;
    const clientId = process.env.REACT_APP_AZURE_CLIENT_ID;
    const clientSecret = process.env.REACT_APP_AZURE_CLIENT_SECRET;
    const scope = `api://${process.env.REACT_APP_AZURE_APP_ID}/.default`;
    
    // Token endpoint
    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    
    // Request body parameters
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('scope', scope);
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'client_credentials');
    
    // Make the token request
    const response = await axios.post(tokenEndpoint, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    // Return the access token
    return response.data.access_token;
  } catch (error) {
    console.error('Authentication error:', error);
    throw new Error('Failed to obtain authentication token: ' + (error.response?.data?.error_description || error.message));
  }
};

/**
 * Check if the client has valid credentials configured
 * @returns {boolean} - Whether the client has valid credentials
 */
export const hasValidCredentials = () => {
  return !!(
    process.env.REACT_APP_AZURE_TENANT_ID &&
    process.env.REACT_APP_AZURE_CLIENT_ID &&
    process.env.REACT_APP_AZURE_CLIENT_SECRET &&
    process.env.REACT_APP_AZURE_APP_ID
  );
};