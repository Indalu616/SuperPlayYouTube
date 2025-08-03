import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

const ExplainCard = ({ videoId, onClose }) => {
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [askingFollowUp, setAskingFollowUp] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);

  useEffect(() => {
    loadExplanation();
    loadConversationHistory();
  }, [videoId]);

  // Save conversation to storage whenever it changes
  useEffect(() => {
    if (conversation.length > 0) {
      saveConversationHistory();
    }
  }, [conversation]);

  const loadExplanation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if we already have a conversation loaded
      if (conversation.length > 0) {
        const explanationMsg = conversation.find(msg => msg.type === 'explanation');
        if (explanationMsg) {
          setExplanation(explanationMsg.content);
          setShowFollowUp(true);
          setLoading(false);
          return;
        }
      }

      // Get video title for context
      const videoTitle = getVideoTitle();
      
      // First get the transcript
      const transcript = await getVideoTranscript(videoId);
      
      // Then generate explanation using Gemini
      const response = await chrome.runtime.sendMessage({
        type: 'GENERATE_EXPLANATION',
        transcript: transcript,
        videoTitle: videoTitle
      });

      if (response.success) {
        setExplanation(response.explanation.explanation);
        setShowFollowUp(true);
        // Initialize conversation with the original explanation
        const newConversation = [{
          type: 'explanation',
          content: response.explanation.explanation,
          timestamp: new Date().toISOString()
        }];
        setConversation(newConversation);
      } else {
        throw new Error(response.error || 'Failed to generate explanation');
      }
      
    } catch (error) {
      console.error('Failed to load explanation:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getVideoTitle = () => {
    const titleElement = document.querySelector('#title h1.ytd-watch-metadata');
    return titleElement ? titleElement.textContent.trim() : 'YouTube Video';
  };

  const getVideoTranscript = async (videoId) => {
    // Send message to background script to get transcript
    const response = await chrome.runtime.sendMessage({
      type: 'GET_VIDEO_TRANSCRIPT',
      videoId: videoId
    });

    if (response.success) {
      return response.transcript;
    } else {
      throw new Error('Could not fetch video transcript');
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleFollowUpSubmit = async (e) => {
    e.preventDefault();
    
    if (!followUpQuestion.trim() || askingFollowUp) return;

    setAskingFollowUp(true);
    
    try {
      // Add user question to conversation
      const userMessage = {
        type: 'question',
        content: followUpQuestion.trim(),
        timestamp: new Date().toISOString()
      };
      
      setConversation(prev => [...prev, userMessage]);
      
      // Get video title and transcript for context
      const videoTitle = getVideoTitle();
      const transcript = await getVideoTranscript(videoId);
      
      // Send follow-up question
      const response = await chrome.runtime.sendMessage({
        type: 'ASK_FOLLOW_UP_QUESTION',
        question: followUpQuestion.trim(),
        conversation: [...conversation, userMessage],
        transcript: transcript,
        videoTitle: videoTitle
      });

      if (response.success) {
        // Add AI response to conversation
        const aiResponse = {
          type: 'answer',
          content: response.answer,
          timestamp: new Date().toISOString()
        };
        
        setConversation(prev => [...prev, aiResponse]);
        setFollowUpQuestion('');
      } else {
        throw new Error(response.error || 'Failed to get answer');
      }
      
    } catch (error) {
      console.error('Failed to ask follow-up question:', error);
      // Add error message to conversation
      const errorMessage = {
        type: 'error',
        content: `Sorry, I couldn't answer that question: ${error.message}`,
        timestamp: new Date().toISOString()
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setAskingFollowUp(false);
    }
  };

  const handleQuestionKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFollowUpSubmit(e);
    }
  };

  const loadConversationHistory = async () => {
    try {
      const result = await chrome.storage.local.get([`conversation_${videoId}`]);
      const savedConversation = result[`conversation_${videoId}`];
      
      if (savedConversation && savedConversation.length > 0) {
        setConversation(savedConversation);
        // If we have a saved conversation, we already have an explanation
        if (savedConversation.some(msg => msg.type === 'explanation')) {
          setShowFollowUp(true);
        }
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  };

  const saveConversationHistory = async () => {
    try {
      await chrome.storage.local.set({
        [`conversation_${videoId}`]: conversation
      });
    } catch (error) {
      console.error('Failed to save conversation history:', error);
    }
  };

  const clearConversationHistory = async () => {
    try {
      await chrome.storage.local.remove([`conversation_${videoId}`]);
      setConversation([]);
      setShowFollowUp(false);
      // Reload the explanation
      loadExplanation();
    } catch (error) {
      console.error('Failed to clear conversation history:', error);
    }
  };

  return (
    <div className="explain-card-backdrop" onClick={handleBackdropClick}>
      <style jsx>{`
        .explain-card-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          backdrop-filter: blur(4px);
        }

        .explain-card {
          background: #1a1a2e;
          border-radius: 16px;
          padding: 24px;
          max-width: 500px;
          width: 90vw;
          max-height: 70vh;
          overflow-y: auto;
          border: 1px solid #16213e;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .header-buttons {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .card-title {
          color: #fff;
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          color: #a0a0a0;
          font-size: 20px;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: #2a2a3e;
          color: #fff;
        }

        .clear-button {
          background: none;
          border: none;
          color: #a0a0a0;
          font-size: 16px;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .clear-button:hover {
          background: #2a2a3e;
          color: #667eea;
          transform: rotate(180deg);
        }

        .loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        .loading-spinner {
          border: 3px solid #667eea;
          border-top: 3px solid transparent;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
          margin-right: 12px;
        }

        .loading-text {
          color: #a0a0a0;
        }

        .explanation-section {
          margin-bottom: 16px;
        }

        .section-title {
          color: #667eea;
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
        }

        .explanation-text {
          margin: 0;
          color: #e0e0e0;
          line-height: 1.6;
          font-size: 14px;
        }

        .key-points-list {
          margin: 0;
          padding-left: 20px;
          color: #e0e0e0;
        }

        .key-points-list li {
          margin-bottom: 4px;
        }

        .footer-note {
          background: #16213e;
          padding: 12px;
          border-radius: 8px;
          border-left: 3px solid #667eea;
          margin-top: 16px;
        }

        .footer-text {
          color: #a0a0a0;
          font-size: 12px;
          margin: 0;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Smooth scroll for content */
        .explain-card {
          scrollbar-width: thin;
          scrollbar-color: #667eea #2a2a3e;
        }

        .explain-card::-webkit-scrollbar {
          width: 6px;
        }

        .explain-card::-webkit-scrollbar-track {
          background: #2a2a3e;
          border-radius: 3px;
        }

        .explain-card::-webkit-scrollbar-thumb {
          background: #667eea;
          border-radius: 3px;
        }

        .explain-card::-webkit-scrollbar-thumb:hover {
          background: #7c8ef0;
        }

        /* Error states */
        .error-container {
          text-align: center;
          padding: 40px 20px;
        }

        .error-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }

        .error-message {
          color: #f87171;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 16px;
        }

        .retry-button {
          background: #667eea;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .retry-button:hover {
          background: #5a6fd8;
        }

        /* Markdown styling */
        .markdown-content {
          line-height: 1.6;
        }

        .markdown-h1 {
          color: #667eea;
          font-size: 20px;
          font-weight: 700;
          margin: 24px 0 12px 0;
          border-bottom: 2px solid #16213e;
          padding-bottom: 8px;
        }

        .markdown-h2 {
          color: #667eea;
          font-size: 18px;
          font-weight: 600;
          margin: 20px 0 10px 0;
          display: flex;
          align-items: center;
        }

        .markdown-h3 {
          color: #a0a0f0;
          font-size: 16px;
          font-weight: 600;
          margin: 16px 0 8px 0;
        }

        .markdown-p {
          color: #e0e0e0;
          font-size: 14px;
          line-height: 1.6;
          margin: 12px 0;
        }

        .markdown-ul {
          color: #e0e0e0;
          margin: 12px 0;
          padding-left: 20px;
        }

        .markdown-li {
          margin: 6px 0;
          line-height: 1.5;
        }

        .markdown-li::marker {
          color: #667eea;
        }

        .markdown-inline-code {
          background: #16213e;
          color: #f0f0f0;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 13px;
        }

        .markdown-code-block {
          background: #16213e;
          color: #f0f0f0;
          padding: 12px;
          border-radius: 6px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 13px;
          display: block;
          overflow-x: auto;
          border-left: 3px solid #667eea;
        }

        .markdown-blockquote {
          background: #16213e;
          border-left: 3px solid #667eea;
          margin: 16px 0;
          padding: 12px 16px;
          border-radius: 0 6px 6px 0;
          color: #d0d0d0;
          font-style: italic;
        }

        /* Emoji styling */
        .markdown-content h2:first-child {
          margin-top: 0;
        }

        /* Make emojis in headings larger */
        .markdown-h2:first-of-type {
          font-size: 20px;
        }

        /* Conversation Styles */
        .conversation-container {
          max-height: 60vh;
          overflow-y: auto;
          margin-bottom: 16px;
        }

        .conversation-message {
          margin-bottom: 16px;
          padding: 12px;
          border-radius: 8px;
          border-left: 3px solid;
        }

        .conversation-message.explanation {
          background: rgba(102, 126, 234, 0.1);
          border-left-color: #667eea;
        }

        .conversation-message.question {
          background: rgba(34, 197, 94, 0.1);
          border-left-color: #22c55e;
        }

        .conversation-message.answer {
          background: rgba(168, 85, 247, 0.1);
          border-left-color: #a855f7;
        }

        .conversation-message.error {
          background: rgba(248, 113, 113, 0.1);
          border-left-color: #f87171;
        }

        .conversation-message.thinking {
          background: rgba(156, 163, 175, 0.1);
          border-left-color: #9ca3af;
        }

        .message-header {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #a0a0a0;
        }

        .message-icon {
          margin-right: 6px;
          font-size: 14px;
        }

        .message-content {
          color: #e0e0e0;
        }

        .simple-text {
          margin: 0;
          color: #e0e0e0;
          font-size: 14px;
          line-height: 1.5;
        }

        .thinking-indicator {
          display: flex;
          align-items: center;
          padding: 8px;
        }

        .thinking-dots {
          display: flex;
          gap: 4px;
        }

        .thinking-dots span {
          width: 6px;
          height: 6px;
          background: #667eea;
          border-radius: 50%;
          animation: thinking 1.4s ease-in-out infinite both;
        }

        .thinking-dots span:nth-child(1) { animation-delay: -0.32s; }
        .thinking-dots span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes thinking {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* Follow-up Question Styles */
        .follow-up-section {
          border-top: 1px solid #2a2a3e;
          padding-top: 16px;
          margin-top: 16px;
        }

        .follow-up-header {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }

        .follow-up-icon {
          margin-right: 8px;
          font-size: 16px;
        }

        .follow-up-title {
          font-size: 14px;
          font-weight: 600;
          color: #e0e0e0;
        }

        .follow-up-form {
          width: 100%;
        }

        .question-input-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .question-input {
          background: #16213e;
          border: 1px solid #2a2a3e;
          border-radius: 6px;
          color: #e0e0e0;
          font-size: 13px;
          line-height: 1.4;
          padding: 10px;
          resize: vertical;
          min-height: 60px;
          font-family: inherit;
        }

        .question-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .question-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .question-input::placeholder {
          color: #6b7280;
        }

        .send-button {
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          align-self: flex-end;
          min-width: 80px;
        }

        .send-button:hover:not(:disabled) {
          background: #5a6fd8;
          transform: translateY(-1px);
        }

        .send-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .button-content {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .button-loading {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .button-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: buttonSpin 1s linear infinite;
        }

        @keyframes buttonSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .send-icon {
          font-size: 12px;
        }

        /* Conversation scrollbar */
        .conversation-container::-webkit-scrollbar {
          width: 4px;
        }

        .conversation-container::-webkit-scrollbar-track {
          background: #2a2a3e;
          border-radius: 2px;
        }

        .conversation-container::-webkit-scrollbar-thumb {
          background: #667eea;
          border-radius: 2px;
        }

        .conversation-container::-webkit-scrollbar-thumb:hover {
          background: #7c8ef0;
        }
      `}</style>

      <div className="explain-card">
        <div className="card-header">
          <h3 className="card-title">🤖 Video Explanation</h3>
          <div className="header-buttons">
            {conversation.length > 1 && (
              <button 
                className="clear-button" 
                onClick={clearConversationHistory}
                title="Start new conversation"
              >
                🔄
              </button>
            )}
            <button className="close-button" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <span className="loading-text">Generating explanation with Gemini AI...</span>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <div className="error-message">{error}</div>
            <button className="retry-button" onClick={loadExplanation}>
              Try Again
            </button>
          </div>
        ) : (
          <div className="explanation-content">
            {/* Conversation Display */}
            <div className="conversation-container">
              {conversation.map((message, index) => (
                <div key={index} className={`conversation-message ${message.type}`}>
                  {message.type === 'explanation' && (
                    <div className="message-header">
                      <span className="message-icon">🤖</span>
                      <span className="message-label">AI Explanation</span>
                    </div>
                  )}
                  {message.type === 'question' && (
                    <div className="message-header">
                      <span className="message-icon">❓</span>
                      <span className="message-label">Your Question</span>
                    </div>
                  )}
                  {message.type === 'answer' && (
                    <div className="message-header">
                      <span className="message-icon">💡</span>
                      <span className="message-label">AI Answer</span>
                    </div>
                  )}
                  {message.type === 'error' && (
                    <div className="message-header">
                      <span className="message-icon">⚠️</span>
                      <span className="message-label">Error</span>
                    </div>
                  )}
                  
                  <div className="message-content">
                    {message.type === 'question' || message.type === 'error' ? (
                      <p className="simple-text">{message.content}</p>
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        className="markdown-content"
                        components={{
                          h1: ({node, ...props}) => <h1 className="markdown-h1" {...props} />,
                          h2: ({node, ...props}) => <h2 className="markdown-h2" {...props} />,
                          h3: ({node, ...props}) => <h3 className="markdown-h3" {...props} />,
                          p: ({node, ...props}) => <p className="markdown-p" {...props} />,
                          ul: ({node, ...props}) => <ul className="markdown-ul" {...props} />,
                          li: ({node, ...props}) => <li className="markdown-li" {...props} />,
                          code: ({node, inline, ...props}) => 
                            inline ? 
                              <code className="markdown-inline-code" {...props} /> : 
                              <code className="markdown-code-block" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="markdown-blockquote" {...props} />
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              
              {askingFollowUp && (
                <div className="conversation-message thinking">
                  <div className="message-header">
                    <span className="message-icon">🤔</span>
                    <span className="message-label">AI is thinking...</span>
                  </div>
                  <div className="thinking-indicator">
                    <div className="thinking-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Follow-up Question Input */}
            {showFollowUp && (
              <div className="follow-up-section">
                <div className="follow-up-header">
                  <span className="follow-up-icon">💬</span>
                  <span className="follow-up-title">Ask a follow-up question</span>
                </div>
                <form onSubmit={handleFollowUpSubmit} className="follow-up-form">
                  <div className="question-input-container">
                    <textarea
                      value={followUpQuestion}
                      onChange={(e) => setFollowUpQuestion(e.target.value)}
                      onKeyPress={handleQuestionKeyPress}
                      placeholder="Ask anything about this video... (Press Enter to send)"
                      className="question-input"
                      rows="3"
                      disabled={askingFollowUp}
                    />
                    <button
                      type="submit"
                      disabled={!followUpQuestion.trim() || askingFollowUp}
                      className="send-button"
                    >
                      {askingFollowUp ? (
                        <span className="button-loading">
                          <div className="button-spinner"></div>
                          Asking...
                        </span>
                      ) : (
                        <span className="button-content">
                          <span className="send-icon">📤</span>
                          Ask
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="footer-note">
              <p className="footer-text">
                💡 This explanation was generated by SuperPlay AI using Gemini. Feel free to ask follow-up questions!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplainCard;