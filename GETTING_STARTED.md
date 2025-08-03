# 🚀 Quick Start Guide - SuperPlay AI

## 🏃‍♂️ Get Running in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Extension
```bash
npm run build
```

### 3. Load into Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top-right)
3. Click **"Load unpacked"**
4. Select the `dist` folder from this project
5. The SuperPlay AI extension should now appear in your toolbar! 🎉

### 4. Test the Extension
1. **Go to YouTube**: Navigate to any YouTube video
2. **Look for the button**: You'll see "🤖 Explain This Video" below the video title
3. **Check the sidebar**: A "📋 Smart Summary" should appear on the right
4. **Click to test**: Try clicking the explain button to see the floating card
5. **Ask questions**: Use the follow-up question feature to chat about the video

### 5. Configure Settings (Required for AI Features)
1. **Click the extension icon** in your Chrome toolbar
2. **Add your Gemini API key** for real AI features
   - Get your free key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Paste it in the API key field
   - Click "Test Connection" to verify it works
3. **Toggle settings** as needed

## 🎯 What You'll See

### Explain Button
- Beautiful gradient button below YouTube video titles
- Hover effects and smooth animations
- Opens a floating card with video explanation
- Conversational interface for follow-up questions

### Smart Summary Sidebar
- Appears automatically on the right side of videos
- Shows AI-generated summary with beautiful markdown formatting
- Interactive chapters with timestamps and descriptions
- Click chapters to jump to video positions

### Extension Popup
- Clean settings interface
- API key configuration
- Toggle controls for features
- Modern dark theme design

## 🔧 Development Mode

For development with hot reloading:

```bash
# Start development server
npm run dev

# In another terminal, build for extension
npm run build

# Reload extension in Chrome after changes
```

## 🐛 Troubleshooting

### Extension Not Loading?
- Make sure you selected the `dist` folder, not the root project folder
- Check Chrome DevTools console for any errors
- Ensure all dependencies are installed (`npm install`)

### UI Not Appearing on YouTube?
- Refresh the YouTube page after loading the extension
- Check that you're on a video page (`youtube.com/watch?v=...`)
- Open Chrome DevTools and look for "SuperPlay AI" console messages

### Want to See It in Action?
1. Go to any YouTube video
2. Add your Gemini API key in the popup settings
3. The extension will automatically inject UI elements
4. Click the explain button to get real AI-powered explanations
5. Check the sidebar for auto-generated summaries and chapters

## 🎨 Customization

The extension uses a modern dark theme that integrates seamlessly with YouTube. All styling is done with CSS-in-JS for easy customization.

## 🔄 Next Steps

1. **Add your Gemini API key** for real AI-powered features
2. **Test different videos** to see the AI in action
3. **Try different video types** (educational, tech talks, tutorials)
4. **Explore the markdown-formatted responses**
5. **Customize the prompts** in the code for different explanation styles

---

**You're all set! 🚀 Enjoy your AI-powered YouTube experience!**