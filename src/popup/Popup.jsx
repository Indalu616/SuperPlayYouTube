/**
 * SuperPlay AI - Popup Component
 * Settings and configuration interface
 */

import React, { useState, useEffect } from 'react';
import { MessageTypes } from '../utils/constants.js';
import '../styles/popup.css';

export default function Popup() {
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
      chrome.runtime.sendMessage({ type: MessageTypes.GET_SETTINGS }, (response) => {
        if (response && response.success) {
          setSettings(response.settings);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      chrome.runtime.sendMessage({
        type: MessageTypes.UPDATE_SETTINGS,
        settings
      }, (response) => {
        if (response && response.success) {
          console.log('Settings saved successfully');
        } else {
          console.error('Failed to save settings:', response?.error);
        }
        setSaving(false);
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaving(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setTestResult(null);
  };

  const testApiConnection = async () => {
    if (!settings.geminiApiKey.trim()) {
      setTestResult({ success: false, message: 'Please enter an API key first' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    // Save settings first
    await saveSettings();

    chrome.runtime.sendMessage({ type: MessageTypes.TEST_GEMINI_CONNECTION }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('SuperPlay AI: Runtime error testing connection:', chrome.runtime.lastError);
        setTestResult({ 
          success: false, 
          message: `Failed to communicate with background script: ${chrome.runtime.lastError.message}` 
        });
        setTesting(false);
        return;
      }

      if (response && response.success) {
        setTestResult(response.result);
      } else {
        setTestResult({ 
          success: false, 
          message: response?.error || 'Failed to test connection' 
        });
      }
      setTesting(false);
    });
  };

  const openYouTube = () => {
    chrome.tabs.create({ url: 'https://www.youtube.com' });
  };

  const isValidGeminiKey = (key) => {
    return key && key.startsWith('AIza') && key.length >= 35;
  };

  if (loading) {
    return (
      <div className="popup-container">
        <div className="popup-header">
          <h1 className="popup-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            SuperPlay AI
          </h1>
        </div>
        <div className="popup-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <div className="popup-header">
        <h1 className="popup-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          SuperPlay AI
        </h1>
        <p className="popup-subtitle">AI-powered YouTube enhancer</p>
      </div>

      <div className="popup-content">
        {/* Extension Settings */}
        <div className="settings-section">
          <div className="section-header">
            <svg className="section-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
            </svg>
            <h2 className="section-title">Extension Settings</h2>
          </div>

          <div className="toggle-container">
            <div className="toggle-info">
              <h3 className="toggle-label">Enable Extension</h3>
              <p className="toggle-description">Turn SuperPlay AI on or off</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                className="toggle-input"
                checked={settings.enabled}
                onChange={(e) => handleSettingChange('enabled', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="toggle-container">
            <div className="toggle-info">
              <h3 className="toggle-label">Auto-Generate Summary</h3>
              <p className="toggle-description">Automatically show summary sidebar when watching videos</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                className="toggle-input"
                checked={settings.autoSummary}
                onChange={(e) => handleSettingChange('autoSummary', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* API Configuration */}
        <div className="settings-section">
          <div className="section-header">
            <svg className="section-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V17C16,18.4 15.6,19 14.2,19H9.8C8.4,19 8,18.4 8,17V13C8,12.4 8.4,11.5 9,11.5V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,8.7 10.2,10V11.5H13.8V10C13.8,8.7 12.8,8.2 12,8.2Z"/>
            </svg>
            <h2 className="section-title">API Configuration</h2>
          </div>

          <div className="api-key-container">
            <div className="input-group">
              <label className="input-label">Google Gemini API Key</label>
              <div className="input-wrapper">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  className={`api-key-input ${
                    settings.geminiApiKey ? 
                      (isValidGeminiKey(settings.geminiApiKey) ? 'valid' : 'invalid') : 
                      ''
                  }`}
                  placeholder="AIza..."
                  value={settings.geminiApiKey}
                  onChange={(e) => handleSettingChange('geminiApiKey', e.target.value)}
                />
                <button
                  type="button"
                  className="toggle-visibility-btn"
                  onClick={() => setShowApiKey(!showApiKey)}
                  title={showApiKey ? 'Hide API key' : 'Show API key'}
                >
                  {showApiKey ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <p className="input-help">
                Get your free API key from{' '}
                <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                  Google AI Studio
                </a>
              </p>
              {settings.geminiApiKey && !isValidGeminiKey(settings.geminiApiKey) && (
                <div className="validation-message error">
                  <svg className="validation-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                  </svg>
                  Invalid API key format
                </div>
              )}
              {settings.geminiApiKey && isValidGeminiKey(settings.geminiApiKey) && (
                <div className="validation-message success">
                  <svg className="validation-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z"/>
                  </svg>
                  Valid API key format
                </div>
              )}
            </div>

            <div className="action-buttons">
              <button
                className="btn btn-primary"
                onClick={testApiConnection}
                disabled={testing || !settings.geminiApiKey.trim()}
              >
                {testing ? <div className="loading-spinner"></div> : 
                  <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z"/>
                  </svg>
                }
                Test Connection
              </button>
              
              <button
                className="btn btn-secondary"
                onClick={openYouTube}
              >
                <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10,15L15.19,12L10,9V15M21.56,7.17C21.69,7.64 21.78,8.27 21.84,9.07C21.91,9.87 21.94,10.56 21.94,11.16L22,12C22,14.19 21.84,15.8 21.56,16.83C21.31,17.73 20.73,18.31 19.83,18.56C19.36,18.69 18.5,18.78 17.18,18.84C15.88,18.91 14.69,18.94 13.59,18.94L12,19C7.81,19 5.2,18.84 4.17,18.56C3.27,18.31 2.69,17.73 2.44,16.83C2.31,16.36 2.22,15.73 2.16,14.93C2.09,14.13 2.06,13.44 2.06,12.84L2,12C2,9.81 2.16,8.2 2.44,7.17C2.69,6.27 3.27,5.69 4.17,5.44C4.64,5.31 5.5,5.22 6.82,5.16C8.12,5.09 9.31,5.06 10.41,5.06L12,5C16.19,5 18.8,5.16 19.83,5.44C20.73,5.69 21.31,6.27 21.56,7.17Z"/>
                </svg>
                Open YouTube
              </button>
            </div>

            {testResult && (
              <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                <svg className="test-result-icon" viewBox="0 0 24 24" fill="currentColor">
                  {testResult.success ? (
                    <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z"/>
                  ) : (
                    <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                  )}
                </svg>
                {testResult.message}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="popup-footer">
        <p className="footer-text">
          Made with ❤️ for YouTube enthusiasts |{' '}
          <a href="https://github.com" className="footer-link" target="_blank" rel="noopener noreferrer">
            View on GitHub
          </a>
        </p>
      </div>
    </div>
  );
}