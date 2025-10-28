import { useState, useEffect, useCallback } from 'react';

export const useSound = (url: string) => {
    const [audio] = useState(() => new Audio(url));
    const [isPlaying, setIsPlaying] = useState(false);

    const play = useCallback(() => {
        audio.currentTime = 0; // Rewind to the start
        audio.play().catch(e => console.error("Audio playback failed:", e));
    }, [audio]);

    useEffect(() => {
        const handleEnded = () => setIsPlaying(false);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);

        return () => {
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
        };
    }, [audio]);

    return { play, isPlaying };
};
