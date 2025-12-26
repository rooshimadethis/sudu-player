import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat } from 'lucide-react';

export function Player({ playerControl }) {
    const { isPlaying, currentTrack, currentLoopCount, play, pause, playNext, playPrevious } = playerControl;

    if (!currentTrack) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-neutral-900/95 backdrop-blur-xl border-t border-neutral-800 pb-8">
            <div className="max-w-md mx-auto space-y-4">
                {/* Progress Bar */}
                <div className="space-y-1">
                    <input
                        type="range"
                        min="0"
                        max={playerControl.duration || 100}
                        value={playerControl.currentTime}
                        onChange={(e) => playerControl.seek(Number(e.target.value))}
                        className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                        <span>{formatTime(playerControl.currentTime)}</span>
                        <span>{formatTime(playerControl.duration)}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-4">
                        <p className="font-bold text-white truncate">{currentTrack.name}</p>
                        <div className="flex items-center text-xs text-purple-400 space-x-2">
                            <Repeat className="w-3 h-3" />
                            <span>
                                Loop: {currentLoopCount + 1} / {currentTrack.loopCount || 1}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button onClick={playPrevious} className="text-neutral-400 hover:text-white">
                            <SkipBack className="w-6 h-6" />
                        </button>

                        <button
                            onClick={isPlaying ? pause : play}
                            className="p-3 bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-transform"
                        >
                            {isPlaying ? (
                                <Pause className="w-6 h-6 fill-current" />
                            ) : (
                                <Play className="w-6 h-6 fill-current" />
                            )}
                        </button>

                        <button onClick={playNext} className="text-neutral-400 hover:text-white">
                            <SkipForward className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
