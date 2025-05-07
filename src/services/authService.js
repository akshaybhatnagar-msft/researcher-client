// services/authService.js
import { PublicClientApplication } from '@azure/msal-browser';

// Azure AD Configuration for multi-tenant support
const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_AZURE_CLIENT_ID,
    // Use 'common' authority endpoint to support multi-tenant login
    authority: "https://login.microsoftonline.com/72f988bf-86f1-41af-91ab-2d7cd011db47",
    redirectUri: window.location.origin,
    // Use multiple audiences if needed
    validateAuthority: false
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  }
};

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL as a Promise to ensure it's ready before use
let msalInitialized = false;
const initializeMsal = async () => {
  if (!msalInitialized) {
    try {
      // Initialize the MSAL application
      await msalInstance.initialize();
      
      // Handle redirect response if navigating back from authentication
      await msalInstance.handleRedirectPromise();
      
      msalInitialized = true;
      console.log("MSAL initialized successfully");
    } catch (error) {
      console.error("MSAL initialization failed:", error);
      throw error;
    }
  }
  return msalInstance;
};

// Initialize MSAL when the file is imported
initializeMsal().catch(error => {
  console.error("Failed to initialize MSAL:", error);
});

// API scopes for access token - using the specific API ID
const apiScopes = [`api://${process.env.REACT_APP_AZURE_APP_ID}/.default`];

/**
 * Get an authentication token for the API
 * @returns {Promise<string>} - The authentication token
 */
export const getAuthToken = async () => {
  try {
    console.log("Starting authentication process...");
    
    // Ensure MSAL is initialized first
    await initializeMsal();
    
    // Check if there are already accounts in the MSAL cache
    const accounts = msalInstance.getAllAccounts();
    console.log(`Found ${accounts.length} accounts in cache`);
    
    if (accounts.length > 0) {
      // If we have accounts, use the first one for the token request
      const silentRequest = {
        scopes: apiScopes,
        account: accounts[0],
        forceRefresh: false
      };
      
      try {
        // Try to get a token silently (from cache)
        console.log("Attempting silent token acquisition...");
        const response = await msalInstance.acquireTokenSilent(silentRequest);
        console.log("Token acquired silently");
        return response.accessToken;
      } catch (error) {
        // If silent request fails, fallback to interactive
        console.warn("Silent token acquisition failed, falling back to interactive method:", error);
        const interactiveRequest = {
          scopes: apiScopes,
        };
        console.log("Starting interactive login...");
        const response = await msalInstance.acquireTokenPopup(interactiveRequest);
        console.log("Token acquired via popup");
        return response.accessToken;
      }
    } else {
      // No accounts, need to login
      const loginRequest = {
        scopes: apiScopes,
        // For multi-tenant, add prompt to ensure user can select their tenant
        prompt: "select_account"
      };
      
      // Use popup for better UX, can be replaced with redirect if preferred
      console.log("No accounts found, starting login flow...");
      const response = await msalInstance.loginPopup(loginRequest);
      console.log("Login successful");
      
      // After login, get the token
      const tokenRequest = {
        scopes: apiScopes,
        account: response.account,
      };
      
      console.log("Acquiring token after login...");
      const tokenResponse = await msalInstance.acquireTokenSilent(tokenRequest);
      console.log("Token acquired");
      return tokenResponse.accessToken;
    }
  } catch (error) {
    console.error("Authentication error:", error);
    
    // Provide more specific error messaging
    if (error.errorCode === "popup_window_error") {
      console.error("Popup was blocked by the browser. Please allow popups for this site.");
    } else if (error.errorCode === "user_cancelled") {
      console.error("User cancelled the login process");
    }
    
    throw error;
  }
};

/**
 * Sign the user out
 * @returns {Promise<void>}
 */
export const signOut = async () => {
  try {
    // Ensure MSAL is initialized first
    await initializeMsal();
    
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      const logoutRequest = {
        account: accounts[0],
        postLogoutRedirectUri: window.location.origin,
      };
      
      console.log("Signing out user...");
      await msalInstance.logout(logoutRequest);
      console.log("User signed out successfully");
    } else {
      console.log("No user signed in to sign out");
    }
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

/**
 * Check if the user is authenticated
 * @returns {Promise<boolean>} - Whether the user is authenticated
 */
export const isAuthenticated = async () => {
  try {
    // Ensure MSAL is initialized first
    await initializeMsal();
    
    const accounts = msalInstance.getAllAccounts();
    return accounts.length > 0;
  } catch (error) {
    console.error("Error checking authentication status:", error);
    return false;
  }
};

/**
 * Get the current user information
 * @returns {Promise<Object|null>} - User information or null if not signed in
 */
export const getCurrentUser = async () => {
  try {
    // Ensure MSAL is initialized first
    await initializeMsal();
    
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) {
      return null;
    }
    
    const account = accounts[0];
    // Include tenant information for multi-tenant scenarios
    return {
      name: account.name || account.username,
      username: account.username,
      tenantId: account.homeAccountId.split('.')[1],
      email: account.username
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};