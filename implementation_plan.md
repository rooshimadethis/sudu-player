# Sudu Player Implementation Plan

## Goal Description
Build a premium, mobile-first web application for iOS (Chrome/Safari) that allows users to queue audio/video files, set loop counts for each, and play them in sequence. The app must support background playback (screen off) and persist user data locally.

## User Review Required
> [!IMPORTANT]
> **iOS Background Playback Constraints**: To ensure continuous playback when the screen is off, we will use a **single media element** strategy. Instead of creating new `<audio>`/`<video>` tags for each track, we will swap the `src` attribute of a persistent player element. This prevents iOS from blocking "autoplay" between tracks.

> [!NOTE]
> **Storage Quota**: iOS Safari may clear IndexedDB data after 7 days of inactivity unless the app is added to the Home Screen (PWA). We will strongly encourage the "Add to Home Screen" action in the UI.

## Proposed Changes

### Project Structure (New)
#### [DONE] `src/services/storage.js`
- Wrapper around `idb` to handle Blob storage and retrieval.
- Methods: `saveFile`, `getFile`, `getAllMetadata`, `deleteFile`.

#### [DONE] `src/hooks/usePlayer.js`
- Manages the single HTMLMediaElement ref.
- Handles `ended` events to trigger the next track or loop logic.
- Updates `navigator.mediaSession` metadata.

#### [DONE] `src/components/`
- `Player.jsx`: The main control interface.
- `Playlist.jsx`: Reorderable list of tracks using `framer-motion` with drag-and-drop.
- `FileUploader.jsx`: Handle file input and ingestion into IDB.
- `InstallPrompt.jsx`: Dismissible banner encouraging "Add to Home Screen" for iOS background support.

### Technical Decisions
- **Framework**: React (Vite) for robust state management of the playlist and loop counters.
- **Styling**: Tailwind CSS for rapid, premium styling with dark mode by default.
- **PWA**: Use `vite-plugin-pwa` to generate a manifest and service worker, allowing "Add to Home Screen" which ensures better persistence and full-screen experience.

## Verification Plan

### Automated Tests
- N/A for this initial prototype (speed is priority).

### Manual Verification
1. **Background Play**: Start playback, lock iPhone screen, wait for track end. Verify next track starts automatically.
2. **Looping**: Set a track to loop 2 times. Verify it plays 2 times total before advancing.
3. **Storage**: Load a large video file (>50MB), reload the page, ensure it plays without re-uploading.
4. **Offline**: Turn off WiFi/Data (Airplane Mode) and verify the app loads and plays stored content.
