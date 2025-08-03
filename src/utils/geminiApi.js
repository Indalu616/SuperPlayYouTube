// Gemini AI API utilities for SuperPlay AI Chrome Extension

/**
 * Gemini API configuration and helper functions
 */

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL_NAME = 'gemini-1.5-flash-latest'; // Using the latest Gemini model

/**
 * Get API key from Chrome storage
 */
async function getApiKey() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['geminiApiKey'], (result) => {
      resolve(result.geminiApiKey || '');
    });
  });
}

/**
 * Make a request to Gemini API
 */
async function callGeminiAPI(prompt, apiKey) {
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please add your API key in the extension settings.');
  }

  const url = `${GEMINI_API_BASE_URL}/${MODEL_NAME}:generateContent?key=${apiKey}`;
  
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
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

  try {
    console.log('SuperPlay AI: Calling Gemini API...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API Error:', errorData);
      
      if (response.status === 400) {
        throw new Error('Invalid API request. Please check your Gemini API key.');
      } else if (response.status === 403) {
        throw new Error('Access denied. Please verify your Gemini API key has the correct permissions.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else {
        throw new Error(`Gemini API error: ${response.status}`);
      }
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Unexpected response format from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    console.log('SuperPlay AI: Gemini API response received');
    
    return generatedText;
    
  } catch (error) {
    console.error('SuperPlay AI: Gemini API call failed:', error);
    throw error;
  }
}

/**
 * Generate video explanation using Gemini
 */
export async function generateVideoExplanation(transcript, videoTitle = '') {
  const apiKey = await getApiKey();
  
  const prompt = `You are an expert educator who explains complex topics in simple, easy-to-understand language. 

**Task**: Explain this YouTube video in a way that a 12-year-old could understand.

**Video Title**: ${videoTitle}

**Video Transcript**: 
${transcript}

**Instructions**:
1. Write a clear, simple explanation of what this video is about
2. Break down complex concepts into easy-to-understand terms
3. Use analogies and examples that kids can relate to
4. Format your response in markdown
5. Include the following sections:

## 🎯 What This Video Is About
[Simple 2-3 sentence summary]

## 🧠 Key Things You'll Learn
[3-5 bullet points of main concepts]

## 🔍 Simple Explanation
[Detailed but simple explanation, 2-3 paragraphs]

## 💡 Why This Matters
[Why someone should care about this topic]

## 🎓 Cool Facts
[2-3 interesting facts or insights from the video]

Make it engaging, fun, and educational!`;

  try {
    const response = await callGeminiAPI(prompt, apiKey);
    return response;
  } catch (error) {
    console.error('Failed to generate explanation:', error);
    throw error;
  }
}

/**
 * Generate video summary and chapters using Gemini
 */
export async function generateVideoSummary(transcript, videoTitle = '') {
  const apiKey = await getApiKey();
  
  const prompt = `You are an expert content analyzer. Analyze this YouTube video and create a comprehensive summary with chapters.

**Video Title**: ${videoTitle}

**Video Transcript**: 
${transcript}

**Instructions**:
1. Create a clear, concise summary
2. Generate logical chapters with estimated timestamps
3. Format everything in markdown
4. Make it professional and useful

Please format your response as JSON with this exact structure:

\`\`\`json
{
  "summary": "A markdown-formatted summary of the video content (2-3 sentences)",
  "chapters": [
    {
      "title": "Chapter Title",
      "timestamp": "0:00",
      "seconds": 0,
      "description": "Brief description of what's covered in this section"
    }
  ]
}
\`\`\`

**Requirements**:
- Summary should be 2-3 sentences in markdown
- Generate 4-8 logical chapters based on content flow
- Timestamps should be realistic (distribute evenly if unclear)
- Each chapter should have a clear, descriptive title
- Include brief descriptions for each chapter
- Use proper markdown formatting in the summary

Analyze the content flow and create meaningful chapters that help viewers navigate the video effectively.`;

  try {
    const response = await callGeminiAPI(prompt, apiKey);
    
    // Extract JSON from the response
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      throw new Error('Could not parse Gemini response as JSON');
    }
    
    const parsedResponse = JSON.parse(jsonMatch[1]);
    
    // Validate the response structure
    if (!parsedResponse.summary || !parsedResponse.chapters || !Array.isArray(parsedResponse.chapters)) {
      throw new Error('Invalid response structure from Gemini');
    }
    
    return parsedResponse;
    
  } catch (error) {
    console.error('Failed to generate summary:', error);
    throw error;
  }
}

/**
 * Answer follow-up questions about the video using conversation context
 */
export async function answerFollowUpQuestion(question, conversation, transcript, videoTitle = '') {
  const apiKey = await getApiKey();
  
  // Build conversation context
  let conversationContext = '';
  if (conversation && conversation.length > 0) {
    conversationContext = conversation.map(msg => {
      switch (msg.type) {
        case 'explanation':
          return `Initial AI Explanation:\n${msg.content}`;
        case 'question':
          return `User Question: ${msg.content}`;
        case 'answer':
          return `AI Answer: ${msg.content}`;
        default:
          return '';
      }
    }).filter(Boolean).join('\n\n');
  }

  const prompt = `You are an expert educator assistant helping users understand a YouTube video. You have already provided an initial explanation, and now the user has a follow-up question.

**Video Title**: ${videoTitle}

**Video Transcript**: 
${transcript}

**Previous Conversation**:
${conversationContext}

**User's Follow-up Question**: ${question}

**Instructions**:
1. Answer the user's specific question based on the video content
2. Reference the previous conversation context when relevant
3. Be conversational and helpful
4. Use markdown formatting for clarity
5. If the question is not related to the video, politely redirect to video-related topics
6. Keep your answer focused and concise (2-4 paragraphs maximum)

**Guidelines**:
- Use a friendly, conversational tone
- Include relevant examples from the video when applicable
- If you need clarification, ask for it
- Use emojis sparingly but appropriately
- Format code or technical terms with backticks when relevant

Answer the question directly and helpfully:`;

  try {
    const response = await callGeminiAPI(prompt, apiKey);
    return response;
  } catch (error) {
    console.error('Failed to answer follow-up question:', error);
    throw error;
  }
}

/**
 * Test Gemini API connection
 */
export async function testGeminiConnection() {
  const apiKey = await getApiKey();
  
  if (!apiKey) {
    throw new Error('No Gemini API key configured');
  }
  
  const testPrompt = "Say 'Hello from Gemini!' if you can hear me.";
  
  try {
    const response = await callGeminiAPI(testPrompt, apiKey);
    return response.includes('Hello from Gemini!') || response.includes('hello') || response.includes('Gemini');
  } catch (error) {
    throw error;
  }
}

/**
 * Get current Gemini API usage info (placeholder for future implementation)
 */
export async function getApiUsage() {
  // This would require additional API endpoints to track usage
  // For now, return a placeholder
  return {
    requestsToday: 0,
    tokensUsed: 0,
    remainingQuota: 'Unknown'
  };
}

/**
 * Validate Gemini API key format
 */
export function isValidGeminiApiKey(apiKey) {
  // Gemini API keys typically start with 'AIza' and are 39 characters long
  return typeof apiKey === 'string' && 
         apiKey.length >= 35 && 
         apiKey.startsWith('AIza');
}