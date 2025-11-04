import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Path, ScratchpadState } from '../types';
import { PencilIcon, EraserIcon, UndoIcon, RedoIcon, XIcon, LightbulbIcon, SparklesIcon } from '../constants/icons';
import { analyzeScratchpadForHint } from '../services/geminiService';

interface DigitalScratchpadProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (state: ScratchpadState) => void;
  initialState?: ScratchpadState;
  questionText: string;
}

const DigitalScratchpad = forwardRef(({ isOpen, onClose, onSave, initialState, questionText }: DigitalScratchpadProps, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [paths, setPaths] = useState<Path[]>(initialState?.paths || []);
    const [undonePaths, setUndonePaths] = useState<Path[]>([]);
    
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [color, setColor] = useState('#1e293b'); // slate-800
    const [strokeWidth, setStrokeWidth] = useState(3);
    
    // For dragging the modal
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });

    // AI Hint state
    const [hint, setHint] = useState<string | null>(null);
    const [isGettingHint, setIsGettingHint] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            e.preventDefault();
            setPosition({
                x: e.clientX - dragStartRef.current.x,
                y: e.clientY - dragStartRef.current.y,
            });
        };
        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);
    
    const drawPaths = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        paths.forEach(path => {
            ctx.beginPath();
            ctx.strokeStyle = path.color;
            ctx.lineWidth = path.strokeWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            path.points.forEach((point, i) => {
                if (i === 0) ctx.moveTo(point.x, point.y);
                else ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
        });
    }, [paths]);

    useEffect(() => {
        drawPaths();
    }, [drawPaths]);
    
    useImperativeHandle(ref, () => ({
        getCanvasDataURL: () => {
            const canvas = canvasRef.current;
            if (canvas) {
                return canvas.toDataURL('image/png').split(',')[1];
            }
            return null;
        }
    }));
    
    const getCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        
        let clientX, clientY;

        if ('touches' in e.nativeEvent) {
            if (e.nativeEvent.touches.length === 0) return null;
            clientX = e.nativeEvent.touches[0].clientX;
            clientY = e.nativeEvent.touches[0].clientY;
        } else {
            clientX = e.nativeEvent.clientX;
            clientY = e.nativeEvent.clientY;
        }
        
        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    };

    const handleDrawStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if ('touches' in e.nativeEvent) e.preventDefault();
        const coords = getCoords(e);
        if (!coords) return;
        
        setIsDrawing(true);
        const newPath: Path = {
            points: [coords],
            color: tool === 'eraser' ? '#FFFFFF' : color,
            strokeWidth: tool === 'eraser' ? 20 : strokeWidth
        };
        setPaths(prev => [...prev, newPath]);
        setUndonePaths([]); // Clear redo history on new drawing
    };

    const handleDrawMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        if ('touches' in e.nativeEvent) e.preventDefault();
        const coords = getCoords(e);
        if (!coords) return;
        
        setPaths(prev => {
            const newPaths = [...prev];
            const lastPath = newPaths[newPaths.length - 1];
            lastPath.points.push(coords);
            return newPaths;
        });
        drawPaths(); // Redraw for responsiveness
    };

    const handleDrawEnd = () => setIsDrawing(false);
    
    const handleUndo = () => {
        if (paths.length === 0) return;
        const lastPath = paths[paths.length - 1];
        setUndonePaths(prev => [lastPath, ...prev]);
        setPaths(paths.slice(0, -1));
    };

    const handleRedo = () => {
        if (undonePaths.length === 0) return;
        const nextPath = undonePaths[0];
        setPaths(prev => [...prev, nextPath]);
        setUndonePaths(undonePaths.slice(1));
    };

    const handleClear = () => {
        setPaths([]);
        setUndonePaths([]);
    };
    
    const handleClose = () => {
        onSave({ paths });
        onClose();
    };

    const handleGetHint = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        setIsGettingHint(true);
        setHint(null);
        const imageBase64 = canvas.toDataURL('image/png').split(',')[1];
        try {
            const generatedHint = await analyzeScratchpadForHint(imageBase64, questionText);
            setHint(generatedHint);
        } catch(e) {
            console.error(e);
            setHint("Sorry, I couldn't generate a hint right now.");
        } finally {
            setIsGettingHint(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/30 z-40"
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col"
                style={{
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    height: '70vh'
                }}
            >
                <header 
                    className="flex items-center justify-between p-2 border-b cursor-move"
                    onMouseDown={(e) => {
                        setIsDragging(true);
                        dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
                    }}
                >
                    <h3 className="font-bold text-slate-700 ml-2">Digital Rough Work</h3>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-slate-100">
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>
                
                <div className="flex p-2 border-b gap-2 items-center">
                    <button onClick={() => setTool('pen')} className={`p-2 rounded ${tool === 'pen' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100'}`}><PencilIcon className="w-5 h-5"/></button>
                    <button onClick={() => setTool('eraser')} className={`p-2 rounded ${tool === 'eraser' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100'}`}><EraserIcon className="w-5 h-5"/></button>
                    <div className="h-6 border-l mx-2"></div>
                    <button onClick={handleUndo} className="p-2 rounded hover:bg-slate-100 disabled:opacity-50" disabled={paths.length === 0}><UndoIcon className="w-5 h-5"/></button>
                    <button onClick={handleRedo} className="p-2 rounded hover:bg-slate-100 disabled:opacity-50" disabled={undonePaths.length === 0}><RedoIcon className="w-5 h-5"/></button>
                    <div className="h-6 border-l mx-2"></div>
                    <button onClick={handleClear} className="p-2 rounded hover:bg-slate-100 text-sm font-semibold">Clear</button>
                    <div className="flex-grow"></div>
                    <button onClick={handleGetHint} disabled={isGettingHint} className="btn btn-primary text-sm flex items-center gap-1">
                        {isGettingHint ? <SparklesIcon className="w-4 h-4 animate-spin"/> : <LightbulbIcon className="w-4 h-4"/>}
                        {isGettingHint ? 'Thinking...' : 'Get a Hint'}
                    </button>
                </div>

                <div className="flex-grow relative bg-white rounded-b-xl">
                    <canvas
                        ref={canvasRef}
                        width="800"
                        height="450" // A bit larger for better resolution
                        className="w-full h-full"
                        onMouseDown={handleDrawStart}
                        onMouseMove={handleDrawMove}
                        onMouseUp={handleDrawEnd}
                        onMouseLeave={handleDrawEnd}
                        onTouchStart={handleDrawStart}
                        onTouchMove={handleDrawMove}
                        onTouchEnd={handleDrawEnd}
                    />
                    {hint && (
                        <div className="absolute bottom-2 left-2 right-2 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg shadow-md animate-fade-in">
                            <p className="text-sm text-yellow-800"><strong>Hint:</strong> {hint}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default DigitalScratchpad;