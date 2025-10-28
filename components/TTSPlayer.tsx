import React, { useEffect } from 'react';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { PlayIcon, StopIcon, PauseIcon } from '../constants/icons';

const TTSPlayer: React.FC<{ textToSpeak: string }> = ({ textToSpeak }) => {
    const {
        speak,
        cancel,
        pause,
        resume,
        speaking,
        paused,
        supported,
    } = useSpeechSynthesis();

    // When the text to speak changes, cancel any ongoing speech
    useEffect(() => {
        cancel();
    }, [textToSpeak, cancel]);

    if (!supported) {
        return <p className="text-xs text-slate-500">Text-to-speech is not supported on your browser.</p>;
    }

    const handlePlayPause = () => {
        if (speaking) {
            if (paused) {
                resume();
            } else {
                pause();
            }
        } else {
            speak({ text: textToSpeak });
        }
    };

    const handleStop = () => {
        cancel();
    };

    const isPlayingOrPaused = speaking || paused;
    const isDisabled = !textToSpeak.trim();

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handlePlayPause}
                className="p-1.5 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors disabled:opacity-50"
                aria-label={speaking && !paused ? 'Pause' : 'Play'}
                disabled={isDisabled}
            >
                {speaking && !paused ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
            </button>
            {isPlayingOrPaused && (
                <button
                    onClick={handleStop}
                    className="p-1.5 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
                    aria-label="Stop"
                >
                    <StopIcon className="w-5 h-5" />
                </button>
            )}
        </div>
    );
};

export default TTSPlayer;