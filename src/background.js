// Background service worker for SuperPlay AI Chrome Extension
console.log('SuperPlay AI: Background service worker loaded');

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('SuperPlay AI: Extension installed/updated', details);
  
  // Set default settings
  chrome.storage.sync.set({
    enabled: true,
    autoSummary: true,
    apiKey: '',
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
      handleGenerateExplanation(request.transcript)
        .then(explanation => sendResponse({ success: true, explanation }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'GENERATE_SUMMARY':
      handleGenerateSummary(request.transcript)
        .then(summary => sendResponse({ success: true, summary }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'GET_SETTINGS':
      chrome.storage.sync.get(['enabled', 'autoSummary', 'apiKey'], (result) => {
        sendResponse({ success: true, settings: result });
      });
      return true;

    case 'UPDATE_SETTINGS':
      chrome.storage.sync.set(request.settings, () => {
        sendResponse({ success: true });
      });
      return true;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

// Placeholder function to get video transcript
async function handleGetTranscript(videoId) {
  console.log('SuperPlay AI: Getting transcript for video:', videoId);
  
  // Placeholder implementation - will be replaced with actual transcript fetching
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`
        Welcome to this video about interesting topics. In this video, we'll explore various concepts
        that will help you understand the subject matter better. 

        First, let's start with the introduction where we'll cover the basic fundamentals.
        This will give you a solid foundation to build upon.

        Next, we'll dive into the main topic overview. Here, we'll discuss the key principles
        and core ideas that form the backbone of our discussion.

        Moving forward, we'll examine some key points in detail. These points are crucial
        for understanding how everything connects together.

        We'll also look at practical examples and case studies. These real-world applications
        will help you see how the concepts work in practice.

        Finally, we'll wrap up with a conclusion that summarizes everything we've covered
        and provides you with actionable next steps.

        Thank you for watching, and I hope you found this content valuable and informative.
      `);
    }, 1000);
  });
}

// Placeholder function to generate explanation using OpenAI
async function handleGenerateExplanation(transcript) {
  console.log('SuperPlay AI: Generating explanation');
  
  // Get API key from storage
  const settings = await chrome.storage.sync.get(['apiKey']);
  
  if (!settings.apiKey) {
    // Return placeholder explanation if no API key
    return {
      simple: "This video is like a friendly teacher explaining something cool! The content breaks down complex ideas into easy-to-understand pieces. It's designed to help you learn new concepts in a way that makes sense, using examples and explanations that anyone can follow.",
      keyPoints: [
        "Clear explanations of main concepts",
        "Step-by-step breakdown of complex topics", 
        "Practical examples and real-world applications",
        "Easy-to-follow learning progression"
      ]
    };
  }

  // TODO: Implement actual OpenAI API call
  // For now, return placeholder response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        simple: "This video teaches you about an interesting topic in a simple way! Think of it like having a smart friend explain something cool to you. The video breaks down complicated stuff into bite-sized pieces that are easy to understand and remember.",
        keyPoints: [
          "Main concepts explained simply",
          "Real examples you can relate to",
          "Step-by-step learning approach",
          "Key takeaways that matter most"
        ]
      });
    }, 2000);
  });
}

// Placeholder function to generate summary using OpenAI
async function handleGenerateSummary(transcript) {
  console.log('SuperPlay AI: Generating summary');
  
  // Get API key from storage
  const settings = await chrome.storage.sync.get(['apiKey']);
  
  if (!settings.apiKey) {
    // Return placeholder summary if no API key
    return {
      summary: "This video provides a comprehensive overview of key concepts, starting with foundational principles and building up to more advanced applications. The content is structured to help viewers understand complex topics through clear explanations and practical examples.",
      chapters: [
        { title: 'Introduction & Overview', timestamp: '0:00', seconds: 0 },
        { title: 'Core Concepts', timestamp: '2:30', seconds: 150 },
        { title: 'Detailed Discussion', timestamp: '5:45', seconds: 345 },
        { title: 'Practical Examples', timestamp: '8:20', seconds: 500 },
        { title: 'Conclusion & Next Steps', timestamp: '12:15', seconds: 735 }
      ]
    };
  }

  // TODO: Implement actual OpenAI API call
  // For now, return placeholder response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        summary: "This educational video covers important concepts in a structured and accessible way. The presenter guides viewers through the topic methodically, ensuring clear understanding at each step before moving to more complex ideas.",
        chapters: [
          { title: 'Welcome & Introduction', timestamp: '0:00', seconds: 0 },
          { title: 'Foundation Concepts', timestamp: '2:15', seconds: 135 },
          { title: 'Key Principles', timestamp: '4:45', seconds: 285 },
          { title: 'Advanced Topics', timestamp: '7:30', seconds: 450 },
          { title: 'Practical Applications', timestamp: '10:00', seconds: 600 },
          { title: 'Summary & Conclusion', timestamp: '12:45', seconds: 765 }
        ]
      });
    }, 1500);
  });
}

// Helper function to make OpenAI API calls (placeholder)
async function callOpenAI(prompt, apiKey) {
  // This will be implemented later with actual OpenAI API integration
  console.log('SuperPlay AI: Would call OpenAI with prompt:', prompt.substring(0, 100) + '...');
  
  // Placeholder response
  return {
    choices: [{
      message: {
        content: "Placeholder AI response - implement actual OpenAI integration here"
      }
    }]
  };
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


