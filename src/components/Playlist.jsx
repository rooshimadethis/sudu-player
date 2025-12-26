import React from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import { Reorder } from 'framer-motion';

export function Playlist({ tracks, currentTrack, onPlayTrack, onUpdateLoop, onDelete, onReorder }) {
    if (tracks.length === 0) {
        return (
            <div className="text-center text-neutral-500 py-10 bg-neutral-800/30 rounded-2xl border-2 border-dashed border-neutral-800">
                <p>No tracks yet.</p>
                <p className="text-xs opacity-50">Upload audio/video files to start.</p>
            </div>
        );
    }

    return (
        <Reorder.Group axis="y" values={tracks} onReorder={onReorder} className="space-y-3">
            {tracks.map((track, index) => (
                <Reorder.Item
                    key={track.id}
                    value={track}
                    className={`
                        relative overflow-hidden group flex flex-col p-4 rounded-2xl border transition-all
                        ${currentTrack?.id === track.id
                            ? 'bg-neutral-800 border-purple-500/50 shadow-lg shadow-purple-900/10'
                            : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'}
                    `}
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-neutral-600 cursor-grab active:cursor-grabbing hover:text-neutral-400">
                            <GripVertical className="w-5 h-5" />
                        </div>

                        <button
                            onClick={() => onPlayTrack(index)}
                            className="flex-1 text-left min-w-0"
                        >
                            <p className={`font-medium truncate ${currentTrack?.id === track.id ? 'text-purple-400' : 'text-white'}`}>
                                {track.name}
                            </p>
                            <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                {(track.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </button>

                        <div className="flex items-center gap-2">
                            <div className="flex flex-col items-end mr-2">
                                <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-0.5">Loops</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={track.loopCount || 1}
                                    onChange={(e) => onUpdateLoop(track.id, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-12 bg-neutral-950 border border-neutral-700 rounded-md text-center text-sm py-1 focus:ring-1 focus:ring-purple-500 outline-none text-white"
                                />
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(track.id); }}
                                className="p-2 text-neutral-600 hover:text-red-400 transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </Reorder.Item>
            ))}
        </Reorder.Group>
    );
}
