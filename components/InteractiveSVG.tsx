import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DiagramHotspot } from '../types';

interface InteractiveSVGProps {
    imageUrl: string;
    hotspots?: DiagramHotspot[];
    altText: string;
}

const InteractiveSVG: React.FC<InteractiveSVGProps> = ({ imageUrl, hotspots = [], altText }) => {
    const [activeHotspot, setActiveHotspot] = useState<number | null>(null);
    const [popoverPosition, setPopoverPosition] = useState<{ top: string, left: string }>({ top: '0', left: '0' });
    const containerRef = useRef<HTMLDivElement>(null);

    const handleHotspotClick = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        if (activeHotspot === index) {
            setActiveHotspot(null);
        } else {
            setActiveHotspot(index);
            const hotspot = hotspots[index];
            if (hotspot) {
                setPopoverPosition({
                    top: `${hotspot.y * 100}%`,
                    left: `${hotspot.x * 100}%`
                });
            }
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setActiveHotspot(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const activeHotspotData = activeHotspot !== null ? hotspots[activeHotspot] : null;

    return (
        <div ref={containerRef} className="relative w-full max-w-full mx-auto my-4" style={{ aspectRatio: '4/3' }}>
            <img src={imageUrl} alt={altText} className="absolute inset-0 w-full h-full object-contain" />
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 75">
                {hotspots.map((hotspot, index) => (
                    <g 
                        key={index} 
                        transform={`translate(${hotspot.x * 100}, ${hotspot.y * 75})`}
                        onClick={(e) => handleHotspotClick(e, index)}
                        className="cursor-pointer group"
                    >
                        <circle cx="0" cy="0" r="1.5" className="fill-indigo-500/50 group-hover:fill-indigo-500/80 transition-all" />
                        <circle cx="0" cy="0" r="0.75" className="fill-indigo-600" />
                    </g>
                ))}
            </svg>

            {activeHotspotData && (
                <div
                    className="absolute z-10 p-3 bg-slate-800 text-white rounded-lg shadow-lg w-48 text-xs animate-pop-in"
                    style={{ 
                        top: popoverPosition.top, 
                        left: popoverPosition.left,
                        transform: 'translate(-50%, 10px)',
                    }}
                >
                    <h4 className="font-bold">{activeHotspotData.label}</h4>
                    <p>{activeHotspotData.details}</p>
                </div>
            )}
        </div>
    );
};

export default InteractiveSVG;