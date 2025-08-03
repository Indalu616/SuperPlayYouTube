import React, { useState, useEffect } from 'react';

const ExplainCard = ({ videoId, onClose }) => {
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExplanation();
  }, [videoId]);

  const loadExplanation = async () => {
    setLoading(true);
    
    // Simulate API call - replace with actual OpenAI integration later
    setTimeout(() => {
      setExplanation({
        simple: "This video is like a friendly teacher explaining something cool! Imagine you're learning about a really interesting topic, and someone is breaking it down into easy pieces that anyone can understand. The video takes complex ideas and makes them simple and fun to learn about.",
        keyPoints: [
          "Main concepts explained in simple terms",
          "Real-world examples you can relate to",
          "Key takeaways that matter most"
        ]
      });
      setLoading(false);
    }, 3000);
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
            <span className="loading-text">Generating explanation...</span>
          </div>
        ) : (
          <div>
            <div className="explanation-section">
              <h4 className="section-title">Simple Explanation:</h4>
              <p className="explanation-text">{explanation.simple}</p>
            </div>

            <div className="explanation-section">
              <h4 className="section-title">What You'll Learn:</h4>
              <ul className="key-points-list">
                {explanation.keyPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>

            <div className="footer-note">
              <p className="footer-text">
                💡 This explanation was generated by SuperPlay AI to help you understand the video content better.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplainCard;