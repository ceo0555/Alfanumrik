// FIX: `useRef` was used without being imported. Added it to the import statement from 'react'.
import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechOptions {
    text: string;
    onEnd?: () => void;
}

export const useSpeechSynthesis = () => {
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [speaking, setSpeaking] = useState(false);
    const [paused, setPaused] = useState(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const handleVoicesChanged = useCallback(() => {
        setVoices(speechSynthesis.getVoices());
    }, []);

    useEffect(() => {
        handleVoicesChanged();
        speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
        return () => {
            speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        };
    }, [handleVoicesChanged]);

    const speak = useCallback(({ text, onEnd }: SpeechOptions) => {
        if (!speechSynthesis) return;

        // If speaking, cancel the previous one before starting a new one
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;

        // Voice selection logic: Prioritize Indian Female, then any Indian, then US female, then default
        const preferredVoice = voices.find(voice => voice.lang === 'en-IN' && /female/i.test(voice.name));
        const indianVoice = voices.find(voice => voice.lang === 'en-IN');
        const usFemaleVoice = voices.find(voice => voice.lang === 'en-US' && /female/i.test(voice.name));
        
        utterance.voice = preferredVoice || indianVoice || usFemaleVoice || voices.find(v => v.default) || voices[0];
        
        utterance.onstart = () => {
            setSpeaking(true);
            setPaused(false);
        };
        utterance.onend = () => {
            setSpeaking(false);
            setPaused(false);
            if (onEnd) onEnd();
        };
        utterance.onpause = () => {
            setSpeaking(true);
            setPaused(true);
        };
        utterance.onresume = () => {
            setSpeaking(true);
            setPaused(false);
        };

        speechSynthesis.speak(utterance);
    }, [voices]);

    const pause = useCallback(() => {
        if (speechSynthesis) {
            speechSynthesis.pause();
        }
    }, []);

    const resume = useCallback(() => {
        if (speechSynthesis) {
            speechSynthesis.resume();
        }
    }, []);

    const cancel = useCallback(() => {
        if (speechSynthesis) {
            setSpeaking(false);
            setPaused(false);
            speechSynthesis.cancel();
        }
    }, []);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (speechSynthesis && speechSynthesis.speaking) {
                speechSynthesis.cancel();
            }
        };
    }, []);

    return {
        speak,
        pause,
        resume,
        cancel,
        speaking,
        paused,
        supported: typeof window !== 'undefined' && 'speechSynthesis' in window,
    };
};
