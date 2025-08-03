import React, { useState, useEffect } from 'react';

const Popup = () => {
  const [settings, setSettings] = useState({
    enabled: true,
    autoSummary: true,
    geminiApiKey: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      if (response.success) {
        setSettings(response.settings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings
      });
      
      if (response.success) {
        // Show success feedback
        setTimeout(() => setSaving(false), 500);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaving(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const openYouTube = () => {
    chrome.tabs.create({ url: 'https://www.youtube.com' });
  };

  const testApiConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      // Save settings first
      await saveSettings();
      
      // Test connection
      const response = await chrome.runtime.sendMessage({ type: 'TEST_GEMINI_CONNECTION' });
      
      if (response.success) {
        setTestResult({ success: true, message: 'Connection successful! 🎉' });
      } else {
        setTestResult({ success: false, message: response.error || 'Connection failed' });
      }
    } catch (error) {
      setTestResult({ success: false, message: error.message || 'Connection test failed' });
    } finally {
      setTesting(false);
      
      // Clear test result after 3 seconds
      setTimeout(() => setTestResult(null), 3000);
    }
  };

  const isValidGeminiKey = (key) => {
    return key && key.length >= 35 && key.startsWith('AIza');
  };

  if (loading) {
    return (
      <div className="popup-container">
        <style jsx>{`
          .popup-container {
            width: 350px;
            height: 400px;
            background: #0f0f23;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .loading-spinner {
            border: 3px solid #667eea;
            border-top: 3px solid transparent;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <style jsx>{`
        .popup-container {
          width: 350px;
          min-height: 450px;
          background: #0f0f23;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 0;
          margin: 0;
        }

        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          text-align: center;
        }

        .logo {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .tagline {
          font-size: 12px;
          opacity: 0.9;
        }

        .content {
          padding: 20px;
        }

        .setting-group {
          margin-bottom: 20px;
        }

        .setting-label {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
          display: block;
          color: #e0e0e0;
        }

        .setting-description {
          font-size: 12px;
          color: #a0a0a0;
          margin-bottom: 8px;
        }

        .toggle-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .toggle-switch {
          position: relative;
          width: 44px;
          height: 24px;
          background: #2a2a3e;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .toggle-switch.active {
          background: #667eea;
        }

        .toggle-slider {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: transform 0.3s ease;
        }

        .toggle-switch.active .toggle-slider {
          transform: translateX(20px);
        }

        .api-key-container {
          position: relative;
        }

        .api-key-input {
          width: 100%;
          padding: 10px 40px 10px 12px;
          background: #1a1a2e;
          border: 1px solid #2a2a3e;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          box-sizing: border-box;
        }

        .api-key-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .api-key-input.valid {
          border-color: #4ade80;
        }

        .api-key-input.invalid {
          border-color: #f87171;
        }

        .api-key-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #a0a0a0;
          cursor: pointer;
          font-size: 14px;
        }

        .api-key-toggle:hover {
          color: #667eea;
        }

        .save-button {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 12px;
        }

        .save-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .save-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .youtube-button {
          width: 100%;
          padding: 10px;
          background: #ff0000;
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .youtube-button:hover {
          background: #cc0000;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
          padding: 8px 12px;
          background: #16213e;
          border-radius: 6px;
          font-size: 12px;
        }

        .status-indicator.active {
          color: #4ade80;
        }

        .status-indicator.inactive {
          color: #f87171;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 8px;
        }

        .status-indicator.active .status-dot {
          background: #4ade80;
        }

        .status-indicator.inactive .status-dot {
          background: #f87171;
        }

        .footer {
          text-align: center;
          padding: 16px 20px;
          border-top: 1px solid #2a2a3e;
          font-size: 11px;
          color: #a0a0a0;
        }

        .api-key-actions {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .test-button {
          background: #4ade80;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .test-button:hover:not(:disabled) {
          background: #22c55e;
        }

        .test-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .test-result {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
        }

        .test-result.success {
          background: rgba(74, 222, 128, 0.2);
          color: #4ade80;
          border: 1px solid rgba(74, 222, 128, 0.3);
        }

        .test-result.error {
          background: rgba(248, 113, 113, 0.2);
          color: #f87171;
          border: 1px solid rgba(248, 113, 113, 0.3);
        }

        .api-key-help {
          margin-top: 8px;
        }

        .api-key-help small {
          color: #a0a0a0;
          font-size: 11px;
        }

        .help-link {
          color: #667eea;
          text-decoration: none;
        }

        .help-link:hover {
          text-decoration: underline;
        }
      `}</style>

      <div className="header">
        <div className="logo">🚀 SuperPlay AI</div>
        <div className="tagline">Enhance YouTube with AI</div>
      </div>

      <div className="content">
        <div className={`status-indicator ${settings.enabled ? 'active' : 'inactive'}`}>
          <div className="status-dot"></div>
          {settings.enabled ? 'Extension Active' : 'Extension Disabled'}
        </div>

        <div className="setting-group">
          <div className="toggle-container">
            <div>
              <label className="setting-label">Enable SuperPlay AI</label>
              <div className="setting-description">
                Turn on/off the extension functionality
              </div>
            </div>
            <div
              className={`toggle-switch ${settings.enabled ? 'active' : ''}`}
              onClick={() => handleSettingChange('enabled', !settings.enabled)}
            >
              <div className="toggle-slider"></div>
            </div>
          </div>
        </div>

        <div className="setting-group">
          <div className="toggle-container">
            <div>
              <label className="setting-label">Auto Summary</label>
              <div className="setting-description">
                Automatically generate summaries when loading videos
              </div>
            </div>
            <div
              className={`toggle-switch ${settings.autoSummary ? 'active' : ''}`}
              onClick={() => handleSettingChange('autoSummary', !settings.autoSummary)}
            >
              <div className="toggle-slider"></div>
            </div>
          </div>
        </div>

        <div className="setting-group">
          <label className="setting-label">Gemini API Key</label>
          <div className="setting-description">
            Add your Google Gemini API key for AI-powered features
          </div>
          <div className="api-key-container">
            <input
              type={showApiKey ? 'text' : 'password'}
              className={`api-key-input ${isValidGeminiKey(settings.geminiApiKey) ? 'valid' : settings.geminiApiKey ? 'invalid' : ''}`}
              placeholder="AIza..."
              value={settings.geminiApiKey}
              onChange={(e) => handleSettingChange('geminiApiKey', e.target.value)}
            />
            <button
              className="api-key-toggle"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          
          {settings.geminiApiKey && (
            <div className="api-key-actions">
              <button
                className="test-button"
                onClick={testApiConnection}
                disabled={testing || !isValidGeminiKey(settings.geminiApiKey)}
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
              
              {testResult && (
                <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                  {testResult.message}
                </div>
              )}
            </div>
          )}
          
          <div className="api-key-help">
            <small>
              Get your free API key from{' '}
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="help-link"
              >
                Google AI Studio
              </a>
            </small>
          </div>
        </div>

        <button
          className="save-button"
          onClick={saveSettings}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>

        <button className="youtube-button" onClick={openYouTube}>
          📺 Open YouTube
        </button>
      </div>

      <div className="footer">
        SuperPlay AI v1.0.0 - Enhance your YouTube experience
      </div>
    </div>
  );
};

export default Popup;