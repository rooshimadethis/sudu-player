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
  const [relinkId, setRelinkId] = useState(null);
  const relinkInputRef = React.useRef(null);
  const player = usePlayer(tracks, setTracks);

  const loadTracks = async () => {
    const metadata = await StorageService.getAllMetadata();
    // Verify files existence
    const verified = await StorageService.verifyFilesExistence(metadata);

    // Sort by order ascending, then addedAt descending
    setTracks(verified.sort((a, b) => {
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
    StorageService.requestPersistence();
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

  const onRelink = (id) => {
    setRelinkId(id);
    relinkInputRef.current?.click();
  };

  const handleRelinkFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !relinkId) return;

    try {
      await StorageService.relinkFile(relinkId, file);
      loadTracks();
      setRelinkId(null);
    } catch (err) {
      console.error("Relinking failed", err);
      alert("Failed to relink file.");
    }
    e.target.value = null; // Reset
  };

  const handleExport = async () => {
    const blob = await StorageService.exportMetadata();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sudu_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const success = await StorageService.importMetadata(event.target.result);
        if (success) {
          alert('Backup imported successfully! Missing files will be marked.');
          loadTracks();
        } else {
          alert('Failed to import backup.');
        }
      } catch (err) {
        console.error(err);
        alert('Invalid backup file.');
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = null;
  };

  return (
    <div className="flex flex-col min-h-screen pb-32 bg-neutral-900 text-white font-sans selection:bg-purple-500/30">
      <input
        type="file"
        ref={relinkInputRef}
        onChange={handleRelinkFileSelect}
        className="hidden"
        accept="audio/*,video/*"
      />
      <div className="p-6 max-w-xl mx-auto w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Sudu Player
          </h1>
          <p className="text-neutral-400 text-sm mt-1">Background-capable media queue</p>
        </header>

        <FileUploader onUploadComplete={loadTracks} />

        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-semibold">Queue</h2>
            <span className="text-xs font-mono text-neutral-500">{tracks.length} items</span>
          </div>

          <Playlist
            tracks={tracks}
            currentTrack={player.currentTrack}
            onPlayTrack={player.playTrack}
            onUpdateLoop={handleUpdateLoop}
            onDelete={handleDelete}
            onReorder={handleReorder}
            onRelink={onRelink}
          />

          <div className="pt-8 border-t border-neutral-800 flex justify-center gap-4 text-xs text-neutral-500">
            <button onClick={handleExport} className="hover:text-purple-400 transition-colors">
              Export Backup (JSON)
            </button>
            <span>•</span>
            <label className="hover:text-purple-400 transition-colors cursor-pointer">
              Import Backup
              <input type="file" onChange={handleImport} accept=".json" className="hidden" />
            </label>
          </div>
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
