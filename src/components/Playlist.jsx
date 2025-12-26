import React from 'react';
import { Trash2, GripVertical, Play, AlertTriangle } from 'lucide-react';
import { Reorder } from 'framer-motion';

export function Playlist({ tracks, currentTrack, onPlayTrack, onUpdateLoop, onDelete, onReorder, onRelink }) {
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
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!track.missingFile) onPlayTrack(index);
                            }}
                            disabled={track.missingFile}
                            className={`p-1.5 transition-colors rounded-full hover:bg-white/5 ${track.missingFile
                                ? 'text-neutral-700 cursor-not-allowed'
                                : 'text-neutral-600 hover:text-purple-400'
                                }`}
                            title={track.missingFile ? "File missing" : "Play"}
                        >
                            <Play className="w-4 h-4 fill-current" />
                        </button>

                        <button
                            onClick={() => {
                                if (track.missingFile) {
                                    onRelink(track.id);
                                } else {
                                    onPlayTrack(index);
                                }
                            }}
                            className={`flex-1 text-left min-w-0 ${track.missingFile ? 'cursor-pointer hover:bg-white/5 p-1 -m-1 rounded' : ''}`}
                        >
                            <div className="flex items-center gap-2">
                                {track.missingFile && (
                                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                                )}
                                <p className={`font-medium truncate ${currentTrack?.id === track.id ? 'text-purple-400' : 'text-white'}`}>
                                    {track.name}
                                </p>
                            </div>
                            <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                {track.missingFile ? (
                                    <span className="text-amber-500/80">File missing - Tap to link</span>
                                ) : (
                                    `${(track.size / 1024 / 1024).toFixed(2)} MB`
                                )}
                            </p>
                        </button>

                        <div className="flex items-center gap-2">
                            <div className="flex flex-col items-end mr-2">
                                <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-0.5">Loops</label>
                                <LoopInput
                                    value={track.loopCount || 1}
                                    onChange={(val) => onUpdateLoop(track.id, val)}
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

function LoopInput({ value: initialValue, onChange }) {
    const [value, setValue] = React.useState(initialValue);

    React.useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    const handleBlur = () => {
        let newValue = value;
        if (newValue === '' || newValue === null || isNaN(parseInt(newValue))) {
            newValue = 1;
        } else {
            newValue = parseInt(newValue);
            if (newValue < 1) newValue = 1;
        }
        setValue(newValue);
        if (newValue !== initialValue) {
            onChange(newValue);
        }
    };

    return (
        <input
            type="number"
            min="1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            onClick={(e) => e.stopPropagation()}
            className="w-12 bg-neutral-950 border border-neutral-700 rounded-md text-center text-sm py-1 focus:ring-1 focus:ring-purple-500 outline-none text-white cancel-drag"
        />
    );
}
