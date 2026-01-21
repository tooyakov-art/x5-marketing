
import React, { useRef, useEffect } from 'react';
import { VideoFont, VideoAnimation, ElementPosition } from '../../types';

interface OverlayLayerProps {
    variant: any;
    style: any;
    containerWidth: number; 
    font: VideoFont;
    animation: VideoAnimation;
    scale?: number;
    positions?: { [key: string]: ElementPosition };
    onElementDown?: (e: React.TouchEvent | React.MouseEvent, id: string) => void;
    activeElementId?: string | null;
    draggingId?: string | null;
    
    // Edit Props
    editingId?: string | null;
    onTextChange?: (text: string) => void;
    onEditEnd?: () => void;
}

export const OverlayLayer: React.FC<OverlayLayerProps> = ({ 
    variant, style, containerWidth, font, animation, scale = 1, positions = {}, onElementDown, activeElementId, draggingId,
    editingId, onTextChange, onEditEnd
}) => {
     // BASE CANVAS SIZE (The coordinate system we are working in)
     const BASE_WIDTH = 1080;
     const BASE_HEIGHT = 1920;
     
     // Scale factor to fit the preview container
     const containerScale = containerWidth / BASE_WIDTH;

     const getFontFamily = (f: VideoFont) => {
         switch(f) {
             case 'Bebas Neue': return '"Bebas Neue", sans-serif';
             case 'Playfair Display': return '"Playfair Display", serif';
             case 'Oswald': return '"Oswald", sans-serif';
             case 'Montserrat': return '"Montserrat", sans-serif';
             case 'Roboto Mono': return '"Roboto Mono", monospace';
             default: return '"Inter", sans-serif';
         }
     }

     const getShadow = () => {
         switch(style.shadow) {
             case 'neon': return '0 0 20px rgba(217, 249, 157, 0.6)';
             case 'neon_blue': return '0 0 20px rgba(59, 130, 246, 0.8)';
             case 'strong': return '0 4px 10px rgba(0,0,0,0.8)';
             case 'hard_black': return '2px 2px 0px #000000'; 
             default: return '0 2px 10px rgba(0,0,0,0.5)';
         }
     }

     const animClass = (animName: string) => {
         // Disable entry animations if we are editing/dragging to prevent jumps
         if (activeElementId || draggingId) return '';
         
         switch(animName) {
             case 'fade-up': return 'animate-video-fade-up';
             case 'scale-in': return 'animate-video-scale-in';
             default: return '';
         }
     }

     // Default positions if undefined
     const getPos = (key: string, defaultY: number): React.CSSProperties => {
         const pos = positions[key] || { x: 0, y: 0 };
         return {
             transform: `translate(${pos.x}px, ${pos.y}px)`,
             top: `${defaultY}px`,
             left: '50%',
             marginLeft: '-400px', // Center the 800px wide element
             width: '800px',
             position: 'absolute',
             cursor: 'grab',
             touchAction: 'none', 
             transition: draggingId === key ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)' 
         };
     };

     const commonStyle: React.CSSProperties = {
         fontFamily: getFontFamily(font),
         textAlign: 'center',
         userSelect: 'none',
         WebkitUserSelect: 'none',
         zIndex: 10,
     };

     // Auto-focus logic for editable textarea
     const EditableText = ({ id, value, styleProps, containerStyle }: any) => {
         const ref = useRef<HTMLTextAreaElement>(null);
         useEffect(() => {
             if (ref.current) {
                 ref.current.focus();
                 // Move cursor to end
                 ref.current.setSelectionRange(value.length, value.length);
             }
         }, []);

         return (
             <div style={containerStyle} className="pointer-events-auto">
                 <textarea
                    ref={ref}
                    value={value}
                    onChange={(e) => onTextChange && onTextChange(e.target.value)}
                    onBlur={onEditEnd}
                    className="w-full bg-transparent border-none outline-none resize-none overflow-hidden text-center mx-auto"
                    style={{
                        ...styleProps,
                        minHeight: '1.2em',
                        padding: 0,
                        margin: 0,
                        caretColor: '#ec4899', // Pink cursor
                        // Fix for textarea vertical alignment
                        display: 'block', 
                    }}
                    // Simple auto-height hack
                    onInput={(e: any) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                 />
             </div>
         )
     };

     return (
         <div 
             className="absolute top-0 left-0 overflow-hidden pointer-events-none"
             style={{ 
                 width: BASE_WIDTH, 
                 height: BASE_HEIGHT, 
                 transformOrigin: 'top left',
                 transform: `scale(${containerScale})`, 
             }}
         >
             {/* 1. BADGE */}
             {variant.badge && (
                 <div 
                    style={{...getPos('badge', 300), ...commonStyle}} 
                    className={`pointer-events-auto flex justify-center ${animClass(animation)}`}
                    onMouseDown={(e) => onElementDown && onElementDown(e, 'badge')}
                    onTouchStart={(e) => onElementDown && onElementDown(e, 'badge')}
                 >
                     {editingId === 'badge' ? (
                         <div className="px-10 py-4 rounded-full shadow-xl ring-4 ring-purple-500 bg-white" style={{ backgroundColor: style.badgeBg }}>
                             <EditableText 
                                id="badge" 
                                value={variant.badge} 
                                styleProps={{ 
                                    color: style.badgeText, 
                                    fontSize: `${42 * scale}px`, 
                                    fontWeight: 900, 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '0.1em',
                                    height: `${42 * scale * 1.5}px`
                                }}
                             />
                         </div>
                     ) : (
                         <div 
                            className={`px-10 py-4 rounded-full shadow-xl border-2 transition-colors ${activeElementId === 'badge' ? 'border-white/80' : 'border-transparent'}`}
                            style={{ backgroundColor: style.badgeBg }}
                         >
                             <span style={{ 
                                 color: style.badgeText, 
                                 fontSize: `${42 * scale}px`, 
                                 fontWeight: 900, 
                                 textTransform: 'uppercase', 
                                 letterSpacing: '0.1em' 
                             }}>
                                {variant.badge}
                             </span>
                         </div>
                     )}
                 </div>
             )}

             {/* 2. HEADLINE */}
             <div 
                style={{...getPos('headline', 450), ...commonStyle}} 
                className={`pointer-events-auto ${animClass(animation)}`}
                onMouseDown={(e) => onElementDown && onElementDown(e, 'headline')}
                onTouchStart={(e) => onElementDown && onElementDown(e, 'headline')}
             >
                 {editingId === 'headline' ? (
                     <div className="w-full h-auto min-h-[100px] border-2 border-purple-500 rounded-xl bg-black/20 backdrop-blur-sm">
                         <EditableText 
                            id="headline"
                            value={variant.headline}
                            styleProps={{
                                color: style.headlineColor, 
                                fontSize: `${100 * scale}px`, 
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                textShadow: getShadow(),
                                lineHeight: 0.95
                            }}
                         />
                     </div>
                 ) : (
                     <h1 className={`leading-[0.95] break-words w-full transition-opacity p-5 rounded-xl border-2 ${activeElementId === 'headline' ? 'border-white/50 bg-black/10' : 'border-transparent'}`}
                         style={{ 
                             color: style.headlineColor, 
                             fontSize: `${100 * scale}px`, 
                             fontWeight: 900,
                             textTransform: 'uppercase',
                             textShadow: getShadow(),
                         }}>
                         {variant.headline}
                     </h1>
                 )}
             </div>

             {/* 3. SMALL TEXT */}
             {variant.smallText && (
                 <div 
                    style={{...getPos('smallText', 1400), ...commonStyle}} 
                    className={`pointer-events-auto ${animClass(animation)}`}
                    onMouseDown={(e) => onElementDown && onElementDown(e, 'smallText')}
                    onTouchStart={(e) => onElementDown && onElementDown(e, 'smallText')}
                 >
                     {editingId === 'smallText' ? (
                         <div className="bg-black/60 backdrop-blur-md px-10 py-6 rounded-[40px] inline-block max-w-[90%] border-2 border-purple-500">
                             <EditableText 
                                id="smallText"
                                value={variant.smallText}
                                styleProps={{ color: 'white', fontSize: `${42 * scale}px`, fontWeight: 700, lineHeight: 1.2 }}
                             />
                         </div>
                     ) : (
                         <div className={`bg-black/40 backdrop-blur-md px-10 py-6 rounded-[40px] inline-block max-w-[90%] border-2 transition-colors ${activeElementId === 'smallText' ? 'border-white/50' : 'border-transparent'}`}>
                             <p style={{ color: 'white', fontSize: `${42 * scale}px`, fontWeight: 700, lineHeight: 1.2 }}>
                                 {variant.smallText}
                             </p>
                         </div>
                     )}
                 </div>
             )}
             
             {/* 4. CTA BUTTON */}
             {variant.cta && (
                 <div 
                    style={{...getPos('cta', 1600), ...commonStyle}} 
                    className={`pointer-events-auto flex justify-center ${animClass(animation)}`}
                    onMouseDown={(e) => onElementDown && onElementDown(e, 'cta')}
                    onTouchStart={(e) => onElementDown && onElementDown(e, 'cta')}
                 >
                     {editingId === 'cta' ? (
                         <div className="px-14 py-8 rounded-full shadow-2xl ring-4 ring-purple-500" style={{ backgroundColor: style.ctaBg }}>
                             <EditableText 
                                id="cta"
                                value={variant.cta}
                                styleProps={{ 
                                    color: style.ctaText, 
                                    fontSize: `${54 * scale}px`, 
                                    fontWeight: 800, 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '0.05em'
                                }}
                             />
                         </div>
                     ) : (
                         <div className={`px-14 py-8 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-2 transition-colors ${activeElementId === 'cta' ? 'border-white/50' : 'border-transparent'}`}
                              style={{ backgroundColor: style.ctaBg }}>
                             <span style={{ 
                                 color: style.ctaText, 
                                 fontSize: `${54 * scale}px`, 
                                 fontWeight: 800, 
                                 textTransform: 'uppercase', 
                                 letterSpacing: '0.05em'
                             }}>
                                {variant.cta}
                             </span>
                         </div>
                     )}
                 </div>
             )}
         </div>
     )
};
