/**
 * SuperPlay AI - UI Manager
 * Handles creation and management of UI elements
 * ONLY RUNS IN CONTENT SCRIPT CONTEXT
 */

import { CSSClasses, MessageTypes } from '../utils/constants.js';

export class UIManager {
  constructor() {
    this.activeElements = new Set();
  }

  /**
   * Create the explain button element
   */
  createExplainButton() {
    const button = document.createElement('button');
    button.className = CSSClasses.BUTTON;
    button.innerHTML = `
      <svg class="superplay-button-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
      </svg>
      🤖 Explain This Video
    `;
    button.title = 'Get an AI explanation of this video';
    
    this.activeElements.add(button);
    return button;
  }

  /**
   * Create the sidebar container
   */
  createSidebarContainer() {
    const sidebar = document.createElement('div');
    sidebar.className = CSSClasses.SIDEBAR;
    sidebar.style.display = 'none';
    sidebar.innerHTML = `
      <div class="sidebar-header">
        <h3 class="sidebar-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          Smart Summary
        </h3>
        <p class="sidebar-subtitle">AI-powered video analysis</p>
      </div>
      <div class="sidebar-content">
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p class="loading-text">Generating summary...</p>
        </div>
      </div>
    `;
    
    this.activeElements.add(sidebar);
    return sidebar;
  }

  /**
   * Create the explain card modal
   */
  createExplainCard(videoInfo) {
    const card = document.createElement('div');
    card.className = CSSClasses.CARD;
    card.innerHTML = `
      <div class="explain-card-header">
        <h2 class="explain-card-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
          </svg>
          Video Explanation
        </h2>
        <p class="explain-card-subtitle">${videoInfo.title}</p>
        <button class="close-button" title="Close">×</button>
      </div>
      <div class="explain-card-content">
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p class="loading-text">Generating explanation...</p>
        </div>
      </div>
    `;
    
    // Load explanation content
    this.loadExplanationContent(card, videoInfo);
    
    this.activeElements.add(card);
    return card;
  }

  /**
   * Create overlay for modals
   */
  createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = CSSClasses.OVERLAY;
    
    this.activeElements.add(overlay);
    return overlay;
  }

  /**
   * Load sidebar content with summary and chapters
   */
  async loadSidebarContent(sidebar, videoInfo) {
    const content = sidebar.querySelector('.sidebar-content');
    
    try {
      // Show loading state
      content.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p class="loading-text">Generating summary and chapters...</p>
        </div>
      `;

      // Request transcript and generate summary
      const transcript = await this.getTranscript(videoInfo.videoId, videoInfo.title);
      const summaryData = await this.generateSummary(transcript, videoInfo.title);

      // Update content with results
      content.innerHTML = `
        <div class="sidebar-section">
          <h4 class="section-title">
            <svg class="section-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
            Summary
          </h4>
          <div class="summary-content" data-summary>${this.renderMarkdown(summaryData.summary)}</div>
        </div>
        
        <div class="sidebar-section">
          <h4 class="section-title">
            <svg class="section-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6Z"/>
            </svg>
            Chapters
          </h4>
          <div class="chapters-list">
            ${summaryData.chapters.map(chapter => `
              <div class="chapter-item" data-seconds="${chapter.seconds}">
                <div class="chapter-content">
                  <div class="chapter-header">
                    <h5 class="chapter-title">${chapter.title}</h5>
                    <span class="chapter-timestamp">${chapter.timestamp}</span>
                  </div>
                  <p class="chapter-description">${chapter.description}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      // Add click handlers for chapters
      content.querySelectorAll('.chapter-item').forEach(item => {
        item.addEventListener('click', () => {
          const seconds = parseInt(item.dataset.seconds);
          this.seekToTimestamp(seconds);
        });
      });

    } catch (error) {
      console.error('SuperPlay AI: Failed to load sidebar content:', error);
      content.innerHTML = `
        <div class="error-container">
          <p class="error-message">
            <span class="error-icon">⚠️</span>
            Failed to generate summary: ${error.message}
          </p>
        </div>
      `;
    }
  }

  /**
   * Load explanation content for card
   */
  async loadExplanationContent(card, videoInfo) {
    const content = card.querySelector('.explain-card-content');
    
    try {
      // Get transcript and generate explanation
      const transcript = await this.getTranscript(videoInfo.videoId, videoInfo.title);
      const explanation = await this.generateExplanation(transcript, videoInfo.title);

      // Create conversation interface
      content.innerHTML = `
        <div class="conversation-container">
          <div class="message ai-message">
            <div class="message-header">
              <div class="message-avatar ai-avatar">AI</div>
              <span class="message-sender ai-sender">SuperPlay AI</span>
            </div>
            <div class="message-content">
              ${this.renderMarkdown(explanation)}
            </div>
          </div>
        </div>
        
        <div class="followup-container">
          <form class="followup-form">
            <textarea 
              class="followup-input" 
              placeholder="Ask a follow-up question about this video..."
              rows="2"
            ></textarea>
            <button type="submit" class="followup-submit">
              <svg class="submit-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z"/>
              </svg>
              Send
            </button>
          </form>
        </div>
        
        <div class="clear-history-container">
          <button class="clear-history-button">Clear Conversation</button>
        </div>
      `;

      // Setup form handling
      this.setupConversationHandlers(content, videoInfo);

    } catch (error) {
      console.error('SuperPlay AI: Failed to load explanation:', error);
      content.innerHTML = `
        <div class="error-container">
          <p class="error-message">
            <span class="error-icon">⚠️</span>
            Failed to generate explanation: ${error.message}
          </p>
        </div>
      `;
    }
  }

  /**
   * Setup conversation form handlers
   */
  setupConversationHandlers(content, videoInfo) {
    const form = content.querySelector('.followup-form');
    const input = content.querySelector('.followup-input');
    const button = content.querySelector('.followup-submit');
    const clearBtn = content.querySelector('.clear-history-button');
    const conversationContainer = content.querySelector('.conversation-container');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const question = input.value.trim();
      if (!question) return;

      // Disable form
      input.disabled = true;
      button.disabled = true;
      
      // Add user message
      const userMessage = this.createUserMessage(question);
      conversationContainer.appendChild(userMessage);
      
      // Clear input
      input.value = '';
      
      // Add thinking indicator
      const thinkingIndicator = this.createThinkingIndicator();
      conversationContainer.appendChild(thinkingIndicator);
      
      try {
        // Get conversation history
        const conversation = this.extractConversationHistory(conversationContainer);
        
        // Get transcript and ask follow-up
        const transcript = await this.getTranscript(videoInfo.videoId, videoInfo.title);
        const answer = await this.askFollowUpQuestion(question, conversation, transcript, videoInfo.title);
        
        // Remove thinking indicator
        thinkingIndicator.remove();
        
        // Add AI response
        const aiMessage = this.createAIMessage(answer);
        conversationContainer.appendChild(aiMessage);
        
      } catch (error) {
        console.error('SuperPlay AI: Follow-up question failed:', error);
        thinkingIndicator.remove();
        
        const errorMessage = this.createErrorMessage(error.message);
        conversationContainer.appendChild(errorMessage);
      } finally {
        // Re-enable form
        input.disabled = false;
        button.disabled = false;
        input.focus();
      }
    });

    // Clear conversation handler
    clearBtn.addEventListener('click', () => {
      const messages = conversationContainer.querySelectorAll('.message:not(:first-child)');
      messages.forEach(msg => msg.remove());
    });
  }

  /**
   * Create user message element
   */
  createUserMessage(text) {
    const message = document.createElement('div');
    message.className = 'message user-message';
    message.innerHTML = `
      <div class="message-header">
        <div class="message-avatar user-avatar">U</div>
        <span class="message-sender user-sender">You</span>
      </div>
      <div class="message-content">${text}</div>
    `;
    return message;
  }

  /**
   * Create AI message element
   */
  createAIMessage(text) {
    const message = document.createElement('div');
    message.className = 'message ai-message';
    message.innerHTML = `
      <div class="message-header">
        <div class="message-avatar ai-avatar">AI</div>
        <span class="message-sender ai-sender">SuperPlay AI</span>
      </div>
      <div class="message-content">
        ${this.renderMarkdown(text)}
      </div>
    `;
    return message;
  }

  /**
   * Create thinking indicator
   */
  createThinkingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'thinking-indicator';
    indicator.innerHTML = `
      AI is thinking
      <div class="thinking-dots">
        <div class="thinking-dot"></div>
        <div class="thinking-dot"></div>
        <div class="thinking-dot"></div>
      </div>
    `;
    return indicator;
  }

  /**
   * Create error message element
   */
  createErrorMessage(error) {
    const message = document.createElement('div');
    message.className = 'error-message-content';
    message.innerHTML = `⚠️ ${error}`;
    return message;
  }

  /**
   * Extract conversation history from DOM
   */
  extractConversationHistory(container) {
    const messages = container.querySelectorAll('.message');
    return Array.from(messages).map(msg => {
      const isUser = msg.classList.contains('user-message');
      const content = msg.querySelector('.message-content').textContent;
      return {
        type: isUser ? 'user' : 'ai',
        content: content
      };
    });
  }

  /**
   * Simple markdown renderer
   */
  renderMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[h|u|l])(.+)$/gm, '<p>$1</p>')
      .replace(/<p><\/p>/g, '');
  }

  /**
   * Seek video to timestamp
   */
  seekToTimestamp(seconds) {
    const video = document.querySelector('video');
    if (video) {
      video.currentTime = seconds;
    }
  }

  /**
   * Helper methods for API communication
   */
  async getTranscript(videoId, videoTitle) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: MessageTypes.GET_VIDEO_TRANSCRIPT,
        videoId,
        videoTitle
      }, (response) => {
        if (response && response.success) {
          resolve(response.transcript);
        } else {
          reject(new Error(response?.error || 'Failed to get transcript'));
        }
      });
    });
  }

  async generateSummary(transcript, videoTitle) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: MessageTypes.GENERATE_SUMMARY,
        transcript,
        videoTitle
      }, (response) => {
        if (response && response.success) {
          resolve({ summary: response.summary, chapters: response.chapters });
        } else {
          reject(new Error(response?.error || 'Failed to generate summary'));
        }
      });
    });
  }

  async generateExplanation(transcript, videoTitle) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: MessageTypes.GENERATE_EXPLANATION,
        transcript,
        videoTitle
      }, (response) => {
        if (response && response.success) {
          resolve(response.explanation);
        } else {
          reject(new Error(response?.error || 'Failed to generate explanation'));
        }
      });
    });
  }

  async askFollowUpQuestion(question, conversation, transcript, videoTitle) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: MessageTypes.ASK_FOLLOW_UP_QUESTION,
        question,
        conversation,
        transcript,
        videoTitle
      }, (response) => {
        if (response && response.success) {
          resolve(response.answer);
        } else {
          reject(new Error(response?.error || 'Failed to answer question'));
        }
      });
    });
  }

  /**
   * Cleanup all active elements
   */
  cleanup() {
    this.activeElements.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    this.activeElements.clear();

    // Also remove any orphaned elements
    const selectors = [
      '.superplay-explain-button',
      '.superplay-sidebar-container',
      '.superplay-floating-card',
      '.superplay-overlay'
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
  }
}