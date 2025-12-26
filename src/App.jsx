import React, { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { FileUploader } from './components/FileUploader';
import { Playlist } from './components/Playlist';
import { Player } from './components/Player';
import { InstallPrompt } from './components/InstallPrompt';
import { StorageService } from './services/storage';
import { usePlayer } from './hooks/usePlayer';

function App() {
  const [tracks, setTracks] = useState([]);
  const player = usePlayer(tracks, setTracks);

  const loadTracks = async () => {
    const metadata = await StorageService.getAllMetadata();
    // Sort by order ascending, then addedAt descending
    setTracks(metadata.sort((a, b) => {
      if (typeof a.order === 'number' && typeof b.order === 'number') {
        return a.order - b.order;
      }
      return b.addedAt - a.addedAt;
    }));
  };

  const handleReorder = (newTracks) => {
    setTracks(newTracks);
    // Persist order asynchronously
    newTracks.forEach((track, index) => {
      if (track.order !== index) {
        StorageService.updateMetadata(track.id, { order: index });
      }
    });
  };

  useEffect(() => {
    loadTracks();
  }, []);

  const handleDelete = async (id) => {
    if (confirm('Delete this track?')) {
      await StorageService.deleteFile(id);
      loadTracks();
    }
  };

  const handleUpdateLoop = async (id, count) => {
    const newCount = Math.max(1, parseInt(count) || 1);
    await StorageService.updateMetadata(id, { loopCount: newCount });
    loadTracks();
  };

  return (
    <div className="flex flex-col min-h-screen pb-32 bg-neutral-900 text-white font-sans selection:bg-purple-500/30">
      <div className="p-6 max-w-xl mx-auto w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Sudu Library
          </h1>
          <p className="text-neutral-400 text-sm mt-1">Background-capable media queue</p>
        </header>

        <FileUploader onUploadComplete={loadTracks} />

        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-semibold">Diffuser Queue</h2>
            <span className="text-xs font-mono text-neutral-500">{tracks.length} items</span>
          </div>

          <Playlist
            tracks={tracks}
            currentTrack={player.currentTrack}
            onPlayTrack={player.playTrack}
            onUpdateLoop={handleUpdateLoop}
            onDelete={handleDelete}
            onReorder={handleReorder}
          />
        </div>
      </div>

      <InstallPrompt />

      {tracks.length > 0 && !player.currentTrack && (
        <button
          onClick={() => player.play()}
          className="fixed bottom-8 right-8 p-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full shadow-2xl shadow-purple-900/40 hover:scale-105 active:scale-95 transition-all z-40 animate-in fade-in zoom-in duration-300"
          aria-label="Start Playback"
        >
          <Play className="w-8 h-8 fill-current translate-x-0.5" />
        </button>
      )}

      <Player playerControl={player} />
    </div>
  );
}

export default App;
