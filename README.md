# 🚀 SuperPlay AI - Chrome Extension

**AI-powered YouTube enhancer with smart summaries and explanations**

SuperPlay AI is a powerful Chrome extension that brings artificial intelligence directly to YouTube, helping you understand video content better with instant summaries, chapter breakdowns, and simplified explanations.

## ✨ Features

### 🤖 Explain This Video
- **One-click explanations**: Click the "🤖 Explain This Video" button below any YouTube video title
- **Simple language**: Get complex topics explained "like you're 12"
- **Beautiful overlay**: Clean, modern floating card design
- **Smart insights**: Key takeaways and learning points extracted

### 📋 Smart Summary + Chapters
- **Auto-generated summaries**: Instant video content overview
- **Interactive chapters**: Click to jump to specific timestamps
- **Elegant sidebar**: Seamlessly integrated into YouTube's layout
- **Time-stamped navigation**: Easy video navigation with AI-generated chapters

## 🛠️ Tech Stack

- **Frontend**: Vite + React + JavaScript
- **Styling**: Custom Tailwind-like CSS for modern UI
- **AI**: OpenAI API (GPT-4/GPT-4o)
- **Platform**: Chrome Extension (Manifest V3)
- **Architecture**: Content script injection with React components

## 📦 Installation

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd superplay-ai-extension
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure OpenAI API Key**
   - Copy `.env` file and add your OpenAI API key
   - Or set it later through the extension popup

4. **Build the extension**
   ```bash
   npm run build
   ```

5. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

### Production Build

```bash
npm run build
```

The built extension will be in the `dist` folder, ready for Chrome Web Store submission.

## 🎯 How It Works

### Architecture Overview

```
YouTube Page
├── Content Script (content.js)
│   ├── Injects "Explain" button
│   ├── Injects Smart Summary sidebar
│   └── Handles UI interactions
├── Background Service Worker (background.js)
│   ├── Manages API calls
│   ├── Handles transcript fetching
│   └── Processes OpenAI responses
└── React Components
    ├── ExplainCard.jsx (floating overlay)
    ├── Sidebar.jsx (summary + chapters)
    └── Popup.jsx (settings)
```

### Key Components

1. **Content Script**: Injects UI elements into YouTube pages
2. **Background Worker**: Handles API calls and data processing
3. **React Components**: Modern UI with smooth animations
4. **Transcript Utils**: YouTube transcript extraction and processing

## 🔧 Configuration

### Extension Settings

Access settings by clicking the SuperPlay AI icon in your Chrome toolbar:

- **Enable/Disable**: Toggle extension functionality
- **Auto Summary**: Automatically generate summaries for videos
- **OpenAI API Key**: Configure your API key for AI features

### API Key Setup

1. Get your OpenAI API key from [platform.openai.com](https://platform.openai.com)
2. Open the extension popup
3. Enter your API key in the settings
4. Save settings

## 🎨 UI Features

### Modern Design
- **Dark theme**: Consistent with YouTube's design language
- **Smooth animations**: Polished micro-interactions
- **Responsive layout**: Works on all screen sizes
- **Accessibility**: Screen reader friendly

### Interactive Elements
- **Hover effects**: Beautiful button interactions
- **Loading states**: Elegant spinners and transitions
- **Click-to-seek**: Jump to video timestamps from chapters
- **Keyboard shortcuts**: Quick access to features

## 🚧 Development

### Project Structure

```
superplay-ai-extension/
├── public/
│   └── icons/           # Extension icons
├── src/
│   ├── background.js    # Service worker
│   ├── content.js       # Content script
│   ├── manifest.json    # Extension manifest
│   ├── popup/
│   │   ├── Popup.jsx    # Settings popup
│   │   └── popup.html   # Popup HTML
│   ├── sidebar/
│   │   └── Sidebar.jsx  # Summary sidebar
│   ├── floatingCard/
│   │   └── ExplainCard.jsx # Explanation overlay
│   ├── utils/
│   │   └── transcriptUtils.js # Transcript processing
│   └── main.jsx         # React entry point
├── vite.config.js       # Vite configuration
└── package.json         # Dependencies
```

### Development Commands

```bash
# Start development build (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Tips

1. **Chrome DevTools**: Use to debug content scripts and background workers
2. **React DevTools**: Install for component debugging
3. **Extension Reloading**: Use `chrome://extensions/` to reload during development
4. **Console Logging**: Check both page console and extension console

## 🌟 Features Roadmap

### Current (v1.0.0)
- ✅ Basic UI injection
- ✅ Placeholder AI responses
- ✅ Modern React components
- ✅ Chrome Extension architecture

### Coming Soon (v1.1.0)
- 🔄 Real OpenAI API integration
- 🔄 YouTube transcript extraction
- 🔄 Improved chapter detection
- 🔄 Multiple language support

### Future (v2.0.0)
- 📝 Custom prompts
- 🎯 Topic-specific explanations
- 📊 Learning analytics
- 🔗 Social sharing features

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Issues**: Report bugs on GitHub Issues
- **Features**: Request features on GitHub Discussions
- **Documentation**: Check the wiki for detailed guides

## 🙏 Acknowledgments

- **OpenAI**: For providing the AI capabilities
- **YouTube**: For the platform we enhance
- **React**: For the component framework
- **Vite**: For the build tooling
- **Chrome Extensions**: For the platform APIs

---

**Made with ❤️ for the YouTube learning community**

*SuperPlay AI - Making video learning smarter, one explanation at a time.*
