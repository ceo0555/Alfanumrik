import React, { useState, useRef, useEffect, useCallback } from 'react';

const InteractiveReflectionDiagram: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [incidentAngle, setIncidentAngle] = useState(30); // Initial angle in degrees

    const center = { x: 150, y: 150 };
    const mirrorY = 250;
    const normal = { x1: center.x, y1: mirrorY, x2: center.x, y2: 50 };

    const angleToRad = (angle: number) => angle * (Math.PI / 180);

    const incidentRad = angleToRad(90 + incidentAngle);
    const incidentEndPoint = {
        x: center.x + 100 * Math.cos(incidentRad),
        y: mirrorY - 100 * Math.sin(incidentRad),
    };

    const reflectedRad = angleToRad(90 - incidentAngle);
    const reflectedEndPoint = {
        x: center.x + 100 * Math.cos(reflectedRad),
        y: mirrorY - 100 * Math.sin(reflectedRad),
    };
    
    const handleInteraction = useCallback((clientX: number, clientY: number) => {
        if (!svgRef.current) return;
        const svgRect = svgRef.current.getBoundingClientRect();
        
        // Transform client coordinates to SVG coordinates
        const svgX = (clientX - svgRect.left) * (svgRef.current.viewBox.baseVal.width / svgRect.width);
        const svgY = (clientY - svgRect.top) * (svgRef.current.viewBox.baseVal.height / svgRect.height);

        let dx = svgX - center.x;
        let dy = mirrorY - svgY;
        
        if (dy <= 10) return; // Prevent dragging below or too close to the mirror

        let angle = Math.atan2(dx, dy) * (180 / Math.PI);
        angle = Math.max(-85, Math.min(85, angle)); // Clamp angle

        setIncidentAngle(Math.abs(angle));
    }, [center.x, mirrorY]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        handleInteraction(e.clientX, e.clientY);
    }, [handleInteraction]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        e.preventDefault();
        if (e.touches[0]) {
            handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, [handleInteraction]);

    const handleMouseUp = useCallback(() => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    const handleTouchEnd = useCallback(() => {
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
    }, [handleTouchMove]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove, handleMouseUp]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
    }, [handleTouchMove, handleTouchEnd]);
    
    return (
        <div className="w-full max-w-sm mx-auto my-4 touch-none">
            <svg ref={svgRef} viewBox="0 0 300 300" className="w-full bg-slate-50 rounded-lg border">
                {/* Mirror */}
                <rect x="0" y={mirrorY} width="300" height="10" fill="#a7c7e7" />
                <line x1="0" y1={mirrorY} x2="300" y2={mirrorY} stroke="#555" strokeWidth="2" />
                
                {/* Normal */}
                <line {...normal} stroke="#333" strokeDasharray="4 2" />
                
                {/* Incident Ray */}
                <line x1={incidentEndPoint.x} y1={incidentEndPoint.y} x2={center.x} y2={mirrorY} stroke="#f87171" strokeWidth="2.5" />
                
                {/* Reflected Ray */}
                <line x1={center.x} y1={mirrorY} x2={reflectedEndPoint.x} y2={reflectedEndPoint.y} stroke="#4ade80" strokeWidth="2.5" />

                {/* Draggable Handle */}
                <circle
                    cx={incidentEndPoint.x}
                    cy={incidentEndPoint.y}
                    r="10"
                    fill="rgba(248, 113, 113, 0.5)"
                    stroke="#f87171"
                    strokeWidth="2"
                    cursor="grab"
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                />
                
                {/* Angle Arcs */}
                <path
                    d={`M ${center.x} ${mirrorY - 30} A 30 30 0 0 0 ${center.x - 30 * Math.sin(angleToRad(incidentAngle))} ${mirrorY - 30 * Math.cos(angleToRad(incidentAngle))}`}
                    fill="none"
                    stroke="rgba(100, 116, 139, 0.5)"
                    strokeWidth="1.5"
                />
                 <path
                    d={`M ${center.x} ${mirrorY - 30} A 30 30 0 0 1 ${center.x + 30 * Math.sin(angleToRad(incidentAngle))} ${mirrorY - 30 * Math.cos(angleToRad(incidentAngle))}`}
                    fill="none"
                    stroke="rgba(100, 116, 139, 0.5)"
                    strokeWidth="1.5"
                />

                {/* Angle Text */}
                <text x={center.x - 40} y={mirrorY - 25} className="text-xs font-bold fill-current text-slate-700" textAnchor="middle">
                    θi: {incidentAngle.toFixed(0)}°
                </text>
                 <text x={center.x + 40} y={mirrorY - 25} className="text-xs font-bold fill-current text-slate-700" textAnchor="middle">
                    θr: {incidentAngle.toFixed(0)}°
                </text>
                 <text x={center.x} y={40} className="text-xs font-semibold fill-current text-slate-500" textAnchor="middle">Normal</text>
            </svg>
            <p className="text-xs text-center text-slate-500 mt-2">Drag the red circle to change the angle of incidence.</p>
        </div>
    );
};

export default InteractiveReflectionDiagram;
