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

      // Try multiple methods in order
      const methods = [
        () => this.fetchFromPlayerAPI(videoId),
        () => this.fetchFromCaptionTracks(videoId),
        () => this.fetchFromVisibleCaptions(),
        () => this.fetchFromDescription()
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
   * Fetch transcript from YouTube's internal player API
   */
  async fetchFromPlayerAPI(videoId) {
    try {
      const apiUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=srv3`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml, text/xml, */*',
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

    } catch (error) {
      throw new Error(`Player API method failed: ${error.message}`);
    }
  }

  /**
   * Fetch transcript from caption tracks in page
   */
  async fetchFromCaptionTracks(videoId) {
    try {
      // Look for caption track URLs in page source
      const pageHTML = document.documentElement.outerHTML;
      const captionRegex = /"captionTracks":\s*\[([^\]]+)\]/;
      const match = pageHTML.match(captionRegex);
      
      if (!match) {
        throw new Error('No caption tracks found in page');
      }

      const captionTracksString = match[1];
      const urlRegex = /"baseUrl":"([^"]+)"/;
      const urlMatch = captionTracksString.match(urlRegex);
      
      if (!urlMatch) {
        throw new Error('No caption URL found');
      }

      let captionUrl = urlMatch[1].replace(/\\u0026/g, '&');
      
      // Ensure we get the right format
      if (!captionUrl.includes('fmt=')) {
        captionUrl += '&fmt=srv3';
      }

      const response = await fetch(captionUrl);
      if (!response.ok) {
        throw new Error(`Caption fetch failed: ${response.status}`);
      }

      const xmlText = await response.text();
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
      // Wait a bit for captions to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      const captionElements = document.querySelectorAll(YouTubeSelectors.CAPTION_SEGMENTS);
      
      if (captionElements.length === 0) {
        throw new Error('No visible captions found');
      }

      const transcript = Array.from(captionElements)
        .map(el => el.textContent?.trim())
        .filter(text => text && text.length > 1)
        .join(' ');

      if (transcript.length < UIConfig.MIN_TRANSCRIPT_LENGTH) {
        throw new Error('Visible captions too short');
      }

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