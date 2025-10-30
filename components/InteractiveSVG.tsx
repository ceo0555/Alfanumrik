import React from 'react';
import { LabelData } from '../types';

interface InteractiveSVGProps {
    imageUrl: string;
    labels: LabelData[];
    altText: string;
}

const InteractiveSVG: React.FC<InteractiveSVGProps> = ({ imageUrl, labels, altText }) => {
    return (
        <div className="relative w-full max-w-full mx-auto" style={{ aspectRatio: '4/3' }}>
            <img src={imageUrl} alt={altText} className="absolute inset-0 w-full h-full object-contain" />
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 75">
                {labels.map((label, index) => {
                    const xPos = label.x * 100;
                    const yPos = label.y * 75; // 75 because aspect ratio is 4:3 (viewBox height is 75)
                    
                    // Heuristic for text anchor to prevent labels going off-screen
                    const textAnchor = xPos > 80 ? 'end' : xPos < 20 ? 'start' : 'middle';
                    let dx = 0;
                    if (textAnchor === 'end') dx = -1;
                    if (textAnchor === 'start') dx = 1;

                    return (
                        <g key={index} transform={`translate(${xPos}, ${yPos})`}>
                            <circle cx="0" cy="0" r="0.5" fill="#4f46e5" stroke="#ffffff" strokeWidth="0.2" />
                            <text
                                x={dx}
                                y={0}
                                dy="0.25em"
                                textAnchor={textAnchor}
                                className="font-sans font-semibold"
                                style={{ fontSize: '2.2px', fill: '#1e293b', paintOrder: 'stroke', stroke: '#ffffff', strokeWidth: '0.4px', strokeLinecap: 'butt', strokeLinejoin: 'miter' }}
                            >
                                {label.label}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export default InteractiveSVG;