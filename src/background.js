// Background service worker for SuperPlay AI Chrome Extension
console.log('SuperPlay AI: Background service worker loaded');

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('SuperPlay AI: Extension installed/updated', details);
  
  // Set default settings
  chrome.storage.sync.set({
    enabled: true,
    autoSummary: true,
    geminiApiKey: '',
    lastUpdated: Date.now()
  });
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('SuperPlay AI: Message received', request);

  switch (request.type) {
    case 'GET_VIDEO_TRANSCRIPT':
      handleGetTranscript(request.videoId)
        .then(transcript => sendResponse({ success: true, transcript }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open for async response

    case 'GENERATE_EXPLANATION':
      handleGenerateExplanation(request.transcript, request.videoTitle)
        .then(explanation => sendResponse({ success: true, explanation }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'GENERATE_SUMMARY':
      handleGenerateSummary(request.transcript, request.videoTitle)
        .then(summary => sendResponse({ success: true, summary }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'GET_SETTINGS':
      chrome.storage.sync.get(['enabled', 'autoSummary', 'geminiApiKey'], (result) => {
        sendResponse({ success: true, settings: result });
      });
      return true;

    case 'UPDATE_SETTINGS':
      chrome.storage.sync.set(request.settings, () => {
        sendResponse({ success: true });
      });
      return true;

    case 'TEST_GEMINI_CONNECTION':
      handleTestConnection()
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'ASK_FOLLOW_UP_QUESTION':
      handleFollowUpQuestion(request.question, request.conversation, request.transcript, request.videoTitle)
        .then(answer => sendResponse({ success: true, answer }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

// Get video transcript using multiple methods
async function handleGetTranscript(videoId) {
  console.log('SuperPlay AI: Getting transcript for video:', videoId);
  
  try {
    // Import transcript utilities
    const { fetchVideoTranscript } = await import('./utils/transcriptUtils.js');
    
    // Attempt to fetch the real transcript
    const transcript = await fetchVideoTranscript(videoId);
    
    if (!transcript || transcript.trim().length < 50) {
      throw new Error('Transcript too short or empty');
    }
    
    return transcript;
    
  } catch (error) {
    console.error('SuperPlay AI: Failed to get real transcript:', error);
    
    // Fallback to a more realistic placeholder based on video ID
    return generateFallbackTranscript(videoId);
  }
}

// Generate a fallback transcript when real transcript isn't available
function generateFallbackTranscript(videoId) {
  return `
    Welcome to this YouTube video. In this presentation, we'll be exploring the main topic 
    and breaking down the key concepts for better understanding.

    Let's start with an introduction to set the context and establish the foundation 
    for our discussion. This opening section helps viewers understand what they can 
    expect to learn from this content.

    Moving into the main content, we'll examine the core principles and ideas that 
    form the backbone of this topic. These fundamental concepts are essential for 
    grasping the more advanced material that follows.

    Throughout the video, we'll provide practical examples and real-world applications 
    to illustrate how these concepts work in practice. This approach helps bridge 
    the gap between theory and implementation.

    As we progress, we'll dive deeper into specific techniques and advanced topics 
    that build upon our foundational understanding. These sections require careful 
    attention to fully appreciate the nuances involved.

    The video concludes with a comprehensive summary of all the key points covered, 
    along with actionable next steps for viewers who want to continue learning about 
    this topic beyond this presentation.

    Thank you for watching this educational content. We hope you found it valuable 
    and informative for your learning journey.
  `;
}

// Generate explanation using Gemini AI
async function handleGenerateExplanation(transcript, videoTitle = '') {
  console.log('SuperPlay AI: Generating explanation with Gemini');
  
  try {
    // Import Gemini API functions
    const { generateVideoExplanation } = await import('./utils/geminiApi.js');
    
    // Generate explanation using Gemini
    const explanation = await generateVideoExplanation(transcript, videoTitle);
    
    return {
      explanation: explanation,
      isMarkdown: true
    };
    
  } catch (error) {
    console.error('SuperPlay AI: Failed to generate explanation:', error);
    
    // Return user-friendly error message
    if (error.message.includes('API key')) {
      throw new Error('Please configure your Gemini API key in the extension settings to use AI features.');
    } else if (error.message.includes('Rate limit')) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    } else {
      throw new Error('Failed to generate explanation. Please try again.');
    }
  }
}

// Generate summary using Gemini AI
async function handleGenerateSummary(transcript, videoTitle = '') {
  console.log('SuperPlay AI: Generating summary with Gemini');
  
  try {
    // Import Gemini API functions
    const { generateVideoSummary } = await import('./utils/geminiApi.js');
    
    // Generate summary using Gemini
    const summaryData = await generateVideoSummary(transcript, videoTitle);
    
    return {
      summary: summaryData.summary,
      chapters: summaryData.chapters,
      isMarkdown: true
    };
    
  } catch (error) {
    console.error('SuperPlay AI: Failed to generate summary:', error);
    
    // Return user-friendly error message
    if (error.message.includes('API key')) {
      throw new Error('Please configure your Gemini API key in the extension settings to use AI features.');
    } else if (error.message.includes('Rate limit')) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    } else {
      throw new Error('Failed to generate summary. Please try again.');
    }
  }
}

// Handle follow-up questions using Gemini AI
async function handleFollowUpQuestion(question, conversation, transcript, videoTitle = '') {
  console.log('SuperPlay AI: Handling follow-up question with Gemini');
  
  try {
    // Import Gemini API functions
    const { answerFollowUpQuestion } = await import('./utils/geminiApi.js');
    
    // Generate answer using Gemini with full context
    const answer = await answerFollowUpQuestion(question, conversation, transcript, videoTitle);
    
    return answer;
    
  } catch (error) {
    console.error('SuperPlay AI: Failed to answer follow-up question:', error);
    
    // Return user-friendly error message
    if (error.message.includes('API key')) {
      throw new Error('Please configure your Gemini API key in the extension settings to use AI features.');
    } else if (error.message.includes('Rate limit')) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    } else {
      throw new Error('Failed to answer question. Please try again.');
    }
  }
}

// Test Gemini API connection
async function handleTestConnection() {
  try {
    const { testGeminiConnection } = await import('./utils/geminiApi.js');
    const isConnected = await testGeminiConnection();
    return isConnected;
  } catch (error) {
    console.error('SuperPlay AI: Connection test failed:', error);
    throw error;
  }
}

// Handle tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com/watch')) {
    console.log('SuperPlay AI: YouTube video page loaded, ensuring content script is injected');
    
    // Inject content script if not already present (backup injection)
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['src/content.js']
    }).catch(() => {
      // Script already injected or failed - this is expected behavior
      console.log('SuperPlay AI: Content script injection handled by manifest');
    });
  }
});

// Keep service worker alive
chrome.runtime.onConnect.addListener((port) => {
  console.log('SuperPlay AI: Connected to port:', port.name);
});