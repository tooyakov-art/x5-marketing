
import React, { useRef, useEffect, useState } from 'react';
import { Download, Loader2, ChevronLeft, Check, Share2, Wand2, X, FileVideo, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { CreativeHook } from '../../types';
import { OverlayLayer } from './OverlayLayer';
import { VARIANT_STYLES } from './constants';
import { renderVideo } from '../../services/videoRenderer';

interface VideoGridProps {
    mediaUrl: string | null;
    thumbnailUrl?: string | null;
    mediaType: 'video' | 'image';
    hooks: CreativeHook[];
    onSelect: (id: number, styleId?: string) => void;
    onBack: () => void;
    onGenerateMore: () => void;
    isGenerating: boolean;
    needsWatermark?: boolean;
}

export const VideoGrid: React.FC<VideoGridProps> = ({ mediaUrl, thumbnailUrl, mediaType, hooks, onSelect, onBack, onGenerateMore, isGenerating, needsWatermark = false }) => {
    
    const [cardWidth, setCardWidth] = useState(150);
    const containerRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    
    // Selection Mode
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    
    // Download/Export State
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    
    // Results State (Array of Files)
    const [resultFiles, setResultFiles] = useState<File[]>([]);

    useEffect(() => {
        const updateWidth = () => {
            if (cardRef.current) {
                setCardWidth(cardRef.current.offsetWidth); 
            } else if (containerRef.current) {
                const w = containerRef.current.offsetWidth;
                setCardWidth(w > 768 ? (w / 4 - 20) : (w / 2 - 20));
            }
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, [hooks.length]);

    const toggleSelection = (id: number) => {
        if (selectedIds.includes(id)) setSelectedIds(prev => prev.filter(i => i !== id));
        else setSelectedIds(prev => [...prev, id]);
    };

    const handleDownload = async () => {
        if (selectedIds.length === 0) {
            setSelectionMode(true);
            alert("Нажмите на карточки, чтобы выбрать видео для скачивания.");
            return;
        }
        
        if (!mediaUrl) return;

        setIsExporting(true);
        setExportProgress(0);
        setResultFiles([]);

        const generatedFiles: File[] = [];
        let errorCount = 0;

        try {
            for (let i = 0; i < selectedIds.length; i++) {
                const id = selectedIds[i];
                const hook = hooks.find(h => h.id === id);
                if (!hook) continue;

                const hookIndex = hooks.findIndex(h => h.id === id);
                let styleIndex = VARIANT_STYLES.findIndex(s => s.id === hook.styleId);
                if (styleIndex === -1) styleIndex = hookIndex % VARIANT_STYLES.length;

                try {
                    setExportProgress(((i) / selectedIds.length) * 100);

                    const blob = await renderVideo({
                        videoUrl: mediaUrl,
                        variant: hook,
                        styleIndex: styleIndex,
                        font: hook.font || 'Inter',
                        scale: hook.textScale || 1,
                        watermark: needsWatermark,
                        onProgress: (p) => {
                            const totalP = ((i + p) / selectedIds.length) * 100;
                            setExportProgress(Math.min(totalP, 99));
                        }
                    });

                    // Determine correct extension based on MIME type
                    const ext = blob.type.includes('webm') ? 'webm' : 'mp4';
                    const filename = `x5-reels-${Date.now()}-${i+1}.${ext}`;
                    const file = new File([blob], filename, { type: blob.type });
                    generatedFiles.push(file);

                } catch (err: any) {
                    console.error(`Failed to render video ${i + 1}`, err);
                    errorCount++;
                    if (selectedIds.length === 1) {
                        alert(`Ошибка экспорта: ${err.message}. Попробуйте другое видео.`);
                    }
                }

                // Delay for cleanup
                if (i < selectedIds.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
            }

            if (generatedFiles.length > 0) {
                setResultFiles(generatedFiles);
            } else if (errorCount > 0 && selectedIds.length > 1) {
                alert("Не удалось создать видео. Возможно, формат исходника не поддерживается.");
            }

        } catch (e: any) {
            alert("Критическая ошибка: " + e.message);
        } finally {
            setIsExporting(false);
            setSelectionMode(false);
            setSelectedIds([]);
        }
    };

    const handleShareAll = async () => {
        if (resultFiles.length === 0) return;
        
        try {
            if (navigator.share && navigator.canShare && navigator.canShare({ files: resultFiles })) {
                await navigator.share({
                    files: resultFiles,
                    title: 'X5 Reels',
                    text: `Created with X5 App`
                });
            } else {
                alert("Скачивание файлов начнется автоматически...");
                handleDownloadAll();
            }
        } catch (e) {
            console.log("Share failed or cancelled", e);
        }
    };

    const handleDownloadAll = () => {
        resultFiles.forEach((file, index) => {
            setTimeout(() => {
                const url = URL.createObjectURL(file);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 5000);
            }, index * 1000);
        });
    };

    const handleDownloadSingle = async (file: File) => {
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'Save Video',
                });
                return;
            } catch(e) {}
        }

        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    return (
        <div className="h-full flex flex-col bg-black text-white relative" ref={containerRef}>
            
            {/* PROGRESS OVERLAY */}
            {isExporting && (
                <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center text-center p-6 backdrop-blur-xl animate-fade-in">
                    <Loader2 className="animate-spin text-purple-500 mb-6" size={48} />
                    <h3 className="text-xl font-bold mb-2">
                        {exportProgress > 95 ? "Финализация..." : "Рендеринг..."}
                    </h3>
                    <p className="text-sm text-gray-400 mb-6">
                        {exportProgress > 95 ? "Собираем файлы" : `Обработка ${selectedIds.length > 1 ? 'очереди' : 'видео'}`}
                    </p>
                    <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-200" style={{width: `${exportProgress}%`}}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">{Math.round(exportProgress)}%</p>

                    <div className="mt-10 bg-red-500/10 border border-red-500/30 p-5 rounded-2xl max-w-xs animate-pulse">
                        <div className="flex flex-col items-center gap-2">
                            <AlertTriangle size={24} className="text-red-500" />
                            <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Не сворачивайте</p>
                        </div>
                        <p className="text-[11px] text-red-200 leading-relaxed mt-2 font-medium">
                            Пожалуйста, не закрывайте приложение и не выключайте экран до завершения рендеринга.
                        </p>
                    </div>
                </div>
            )}

            {/* UNIFIED RESULT MODAL */}
            {resultFiles.length > 0 && !isExporting && (
                <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center animate-fade-in p-6 backdrop-blur-xl">
                    <div className="absolute top-6 right-6 z-20">
                        <button onClick={() => setResultFiles([])} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform hover:bg-white/20">
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="w-full max-w-sm flex flex-col items-center gap-4 animate-scale-in">
                        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/20 mb-2">
                            <Check size={40} className="text-black" strokeWidth={4} />
                        </div>
                        
                        <div className="text-center mb-6">
                            <h3 className="text-3xl font-black text-white mb-2">Готово!</h3>
                            <p className="text-gray-400">Сгенерировано: {resultFiles.length} видео</p>
                        </div>

                        <button 
                            onClick={handleShareAll} 
                            className="w-full px-8 py-5 bg-white text-black rounded-[24px] font-bold text-lg flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-transform hover:bg-gray-100"
                        >
                            <Share2 size={24} />
                            <span>Поделиться / Share</span>
                        </button>

                        <button 
                            onClick={handleDownloadAll} 
                            className="w-full px-8 py-5 bg-white/10 text-white rounded-[24px] font-bold text-lg flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-transform border border-white/20"
                        >
                            <Download size={24} />
                            <span>Скачать в Галерею</span>
                        </button>

                        <div className="w-full bg-white/5 rounded-[24px] border border-white/10 p-2 max-h-[150px] overflow-y-auto mt-4 custom-scrollbar">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest pl-3 mb-2 pt-2">Файлы по отдельности</p>
                            {resultFiles.map((file, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-xl transition-colors group">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-slate-300">
                                            <FileVideo size={16} />
                                        </div>
                                        <span className="text-sm font-medium text-slate-300 truncate w-[160px]">{file.name}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleDownloadSingle(file)}
                                        className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-white hover:text-black transition-all"
                                    >
                                        <Download size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div className="flex items-center justify-between p-4 pt-12 z-20">
                <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:scale-90 transition-transform"><ChevronLeft size={20}/></button>
                <h2 className="text-xs font-bold opacity-50 tracking-[0.2em] uppercase">ВАРИАНТЫ</h2>
                <button onClick={() => setSelectionMode(!selectionMode)} className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors ${selectionMode ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`}>
                    {selectionMode ? 'ОТМЕНА' : 'ВЫБРАТЬ'}
                </button>
            </div>

            {/* GRID */}
            <div className="flex-1 overflow-y-auto px-3 pb-32">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {hooks.map((hook, idx) => {
                        const activeStyle = VARIANT_STYLES.find(s => s.id === hook.styleId) || VARIANT_STYLES[idx % VARIANT_STYLES.length] || VARIANT_STYLES[0];
                        
                        return (
                        <div 
                            key={hook.id}
                            ref={idx === 0 ? cardRef : null}
                            onClick={() => {
                                if (selectionMode && hook.id) {
                                    toggleSelection(hook.id);
                                } else if (hook.id) {
                                    onSelect(hook.id, activeStyle.id);
                                }
                            }}
                            className={`relative aspect-[9/16] rounded-[20px] overflow-hidden bg-gray-900 active:scale-95 transition-all duration-200 border-2 group ${selectedIds.includes(hook.id!) ? 'border-green-500' : 'border-transparent hover:border-white/30'}`}
                        >
                            {mediaType === 'image' ? (
                                <img src={mediaUrl || ''} className="w-full h-full object-cover opacity-80" />
                            ) : (
                                thumbnailUrl ? (
                                    <img src={thumbnailUrl} className="w-full h-full object-cover opacity-80" />
                                ) : (
                                    <video src={mediaUrl || ''} className="w-full h-full object-cover opacity-80" muted playsInline />
                                )
                            )}
                            
                            <div className="absolute inset-0 pointer-events-none">
                                {cardWidth > 0 && (
                                    <OverlayLayer 
                                        variant={hook}
                                        style={activeStyle}
                                        containerWidth={cardWidth} 
                                        font={hook.font || 'Inter'}
                                        animation={'none'}
                                        scale={hook.textScale || 1}
                                        positions={hook.positions || {}}
                                    />
                                )}
                            </div>

                            {needsWatermark && (
                                <div className="absolute bottom-2 right-2 z-10 opacity-60">
                                    <span className="text-[8px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm">X5 Free</span>
                                </div>
                            )}

                            {selectionMode && selectedIds.includes(hook.id!) && (
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-20 backdrop-blur-[1px]">
                                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white shadow-xl animate-scale-in">
                                        <Check size={20} strokeWidth={3} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )})}
                </div>
            </div>

            {/* FLOATING ACTION BUTTONS */}
            <div className="absolute bottom-8 left-0 right-0 z-40 px-6 flex justify-center items-center gap-6 pointer-events-none">
                <button 
                    onClick={onGenerateMore} 
                    disabled={isGenerating} 
                    className="pointer-events-auto h-12 w-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg active:scale-90 transition-all hover:bg-black/80"
                >
                    {isGenerating ? <Loader2 className="animate-spin" size={18}/> : <Wand2 size={20}/>}
                </button>

                <button 
                    onClick={handleDownload} 
                    className={`pointer-events-auto h-14 w-14 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all ${selectedIds.length > 0 ? 'bg-white text-black scale-110' : 'bg-white/10 text-white backdrop-blur-md border border-white/20 hover:bg-white/20'}`}
                >
                    <Download size={24}/>
                    {selectedIds.length > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white border border-black">
                            {selectedIds.length}
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
};
