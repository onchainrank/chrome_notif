# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension that connects to the onchainrank server via WebSocket to receive real-time notifications about meme coin launches. The extension plays audio notifications and automatically opens relevant URLs in new tabs based on user preferences.

## Development Commands

This project has no build system - it's a vanilla JavaScript Chrome extension. No npm/yarn commands needed.

### Testing the Extension
1. Load unpacked extension in Chrome: `chrome://extensions/` → Enable Developer mode → Load unpacked
2. Open extension options page to test functionality
3. Check browser console for JavaScript errors

### Deployment
Copy all files to extension directory:
- `manifest.json` (extension configuration)
- `background.js` (service worker)
- `options.html`, `options.js` (UI and main logic)
- `socket.io.min.js` (WebSocket client library)
- Audio files: `notif.wav`
- Icons: `ocr-blue-*.png`, `logo.png`

## Architecture

### Core Components
- **Background Script** (`background.js`): Minimal service worker that opens options page when extension icon is clicked
- **Options Page** (`options.html` + `options.js`): Main UI and all business logic including:
  - WebSocket connection management using Socket.IO
  - API key storage via Chrome storage API
  - Audio notification playback
  - Tab management for opening URLs
  - Settings persistence

### Key Features
- **Real-time WebSocket Connection**: Connects to `https://ws.onchainrank.com` with API key authentication
- **Notification Filtering**: Multiple checkbox options to filter which events trigger notifications
- **Audio Notifications**: Plays `notif.wav` with volume control
- **URL Management**: Opens Bullx URLs automatically, with optional website/social URLs
- **Persistent Storage**: Uses `chrome.storage.sync` for API keys and settings

### Data Flow
1. User configures API key and preferences in options page
2. Extension connects to WebSocket server with token authentication
3. Server sends `notify` events with URL and metadata
4. Extension filters events based on user preferences
5. Valid events trigger audio, increment counter, and open tabs

### Storage Schema
Chrome storage contains:
- `apiKey`: User's authentication token
- `openWebsite`, `openXcom`, `openOnlyUnique`, `openValidLaunch`: Boolean preferences
- `notificationVolume`: Integer 0-100

## Important Notes

- Extension only works while options page is open (stated limitation)
- No external dependencies beyond Socket.IO CDN library
- Uses Chrome Extension Manifest V3
- Requires `tabs` and `storage` permissions
- Server URL is hardcoded in `options.js:129`