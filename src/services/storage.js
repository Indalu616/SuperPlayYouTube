/**
 * SuperPlay AI - Storage Service
 * Handles chrome.storage operations with proper error handling and defaults
 */

export class StorageService {
  constructor() {
    this.defaultSettings = {
      enabled: true,
      autoSummary: true,
      geminiApiKey: '',
      lastUpdated: Date.now(),
      version: '1.1.0'
    };
  }

  /**
   * Initialize default settings on first install
   */
  async initializeDefaults() {
    try {
      const existing = await this.getSettings();
      
      // Only set defaults for missing keys
      const settingsToSet = {};
      for (const [key, value] of Object.entries(this.defaultSettings)) {
        if (existing[key] === undefined) {
          settingsToSet[key] = value;
        }
      }

      if (Object.keys(settingsToSet).length > 0) {
        await chrome.storage.sync.set(settingsToSet);
        console.log('SuperPlay AI: Initialized default settings:', settingsToSet);
      }

      return true;
    } catch (error) {
      console.error('SuperPlay AI: Failed to initialize defaults:', error);
      throw new Error(`Failed to initialize settings: ${error.message}`);
    }
  }

  /**
   * Get all settings from storage
   */
  async getSettings() {
    try {
      const keys = Object.keys(this.defaultSettings);
      const result = await chrome.storage.sync.get(keys);
      
      // Merge with defaults for any missing keys
      const settings = { ...this.defaultSettings, ...result };
      
      return settings;
    } catch (error) {
      console.error('SuperPlay AI: Failed to get settings:', error);
      // Return defaults if storage fails
      return { ...this.defaultSettings };
    }
  }

  /**
   * Update specific settings
   */
  async updateSettings(newSettings) {
    try {
      // Add timestamp
      const settingsWithTimestamp = {
        ...newSettings,
        lastUpdated: Date.now()
      };

      await chrome.storage.sync.set(settingsWithTimestamp);
      console.log('SuperPlay AI: Settings updated:', Object.keys(settingsWithTimestamp));
      
      return true;
    } catch (error) {
      console.error('SuperPlay AI: Failed to update settings:', error);
      throw new Error(`Failed to save settings: ${error.message}`);
    }
  }

  /**
   * Get conversation history for a video
   */
  async getConversationHistory(videoId) {
    try {
      const key = `conversation_${videoId}`;
      const result = await chrome.storage.local.get([key]);
      return result[key] || [];
    } catch (error) {
      console.error('SuperPlay AI: Failed to get conversation history:', error);
      return [];
    }
  }

  /**
   * Save conversation history for a video
   */
  async saveConversationHistory(videoId, conversation) {
    try {
      const key = `conversation_${videoId}`;
      await chrome.storage.local.set({
        [key]: conversation,
        [`${key}_timestamp`]: Date.now()
      });
      
      // Clean up old conversations (keep only last 10)
      this.cleanupOldConversations();
      
      return true;
    } catch (error) {
      console.error('SuperPlay AI: Failed to save conversation history:', error);
      throw new Error(`Failed to save conversation: ${error.message}`);
    }
  }

  /**
   * Clear conversation history for a video
   */
  async clearConversationHistory(videoId) {
    try {
      const key = `conversation_${videoId}`;
      await chrome.storage.local.remove([key, `${key}_timestamp`]);
      return true;
    } catch (error) {
      console.error('SuperPlay AI: Failed to clear conversation history:', error);
      throw new Error(`Failed to clear conversation: ${error.message}`);
    }
  }

  /**
   * Clean up old conversation histories to prevent storage bloat
   */
  async cleanupOldConversations() {
    try {
      const all = await chrome.storage.local.get(null);
      const conversations = {};
      
      // Find all conversation entries with timestamps
      for (const [key, value] of Object.entries(all)) {
        if (key.startsWith('conversation_') && key.endsWith('_timestamp')) {
          const conversationKey = key.replace('_timestamp', '');
          conversations[conversationKey] = value;
        }
      }

      // Sort by timestamp and keep only the 10 most recent
      const sorted = Object.entries(conversations)
        .sort(([,a], [,b]) => b - a)
        .slice(10); // Remove all but the 10 most recent

      // Remove old conversations
      const keysToRemove = [];
      for (const [conversationKey] of sorted) {
        keysToRemove.push(conversationKey, `${conversationKey}_timestamp`);
      }

      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
        console.log(`SuperPlay AI: Cleaned up ${keysToRemove.length / 2} old conversations`);
      }

    } catch (error) {
      console.error('SuperPlay AI: Failed to cleanup old conversations:', error);
    }
  }

  /**
   * Get cached transcript for a video
   */
  async getCachedTranscript(videoId) {
    try {
      const key = `transcript_${videoId}`;
      const result = await chrome.storage.local.get([key, `${key}_timestamp`]);
      
      const transcript = result[key];
      const timestamp = result[`${key}_timestamp`];
      
      // Check if cache is still valid (24 hours)
      if (transcript && timestamp && (Date.now() - timestamp < 24 * 60 * 60 * 1000)) {
        return transcript;
      }
      
      return null;
    } catch (error) {
      console.error('SuperPlay AI: Failed to get cached transcript:', error);
      return null;
    }
  }

  /**
   * Cache transcript for a video
   */
  async cacheTranscript(videoId, transcript) {
    try {
      const key = `transcript_${videoId}`;
      await chrome.storage.local.set({
        [key]: transcript,
        [`${key}_timestamp`]: Date.now()
      });
      
      console.log(`SuperPlay AI: Cached transcript for video ${videoId}`);
      return true;
    } catch (error) {
      console.error('SuperPlay AI: Failed to cache transcript:', error);
      return false;
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats() {
    try {
      const syncUsage = await chrome.storage.sync.getBytesInUse();
      const localUsage = await chrome.storage.local.getBytesInUse();
      
      return {
        sync: {
          used: syncUsage,
          quota: chrome.storage.sync.QUOTA_BYTES || 102400,
          percentage: Math.round((syncUsage / (chrome.storage.sync.QUOTA_BYTES || 102400)) * 100)
        },
        local: {
          used: localUsage,
          quota: chrome.storage.local.QUOTA_BYTES || 5242880,
          percentage: Math.round((localUsage / (chrome.storage.local.QUOTA_BYTES || 5242880)) * 100)
        }
      };
    } catch (error) {
      console.error('SuperPlay AI: Failed to get storage stats:', error);
      return null;
    }
  }
}