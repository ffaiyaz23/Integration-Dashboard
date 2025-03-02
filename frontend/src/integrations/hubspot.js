// hubspot.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const HubSpotIntegration = ({
  user,
  org,
  integrationParams,
  setIntegrationParams,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Function to open OAuth in a new window
  const handleConnectClick = async () => {
    try {
      setIsConnecting(true);
      const formData = new FormData();
      formData.append('user_id', user);
      formData.append('org_id', org);

      const response = await axios.post(
        'http://localhost:8000/integrations/hubspot/authorize',
        formData
      );
      const authURL = response?.data;
      const newWindow = window.open(
        authURL,
        'HubSpot Authorization',
        'width=600,height=600'
      );

      // Polling for the window to close
      const pollTimer = window.setInterval(() => {
        if (newWindow?.closed !== false) {
          window.clearInterval(pollTimer);
          handleWindowClosed();
        }
      }, 200);
    } catch (err) {
      setIsConnecting(false);
      alert(err?.response?.data?.detail || err.message);
    }
  };

  // Function to handle logic when the OAuth window closes
  const handleWindowClosed = async () => {
    try {
      const formData = new FormData();
      formData.append('user_id', user);
      formData.append('org_id', org);

      const response = await axios.post(
        'http://localhost:8000/integrations/hubspot/credentials',
        formData
      );
      const credentials = response.data;

      if (credentials) {
        setIsConnecting(false);
        setIsConnected(true);
        setIntegrationParams((prev) => ({
          ...prev,
          credentials: credentials,
          type: 'HubSpot',
        }));
      }
      setIsConnecting(false);
    } catch (err) {
      setIsConnecting(false);
      alert(err?.response?.data?.detail || err.message);
    }
  };

  // Function to disconnect from HubSpot
  const handleDisconnectClick = async () => {
    try {
      const formData = new FormData();
      formData.append('user_id', user);
      formData.append('org_id', org);

      await axios.post(
        'http://localhost:8000/integrations/hubspot/disconnect',
        formData
      );
      setIsConnected(false);
      setIntegrationParams({});
    } catch (err) {
      alert(err?.response?.data?.detail || err.message);
    }
  };

  useEffect(() => {
    // If integrationParams already has credentials, mark as connected
    setIsConnected(!!integrationParams?.credentials);
  }, [integrationParams]);

  return (
    <div style={{ maxWidth: '400px', margin: '20px auto', textAlign: 'center' }}>
      <h2 style={{ fontFamily: 'Arial, sans-serif', color: '#333' }}>
        HubSpot Integration
      </h2>

      <p style={{ fontWeight: 'bold', marginBottom: '20px' }}>
        Status: {isConnected ? 'Connected' : 'Not Connected'}
      </p>

      {isConnected ? (
        <button
          onClick={handleDisconnectClick}
          disabled={isConnecting}
          style={{
            backgroundColor: 'red',
            color: 'white',
            padding: '10px 20px',
            fontWeight: 'bold',
            cursor: 'pointer',
            borderRadius: '8px',
            border: 'none',
            transition: 'all 0.3s ease',
          }}
          onMouseOver={(e) => (e.target.style.opacity = '0.9')}
          onMouseOut={(e) => (e.target.style.opacity = '1')}
        >
          Disconnect from HubSpot
        </button>
      ) : (
        <button
          onClick={handleConnectClick}
          disabled={isConnecting}
          style={{
            backgroundColor: '#1976d2',
            color: 'white',
            padding: '10px 20px',
            fontWeight: 'bold',
            cursor: 'pointer',
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#1565c0';
            e.target.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.2)';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = '#1976d2';
            e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
          }}
        >
          {isConnecting ? 'Connecting...' : 'Connect to HubSpot'}
        </button>
      )}
    </div>
  );
};
