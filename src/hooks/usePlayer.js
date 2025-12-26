import { useState, useEffect, useRef, useCallback } from 'react';
import { StorageService } from '../services/storage';

export function usePlayer(playlist) {
    const audioRef = useRef(new Audio());
    const [isPlaying, setIsPlaying] = useState(false);
    // Initialize from localStorage
    const [currentTrackId, setCurrentTrackId] = useState(() => localStorage.getItem('sudu_last_track_id'));
    const [currentLoopCount, setCurrentLoopCount] = useState(() => parseInt(localStorage.getItem('sudu_last_loop_count')) || 0);
    const [isLoading, setIsLoading] = useState(false);

    const currentTrackIndex = playlist.findIndex(t => t.id === currentTrackId);
    const currentTrack = playlist[currentTrackIndex];

    // Persistence Effects
    useEffect(() => {
        if (currentTrackId) localStorage.setItem('sudu_last_track_id', currentTrackId);
    }, [currentTrackId]);

    useEffect(() => {
        localStorage.setItem('sudu_last_loop_count', currentLoopCount);
    }, [currentLoopCount]);

    // Functions defined with useCallback to be stable for useEffect deps

    // Actually, hoisting helper functions or using refs for mutable callbacks is easier.
    // However, to fix lint quickly, I'll rely on hoisting validation or just suppress exhaustive-deps for the complex interaction
    // cleaner: define loadTrackResult first.

    const loadTrackResult = useCallback(async (track, autoPlay = true) => {
        setIsLoading(true);
        try {
            const blob = await StorageService.getFileBlob(track.id);
            if (!blob) throw new Error('File not found in storage');

            const url = URL.createObjectURL(blob);

            if (audioRef.current.src) {
                URL.revokeObjectURL(audioRef.current.src);
            }

            audioRef.current.src = url;

            if (autoPlay) {
                await audioRef.current.play();
                setIsPlaying(true);
            } else {
                setIsPlaying(false);
            }

            if (autoPlay) {
                setCurrentLoopCount(0);
            }

            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: track.name,
                    artist: `Loop 1/${track.loopCount || 1}`,
                    album: 'Sudu Player',
                });
            }
        } catch (e) {
            console.error("Error playing track:", e);
            if (autoPlay) setIsPlaying(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Restoration Effect: Load the stored track source if not already loaded
    useEffect(() => {
        if (currentTrack && !audioRef.current.src && !isLoading) {
            loadTrackResult(currentTrack, false);
        }
    }, [currentTrack, loadTrackResult, isLoading]);

    const playTrack = useCallback((index) => {
        if (index < 0 || index >= playlist.length) return;
        const track = playlist[index];
        setCurrentTrackId(track.id);
        setCurrentLoopCount(0); // Reset loop count on explicit play
        loadTrackResult(track, true);
    }, [playlist, loadTrackResult]);

    // Redefine playNext to use playTrack
    const playNextRef = useRef();
    playNextRef.current = () => {
        const nextIndex = currentTrackIndex + 1;
        if (nextIndex < playlist.length) {
            playTrack(nextIndex);
        } else {
            setIsPlaying(false);
            audioRef.current.pause();
        }
    };

    // Wrapper for stability
    const playNextStable = useCallback(() => playNextRef.current(), []);

    const playPrevious = useCallback(() => {
        const prevIndex = currentTrackIndex - 1;
        if (prevIndex >= 0) {
            playTrack(prevIndex);
        }
    }, [currentTrackIndex, playTrack]);

    const play = useCallback(async () => {
        if (!currentTrackId && playlist.length > 0) {
            playTrack(0);
        } else {
            await audioRef.current.play();
            setIsPlaying(true);
        }
    }, [currentTrackId, playlist, playTrack]);

    const pause = useCallback(() => {
        audioRef.current.pause();
        setIsPlaying(false);
    }, []);

    // Initialize Media Session actions
    useEffect(() => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', play);
            navigator.mediaSession.setActionHandler('pause', pause);
            navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
            navigator.mediaSession.setActionHandler('nexttrack', playNextStable);
        }
    }, [play, pause, playPrevious, playNextStable]);

    // Handle track ending (Looping logic)
    useEffect(() => {
        const audio = audioRef.current;

        const handleEnded = () => {
            if (!currentTrack) return;

            const targetLoop = currentTrack.loopCount || 1;

            if (currentLoopCount < targetLoop - 1) {
                setCurrentLoopCount(prev => prev + 1);
                audio.currentTime = 0;
                audio.play();
                // Update Metadata for loop count
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: currentTrack.name,
                        artist: `Loop ${currentLoopCount + 2}/${targetLoop}`,
                        album: 'Sudu Player',
                    });
                }
            } else {
                playNextStable();
            }
        };

        audio.addEventListener('ended', handleEnded);
        return () => audio.removeEventListener('ended', handleEnded);
    }, [currentTrack, currentLoopCount, playNextStable]); // Removed playlist from deps as it's not directly used in effect body

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // ... (existing code) ...

    // Handle time updates
    useEffect(() => {
        const audio = audioRef.current;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleLoadedMetadata = () => setDuration(audio.duration);

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, []);

    const seek = useCallback((time) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    return {
        isPlaying,
        currentTrack,
        currentLoopCount,
        isLoading,
        currentTime,
        duration,
        seek,
        playTrack,
        play,
        pause,
        playNext: playNextStable,
        playPrevious
    };
}
