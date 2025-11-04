import { useState, useRef, useCallback } from 'react';

export const useAudioRecorder = () => {
    const [status, setStatus] = useState<'idle' | 'recording' | 'stopped'>('idle');
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setStatus('stopped');
                // Stop all tracks to turn off the microphone indicator
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setStatus('recording');
        } catch (err) {
            console.error("Error starting recording:", err);
            alert("Could not access microphone. Please ensure permissions are granted.");
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    }, []);
    
    const reset = useCallback(() => {
        setStatus('idle');
        setAudioBlob(null);
    }, []);

    return { status, audioBlob, startRecording, stopRecording, reset };
};
