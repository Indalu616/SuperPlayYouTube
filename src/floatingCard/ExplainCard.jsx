import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

const ExplainCard = ({ videoId, onClose }) => {
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadExplanation();
  }, [videoId]);

  const loadExplanation = async () => {
    setLoading(true);
    setError(null);
    
    try {
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
      `}</style>

      <div className="explain-card">
        <div className="card-header">
          <h3 className="card-title">🤖 Video Explanation</h3>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
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
              {explanation}
            </ReactMarkdown>

            <div className="footer-note">
              <p className="footer-text">
                💡 This explanation was generated by SuperPlay AI using Gemini to help you understand the video content better.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplainCard;