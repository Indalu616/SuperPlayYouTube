/**
 * SuperPlay AI - YouTube Service
 * Handles all YouTube-specific DOM operations and transcript fetching
 * ONLY RUNS IN CONTENT SCRIPT CONTEXT - HAS DOM ACCESS
 */

import { YouTubeSelectors, VideoIdPatterns, UIConfig, Timings } from '../utils/constants.js';

export class YouTubeService {
  constructor() {
    this.transcriptCache = new Map();
  }

  /**
   * Get current video ID from URL
   */
  getCurrentVideoId() {
    const url = window.location.href;
    return this.extractVideoId(url);
  }

  /**
   * Extract video ID from various YouTube URL formats
   */
  extractVideoId(url) {
    for (const pattern of Object.values(VideoIdPatterns)) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  /**
   * Get current video information
   */
  async getVideoInfo() {
    const videoId = this.getCurrentVideoId();
    const title = this.getVideoTitle();
    const duration = this.getVideoDuration();
    const owner = this.getVideoOwner();

    return {
      videoId,
      title,
      duration,
      owner,
      url: window.location.href
    };
  }

  /**
   * Get video title from DOM
   */
  getVideoTitle() {
    const titleElement = document.querySelector(YouTubeSelectors.VIDEO_TITLE);
    return titleElement ? titleElement.textContent.trim() : 'Unknown Video';
  }

  /**
   * Get video duration in seconds
   */
  getVideoDuration() {
    const video = document.querySelector(YouTubeSelectors.VIDEO_PLAYER);
    return video ? video.duration : 0;
  }

  /**
   * Get video owner/channel name
   */
  getVideoOwner() {
    const ownerElement = document.querySelector(YouTubeSelectors.VIDEO_OWNER);
    return ownerElement ? ownerElement.textContent.trim() : 'Unknown Channel';
  }

  /**
   * Check if captions are available
   */
  areCaptionsAvailable() {
    const captionButton = document.querySelector(YouTubeSelectors.CAPTION_BUTTON);
    return captionButton && !captionButton.classList.contains('ytp-button-disabled');
  }

  /**
   * Main transcript fetching method with multiple fallbacks
   */
  async fetchTranscript(videoId) {
    try {
      // Check cache first
      if (this.transcriptCache.has(videoId)) {
        console.log('SuperPlay AI: Using cached transcript');
        return this.transcriptCache.get(videoId);
      }

      console.log('SuperPlay AI: Fetching transcript for video:', videoId);

      // Try multiple methods in order of reliability
      const methods = [
        () => this.fetchFromPageData(videoId),
        () => this.fetchFromCaptionTracks(videoId),
        () => this.fetchFromVisibleCaptions(),
        () => this.fetchFromDescription(),
        () => this.fetchFromPlayerAPI(videoId) // Last resort due to CORS
      ];

      for (const method of methods) {
        try {
          const transcript = await method();
          if (transcript && transcript.length >= UIConfig.MIN_TRANSCRIPT_LENGTH) {
            const cleanedTranscript = this.cleanTranscript(transcript);
            
            // Cache successful result
            this.transcriptCache.set(videoId, cleanedTranscript);
            
            console.log('SuperPlay AI: Transcript fetched successfully, length:', cleanedTranscript.length);
            return cleanedTranscript;
          }
        } catch (error) {
          console.log('SuperPlay AI: Transcript method failed:', error.message);
        }
      }

      throw new Error('All transcript fetch methods failed');

    } catch (error) {
      console.error('SuperPlay AI: Failed to fetch transcript:', error);
      throw new Error('Could not fetch video transcript. This video may not have captions available.');
    }
  }

  /**
   * Fetch transcript from YouTube's page data objects
   */
  async fetchFromPageData(videoId) {
    try {
      console.log('SuperPlay AI: Trying to extract from page data...');
      
      // Wait for page data to load
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Look for ytInitialPlayerResponse or similar objects
      const scripts = document.querySelectorAll('script');
      let playerData = null;
      
      for (const script of scripts) {
        const content = script.textContent || '';
        
        // Look for ytInitialPlayerResponse
        if (content.includes('ytInitialPlayerResponse')) {
          const match = content.match(/var ytInitialPlayerResponse = ({.+?});/);
          if (match) {
            try {
              playerData = JSON.parse(match[1]);
              break;
            } catch (e) {
              continue;
            }
          }
        }
        
        // Look for window.ytplayer
        if (content.includes('ytplayer.config')) {
          const match = content.match(/ytplayer\.config\s*=\s*({.+?});/);
          if (match) {
            try {
              const config = JSON.parse(match[1]);
              if (config.args && config.args.player_response) {
                playerData = JSON.parse(config.args.player_response);
                break;
              }
            } catch (e) {
              continue;
            }
          }
        }
      }
      
      if (!playerData) {
        // Try to get from window objects
        if (typeof window !== 'undefined') {
          playerData = window.ytInitialPlayerResponse || 
                      (window.ytplayer && window.ytplayer.config && window.ytplayer.config.args && 
                       JSON.parse(window.ytplayer.config.args.player_response));
        }
      }
      
      if (!playerData) {
        throw new Error('No player data found');
      }
      
      // Extract caption tracks from player data
      const captions = playerData.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      
      if (!captions || !captions.length) {
        throw new Error('No caption tracks in player data');
      }
      
      // Find English captions
      let captionTrack = captions.find(track => 
        track.languageCode === 'en' || 
        track.languageCode === 'en-US' ||
        track.languageCode === 'en-GB'
      );
      
      if (!captionTrack) {
        captionTrack = captions[0]; // Use first available
      }
      
      if (!captionTrack.baseUrl) {
        throw new Error('No caption URL in track data');
      }
      
      let captionUrl = captionTrack.baseUrl;
      
      // Ensure we get the right format
      if (!captionUrl.includes('fmt=')) {
        captionUrl += '&fmt=srv3';
      }
      
      console.log('SuperPlay AI: Fetching from player data caption URL...');
      
      const response = await fetch(captionUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`Caption fetch failed: ${response.status}`);
      }
      
      const xmlText = await response.text();
      
      if (!xmlText || xmlText.length < 50) {
        throw new Error('Empty caption response from player data');
      }
      
      const transcript = this.parseTranscriptXML(xmlText);
      console.log('SuperPlay AI: Successfully extracted from page data, length:', transcript.length);
      
      return transcript;
      
    } catch (error) {
      throw new Error(`Page data method failed: ${error.message}`);
    }
  }

  /**
   * Fetch transcript from caption tracks in page
   */
  async fetchFromCaptionTracks(videoId) {
    try {
      // Wait for page to fully load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Look for caption track URLs in page source and scripts
      const pageHTML = document.documentElement.outerHTML;
      
      // Multiple regex patterns to find caption tracks
      const patterns = [
        /"captionTracks":\s*\[([^\]]+)\]/,
        /"caption_tracks":\s*\[([^\]]+)\]/,
        /\"captionTracks\":\[([^\]]+)\]/,
        /"captions"[^}]*"playerCaptionsTracklistRenderer"[^}]*"captionTracks":\[([^\]]+)\]/
      ];
      
      let captionTracksString = null;
      
      for (const pattern of patterns) {
        const match = pageHTML.match(pattern);
        if (match) {
          captionTracksString = match[1];
          break;
        }
      }
      
      if (!captionTracksString) {
        throw new Error('No caption tracks found in page');
      }

      // Extract caption URL
      const urlPatterns = [
        /"baseUrl":"([^"]+)"/,
        /"url":"([^"]+)"/,
        /baseUrl['"]\s*:\s*['"]([^'"]+)['"]/
      ];
      
      let captionUrl = null;
      
      for (const pattern of urlPatterns) {
        const urlMatch = captionTracksString.match(pattern);
        if (urlMatch) {
          captionUrl = urlMatch[1];
          break;
        }
      }
      
      if (!captionUrl) {
        throw new Error('No caption URL found');
      }

      // Clean up URL encoding
      captionUrl = captionUrl
        .replace(/\\u0026/g, '&')
        .replace(/\\u003d/g, '=')
        .replace(/\\u003f/g, '?')
        .replace(/\\/g, '');
      
      // Ensure we get the right format
      if (!captionUrl.includes('fmt=')) {
        captionUrl += '&fmt=srv3';
      }

      console.log('SuperPlay AI: Fetching from caption URL:', captionUrl.substring(0, 100) + '...');

      const response = await fetch(captionUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`Caption fetch failed: ${response.status}`);
      }

      const xmlText = await response.text();
      
      if (!xmlText || xmlText.length < 50) {
        throw new Error('Empty caption response');
      }
      
      return this.parseTranscriptXML(xmlText);

    } catch (error) {
      throw new Error(`Caption tracks method failed: ${error.message}`);
    }
  }

  /**
   * Extract transcript from visible captions on page
   */
  async fetchFromVisibleCaptions() {
    try {
      console.log('SuperPlay AI: Trying to extract from visible captions...');
      
      // Wait longer for captions to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Try multiple selectors for captions
      const captionSelectors = [
        '.ytp-caption-segment',
        '.caption-line',
        '.ytp-caption-window-container .ytp-caption-segment',
        '[class*="caption"] [class*="segment"]'
      ];
      
      let captionElements = [];
      
      for (const selector of captionSelectors) {
        captionElements = document.querySelectorAll(selector);
        if (captionElements.length > 0) {
          console.log(`SuperPlay AI: Found ${captionElements.length} caption elements with selector: ${selector}`);
          break;
        }
      }
      
      if (captionElements.length === 0) {
        // Try to enable captions programmatically
        const captionButton = document.querySelector('.ytp-subtitles-button, .ytp-cc-button');
        if (captionButton && !captionButton.classList.contains('ytp-button-active')) {
          captionButton.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Try again after enabling
          captionElements = document.querySelectorAll('.ytp-caption-segment');
        }
      }
      
      if (captionElements.length === 0) {
        throw new Error('No visible captions found');
      }

      const transcript = Array.from(captionElements)
        .map(el => el.textContent?.trim())
        .filter(text => text && text.length > 1)
        .join(' ');

      if (transcript.length < UIConfig.MIN_TRANSCRIPT_LENGTH) {
        throw new Error(`Visible captions too short: ${transcript.length} characters`);
      }

      console.log('SuperPlay AI: Successfully extracted visible captions, length:', transcript.length);
      return transcript;

    } catch (error) {
      throw new Error(`Visible captions method failed: ${error.message}`);
    }
  }

  /**
   * Extract transcript from video description if it contains timestamps
   */
  async fetchFromDescription() {
    try {
      const descriptionElement = document.querySelector(YouTubeSelectors.VIDEO_DESCRIPTION);
      
      if (!descriptionElement) {
        throw new Error('No description found');
      }

      const description = descriptionElement.textContent;
      
      // Check if description contains timestamps (indicating a transcript)
      const timestampRegex = /\d{1,2}:\d{2}/g;
      const timestamps = description.match(timestampRegex);
      
      if (!timestamps || timestamps.length < 5) {
        throw new Error('Description does not appear to contain transcript');
      }

      if (description.length < UIConfig.MIN_TRANSCRIPT_LENGTH * 2) {
        throw new Error('Description too short to be a transcript');
      }

      // Remove timestamps and clean up
      return description
        .replace(/\d{1,2}:\d{2}(?::\d{2})?\s*/g, '')
        .replace(/\n+/g, ' ')
        .trim();

    } catch (error) {
      throw new Error(`Description method failed: ${error.message}`);
    }
  }

  /**
   * Fetch transcript from YouTube's internal player API
   */
  async fetchFromPlayerAPI(videoId) {
    try {
      // Try different language options
      const languages = ['en', 'en-US', 'en-GB'];
      
      for (const lang of languages) {
        try {
          const apiUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=srv3`;
          
          const response = await fetch(apiUrl, {
            method: 'GET',
            mode: 'cors',
            credentials: 'same-origin',
            headers: {
              'Accept': 'application/xml, text/xml, */*',
              'User-Agent': navigator.userAgent
            }
          });

          if (!response.ok) {
            throw new Error(`API response not ok: ${response.status}`);
          }

          const xmlText = await response.text();
          
          if (!xmlText || xmlText.length < 100) {
            throw new Error('Empty or invalid XML response');
          }

          return this.parseTranscriptXML(xmlText);
        } catch (langError) {
          console.log(`SuperPlay AI: Language ${lang} failed:`, langError.message);
          continue;
        }
      }
      
      throw new Error('All language variants failed');

    } catch (error) {
      throw new Error(`Player API method failed: ${error.message}`);
    }
  }

  /**
   * Parse XML transcript format from YouTube
   */
  parseTranscriptXML(xmlText) {
    try {
      // Try using DOMParser first
      if (typeof DOMParser !== 'undefined') {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const textElements = xmlDoc.querySelectorAll('text');
        
        if (textElements.length > 0) {
          return Array.from(textElements)
            .map(el => this.decodeHTMLEntities(el.textContent || ''))
            .filter(text => text.trim())
            .join(' ');
        }
      }

      // Fallback to regex parsing
      return this.parseTranscriptXMLWithRegex(xmlText);

    } catch (error) {
      console.error('SuperPlay AI: XML parsing failed:', error);
      return this.parseTranscriptXMLWithRegex(xmlText);
    }
  }

  /**
   * Fallback XML parsing using regex
   */
  parseTranscriptXMLWithRegex(xmlText) {
    const textMatches = xmlText.match(/<text[^>]*>([^<]*)<\/text>/g);
    
    if (!textMatches) {
      throw new Error('No text elements found in XML');
    }

    return textMatches
      .map(match => {
        const content = match.replace(/<text[^>]*>([^<]*)<\/text>/, '$1');
        return this.decodeHTMLEntities(content);
      })
      .filter(text => text.trim())
      .join(' ');
  }

  /**
   * Decode HTML entities in transcript text
   */
  decodeHTMLEntities(text) {
    const entities = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' '
    };

    return text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
      return entities[entity] || entity;
    });
  }

  /**
   * Clean and normalize transcript text
   */
  cleanTranscript(rawTranscript) {
    if (!rawTranscript) return '';

    return rawTranscript
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove common auto-caption artifacts
      .replace(/\[Music\]/gi, '')
      .replace(/\[Applause\]/gi, '')
      .replace(/\[Laughter\]/gi, '')
      .replace(/\[Inaudible\]/gi, '')
      // Remove repeated words (common in auto-captions)
      .replace(/\b(\w+)\s+\1\b/gi, '$1')
      // Clean up punctuation
      .replace(/\s+([,.!?])/g, '$1')
      .replace(/([,.!?])\s*([,.!?])/g, '$1')
      // Trim and ensure single spaces
      .trim()
      .replace(/\s+/g, ' ');
  }

  /**
   * Seek video to specific timestamp
   */
  seekToTimestamp(seconds) {
    try {
      const video = document.querySelector(YouTubeSelectors.VIDEO_PLAYER);
      if (video) {
        video.currentTime = seconds;
        console.log('SuperPlay AI: Seeked to', seconds, 'seconds');
      }
    } catch (error) {
      console.error('SuperPlay AI: Failed to seek video:', error);
    }
  }

  /**
   * Convert timestamp string to seconds
   */
  parseTimestamp(timestamp) {
    const parts = timestamp.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1]; // MM:SS
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
    }
    return 0;
  }

  /**
   * Format seconds to timestamp string
   */
  formatTimestamp(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Clear transcript cache
   */
  clearCache() {
    this.transcriptCache.clear();
  }
}