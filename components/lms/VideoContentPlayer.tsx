import React, { useState, useRef, useEffect } from 'react';
import { PlayIcon, PauseIcon, VolumeIcon, VolumeOffIcon, MaximizeIcon, SettingsIcon } from '../../constants/icons';

interface VideoContentPlayerProps {
    videoUrl: string;
    title: string;
    onProgress: (progress: number) => void;
    initialProgress?: number;
    onComplete?: () => void;
}

const VideoContentPlayer: React.FC<VideoContentPlayerProps> = ({ 
    videoUrl, 
    title, 
    onProgress, 
    initialProgress = 0,
    onComplete 
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [hasCompletedOnce, setHasCompletedOnce] = useState(false);

    useEffect(() => {
        if (videoRef.current && initialProgress > 0) {
            videoRef.current.currentTime = initialProgress;
        }
    }, [initialProgress]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateTime = () => {
            setCurrentTime(video.currentTime);
            const progress = (video.currentTime / video.duration) * 100;
            onProgress(video.currentTime);

            // Mark as complete when 90% watched
            if (progress >= 90 && !hasCompletedOnce) {
                setHasCompletedOnce(true);
                onComplete?.();
            }
        };

        const updateDuration = () => setDuration(video.duration);
        
        video.addEventListener('timeupdate', updateTime);
        video.addEventListener('loadedmetadata', updateDuration);

        return () => {
            video.removeEventListener('timeupdate', updateTime);
            video.removeEventListener('loadedmetadata', updateDuration);
        };
    }, [onProgress, onComplete, hasCompletedOnce]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
        }
        setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const changeSpeed = (speed: number) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = speed;
            setPlaybackSpeed(speed);
            setShowSpeedMenu(false);
        }
    };

    const toggleFullscreen = () => {
        if (videoRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                videoRef.current.requestFullscreen();
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl">
            <div className="relative group">
                <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full aspect-video bg-black"
                    onClick={togglePlay}
                />
                
                {/* Play/Pause Overlay */}
                {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <button
                            onClick={togglePlay}
                            className="w-20 h-20 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all transform hover:scale-110"
                        >
                            <PlayIcon className="w-10 h-10 text-slate-900 ml-1" />
                        </button>
                    </div>
                )}

                {/* Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Progress Bar */}
                    <div className="mb-4">
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleSeek}
                            className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${progress}%, #475569 ${progress}%, #475569 100%)`
                            }}
                        />
                        <div className="flex justify-between text-xs text-white mt-1">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={togglePlay}
                                className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all"
                            >
                                {isPlaying ? (
                                    <PauseIcon className="w-5 h-5 text-white" />
                                ) : (
                                    <PlayIcon className="w-5 h-5 text-white ml-0.5" />
                                )}
                            </button>

                            {/* Volume Control */}
                            <div className="flex items-center gap-2 relative">
                                <button
                                    onClick={toggleMute}
                                    onMouseEnter={() => setShowVolumeSlider(true)}
                                    className="w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all"
                                >
                                    {isMuted || volume === 0 ? (
                                        <VolumeOffIcon className="w-4 h-4 text-white" />
                                    ) : (
                                        <VolumeIcon className="w-4 h-4 text-white" />
                                    )}
                                </button>
                                {showVolumeSlider && (
                                    <div
                                        onMouseLeave={() => setShowVolumeSlider(false)}
                                        className="absolute bottom-full left-0 mb-2 bg-slate-800 p-2 rounded-lg"
                                    >
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={volume}
                                            onChange={handleVolumeChange}
                                            className="w-24 h-1 appearance-none cursor-pointer"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Speed Control */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                    className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white text-sm font-semibold transition-all"
                                >
                                    {playbackSpeed}x
                                </button>
                                {showSpeedMenu && (
                                    <div className="absolute bottom-full right-0 mb-2 bg-slate-800 rounded-lg overflow-hidden shadow-xl">
                                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                                            <button
                                                key={speed}
                                                onClick={() => changeSpeed(speed)}
                                                className={`block w-full px-4 py-2 text-left text-white text-sm hover:bg-indigo-600 transition-colors ${
                                                    playbackSpeed === speed ? 'bg-indigo-500' : ''
                                                }`}
                                            >
                                                {speed}x
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Fullscreen */}
                            <button
                                onClick={toggleFullscreen}
                                className="w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all"
                            >
                                <MaximizeIcon className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Title */}
            <div className="p-4 bg-slate-800">
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <div className="mt-2 flex items-center gap-4 text-sm text-slate-400">
                    <span>Progress: {Math.round(progress)}%</span>
                    <span className="w-32 bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </span>
                </div>
            </div>
        </div>
    );
};

export default VideoContentPlayer;
