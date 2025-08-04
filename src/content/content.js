/**
 * SuperPlay AI - Content Script
 * Handles DOM manipulation, UI injection, and communication with background script
 * This is the ONLY file that should access DOM elements
 */

import { MessageTypes, YouTubeSelectors, UIConfig, Timings } from '../utils/constants.js';
import { YouTubeService } from '../services/youtube.js';
import { UIManager } from '../services/ui-manager.js';

class ContentScript {
  constructor() {
    this.youtubeService = new YouTubeService();
    this.uiManager = new UIManager();
    this.currentVideoId = null;
    this.isInitialized = false;
    this.navigationTimer = null;
    this.init();
  }

  async init() {
    try {
      console.log('SuperPlay AI: Content script initializing...');
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }

    } catch (error) {
      console.error('SuperPlay AI: Content script initialization failed:', error);
    }
  }

  async setup() {
    try {
      // Check if extension is enabled
      const settings = await this.getSettings();
      if (!settings.enabled) {
        console.log('SuperPlay AI: Extension disabled, skipping initialization');
        return;
      }

      // Setup message listeners
      this.setupMessageListeners();

      // Initialize UI if on video page
      if (this.isVideoPage()) {
        await this.initializeVideoPage();
      }

      // Setup navigation detection
      this.setupNavigationDetection();

      this.isInitialized = true;
      console.log('SuperPlay AI: Content script ready');

    } catch (error) {
      console.error('SuperPlay AI: Content script setup failed:', error);
    }
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('SuperPlay AI: Content script received message:', request.type);

      switch (request.type) {
        case MessageTypes.PING:
          sendResponse({ success: true, ready: this.isInitialized });
          break;

        case MessageTypes.FETCH_TRANSCRIPT_FROM_DOM:
          this.handleFetchTranscriptFromDOM(request, sendResponse);
          break;

        case MessageTypes.GET_VIDEO_INFO_FROM_DOM:
          this.handleGetVideoInfoFromDOM(sendResponse);
          break;

        default:
          console.warn('SuperPlay AI: Unknown message type in content script:', request.type);
          sendResponse({ success: false, error: 'Unknown message type' });
      }

      return true; // Keep message channel open
    });
  }

  async handleFetchTranscriptFromDOM(request, sendResponse) {
    try {
      const { videoId, videoTitle } = request;
      console.log('SuperPlay AI: Fetching transcript from DOM for video:', videoId);

      const transcript = await this.youtubeService.fetchTranscript(videoId);
      
      if (!transcript || transcript.length < UIConfig.MIN_TRANSCRIPT_LENGTH) {
        sendResponse({ 
          success: false, 
          error: 'Could not fetch video transcript. This video may not have captions available.' 
        });
        return;
      }

      sendResponse({ success: true, transcript });

    } catch (error) {
      console.error('SuperPlay AI: Failed to fetch transcript from DOM:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleGetVideoInfoFromDOM(sendResponse) {
    try {
      const videoInfo = await this.youtubeService.getVideoInfo();
      sendResponse({ success: true, videoInfo });
    } catch (error) {
      console.error('SuperPlay AI: Failed to get video info from DOM:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  isVideoPage() {
    return window.location.pathname === '/watch' && 
           window.location.search.includes('v=');
  }

  async initializeVideoPage() {
    try {
      const videoId = this.youtubeService.getCurrentVideoId();
      if (!videoId) {
        console.log('SuperPlay AI: No video ID found, skipping initialization');
        return;
      }

      if (this.currentVideoId === videoId) {
        console.log('SuperPlay AI: Same video, skipping re-initialization');
        return;
      }

      console.log('SuperPlay AI: Initializing for video:', videoId);
      this.currentVideoId = videoId;

      // Clear existing UI
      this.uiManager.cleanup();

      // Wait for video elements to load
      await this.waitForVideoElements();

      // Inject UI elements
      await this.injectUI();

      // Auto-generate summary if enabled
      const settings = await this.getSettings();
      if (settings.autoSummary) {
        setTimeout(() => this.showSidebar(), UIConfig.BUTTON_DELAY);
      }

    } catch (error) {
      console.error('SuperPlay AI: Video page initialization failed:', error);
    }
  }

  async waitForVideoElements() {
    const selectors = [
      YouTubeSelectors.VIDEO_TITLE,
      YouTubeSelectors.PRIMARY_INFO,
      YouTubeSelectors.VIDEO_PLAYER
    ];

    for (const selector of selectors) {
      await this.waitForElement(selector, Timings.DOM_WAIT_TIMEOUT);
    }
  }

  async waitForElement(selector, timeout = Timings.DOM_WAIT_TIMEOUT) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }

  async injectUI() {
    try {
      // Inject explain button
      await this.injectExplainButton();
      
      // Inject sidebar container (initially hidden)
      await this.injectSidebarContainer();

    } catch (error) {
      console.error('SuperPlay AI: UI injection failed:', error);
    }
  }

  async injectExplainButton() {
    try {
      const titleElement = await this.waitForElement(YouTubeSelectors.VIDEO_TITLE, 5000);
      const container = titleElement.closest('#title') || titleElement.parentElement;
      
      if (!container) {
        throw new Error('Could not find title container');
      }

      // Check if button already exists
      if (container.querySelector('.superplay-explain-button')) {
        return;
      }

      const button = this.uiManager.createExplainButton();
      button.addEventListener('click', () => this.showExplainCard());

      // Insert after title
      container.appendChild(button);
      
      console.log('SuperPlay AI: Explain button injected');

    } catch (error) {
      console.error('SuperPlay AI: Failed to inject explain button:', error);
    }
  }

  async injectSidebarContainer() {
    try {
      // Check if sidebar already exists
      if (document.querySelector('.superplay-sidebar-container')) {
        return;
      }

      const sidebar = this.uiManager.createSidebarContainer();
      document.body.appendChild(sidebar);
      
      console.log('SuperPlay AI: Sidebar container injected');

    } catch (error) {
      console.error('SuperPlay AI: Failed to inject sidebar container:', error);
    }
  }

  async showExplainCard() {
    try {
      console.log('SuperPlay AI: Showing explain card...');

      const videoInfo = await this.youtubeService.getVideoInfo();
      const explainCard = this.uiManager.createExplainCard(videoInfo);
      
      // Add overlay
      const overlay = this.uiManager.createOverlay();
      overlay.addEventListener('click', () => this.hideExplainCard());
      
      document.body.appendChild(overlay);
      document.body.appendChild(explainCard);

      // Setup close functionality
      const closeBtn = explainCard.querySelector('.close-button');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.hideExplainCard());
      }

    } catch (error) {
      console.error('SuperPlay AI: Failed to show explain card:', error);
    }
  }

  hideExplainCard() {
    const overlay = document.querySelector('.superplay-overlay');
    const card = document.querySelector('.superplay-floating-card');
    
    if (overlay) overlay.remove();
    if (card) card.remove();
  }

  async showSidebar() {
    try {
      console.log('SuperPlay AI: Showing sidebar...');

      const videoInfo = await this.youtubeService.getVideoInfo();
      const sidebar = document.querySelector('.superplay-sidebar-container');
      
      if (sidebar) {
        // Load sidebar content
        this.uiManager.loadSidebarContent(sidebar, videoInfo);
        sidebar.style.display = 'block';
      }

    } catch (error) {
      console.error('SuperPlay AI: Failed to show sidebar:', error);
    }
  }

  setupNavigationDetection() {
    // YouTube uses history API for navigation
    let lastUrl = location.href;
    
    this.navigationTimer = setInterval(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        console.log('SuperPlay AI: Navigation detected');
        
        if (this.isVideoPage()) {
          // Debounce to avoid multiple rapid initializations
          setTimeout(() => this.initializeVideoPage(), UIConfig.DEBOUNCE_DELAY);
        } else {
          this.currentVideoId = null;
          this.uiManager.cleanup();
        }
      }
    }, Timings.NAVIGATION_CHECK_INTERVAL);
  }

  async getSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: MessageTypes.GET_SETTINGS }, (response) => {
        if (response && response.success) {
          resolve(response.settings);
        } else {
          resolve({ enabled: true, autoSummary: true }); // Defaults
        }
      });
    });
  }

  // Cleanup when page unloads
  cleanup() {
    if (this.navigationTimer) {
      clearInterval(this.navigationTimer);
    }
    this.uiManager.cleanup();
  }
}

// Initialize content script when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ContentScript());
} else {
  new ContentScript();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.contentScript) {
    window.contentScript.cleanup();
  }
});