/**
 * SuperPlay AI - Background Service Worker
 * Handles AI API calls, settings management, and content script communication
 * NO DOM access - pure service worker functionality
 */

import { StorageService } from './storage.js';
import { GeminiService } from './gemini.js';
import { MessageTypes } from '../utils/constants.js';

class BackgroundService {
  constructor() {
    this.storageService = new StorageService();
    this.geminiService = new GeminiService();
    this.init();
  }

  init() {
    console.log('SuperPlay AI: Background service worker initializing...');
    
    // Handle extension installation/update
    chrome.runtime.onInstalled.addListener(this.handleInstall.bind(this));
    
    // Handle messages from content scripts and popup
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    // Handle tab updates for auto-injection
    chrome.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this));
    
    console.log('SuperPlay AI: Background service worker ready');
  }

  async handleInstall(details) {
    console.log('SuperPlay AI: Extension installed/updated', details);
    
    try {
      // Initialize default settings
      await this.storageService.initializeDefaults();
      console.log('SuperPlay AI: Default settings initialized');
    } catch (error) {
      console.error('SuperPlay AI: Failed to initialize defaults:', error);
    }
  }

  async handleMessage(request, sender, sendResponse) {
    console.log('SuperPlay AI: Message received:', request.type);

    // Always return true to keep message channel open for async operations
    (async () => {
      try {
        switch (request.type) {
          case MessageTypes.GET_SETTINGS:
            await this.handleGetSettings(sendResponse);
            break;

          case MessageTypes.UPDATE_SETTINGS:
            await this.handleUpdateSettings(request.settings, sendResponse);
            break;

          case MessageTypes.TEST_GEMINI_CONNECTION:
            await this.handleTestConnection(sendResponse);
            break;

          case MessageTypes.GET_VIDEO_TRANSCRIPT:
            await this.handleGetTranscript(request.videoId, request.videoTitle, sendResponse);
            break;

          case MessageTypes.GENERATE_EXPLANATION:
            await this.handleGenerateExplanation(request, sendResponse);
            break;

          case MessageTypes.GENERATE_SUMMARY:
            await this.handleGenerateSummary(request, sendResponse);
            break;

          case MessageTypes.ASK_FOLLOW_UP_QUESTION:
            await this.handleFollowUpQuestion(request, sendResponse);
            break;

          case MessageTypes.GET_VIDEO_INFO:
            await this.handleGetVideoInfo(request.tabId, sendResponse);
            break;

          default:
            console.warn('SuperPlay AI: Unknown message type:', request.type);
            sendResponse({ success: false, error: 'Unknown message type' });
        }
      } catch (error) {
        console.error('SuperPlay AI: Message handler error:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true; // Keep message channel open for async response
  }

  async handleTabUpdate(tabId, changeInfo, tab) {
    // Auto-inject content script on YouTube pages if needed
    if (changeInfo.status === 'complete' && tab.url?.includes('youtube.com/watch')) {
      try {
        const settings = await this.storageService.getSettings();
        if (settings.enabled) {
          // Ping content script to see if it's already loaded
          chrome.tabs.sendMessage(tabId, { type: MessageTypes.PING }, (response) => {
            if (chrome.runtime.lastError || !response) {
              // Content script not loaded, inject it
              chrome.scripting.executeScript({
                target: { tabId },
                files: ['src/content/content.js']
              }).catch(error => {
                console.log('SuperPlay AI: Content script injection failed (expected on some pages):', error.message);
              });
            }
          });
        }
      } catch (error) {
        console.log('SuperPlay AI: Tab update handler error:', error.message);
      }
    }
  }

  async handleGetSettings(sendResponse) {
    try {
      const settings = await this.storageService.getSettings();
      sendResponse({ success: true, settings });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleUpdateSettings(newSettings, sendResponse) {
    try {
      await this.storageService.updateSettings(newSettings);
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleTestConnection(sendResponse) {
    try {
      const result = await this.geminiService.testConnection();
      sendResponse({ success: true, result });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleGetTranscript(videoId, videoTitle, sendResponse) {
    try {
      console.log('SuperPlay AI: Requesting transcript for video:', videoId);
      
      // Request transcript from content script (which has DOM access)
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]) {
        throw new Error('No active tab found');
      }

      // Send message to content script to fetch transcript
      chrome.tabs.sendMessage(tabs[0].id, {
        type: MessageTypes.FETCH_TRANSCRIPT_FROM_DOM,
        videoId,
        videoTitle
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('SuperPlay AI: Failed to communicate with content script:', chrome.runtime.lastError);
          sendResponse({ 
            success: false, 
            error: 'Failed to communicate with content script. Please refresh the page.' 
          });
          return;
        }

        if (!response || !response.success) {
          console.error('SuperPlay AI: Content script failed to fetch transcript:', response?.error);
          sendResponse({ 
            success: false, 
            error: response?.error || 'Failed to fetch transcript from page' 
          });
          return;
        }

        console.log('SuperPlay AI: Transcript fetched successfully');
        sendResponse({ success: true, transcript: response.transcript });
      });

    } catch (error) {
      console.error('SuperPlay AI: Get transcript error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleGenerateExplanation(request, sendResponse) {
    try {
      const { transcript, videoTitle } = request;
      console.log('SuperPlay AI: Generating explanation...');

      const explanation = await this.geminiService.generateVideoExplanation(transcript, videoTitle);
      sendResponse({ success: true, explanation });
    } catch (error) {
      console.error('SuperPlay AI: Generate explanation error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleGenerateSummary(request, sendResponse) {
    try {
      const { transcript, videoTitle } = request;
      console.log('SuperPlay AI: Generating summary...');

      const result = await this.geminiService.generateVideoSummary(transcript, videoTitle);
      sendResponse({ success: true, ...result });
    } catch (error) {
      console.error('SuperPlay AI: Generate summary error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleFollowUpQuestion(request, sendResponse) {
    try {
      const { question, conversation, transcript, videoTitle } = request;
      console.log('SuperPlay AI: Answering follow-up question...');

      const answer = await this.geminiService.answerFollowUpQuestion(
        question, 
        conversation, 
        transcript, 
        videoTitle
      );
      
      sendResponse({ success: true, answer });
    } catch (error) {
      console.error('SuperPlay AI: Follow-up question error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleGetVideoInfo(tabId, sendResponse) {
    try {
      // Get video info from content script
      chrome.tabs.sendMessage(tabId, {
        type: MessageTypes.GET_VIDEO_INFO_FROM_DOM
      }, (response) => {
        if (chrome.runtime.lastError || !response) {
          sendResponse({ 
            success: false, 
            error: 'Failed to get video info from page' 
          });
          return;
        }
        sendResponse(response);
      });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
}

// Initialize the background service
new BackgroundService();