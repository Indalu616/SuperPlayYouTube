import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Sidebar = ({ videoId }) => {
  const [summary, setSummary] = useState('');
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSummaryAndChapters();
  }, [videoId]);

  const loadSummaryAndChapters = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get video title for context
      const videoTitle = getVideoTitle();
      
      // First get the transcript
      const transcript = await getVideoTranscript(videoId);
      
      // Then generate summary using Gemini
      const response = await chrome.runtime.sendMessage({
        type: 'GENERATE_SUMMARY',
        transcript: transcript,
        videoTitle: videoTitle
      });

      if (response.success) {
        setSummary(response.summary.summary);
        setChapters(response.summary.chapters || []);
      } else {
        throw new Error(response.error || 'Failed to generate summary');
      }
      
    } catch (error) {
      console.error('Failed to load summary:', error);
      setError(error.message);
      // Set fallback content
      setSummary('Unable to generate summary. Please check your Gemini API key in settings.');
      setChapters([]);
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

  const seekToTimestamp = (seconds) => {
    try {
      // Get YouTube player and seek to timestamp
      const video = document.querySelector('video');
      if (video) {
        video.currentTime = seconds;
        video.play();
      }
    } catch (error) {
      console.error('Failed to seek to timestamp:', error);
      alert(`Would seek to ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} (feature in development)`);
    }
  };

  return (
    <div className="superplay-sidebar">
      <style jsx>{`
        .superplay-sidebar {
          background: #0f0f23;
          border-radius: 12px;
          margin-bottom: 16px;
          padding: 20px;
          border: 1px solid #272738;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .sidebar-header {
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
        }

        .sidebar-badge {
          margin-left: auto;
          font-size: 12px;
          background: #667eea;
          padding: 2px 8px;
          border-radius: 8px;
          color: white;
        }

        .summary-content {
          color: #a0a0a0;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 16px;
        }

        .chapters-header {
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .chapters-list {
          color: #a0a0a0;
          font-size: 13px;
        }

        .chapter-item {
          padding: 8px 0;
          border-bottom: 1px solid #2a2a3e;
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 4px;
          padding: 8px;
          margin-bottom: 4px;
        }

        .chapter-item:hover {
          background: #16213e;
          color: #667eea;
        }

        .chapter-title {
          font-weight: 500;
          color: #e0e0e0;
          margin-bottom: 2px;
        }

        .chapter-timestamp {
          font-size: 11px;
          color: #667eea;
        }

        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .spinner {
          border: 3px solid #667eea;
          border-top: 3px solid transparent;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
          margin-right: 10px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-state {
          text-align: center;
          padding: 12px;
        }

        .error-text {
          color: #f87171;
          font-size: 12px;
          display: block;
          margin-bottom: 8px;
        }

        .retry-btn {
          background: #667eea;
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .retry-btn:hover {
          background: #5a6fd8;
        }

        .summary-markdown {
          line-height: 1.5;
        }

        .summary-p {
          margin: 8px 0;
          color: #a0a0a0;
          font-size: 14px;
        }

        .summary-strong {
          color: #e0e0e0;
          font-weight: 600;
        }

        .summary-em {
          color: #c0c0c0;
          font-style: italic;
        }

        .chapter-description {
          font-size: 11px;
          color: #808080;
          margin-top: 2px;
          line-height: 1.3;
        }

        .no-chapters {
          text-align: center;
          color: #808080;
          font-size: 12px;
          padding: 12px;
          font-style: italic;
        }
      `}</style>

      <div className="sidebar-header">
        📋 Smart Summary
        <div className="sidebar-badge">SuperPlay AI</div>
      </div>

      <div className="summary-content">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <span>Generating with Gemini AI...</span>
          </div>
        ) : error ? (
          <div className="error-state">
            <span className="error-text">{error}</span>
            <button className="retry-btn" onClick={loadSummaryAndChapters}>
              Retry
            </button>
          </div>
        ) : (
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            className="summary-markdown"
            components={{
              p: ({node, ...props}) => <p className="summary-p" {...props} />,
              strong: ({node, ...props}) => <strong className="summary-strong" {...props} />,
              em: ({node, ...props}) => <em className="summary-em" {...props} />
            }}
          >
            {summary}
          </ReactMarkdown>
        )}
      </div>

      <div className="chapters-header">📚 Chapters</div>
      
      <div className="chapters-list">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <span>Generating chapters...</span>
          </div>
        ) : error ? (
          <div className="error-state">
            <span className="error-text">Failed to load chapters</span>
          </div>
        ) : chapters.length > 0 ? (
          chapters.map((chapter, index) => (
            <div
              key={index}
              className="chapter-item"
              onClick={() => seekToTimestamp(chapter.seconds)}
            >
              <div className="chapter-title">{chapter.title}</div>
              <div className="chapter-timestamp">{chapter.timestamp}</div>
              {chapter.description && (
                <div className="chapter-description">{chapter.description}</div>
              )}
            </div>
          ))
        ) : (
          <div className="no-chapters">
            No chapters available for this video
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;