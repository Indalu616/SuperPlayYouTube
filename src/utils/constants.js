/**
 * SuperPlay AI - Constants
 * Shared constants used throughout the extension
 */

// Message types for communication between components
export const MessageTypes = {
  // Settings
  GET_SETTINGS: 'GET_SETTINGS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  
  // AI Operations
  TEST_GEMINI_CONNECTION: 'TEST_GEMINI_CONNECTION',
  GENERATE_EXPLANATION: 'GENERATE_EXPLANATION',
  GENERATE_SUMMARY: 'GENERATE_SUMMARY',
  ASK_FOLLOW_UP_QUESTION: 'ASK_FOLLOW_UP_QUESTION',
  
  // Transcript Operations
  GET_VIDEO_TRANSCRIPT: 'GET_VIDEO_TRANSCRIPT',
  FETCH_TRANSCRIPT_FROM_DOM: 'FETCH_TRANSCRIPT_FROM_DOM',
  
  // Video Info
  GET_VIDEO_INFO: 'GET_VIDEO_INFO',
  GET_VIDEO_INFO_FROM_DOM: 'GET_VIDEO_INFO_FROM_DOM',
  
  // System
  PING: 'PING',
  CONTENT_SCRIPT_READY: 'CONTENT_SCRIPT_READY'
};

// YouTube selectors
export const YouTubeSelectors = {
  VIDEO_TITLE: '#title h1.ytd-watch-metadata, #container h1.title',
  VIDEO_DESCRIPTION: '#description-text, #description',
  VIDEO_PLAYER: 'video',
  CAPTION_BUTTON: '.ytp-subtitles-button, .ytp-cc-button',
  CAPTION_SEGMENTS: '.ytp-caption-segment',
  PRIMARY_INFO: '#primary-inner, #info',
  WATCH_FLEXY: 'ytd-watch-flexy',
  VIDEO_OWNER: '#owner-text a, #channel-name a'
};

// Video ID patterns
export const VideoIdPatterns = {
  WATCH_URL: /[?&]v=([a-zA-Z0-9_-]{11})/,
  EMBED_URL: /\/embed\/([a-zA-Z0-9_-]{11})/,
  SHORT_URL: /youtu\.be\/([a-zA-Z0-9_-]{11})/
};

// Extension settings defaults
export const DefaultSettings = {
  enabled: true,
  autoSummary: true,
  geminiApiKey: '',
  lastUpdated: Date.now(),
  version: '1.1.0'
};

// UI Configuration
export const UIConfig = {
  BUTTON_DELAY: 1000, // Delay before injecting button
  SIDEBAR_WIDTH: 380,
  CARD_MAX_WIDTH: 800,
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  MAX_TRANSCRIPT_LENGTH: 50000, // Max characters for transcript
  MIN_TRANSCRIPT_LENGTH: 50 // Min characters for valid transcript
};

// API Configuration
export const APIConfig = {
  GEMINI_MODEL: 'gemini-1.5-flash-latest',
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  TIMEOUT: 30000, // 30 seconds
  MAX_TOKENS: 8192,
  TEMPERATURE: 0.7
};

// Storage Keys
export const StorageKeys = {
  SETTINGS: ['enabled', 'autoSummary', 'geminiApiKey', 'lastUpdated', 'version'],
  CONVERSATION_PREFIX: 'conversation_',
  TRANSCRIPT_PREFIX: 'transcript_',
  TIMESTAMP_SUFFIX: '_timestamp'
};

// Error Messages
export const ErrorMessages = {
  NO_API_KEY: 'Gemini API key not configured. Please add your API key in the extension settings.',
  INVALID_API_KEY: 'Invalid Gemini API key format. Please check your API key.',
  NO_TRANSCRIPT: 'Could not fetch video transcript. This video may not have captions available.',
  API_ERROR: 'API request failed. Please try again later.',
  RATE_LIMITED: 'Rate limit exceeded. Please try again in a few minutes.',
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
};

// Success Messages
export const SuccessMessages = {
  SETTINGS_SAVED: 'Settings saved successfully!',
  CONNECTION_SUCCESS: 'Gemini API connection successful!',
  EXPLANATION_GENERATED: 'Video explanation generated successfully!',
  SUMMARY_GENERATED: 'Video summary generated successfully!'
};

// CSS Classes
export const CSSClasses = {
  BUTTON: 'superplay-explain-button',
  SIDEBAR: 'superplay-sidebar-container',
  CARD: 'superplay-floating-card',
  OVERLAY: 'superplay-overlay',
  LOADING: 'loading-spinner',
  ERROR: 'error-message',
  SUCCESS: 'success-message'
};

// Timeouts and Intervals
export const Timings = {
  DOM_WAIT_TIMEOUT: 10000, // 10 seconds
  API_TIMEOUT: 30000, // 30 seconds
  DEBOUNCE_DELAY: 500, // 0.5 seconds
  RETRY_DELAY: 1000, // 1 second
  NAVIGATION_CHECK_INTERVAL: 2000, // 2 seconds
  CACHE_DURATION: 24 * 60 * 60 * 1000 // 24 hours
};

// Regular Expressions
export const RegexPatterns = {
  VIDEO_ID: /^[a-zA-Z0-9_-]{11}$/,
  TIMESTAMP: /(\d{1,2}):(\d{2})/g,
  API_KEY: /^AIza[a-zA-Z0-9_-]{35,}$/,
  YOUTUBE_URL: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/
};

// Feature Flags (for future use)
export const FeatureFlags = {
  ENABLE_CACHING: true,
  ENABLE_AUTO_SUMMARY: true,
  ENABLE_FOLLOW_UP: true,
  ENABLE_CHAPTERS: true,
  ENABLE_DARK_MODE: true,
  ENABLE_ANALYTICS: false // For future analytics
};