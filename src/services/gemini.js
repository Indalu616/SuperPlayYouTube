/**
 * SuperPlay AI - Gemini AI Service
 * Handles all Gemini API interactions with comprehensive error handling
 */

import { StorageService } from './storage.js';

export class GeminiService {
  constructor() {
    this.storageService = new StorageService();
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
    this.requestConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
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
  }

  /**
   * Get API key from storage
   */
  async getApiKey() {
    const settings = await this.storageService.getSettings();
    const apiKey = settings.geminiApiKey?.trim();
    
    if (!apiKey) {
      throw new Error('Gemini API key not configured. Please add your API key in the extension settings.');
    }

    if (!this.isValidApiKey(apiKey)) {
      throw new Error('Invalid Gemini API key format. Please check your API key.');
    }

    return apiKey;
  }

  /**
   * Validate API key format
   */
  isValidApiKey(apiKey) {
    return typeof apiKey === 'string' && 
           apiKey.startsWith('AIza') && 
           apiKey.length >= 35;
  }

  /**
   * Make API call to Gemini with comprehensive error handling
   */
  async callGeminiAPI(prompt, retries = 3) {
    const apiKey = await this.getApiKey();
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: this.requestConfig.temperature,
              topK: this.requestConfig.topK,
              topP: this.requestConfig.topP,
              maxOutputTokens: this.requestConfig.maxOutputTokens,
            },
            safetySettings: this.requestConfig.safetySettings
          })
        });

        // Handle HTTP errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          switch (response.status) {
            case 400:
              throw new Error(`Invalid request: ${errorData.error?.message || 'Bad request format'}`);
            case 401:
              throw new Error('Invalid API key. Please check your Gemini API key in settings.');
            case 403:
              throw new Error('API access forbidden. Please verify your API key has the necessary permissions.');
            case 429:
              if (attempt < retries) {
                const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                console.log(`SuperPlay AI: Rate limited, retrying in ${delay}ms (attempt ${attempt}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
              }
              throw new Error('Rate limit exceeded. Please try again in a few minutes.');
            case 500:
              if (attempt < retries) {
                const delay = 2000 * attempt;
                console.log(`SuperPlay AI: Server error, retrying in ${delay}ms (attempt ${attempt}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
              }
              throw new Error('Gemini API server error. Please try again later.');
            default:
              throw new Error(`API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
          }
        }

        const data = await response.json();
        
        // Validate response structure
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
          throw new Error('Invalid response format from Gemini API');
        }

        const content = data.candidates[0].content.parts[0].text;
        if (!content || typeof content !== 'string') {
          throw new Error('Empty or invalid response from Gemini API');
        }

        return content.trim();

      } catch (error) {
        if (attempt === retries) {
          console.error('SuperPlay AI: Gemini API call failed after all retries:', error);
          throw error;
        }
        
        // Don't retry on certain errors
        if (error.message.includes('Invalid API key') || 
            error.message.includes('API access forbidden') ||
            error.message.includes('Invalid request')) {
          throw error;
        }
        
        console.log(`SuperPlay AI: API call failed, attempt ${attempt}/${retries}:`, error.message);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      const testPrompt = "Respond with exactly: 'Connection successful'";
      const response = await this.callGeminiAPI(testPrompt, 1);
      
      if (response.toLowerCase().includes('connection successful')) {
        return { success: true, message: 'Gemini API connection successful!' };
      } else {
        return { success: true, message: 'API responded but with unexpected content. Connection likely works.' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Generate video explanation for 12-year-olds
   */
  async generateVideoExplanation(transcript, videoTitle) {
    if (!transcript || transcript.trim().length < 50) {
      throw new Error('Transcript is too short or empty to generate explanation');
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

    try {
      const explanation = await this.callGeminiAPI(prompt);
      return explanation;
    } catch (error) {
      throw new Error(`Failed to generate explanation: ${error.message}`);
    }
  }

  /**
   * Generate video summary and chapters
   */
  async generateVideoSummary(transcript, videoTitle) {
    if (!transcript || transcript.trim().length < 50) {
      throw new Error('Transcript is too short or empty to generate summary');
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

    try {
      const response = await this.callGeminiAPI(prompt);
      
      // Try to parse JSON response
      let parsedResponse;
      try {
        // Clean up response - remove any markdown code blocks
        const cleanResponse = response.replace(/```json\s*|\s*```/g, '').trim();
        parsedResponse = JSON.parse(cleanResponse);
      } catch (parseError) {
        console.error('SuperPlay AI: Failed to parse JSON response:', parseError);
        throw new Error('AI returned invalid format. Please try again.');
      }

      // Validate response structure
      if (!parsedResponse.summary || !Array.isArray(parsedResponse.chapters)) {
        throw new Error('AI returned incomplete response. Please try again.');
      }

      // Validate and process chapters
      const processedChapters = parsedResponse.chapters.map((chapter, index) => {
        if (!chapter.title || !chapter.description) {
          throw new Error('AI returned invalid chapter format. Please try again.');
        }

        return {
          title: chapter.title.substring(0, 60), // Ensure reasonable length
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
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
  }

  /**
   * Answer follow-up questions about the video
   */
  async answerFollowUpQuestion(question, conversation, transcript, videoTitle) {
    if (!question || question.trim().length < 3) {
      throw new Error('Question is too short');
    }

    // Build conversation context
    let conversationContext = '';
    if (conversation && conversation.length > 0) {
      conversationContext = '\n\nPREVIOUS CONVERSATION:\n';
      conversation.forEach((msg, index) => {
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

    try {
      const answer = await this.callGeminiAPI(prompt);
      return answer;
    } catch (error) {
      throw new Error(`Failed to answer question: ${error.message}`);
    }
  }

  /**
   * Get API usage statistics and limits
   */
  async getApiUsageInfo() {
    // This would require additional API calls to get usage statistics
    // For now, return basic info about limits
    return {
      dailyLimit: 1500, // Free tier limit
      model: 'gemini-1.5-flash-latest',
      maxTokensPerRequest: this.requestConfig.maxOutputTokens,
      note: 'Usage statistics not available through current API'
    };
  }
}