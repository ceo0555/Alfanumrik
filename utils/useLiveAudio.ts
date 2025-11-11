import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Blob, LiveConnectParameters, LiveCallbacks } from '@google/genai';
import { encode } from './audio';
import { requireGeminiApiKey } from './env';

type ConnectOptions = Omit<LiveConnectParameters, 'callbacks'>;

export const useLiveAudio = (
    options: ConnectOptions,
    callbacks: LiveCallbacks
) => {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [status, setStatus] = useState('Idle');
    const [stream, setStream] = useState<MediaStream | null>(null);
    
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const stopConversation = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close()).catch(console.error);
            sessionPromiseRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            setStream(null);
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if(mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close().catch(console.error);
        }
        
        setIsSessionActive(false);
        setStatus('Disconnected');
    }, []);

    const startConversation = useCallback(async (constraints: MediaStreamConstraints) => {
        setIsSessionActive(true);
        setStatus('Connecting...');

        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(streamRef.current);
            
            let apiKey: string;
            try {
                apiKey = requireGeminiApiKey();
            } catch (error) {
                setStatus("Error: Gemini API key is not configured.");
                setIsSessionActive(false);
                return;
            }

            const ai = new GoogleGenAI({ apiKey });
            
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            
            const fullCallbacks: LiveCallbacks = {
                onmessage: callbacks.onmessage,
                onopen: () => {
                    setStatus('Connection open. Listening...');
                    if (callbacks.onopen) callbacks.onopen();

                    if (!streamRef.current || !inputAudioContextRef.current) return;
                        
                    if (constraints.audio) {
                        mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
                        scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Live API Error:', e);
                    let friendlyMessage = `An error occurred: ${e.message}.`;
                    setStatus(friendlyMessage);
                    if(callbacks.onerror) callbacks.onerror(e);
                    stopConversation();
                },
                onclose: (e: CloseEvent) => {
                    if (callbacks.onclose) callbacks.onclose(e);
                    stopConversation();
                }
            };
            
                sessionPromiseRef.current = ai.live.connect({ ...options, callbacks: fullCallbacks });
            
            // Add robust error handling for the connection promise itself
            sessionPromiseRef.current.catch(error => {
                console.error('Live session connection failed:', error);
                setStatus(`Error: ${error.message}`);
                stopConversation();
            });

        } catch (error) {
            console.error('Failed to start conversation:', error);
            setStatus('Error: Could not access microphone or camera.');
            setIsSessionActive(false);
        }
    }, [options, callbacks, stopConversation]);

    return { isSessionActive, status, startConversation, stopConversation, stream, sessionPromise: sessionPromiseRef.current };
};