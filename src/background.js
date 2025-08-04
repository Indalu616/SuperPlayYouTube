/**
 * SuperPlay AI - Background Service Worker
 * Handles AI API calls, settings management, and content script communication
 * NO DOM access - pure service worker functionality
 */

// Constants - copied here to avoid import issues in service worker
const MessageTypes = {
  GET_SETTINGS: 'GET_SETTINGS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  TEST_GEMINI_CONNECTION: 'TEST_GEMINI_CONNECTION',
  GENERATE_EXPLANATION: 'GENERATE_EXPLANATION',
  GENERATE_SUMMARY: 'GENERATE_SUMMARY',
  ASK_FOLLOW_UP_QUESTION: 'ASK_FOLLOW_UP_QUESTION',
  GET_VIDEO_TRANSCRIPT: 'GET_VIDEO_TRANSCRIPT',
  FETCH_TRANSCRIPT_FROM_DOM: 'FETCH_TRANSCRIPT_FROM_DOM',
  GET_VIDEO_INFO: 'GET_VIDEO_INFO',
  GET_VIDEO_INFO_FROM_DOM: 'GET_VIDEO_INFO_FROM_DOM',
  PING: 'PING',
  CONTENT_SCRIPT_READY: 'CONTENT_SCRIPT_READY'
};

const DEFAULT_SETTINGS = {
  enabled: true,
  autoSummary: true,
  geminiApiKey: '',
  lastUpdated: Date.now(),
  version: '1.1.0'
};

console.log('SuperPlay AI: Background service worker loading...');

// Handle extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('SuperPlay AI: Extension installed/updated', details);
  
  try {
    await initializeDefaults();
    console.log('SuperPlay AI: Default settings initialized');
  } catch (error) {
    console.error('SuperPlay AI: Failed to initialize defaults:', error);
  }
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('SuperPlay AI: Message received:', request.type);

  // Handle the message asynchronously
  handleMessage(request, sender, sendResponse);
  
  return true; // Keep message channel open for async response
});

async function handleMessage(request, sender, sendResponse) {
  try {
    switch (request.type) {
      case MessageTypes.GET_SETTINGS:
        await handleGetSettings(sendResponse);
        break;

      case MessageTypes.UPDATE_SETTINGS:
        await handleUpdateSettings(request.settings, sendResponse);
        break;

      case MessageTypes.TEST_GEMINI_CONNECTION:
        await handleTestConnection(sendResponse);
        break;

      case MessageTypes.GET_VIDEO_TRANSCRIPT:
        await handleGetTranscript(request.videoId, request.videoTitle, sendResponse);
        break;

      case MessageTypes.GENERATE_EXPLANATION:
        await handleGenerateExplanation(request, sendResponse);
        break;

      case MessageTypes.GENERATE_SUMMARY:
        await handleGenerateSummary(request, sendResponse);
        break;

      case MessageTypes.ASK_FOLLOW_UP_QUESTION:
        await handleFollowUpQuestion(request, sendResponse);
        break;

      case MessageTypes.GET_VIDEO_INFO:
        await handleGetVideoInfo(request.tabId, sendResponse);
        break;

      default:
        console.warn('SuperPlay AI: Unknown message type:', request.type);
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('SuperPlay AI: Message handler error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Initialize default settings
async function initializeDefaults() {
  try {
    const existing = await getSettings();
    
    const settingsToSet = {};
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      if (existing[key] === undefined) {
        settingsToSet[key] = value;
      }
    }

    if (Object.keys(settingsToSet).length > 0) {
      await chrome.storage.sync.set(settingsToSet);
      console.log('SuperPlay AI: Initialized default settings:', settingsToSet);
    }

    return true;
  } catch (error) {
    console.error('SuperPlay AI: Failed to initialize defaults:', error);
    throw new Error(`Failed to initialize settings: ${error.message}`);
  }
}

// Get settings from storage
async function getSettings() {
  try {
    const keys = Object.keys(DEFAULT_SETTINGS);
    const result = await chrome.storage.sync.get(keys);
    return { ...DEFAULT_SETTINGS, ...result };
  } catch (error) {
    console.error('SuperPlay AI: Failed to get settings:', error);
    return { ...DEFAULT_SETTINGS };
  }
}

// Handle get settings
async function handleGetSettings(sendResponse) {
  try {
    const settings = await getSettings();
    sendResponse({ success: true, settings });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Handle update settings
async function handleUpdateSettings(newSettings, sendResponse) {
  try {
    const settingsWithTimestamp = {
      ...newSettings,
      lastUpdated: Date.now()
    };

    await chrome.storage.sync.set(settingsWithTimestamp);
    console.log('SuperPlay AI: Settings updated:', Object.keys(settingsWithTimestamp));
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('SuperPlay AI: Failed to update settings:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle test connection
async function handleTestConnection(sendResponse) {
  try {
    console.log('SuperPlay AI: Testing Gemini API connection...');
    
    const settings = await getSettings();
    const apiKey = settings.geminiApiKey?.trim();
    
    if (!apiKey) {
      sendResponse({ 
        success: true, 
        result: { success: false, message: 'Gemini API key not configured. Please add your API key in the extension settings.' }
      });
      return;
    }

    if (!isValidApiKey(apiKey)) {
      sendResponse({ 
        success: true, 
        result: { success: false, message: 'Invalid Gemini API key format. Please check your API key.' }
      });
      return;
    }

    const result = await testGeminiConnection(apiKey);
    sendResponse({ success: true, result });
  } catch (error) {
    console.error('SuperPlay AI: Test connection error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Test Gemini API connection
async function testGeminiConnection(apiKey) {
  try {
    const testPrompt = "Respond with exactly: 'Connection successful'";
    const response = await callGeminiAPI(testPrompt, apiKey, 1);
    
    if (response.toLowerCase().includes('connection successful')) {
      return { success: true, message: 'Gemini API connection successful!' };
    } else {
      return { success: true, message: 'API responded but with unexpected content. Connection likely works.' };
    }
  } catch (error) {
    console.error('SuperPlay AI: Connection test failed:', error);
    return { success: false, message: error.message };
  }
}

// Handle get transcript
async function handleGetTranscript(videoId, videoTitle, sendResponse) {
  try {
    console.log('SuperPlay AI: Requesting transcript for video:', videoId);
    
    // Request transcript from content script (which has DOM access)
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]) {
      throw new Error('No active tab found');
    }

    // Send message to content script to fetch transcript
    chrome.tabs.sendMessage(tabs[0].id, {
      type: MessageTypes.FETCH_TRANSCRIPT_FROM_DOM,
      videoId,
      videoTitle
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('SuperPlay AI: Failed to communicate with content script:', chrome.runtime.lastError);
        sendResponse({ 
          success: false, 
          error: 'Failed to communicate with content script. Please refresh the page.' 
        });
        return;
      }

      if (!response || !response.success) {
        console.error('SuperPlay AI: Content script failed to fetch transcript:', response?.error);
        sendResponse({ 
          success: false, 
          error: response?.error || 'Failed to fetch transcript from page' 
        });
        return;
      }

      console.log('SuperPlay AI: Transcript fetched successfully');
      sendResponse({ success: true, transcript: response.transcript });
    });

  } catch (error) {
    console.error('SuperPlay AI: Get transcript error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle generate explanation
async function handleGenerateExplanation(request, sendResponse) {
  try {
    const { transcript, videoTitle } = request;
    console.log('SuperPlay AI: Generating explanation...');

    const explanation = await generateVideoExplanation(transcript, videoTitle);
    sendResponse({ success: true, explanation });
  } catch (error) {
    console.error('SuperPlay AI: Generate explanation error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle generate summary
async function handleGenerateSummary(request, sendResponse) {
  try {
    const { transcript, videoTitle } = request;
    console.log('SuperPlay AI: Generating summary...');

    const result = await generateVideoSummary(transcript, videoTitle);
    sendResponse({ success: true, ...result });
  } catch (error) {
    console.error('SuperPlay AI: Generate summary error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle follow-up question
async function handleFollowUpQuestion(request, sendResponse) {
  try {
    const { question, conversation, transcript, videoTitle } = request;
    console.log('SuperPlay AI: Answering follow-up question...');

    const answer = await answerFollowUpQuestion(question, conversation, transcript, videoTitle);
    sendResponse({ success: true, answer });
  } catch (error) {
    console.error('SuperPlay AI: Follow-up question error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle get video info
async function handleGetVideoInfo(tabId, sendResponse) {
  try {
    chrome.tabs.sendMessage(tabId, {
      type: MessageTypes.GET_VIDEO_INFO_FROM_DOM
    }, (response) => {
      if (chrome.runtime.lastError || !response) {
        sendResponse({ 
          success: false, 
          error: 'Failed to get video info from page' 
        });
        return;
      }
      sendResponse(response);
    });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Validate API key format
function isValidApiKey(apiKey) {
  return typeof apiKey === 'string' && 
         apiKey.startsWith('AIza') && 
         apiKey.length >= 35;
}

// Call Gemini API
async function callGeminiAPI(prompt, apiKey, retries = 3) {
  const baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`SuperPlay AI: Making Gemini API call (attempt ${attempt}/${retries})`);
      
      const requestBody = {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      const response = await fetch(`${baseUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`SuperPlay AI: Received response with status: ${response.status}`);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          errorData = { error: { message: 'Failed to parse error response' } };
        }
        
        console.error('SuperPlay AI: API error response:', errorData);
        
        switch (response.status) {
          case 400:
            throw new Error(`Invalid request: ${errorData.error?.message || 'Bad request format'}`);
          case 401:
            throw new Error('Invalid API key. Please check your Gemini API key in settings.');
          case 403:
            throw new Error('API access forbidden. Please verify your API key has the necessary permissions.');
          case 429:
            if (attempt < retries) {
              const delay = Math.pow(2, attempt) * 1000;
              console.log(`SuperPlay AI: Rate limited, retrying in ${delay}ms`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            throw new Error('Rate limit exceeded. Please try again in a few minutes.');
          case 500:
            if (attempt < retries) {
              const delay = 2000 * attempt;
              console.log(`SuperPlay AI: Server error, retrying in ${delay}ms`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            throw new Error('Gemini API server error. Please try again later.');
          default:
            throw new Error(`API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
        }
      }

      const data = await response.json();
      console.log('SuperPlay AI: API response received successfully');
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('SuperPlay AI: Invalid response structure:', data);
        throw new Error('Invalid response format from Gemini API');
      }

      const content = data.candidates[0].content.parts[0].text;
      if (!content || typeof content !== 'string') {
        console.error('SuperPlay AI: Empty or invalid content:', content);
        throw new Error('Empty or invalid response from Gemini API');
      }

      console.log('SuperPlay AI: API call successful, content length:', content.length);
      return content.trim();

    } catch (error) {
      console.error(`SuperPlay AI: API call attempt ${attempt} failed:`, error);
      
      if (attempt === retries) {
        throw error;
      }
      
      if (error.message.includes('Invalid API key') || 
          error.message.includes('API access forbidden') ||
          error.message.includes('Invalid request')) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// Generate video explanation
async function generateVideoExplanation(transcript, videoTitle) {
  if (!transcript || transcript.trim().length < 50) {
    throw new Error('Transcript is too short or empty to generate explanation');
  }

  const settings = await getSettings();
  const apiKey = settings.geminiApiKey?.trim();
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const prompt = `You are an expert educator who explains complex topics in simple terms. 

VIDEO TITLE: "${videoTitle}"

TRANSCRIPT: ${transcript}

Please create a comprehensive explanation of this video that a 12-year-old would easily understand. Use this exact structure and write in markdown:

# 🎬 What This Video Is About

[Write 2-3 sentences explaining the main topic in very simple terms]

# 🎯 Key Things You'll Learn

[List 4-6 main takeaways as bullet points, each explained simply]

# 🧠 Simple Explanation

[Break down the content into easy-to-understand sections with clear headings. Use analogies, examples, and simple language. Make it engaging and fun to read.]

# 🌟 Why This Matters

[Explain why this topic is important or useful in their daily life]

# 🔥 Cool Facts

[Share 2-3 interesting or surprising facts from the video that would excite a young person]

# 💡 Questions to Think About

[Provide 2-3 thought-provoking questions related to the video content]

Important guidelines:
- Use simple vocabulary and short sentences
- Include emojis to make it engaging
- Use analogies to familiar things
- Avoid jargon or technical terms
- Make it conversational and friendly
- If the video contains inappropriate content, focus on educational aspects only`;

  return await callGeminiAPI(prompt, apiKey);
}

// Generate video summary
async function generateVideoSummary(transcript, videoTitle) {
  if (!transcript || transcript.trim().length < 50) {
    throw new Error('Transcript is too short or empty to generate summary');
  }

  const settings = await getSettings();
  const apiKey = settings.geminiApiKey?.trim();
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const prompt = `Analyze this video and create a summary with chapters.

VIDEO TITLE: "${videoTitle}"

TRANSCRIPT: ${transcript}

Please respond with ONLY a valid JSON object in this exact format:

{
  "summary": "A concise 2-3 sentence summary of the main points covered in the video, written in markdown format",
  "chapters": [
    {
      "title": "Chapter title (short and descriptive)",
      "timestamp": "0:00",
      "seconds": 0,
      "description": "Brief description of what's covered in this section"
    }
  ]
}

Guidelines:
- Create 3-8 logical chapters based on topic changes in the transcript
- Estimate timestamps based on content flow (distribute evenly if unclear)
- Keep chapter titles under 50 characters
- Keep descriptions under 100 characters  
- Summary should be engaging and informative
- Use markdown formatting for emphasis in summary
- Ensure all JSON is properly formatted and valid`;

  const response = await callGeminiAPI(prompt, apiKey);
  
  try {
    const cleanResponse = response.replace(/```json\s*|\s*```/g, '').trim();
    const parsedResponse = JSON.parse(cleanResponse);
    
    if (!parsedResponse.summary || !Array.isArray(parsedResponse.chapters)) {
      throw new Error('AI returned incomplete response. Please try again.');
    }

    const processedChapters = parsedResponse.chapters.map((chapter, index) => {
      if (!chapter.title || !chapter.description) {
        throw new Error('AI returned invalid chapter format. Please try again.');
      }

      return {
        title: chapter.title.substring(0, 60),
        timestamp: chapter.timestamp || `${index * 2}:00`,
        seconds: chapter.seconds || index * 120,
        description: chapter.description.substring(0, 120)
      };
    });

    return {
      summary: parsedResponse.summary,
      chapters: processedChapters
    };

  } catch (error) {
    throw new Error(`Failed to parse summary response: ${error.message}`);
  }
}

// Answer follow-up question
async function answerFollowUpQuestion(question, conversation, transcript, videoTitle) {
  if (!question || question.trim().length < 3) {
    throw new Error('Question is too short');
  }

  const settings = await getSettings();
  const apiKey = settings.geminiApiKey?.trim();
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  let conversationContext = '';
  if (conversation && conversation.length > 0) {
    conversationContext = '\n\nPREVIOUS CONVERSATION:\n';
    conversation.forEach((msg) => {
      if (msg.type === 'user') {
        conversationContext += `User: ${msg.content}\n`;
      } else if (msg.type === 'ai') {
        conversationContext += `AI: ${msg.content.substring(0, 200)}...\n`;
      }
    });
  }

  const prompt = `You are an AI assistant helping someone understand a YouTube video. Answer their follow-up question based on the video content.

VIDEO TITLE: "${videoTitle}"

FULL TRANSCRIPT: ${transcript}${conversationContext}

USER'S NEW QUESTION: "${question}"

Please provide a helpful, accurate answer based on the video content. Guidelines:
- Answer directly and conversationally
- Reference specific parts of the video when relevant
- If the question is not related to the video, politely redirect to video topics
- Use markdown formatting for better readability
- Keep your response focused and not too long (aim for 2-4 paragraphs)
- Be friendly and encouraging
- If you're not sure about something, say so rather than guessing`;

  return await callGeminiAPI(prompt, apiKey);
}


console.log('SuperPlay AI: Background service worker ready');
// Keep service worker alive
chrome.runtime.onConnect.addListener((port) => {
  console.log('SuperPlay AI: Connected to port:', port.name);
});



