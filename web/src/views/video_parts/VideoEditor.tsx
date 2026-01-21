
import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Palette, Type, Sliders, PlayCircle, RotateCcw, Hand } from 'lucide-react';
import { CreativeHook, VideoFont, VideoAnimation, ElementPosition } from '../../types';
import { OverlayLayer } from './OverlayLayer';
import { VARIANT_STYLES } from './constants';

interface VideoEditorProps {
    mediaUrl: string | null;
    mediaType: 'video' | 'image';
    initialHook: CreativeHook;
    onSave: (hook: CreativeHook) => void;
    onBack: () => void;
}

export const VideoEditor: React.FC<VideoEditorProps> = ({ mediaUrl, mediaType, initialHook, onSave, onBack }) => {
    
    // --- STYLE INITIALIZATION ---
    const getInitialStyleIndex = () => {
        if (initialHook.styleId) {
            const idx = VARIANT_STYLES.findIndex(s => s.id === initialHook.styleId);
            if (idx !== -1) return idx;
        }
        return Math.floor(initialHook.id || 0) % VARIANT_STYLES.length;
    };

    // Config State
    const [variant, setVariant] = useState(initialHook);
    const [styleIndex, setStyleIndex] = useState(getInitialStyleIndex());
    const [font, setFont] = useState<VideoFont>(initialHook.font || 'Inter');
    const [animation, setAnimation] = useState<VideoAnimation>(initialHook.animation || 'fade-up');
    const [scale, setScale] = useState(initialHook.textScale || 1);
    
    // --- INDIVIDUAL ELEMENT POSITIONS ---
    const [positions, setPositions] = useState<{ [key: string]: ElementPosition }>(initialHook.positions || {
        headline: {x: 0, y: 0},
        badge: {x: 0, y: 0},
        smallText: {x: 0, y: 0},
        cta: {x: 0, y: 0}
    });

    // INTERACTION STATE
    const [selectedId, setSelectedId] = useState<string | null>('headline'); // Default selection
    const [editingId, setEditingId] = useState<string | null>(null); // For inline editing
    const [draggingId, setDraggingId] = useState<string | null>(null);
    
    // Refs for Drag/Click Logic
    const dragStartRef = useRef<{x: number, y: number} | null>(null);
    const elementStartRef = useRef<{x: number, y: number} | null>(null);
    const hasMovedRef = useRef<boolean>(false);
    
    // Pinch State
    const pinchStartDist = useRef<number | null>(null);
    const pinchStartScale = useRef<number>(1);

    // UI State
    const [activeTab, setActiveTab] = useState<'text' | 'style' | 'font' | 'anim' | null>(null);
    
    const [containerWidth, setContainerWidth] = useState(0);
    const previewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (previewRef.current) {
            setContainerWidth(previewRef.current.offsetWidth);
        }
    }, []);

    // SCALE FACTOR (Render Space 1080px vs Screen Space e.g. 360px)
    const renderScale = containerWidth > 0 ? 1080 / containerWidth : 3;

    const fonts: VideoFont[] = ['Inter', 'Bebas Neue', 'Playfair Display', 'Oswald', 'Montserrat', 'Roboto Mono'];
    const animations: {id: VideoAnimation, label: string}[] = [
        {id: 'fade-up', label: 'Fade'},
        {id: 'scale-in', label: 'Pop'},
        {id: 'slide-right', label: 'Slide'},
        {id: 'typewriter', label: 'Type'}
    ];

    const toggleTab = (tab: 'text' | 'style' | 'font' | 'anim') => {
        if (activeTab === tab) setActiveTab(null);
        else setActiveTab(tab);
    };

    // --- MATH HELPERS ---
    const getDistance = (t1: React.Touch, t2: React.Touch) => {
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    // --- INTERACTION HANDLERS ---

    const handlePointerDown = (e: React.TouchEvent | React.MouseEvent, id: string) => {
        if (editingId) return; // Allow interaction with input if editing

        e.stopPropagation(); 
        
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        setDraggingId(id);
        hasMovedRef.current = false; // Reset move flag
        dragStartRef.current = { x: clientX, y: clientY };
        elementStartRef.current = positions[id] || { x: 0, y: 0 };
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        // --- PINCH ZOOM LOGIC ---
        if (e.touches.length === 2) {
            const dist = getDistance(e.touches[0], e.touches[1]);
            
            if (pinchStartDist.current === null) {
                pinchStartDist.current = dist;
                pinchStartScale.current = scale;
                setDraggingId(null);
            } else {
                const scaleFactor = dist / pinchStartDist.current;
                const newScale = Math.min(Math.max(pinchStartScale.current * scaleFactor, 0.3), 3.0);
                setScale(newScale);
            }
            return;
        }

        // --- DRAG LOGIC ---
        if (draggingId && dragStartRef.current && elementStartRef.current) {
            const clientX = e.touches[0].clientX;
            const clientY = e.touches[0].clientY;

            // Detect actual movement threshold to differentiate click vs drag
            const moveDist = Math.sqrt(Math.pow(clientX - dragStartRef.current.x, 2) + Math.pow(clientY - dragStartRef.current.y, 2));
            if (moveDist > 5) hasMovedRef.current = true;

            // Calculate delta in SCREEN pixels
            const deltaX = clientX - dragStartRef.current.x;
            const deltaY = clientY - dragStartRef.current.y;

            // Apply to RENDER pixels
            const newX = elementStartRef.current.x + (deltaX * renderScale);
            const newY = elementStartRef.current.y + (deltaY * renderScale);

            setPositions(prev => ({
                ...prev,
                [draggingId]: { x: newX, y: newY }
            }));
        }
    };

    const handleTouchEnd = () => {
        // CLICK DETECTION
        if (draggingId && !hasMovedRef.current) {
            if (selectedId === draggingId) {
                // Second tap -> EDIT
                setEditingId(draggingId);
                // Also close bottom tabs to focus on editing
                setActiveTab(null);
            } else {
                // First tap -> SELECT
                setSelectedId(draggingId);
            }
        }

        setDraggingId(null);
        pinchStartDist.current = null;
        dragStartRef.current = null;
    };

    // Fallback for mouse
    const handleMouseMove = (e: React.MouseEvent) => {
        if (draggingId && dragStartRef.current && elementStartRef.current) {
            const clientX = e.clientX;
            const clientY = e.clientY;
            
            const moveDist = Math.sqrt(Math.pow(clientX - dragStartRef.current.x, 2) + Math.pow(clientY - dragStartRef.current.y, 2));
            if (moveDist > 5) hasMovedRef.current = true;

            const deltaX = clientX - dragStartRef.current.x;
            const deltaY = clientY - dragStartRef.current.y;
            
            const newX = elementStartRef.current.x + (deltaX * renderScale);
            const newY = elementStartRef.current.y + (deltaY * renderScale);

            setPositions(prev => ({
                ...prev,
                [draggingId]: { x: newX, y: newY }
            }));
        }
    };

    const resetPositions = () => {
        setPositions({
            headline: {x: 0, y: 0},
            badge: {x: 0, y: 0},
            smallText: {x: 0, y: 0},
            cta: {x: 0, y: 0}
        });
        setScale(1);
    };

    const handleTextChange = (text: string) => {
        if (editingId) {
            setVariant(prev => ({ ...prev, [editingId]: text }));
        }
    };

    const currentStyle = VARIANT_STYLES[styleIndex] || VARIANT_STYLES[0];

    return (
        <div 
            className="absolute inset-0 z-50 bg-black flex flex-col h-full animate-fade-in font-sans"
            style={{ touchAction: 'none' }}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onMouseMove={handleMouseMove}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
            // Clicking background deselects
            onClick={() => {
                if (!draggingId && !hasMovedRef.current) {
                    setEditingId(null);
                }
            }}
        >
            
            {/* 1. HEADER */}
            <div className="absolute top-0 w-full p-6 pt-12 z-50 flex justify-between items-center pointer-events-none">
                <button onClick={onBack} className="pointer-events-auto w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-90 transition-all border border-white/10 shadow-lg">
                    <X size={18} />
                </button>
                
                <div className="flex gap-2 pointer-events-auto">
                    <button onClick={resetPositions} className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-90 transition-all">
                        <RotateCcw size={16} />
                    </button>
                    <button 
                        onClick={() => onSave({
                            ...variant, 
                            styleId: currentStyle.id, 
                            font, 
                            animation, 
                            textScale: scale,
                            positions 
                        })} 
                        className="bg-white text-black px-5 py-2.5 rounded-full font-bold shadow-xl flex items-center gap-2 active:scale-95 transition-all text-xs border border-white"
                    >
                        <Check size={14} strokeWidth={3} />
                        <span>SAVE</span>
                    </button>
                </div>
            </div>

            {/* 2. PREVIEW CANVAS */}
            <div className="flex-1 flex items-center justify-center bg-gray-900 overflow-hidden relative">
                <div 
                    ref={previewRef}
                    className="relative w-full h-full max-w-[450px] flex items-center justify-center bg-black shadow-2xl"
                >
                    {/* Media */}
                    <div className="w-full h-full">
                        {mediaType === 'video' ? (
                            <video src={mediaUrl || ''} className="w-full h-full object-cover opacity-80" autoPlay muted loop playsInline />
                        ) : (
                            <img src={mediaUrl || ''} className="w-full h-full object-cover opacity-80" />
                        )}
                    </div>
                    
                    {/* Instructions Overlay (Only initially) */}
                    {!selectedId && !draggingId && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40">
                            <Hand size={32} className="text-white animate-pulse mb-2" />
                            <p className="text-[10px] text-white font-bold uppercase tracking-widest">Tap to Edit</p>
                        </div>
                    )}

                    {/* Interactive Overlay Layer */}
                    {containerWidth > 0 && (
                        <OverlayLayer 
                            variant={variant}
                            style={currentStyle}
                            containerWidth={containerWidth} 
                            font={font}
                            animation={draggingId ? 'none' : animation} 
                            scale={scale}
                            positions={positions}
                            onElementDown={handlePointerDown}
                            activeElementId={editingId || selectedId}
                            draggingId={draggingId}
                            // Inline Edit Props
                            editingId={editingId}
                            onTextChange={handleTextChange}
                            onEditEnd={() => setEditingId(null)}
                        />
                    )}
                </div>
            </div>

            {/* 3. TOOLBAR (Only show if not inline editing) */}
            {!editingId && (
                <div className="absolute bottom-0 w-full z-50 flex flex-col items-center pointer-events-auto">
                    
                    {/* POP-UP PANELS */}
                    {activeTab && (
                        <div className="w-[90%] max-w-md bg-black/80 backdrop-blur-xl border border-white/10 rounded-[24px] p-4 mb-4 animate-slide-up shadow-2xl">
                            
                            {/* STYLE PICKER */}
                            {activeTab === 'style' && (
                                <div>
                                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-3 text-center">Цветовая схема</p>
                                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 justify-center">
                                        {VARIANT_STYLES.map((s, i) => (
                                            <button 
                                                key={i} 
                                                onClick={() => setStyleIndex(i)} 
                                                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center relative transition-all ${styleIndex === i ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60'}`} 
                                                style={{background: s.badgeBg}}
                                            >
                                                <div className="w-4 h-4 rounded-full shadow-sm ring-1 ring-black/10" style={{background: s.headlineColor}}></div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* FONT & SIZE */}
                            {activeTab === 'font' && (
                                <div className="space-y-4">
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                        {fonts.map((f) => (
                                            <button 
                                                key={f}
                                                onClick={() => setFont(f)}
                                                className={`px-4 py-2 rounded-lg text-xs border whitespace-nowrap transition-all ${font === f ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/20'}`}
                                                style={{ fontFamily: f }}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-3 px-1">
                                        <span className="text-[10px] font-bold text-white/50 uppercase">Размер</span>
                                        <input 
                                            type="range" min="0.5" max="1.5" step="0.1" 
                                            value={scale} onChange={(e) => setScale(parseFloat(e.target.value))}
                                            className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                                        />
                                        <span className="text-[10px] font-bold text-white w-6 text-right">{Math.round(scale * 100)}%</span>
                                    </div>
                                </div>
                            )}

                            {/* ANIMATION */}
                            {activeTab === 'anim' && (
                                <div className="flex gap-2 justify-center">
                                    {animations.map((a) => (
                                        <button 
                                            key={a.id}
                                            onClick={() => setAnimation(a.id)}
                                            className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all flex flex-col items-center gap-1 ${animation === a.id ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/20 hover:bg-white/10'}`}
                                        >
                                            <PlayCircle size={14} />
                                            {a.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* MAIN ICONS */}
                    <div className="w-full bg-gradient-to-t from-black via-black/90 to-transparent pb-8 pt-6 px-6">
                        <div className="flex justify-center gap-8 max-w-sm mx-auto">
                            {/* Removed Text Tab - Replaced by Inline Editing */}
                            
                            <button onClick={() => toggleTab('style')} className={`flex flex-col items-center gap-1.5 group transition-all ${activeTab === 'style' ? 'scale-110 text-white' : 'text-white/60 hover:text-white'}`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${activeTab === 'style' ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'bg-black/40 backdrop-blur-md border-white/20'}`}>
                                    <Palette size={20} strokeWidth={2.5} />
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-widest">Цвет</span>
                            </button>

                            <button onClick={() => toggleTab('font')} className={`flex flex-col items-center gap-1.5 group transition-all ${activeTab === 'font' ? 'scale-110 text-white' : 'text-white/60 hover:text-white'}`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${activeTab === 'font' ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'bg-black/40 backdrop-blur-md border-white/20'}`}>
                                    <Sliders size={20} strokeWidth={2.5} />
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-widest">Шрифт</span>
                            </button>

                            <button onClick={() => toggleTab('anim')} className={`flex flex-col items-center gap-1.5 group transition-all ${activeTab === 'anim' ? 'scale-110 text-white' : 'text-white/60 hover:text-white'}`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${activeTab === 'anim' ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'bg-black/40 backdrop-blur-md border-white/20'}`}>
                                    <PlayCircle size={20} strokeWidth={2.5} />
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-widest">Аним</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
