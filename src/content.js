// Content script for SuperPlay AI - injects UI elements into YouTube
let explainButton = null;
let sidebarContainer = null;
let explainCardContainer = null;

// Wait for page to be ready and video to load
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

// Inject the "Explain This Video" button
async function injectExplainButton() {
  try {
    // Wait for the video title area
    const titleContainer = await waitForElement('#title h1.ytd-watch-metadata');
    
    if (!titleContainer || explainButton) return;

    // Create explain button
    explainButton = document.createElement('button');
    explainButton.className = 'superplay-explain-btn';
    explainButton.innerHTML = '🤖 Explain This Video';
    explainButton.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      margin: 8px 0;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    `;

    // Hover effects
    explainButton.addEventListener('mouseenter', () => {
      explainButton.style.transform = 'translateY(-2px)';
      explainButton.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
    });

    explainButton.addEventListener('mouseleave', () => {
      explainButton.style.transform = 'translateY(0)';
      explainButton.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
    });

    // Click handler
    explainButton.addEventListener('click', showExplainCard);

    // Insert after title
    titleContainer.parentNode.insertBefore(explainButton, titleContainer.nextSibling);
    
    console.log('SuperPlay AI: Explain button injected');
  } catch (error) {
    console.error('SuperPlay AI: Failed to inject explain button:', error);
  }
}

// Inject the sidebar
async function injectSidebar() {
  try {
    // Wait for the secondary area (right side of video)
    const secondaryArea = await waitForElement('#secondary');
    
    if (!secondaryArea || sidebarContainer) return;

    // Create sidebar container
    sidebarContainer = document.createElement('div');
    sidebarContainer.id = 'superplay-sidebar';
    sidebarContainer.style.cssText = `
      background: #0f0f23;
      border-radius: 12px;
      margin-bottom: 16px;
      padding: 20px;
      border: 1px solid #272738;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    // Add sidebar content
    sidebarContainer.innerHTML = `
      <div style="color: #fff; font-size: 16px; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center;">
        📋 Smart Summary
        <div style="margin-left: auto; font-size: 12px; background: #667eea; padding: 2px 8px; border-radius: 8px;">
          SuperPlay AI
        </div>
      </div>
      <div id="superplay-summary" style="color: #a0a0a0; font-size: 14px; line-height: 1.5; margin-bottom: 16px;">
        Loading summary...
      </div>
      <div style="color: #fff; font-size: 14px; font-weight: 600; margin-bottom: 8px;">
        📚 Chapters
      </div>
      <div id="superplay-chapters" style="color: #a0a0a0; font-size: 13px;">
        Loading chapters...
      </div>
    `;

    // Insert at the top of secondary area
    secondaryArea.insertBefore(sidebarContainer, secondaryArea.firstChild);
    
    // Load summary and chapters
    loadSummaryAndChapters();
    
    console.log('SuperPlay AI: Sidebar injected');
  } catch (error) {
    console.error('SuperPlay AI: Failed to inject sidebar:', error);
  }
}

// Show explain card (floating overlay)
function showExplainCard() {
  if (explainCardContainer) {
    explainCardContainer.remove();
  }

  explainCardContainer = document.createElement('div');
  explainCardContainer.id = 'superplay-explain-card';
  explainCardContainer.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #1a1a2e;
    border-radius: 16px;
    padding: 24px;
    max-width: 500px;
    width: 90vw;
    max-height: 70vh;
    overflow-y: auto;
    z-index: 10000;
    border: 1px solid #16213e;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  `;

  explainCardContainer.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h3 style="color: #fff; font-size: 18px; font-weight: 600; margin: 0;">
        🤖 Video Explanation
      </h3>
      <button id="close-explain-card" style="background: none; border: none; color: #a0a0a0; font-size: 20px; cursor: pointer;">
        ✕
      </button>
    </div>
    <div id="explanation-content" style="color: #e0e0e0; font-size: 14px; line-height: 1.6;">
      <div style="display: flex; align-items: center; justify-content: center; padding: 40px;">
        <div style="border: 3px solid #667eea; border-top: 3px solid transparent; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite;"></div>
        <span style="margin-left: 12px; color: #a0a0a0;">Generating explanation...</span>
      </div>
    </div>
  `;

  // Add spinner animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  // Close button handler
  explainCardContainer.querySelector('#close-explain-card').addEventListener('click', () => {
    explainCardContainer.remove();
    explainCardContainer = null;
  });

  // Close on backdrop click
  explainCardContainer.addEventListener('click', (e) => {
    if (e.target === explainCardContainer) {
      explainCardContainer.remove();
      explainCardContainer = null;
    }
  });

  document.body.appendChild(explainCardContainer);

  // Load explanation
  loadVideoExplanation();
}

// Placeholder function to load summary and chapters
function loadSummaryAndChapters() {
  setTimeout(() => {
    const summaryEl = document.getElementById('superplay-summary');
    const chaptersEl = document.getElementById('superplay-chapters');
    
    if (summaryEl) {
      summaryEl.innerHTML = `
        This video covers the main concepts and key points in an easy-to-understand format. 
        The AI-generated summary provides insights into the video's content and helps viewers 
        quickly understand the main topics discussed.
      `;
    }

    if (chaptersEl) {
      const chapters = [
        { title: 'Introduction', timestamp: '0:00' },
        { title: 'Main Topic Overview', timestamp: '2:30' },
        { title: 'Key Points Discussion', timestamp: '5:45' },
        { title: 'Examples & Case Studies', timestamp: '8:20' },
        { title: 'Conclusion', timestamp: '12:15' }
      ];

      chaptersEl.innerHTML = chapters.map(chapter => `
        <div style="padding: 6px 0; border-bottom: 1px solid #2a2a3e; cursor: pointer; transition: color 0.2s ease;" 
             onmouseover="this.style.color='#667eea'" 
             onmouseout="this.style.color='#a0a0a0'"
             onclick="seekToTimestamp('${chapter.timestamp}')">
          <div style="font-weight: 500; color: #e0e0e0;">${chapter.title}</div>
          <div style="font-size: 11px; color: #667eea;">${chapter.timestamp}</div>
        </div>
      `).join('');
    }
  }, 2000);
}

// Placeholder function to load video explanation
function loadVideoExplanation() {
  setTimeout(() => {
    const contentEl = document.getElementById('explanation-content');
    if (contentEl) {
      contentEl.innerHTML = `
        <div style="margin-bottom: 16px;">
          <h4 style="color: #667eea; margin: 0 0 8px 0; font-size: 16px;">Simple Explanation:</h4>
          <p style="margin: 0; color: #e0e0e0;">
            This video is like a friendly teacher explaining something cool! Imagine you're learning 
            about a really interesting topic, and someone is breaking it down into easy pieces that 
            anyone can understand. The video takes complex ideas and makes them simple and fun to learn about.
          </p>
        </div>
        <div style="margin-bottom: 16px;">
          <h4 style="color: #667eea; margin: 0 0 8px 0; font-size: 16px;">What You'll Learn:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #e0e0e0;">
            <li>Main concepts explained in simple terms</li>
            <li>Real-world examples you can relate to</li>
            <li>Key takeaways that matter most</li>
          </ul>
        </div>
        <div style="background: #16213e; padding: 12px; border-radius: 8px; border-left: 3px solid #667eea;">
          <small style="color: #a0a0a0;">💡 This explanation was generated by SuperPlay AI to help you understand the video content better.</small>
        </div>
      `;
    }
  }, 3000);
}

// Helper function to seek to timestamp (placeholder)
window.seekToTimestamp = function(timestamp) {
  console.log('Seeking to:', timestamp);
  // This will be implemented with actual YouTube player API later
  alert(`Would seek to ${timestamp} (feature coming soon!)`);
};

// Initialize when page loads
function init() {
  // Check if we're on a YouTube video page
  if (window.location.pathname.includes('/watch')) {
    console.log('SuperPlay AI: Initializing on YouTube video page');
    
    // Inject UI elements
    injectExplainButton();
    injectSidebar();
  }
}

// Handle navigation in single-page app
let currentUrl = window.location.href;
function handleNavigation() {
  if (currentUrl !== window.location.href) {
    currentUrl = window.location.href;
    
    // Clean up existing elements
    if (explainButton) {
      explainButton.remove();
      explainButton = null;
    }
    if (sidebarContainer) {
      sidebarContainer.remove();
      sidebarContainer = null;
    }
    if (explainCardContainer) {
      explainCardContainer.remove();
      explainCardContainer = null;
    }
    
    // Re-initialize on video pages
    setTimeout(init, 1000);
  }
}

// Watch for navigation changes
setInterval(handleNavigation, 1000);

// Initial setup
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}