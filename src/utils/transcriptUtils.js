// Utility functions for fetching and processing YouTube video transcripts

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Get current video ID from the page
 */
export function getCurrentVideoId() {
  const url = window.location.href;
  return extractVideoId(url);
}

/**
 * Fetch video transcript using YouTube's internal API (placeholder)
 * This is a simplified version - real implementation would need to handle
 * YouTube's caption API properly
 */
export async function fetchVideoTranscript(videoId) {
  try {
    console.log('Fetching transcript for video:', videoId);
    
    // Placeholder implementation
    // In a real implementation, this would:
    // 1. Fetch caption tracks from YouTube's API
    // 2. Parse the transcript data
    // 3. Return cleaned text
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`
          Welcome to this comprehensive video tutorial. In today's session, we'll be exploring 
          various important concepts that will help you understand the subject matter in depth.

          Let's begin with the fundamentals. Understanding the basic principles is crucial 
          for building a solid foundation. These core concepts form the backbone of everything 
          we'll discuss throughout this presentation.

          Moving forward, we'll examine practical applications. Real-world examples help 
          demonstrate how these concepts work in actual scenarios. This practical approach 
          ensures better comprehension and retention.

          We'll also cover advanced topics and techniques. These more sophisticated elements 
          build upon our foundational knowledge, allowing for deeper understanding and 
          more complex implementations.

          Finally, we'll conclude with actionable insights and next steps. This summary 
          will help you apply what you've learned and continue your learning journey 
          beyond this video.

          Thank you for watching, and remember to subscribe for more educational content.
        `);
      }, 1500);
    });
    
  } catch (error) {
    console.error('Failed to fetch transcript:', error);
    throw new Error('Unable to fetch video transcript');
  }
}

/**
 * Clean and process transcript text
 */
export function cleanTranscript(rawTranscript) {
  if (!rawTranscript) return '';
  
  return rawTranscript
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove timestamp markers (common patterns)
    .replace(/\d{1,2}:\d{2}(?::\d{2})?\s*/g, '')
    // Remove common YouTube auto-caption artifacts
    .replace(/\[Music\]/gi, '')
    .replace(/\[Applause\]/gi, '')
    .replace(/\[Laughter\]/gi, '')
    .replace(/\[.*?\]/g, '')
    // Clean up punctuation
    .replace(/\s+([.,!?])/g, '$1')
    .trim();
}

/**
 * Chunk transcript into smaller pieces for AI processing
 */
export function chunkTranscript(transcript, maxChunkSize = 2000) {
  if (!transcript || transcript.length <= maxChunkSize) {
    return [transcript];
  }

  const chunks = [];
  const sentences = transcript.split(/[.!?]+/);
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    if (currentChunk.length + trimmedSentence.length + 1 <= maxChunkSize) {
      currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk + '.');
      }
      currentChunk = trimmedSentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk + '.');
  }

  return chunks;
}

/**
 * Format timestamp from seconds to MM:SS format
 */
export function formatTimestamp(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Parse timestamp string to seconds
 */
export function parseTimestamp(timestamp) {
  const parts = timestamp.split(':').map(Number);
  
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]; // MM:SS
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
  }
  
  return 0;
}

/**
 * Check if captions are available for the video
 */
export function areCaptionsAvailable() {
  // Check for YouTube's caption button
  const captionButton = document.querySelector('.ytp-subtitles-button');
  return captionButton && !captionButton.classList.contains('ytp-button-disabled');
}

/**
 * Get video duration in seconds
 */
export function getVideoDuration() {
  const video = document.querySelector('video');
  return video ? video.duration : 0;
}

/**
 * Get video title
 */
export function getVideoTitle() {
  const titleElement = document.querySelector('#title h1.ytd-watch-metadata');
  return titleElement ? titleElement.textContent.trim() : 'Unknown Video';
}

/**
 * Validate video ID format
 */
export function isValidVideoId(videoId) {
  return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
}