# 🤖 Gemini AI Setup Guide

Complete guide to setting up Google Gemini AI for SuperPlay AI Chrome Extension.

## 🔑 Getting Your Gemini API Key

### Step 1: Visit Google AI Studio
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account

### Step 2: Create API Key
1. Click **"Create API Key"**
2. Choose **"Create API key in new project"** (recommended for new users)
3. Your API key will be generated instantly
4. **Copy the API key** - it should start with `AIza`

### Step 3: Configure in Extension
1. **Open the SuperPlay AI extension popup** (click the extension icon)
2. **Paste your API key** in the "Gemini API Key" field
3. **Click "Test Connection"** to verify it works
4. **Save settings**

## ✅ Verification

### Test Connection
- The extension includes a built-in connection test
- Click "Test Connection" after entering your API key
- You should see: **"Connection successful! 🎉"**

### First AI Request
1. **Go to any YouTube video**
2. **Click "🤖 Explain This Video"** button
3. **Wait for the AI response** (may take 5-15 seconds)
4. **Check the sidebar** for auto-generated summary

## 🎯 What Your API Key Enables

### Real AI Features:
- ✅ **Video Explanations**: Get complex topics explained simply
- ✅ **Smart Summaries**: Auto-generated video summaries
- ✅ **Chapter Generation**: AI-created chapter breakdowns with timestamps
- ✅ **Markdown Formatting**: Beautiful, readable responses
- ✅ **Context-Aware**: Uses video title and transcript for better results

### Without API Key:
- ❌ AI features disabled
- ⚠️ Fallback to placeholder content
- 📝 Manual transcript extraction still works

## 🔧 API Key Management

### Security Best Practices:
- ✅ **Never share your API key publicly**
- ✅ **Store it securely in the extension settings**
- ✅ **Monitor your usage** in Google AI Studio
- ✅ **Regenerate if compromised**

### Usage Monitoring:
1. Visit [Google AI Studio](https://aistudio.google.com)
2. Check your API usage dashboard
3. Monitor rate limits and quotas

## 🚨 Troubleshooting

### Common Issues:

#### "Invalid API request" Error
- **Cause**: Incorrect API key format
- **Fix**: Ensure key starts with `AIza` and is complete

#### "Access denied" Error
- **Cause**: API key doesn't have correct permissions
- **Fix**: Regenerate API key in Google AI Studio

#### "Rate limit exceeded" Error
- **Cause**: Too many requests in short time
- **Fix**: Wait a moment and try again

#### "Connection test failed" Error
- **Cause**: Network issues or invalid key
- **Fix**: Check internet connection and API key

#### "No transcript available" Error
- **Cause**: Video doesn't have captions/transcript
- **Fix**: Try videos with captions enabled

### Getting Help:
- Check the browser console (F12) for detailed error messages
- Verify your API key in Google AI Studio
- Ensure you have internet connectivity

## 💡 Tips for Best Results

### Video Selection:
- ✅ **Educational content** works best
- ✅ **Videos with captions** provide better transcripts
- ✅ **English videos** currently supported best
- ❌ **Music videos** may not have useful transcripts

### Optimal Usage:
- 🎯 **Wait for complete responses** before making new requests
- 🔄 **Use retry buttons** if requests fail
- 📝 **Try different video types** to see AI capabilities
- ⚙️ **Check settings** if features aren't working

## 📊 API Costs & Limits

### Gemini API Pricing:
- **Free tier available** with generous limits
- **Pay-per-use** for higher volumes
- **Check current pricing** at [Google AI Pricing](https://ai.google.dev/pricing)

### Rate Limits:
- **Requests per minute**: Varies by tier
- **Tokens per request**: Limited by model
- **Daily quotas**: Check your dashboard

## 🔄 Advanced Configuration

### Custom Prompts:
You can modify the AI prompts in the code:
- `src/utils/geminiApi.js` - Contains prompt templates
- Customize for different explanation styles
- Adjust for specific use cases

### Model Selection:
- Currently uses: **Gemini 1.5 Flash**
- Fast responses, good quality
- Optimized for real-time use

---

## ✨ Ready to Go!

Your SuperPlay AI extension is now powered by Google Gemini! 

🎉 **Enjoy AI-powered YouTube learning with:**
- Instant video explanations
- Smart summaries and chapters  
- Beautiful markdown formatting
- Context-aware responses

**Happy learning! 🚀**