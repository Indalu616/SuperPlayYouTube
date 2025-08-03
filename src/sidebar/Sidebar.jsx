import React, { useState, useEffect } from 'react';

const Sidebar = ({ videoId }) => {
  const [summary, setSummary] = useState('');
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummaryAndChapters();
  }, [videoId]);

  const loadSummaryAndChapters = async () => {
    setLoading(true);
    
    // Simulate API call - replace with actual OpenAI integration later
    setTimeout(() => {
      setSummary(
        "This video covers the main concepts and key points in an easy-to-understand format. " +
        "The AI-generated summary provides insights into the video's content and helps viewers " +
        "quickly understand the main topics discussed."
      );
      
      setChapters([
        { title: 'Introduction', timestamp: '0:00', seconds: 0 },
        { title: 'Main Topic Overview', timestamp: '2:30', seconds: 150 },
        { title: 'Key Points Discussion', timestamp: '5:45', seconds: 345 },
        { title: 'Examples & Case Studies', timestamp: '8:20', seconds: 500 },
        { title: 'Conclusion', timestamp: '12:15', seconds: 735 }
      ]);
      
      setLoading(false);
    }, 2000);
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
      `}</style>

      <div className="sidebar-header">
        📋 Smart Summary
        <div className="sidebar-badge">SuperPlay AI</div>
      </div>

      <div className="summary-content">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <span>Loading summary...</span>
          </div>
        ) : (
          summary
        )}
      </div>

      <div className="chapters-header">📚 Chapters</div>
      
      <div className="chapters-list">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <span>Loading chapters...</span>
          </div>
        ) : (
          chapters.map((chapter, index) => (
            <div
              key={index}
              className="chapter-item"
              onClick={() => seekToTimestamp(chapter.seconds)}
            >
              <div className="chapter-title">{chapter.title}</div>
              <div className="chapter-timestamp">{chapter.timestamp}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;