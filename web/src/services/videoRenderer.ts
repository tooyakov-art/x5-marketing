
import { CreativeHook, VideoFont } from '../types';
import { VARIANT_STYLES } from '../views/video_parts/constants';

interface RenderOptions {
  videoUrl: string;
  variant: CreativeHook;
  styleIndex: number;
  font: VideoFont;
  scale: number;
  watermark?: boolean;
  onProgress: (progress: number) => void;
}

// Helper: Draw Rounded Rect
const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

// Helper: Wrap Text
const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
};

const getBestSupportedMimeType = () => {
    // Prioritize MP4 for mobile compatibility
    const types = [
        'video/mp4',
        'video/mp4;codecs=h264',
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/webm;codecs=h264',
        'video/webm;codecs=vp9',
        'video/webm'
    ];
    for (const t of types) {
        if (MediaRecorder.isTypeSupported(t)) {
            return t;
        }
    }
    return ''; // Let browser decide default if nothing matches
};

export const renderVideo = async ({ videoUrl, variant, styleIndex, font, scale, watermark = false, onProgress }: RenderOptions): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    let canvas: HTMLCanvasElement | null = document.createElement('canvas');
    let overlayCanvas: HTMLCanvasElement | null = document.createElement('canvas');
    let video: HTMLVideoElement | null = document.createElement('video');
    let recorder: MediaRecorder | null = null;
    let audioCtx: AudioContext | null = null;
    let source: MediaElementAudioSourceNode | null = null;
    let dest: MediaStreamAudioDestinationNode | null = null;
    let stream: MediaStream | null = null;
    let animationFrameId: number | null = null;
    let isCleanedUp = false;
    let hasStarted = false;

    const cleanup = () => {
        if (isCleanedUp) return;
        isCleanedUp = true;

        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        
        if (video) {
            video.pause();
            video.removeAttribute('src');
            video.load(); 
            video.remove();
            video = null;
        }

        if (recorder && recorder.state === 'recording') {
            try { recorder.stop(); } catch(e){}
        }
        recorder = null;

        if (source) {
            try { source.disconnect(); } catch(e){}
            source = null;
        }

        if (audioCtx) {
            if (audioCtx.state !== 'closed') audioCtx.close();
            audioCtx = null;
        }

        if (stream) {
            try {
                stream.getTracks().forEach(track => track.stop());
            } catch(e) {}
            stream = null;
        }

        // Help GC
        if (canvas) { canvas.width = 1; canvas = null; }
        if (overlayCanvas) { overlayCanvas.width = 1; overlayCanvas = null; }
    };

    // SETUP CANVAS
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d', { 
        alpha: false, 
        willReadFrequently: false 
    });
    
    if (!ctx) {
        cleanup();
        return reject(new Error('Canvas Context Failed'));
    }

    // SETUP OVERLAY
    overlayCanvas.width = 1080;
    overlayCanvas.height = 1920;
    const oCtx = overlayCanvas.getContext('2d');

    if (oCtx) {
        const style = VARIANT_STYLES[styleIndex % VARIANT_STYLES.length] || VARIANT_STYLES[0];
        oCtx.textAlign = 'center';
        oCtx.textBaseline = 'middle';
        
        const fontSizeHeadline = 100 * scale;
        const fontSizeBadge = 42 * scale;
        const fontSizeCTA = 54 * scale;
        const fontSizeSmall = 42 * scale;

        const defaultPos = { badge: 300, headline: 450, smallText: 1400, cta: 1600 };
        const positions = variant.positions || {};

        const drawElement = (type: 'badge' | 'headline' | 'smallText' | 'cta') => {
            const pos = positions[type] || { x: 0, y: 0 };
            const startY = defaultPos[type];
            const anchorX = (1080 / 2) + pos.x;
            const anchorY = startY + pos.y;

            oCtx.save();
            oCtx.translate(anchorX, anchorY);

            if (type === 'badge' && variant.badge) {
                oCtx.font = `900 ${fontSizeBadge}px "${font}"`;
                const txt = variant.badge.toUpperCase();
                const m = oCtx.measureText(txt);
                const w = m.width + (80 * scale);
                const h = fontSizeBadge + (32 * scale);
                
                oCtx.shadowColor = "rgba(0,0,0,0.3)";
                oCtx.shadowBlur = 24;
                oCtx.shadowOffsetY = 4;
                oCtx.fillStyle = style.badgeBg;
                roundRect(oCtx, -w/2, 0, w, h, 999);
                oCtx.fill();
                oCtx.shadowColor = "transparent";
                oCtx.fillStyle = style.badgeText;
                oCtx.fillText(txt, 0, h/2 + (4 * scale)); 
            }

            if (type === 'headline' && variant.headline) {
                oCtx.font = `900 ${fontSizeHeadline}px "${font}"`;
                if (style.shadow === 'neon') { oCtx.shadowColor = "rgba(217, 249, 157, 0.6)"; oCtx.shadowBlur = 20; }
                else if (style.shadow === 'neon_blue') { oCtx.shadowColor = "rgba(59, 130, 246, 0.8)"; oCtx.shadowBlur = 20; }
                else if (style.shadow === 'strong') { oCtx.shadowColor = "rgba(0,0,0,0.9)"; oCtx.shadowBlur = 15; oCtx.shadowOffsetY = 4; }
                else if (style.shadow === 'hard_black') { oCtx.shadowColor = "#000000"; oCtx.shadowOffsetX = 4; oCtx.shadowOffsetY = 4; oCtx.shadowBlur = 0; }
                else { oCtx.shadowColor = "rgba(0,0,0,0.5)"; oCtx.shadowBlur = 10; oCtx.shadowOffsetY = 4; }

                oCtx.fillStyle = style.headlineColor;
                const paddingOffset = 20 * scale; 
                oCtx.translate(0, paddingOffset);

                const lines = wrapText(oCtx, variant.headline.toUpperCase(), 900);
                
                const lineHeight = fontSizeHeadline * 0.95;
                lines.forEach((l, i) => oCtx.fillText(l, 0, (i * lineHeight) + (lineHeight / 2)));
            }

            if (type === 'smallText' && variant.smallText) {
                oCtx.font = `700 ${fontSizeSmall}px "${font}"`;
                const maxTextWidth = 800; 
                const lines = wrapText(oCtx, variant.smallText, maxTextWidth);
                let maxLineWidth = 0;
                lines.forEach(l => {
                    const m = oCtx.measureText(l);
                    if(m.width > maxLineWidth) maxLineWidth = m.width;
                });

                const w = maxLineWidth + (80 * scale); 
                const lineHeight = fontSizeSmall * 1.3;
                const h = (lines.length * lineHeight) + (48 * scale);

                oCtx.fillStyle = "rgba(0,0,0,0.5)"; 
                oCtx.shadowColor = "rgba(0,0,0,0.1)"; 
                oCtx.shadowBlur = 20;
                roundRect(oCtx, -w/2, 0, w, h, 40);
                oCtx.fill();
                
                oCtx.shadowColor = "transparent";
                oCtx.fillStyle = "#fff";
                
                const startTextY = (h / 2) - ((lines.length * lineHeight) / 2) + (lineHeight / 2);
                
                lines.forEach((l, i) => {
                    oCtx.fillText(l, 0, startTextY + (i * lineHeight) - (3 * scale)); 
                });
            }

            if (type === 'cta' && variant.cta) {
                oCtx.font = `800 ${fontSizeCTA}px "${font}"`;
                const txt = variant.cta.toUpperCase();
                const m = oCtx.measureText(txt);
                const w = m.width + (120 * scale);
                const h = fontSizeCTA + (64 * scale);
                oCtx.fillStyle = style.ctaBg;
                oCtx.shadowColor = "rgba(0,0,0,0.4)"; oCtx.shadowBlur = 40; oCtx.shadowOffsetY = 10;
                roundRect(oCtx, -w/2, 0, w, h, 999);
                oCtx.fill();
                oCtx.shadowColor = "transparent";
                oCtx.fillStyle = style.ctaText;
                oCtx.fillText(txt, 0, h/2 + (4 * scale));
            }
            oCtx.restore();
        };

        drawElement('badge');
        drawElement('headline');
        drawElement('smallText');
        drawElement('cta');

        if (watermark) {
            oCtx.save();
            oCtx.font = "bold 40px Arial";
            oCtx.fillStyle = "rgba(255, 255, 255, 0.6)";
            oCtx.shadowColor = "rgba(0,0,0,0.5)";
            oCtx.shadowBlur = 4;
            oCtx.textAlign = "right";
            oCtx.textBaseline = "bottom";
            oCtx.fillText("X5 Free Version", 1080 - 40, 1920 - 40);
            oCtx.restore();
        }
    }

    // FIX: Only set crossOrigin if it's NOT a blob URL. 
    if (!videoUrl.startsWith('blob:')) {
        video.crossOrigin = 'anonymous';
    }
    
    // IMPORTANT: Enable audio
    video.muted = false; // We MUST unmute the element to capture audio
    video.volume = 1.0;  // Ensure volume is up
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('webkit-playsinline', 'true'); 
    video.src = videoUrl;

    const safetyTimeout = setTimeout(() => {
        cleanup();
        reject(new Error("Тайм-аут генерации (45 сек)"));
    }, 45000);

    const loadTimeout = setTimeout(() => {
        if (!hasStarted) {
            cleanup();
            reject(new Error("Не удалось загрузить видео"));
        }
    }, 10000);

    video.onerror = (e) => {
        clearTimeout(safetyTimeout);
        clearTimeout(loadTimeout);
        cleanup();
        reject(new Error(`Ошибка загрузки видео-файла`));
    };
    
    const startProcessing = async () => {
        if (hasStarted) return;
        hasStarted = true;
        clearTimeout(loadTimeout);

        const mimeType = getBestSupportedMimeType();

        try {
            stream = canvas!.captureStream(30); 

            // --- AUDIO CAPTURE SYSTEM ---
            // We use WebAudio to capture the audio from the video element.
            // This allows us to pipe it to the MediaRecorder WITHOUT playing it on the speakers.
            // (createMediaElementSource 'steals' the audio output from the element)
            try {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioContext) {
                    audioCtx = new AudioContext();
                    
                    // Create Source from Video Element
                    source = audioCtx.createMediaElementSource(video!);
                    
                    // Create Stream Destination (this goes to Recorder)
                    dest = audioCtx.createMediaStreamDestination();
                    
                    // Connect Video -> Destination (Recorder)
                    // We DO NOT connect to audioCtx.destination (Speakers), so it remains silent to user
                    source.connect(dest);
                    
                    const audioTrack = dest.stream.getAudioTracks()[0];
                    if (audioTrack) {
                        stream.addTrack(audioTrack);
                        console.log("Audio track added via WebAudio");
                    }
                    
                    if (audioCtx.state === 'suspended') await audioCtx.resume();
                }
            } catch (audioErr) {
                console.warn("WebAudio Capture failed, trying fallback...", audioErr);
                // Fallback: Try to get tracks directly if browser allows (works in some contexts)
                // Note: If video.muted was true, this would be silent. We rely on video.muted = false above.
                if ((video as any).captureStream) {
                     const vidStream = (video as any).captureStream();
                     const tracks = vidStream.getAudioTracks();
                     if (tracks.length > 0) stream.addTrack(tracks[0]);
                } else if ((video as any).mozCaptureStream) {
                     const vidStream = (video as any).mozCaptureStream();
                     const tracks = vidStream.getAudioTracks();
                     if (tracks.length > 0) stream.addTrack(tracks[0]);
                }
            }

            const options: MediaRecorderOptions = {
                videoBitsPerSecond: 3000000, 
            };
            if (mimeType) options.mimeType = mimeType;

            recorder = new MediaRecorder(stream, options);
        } catch (e) {
            clearTimeout(safetyTimeout);
            cleanup();
            reject(new Error("Ошибка инициализации записи: " + (e as any).message));
            return;
        }
      
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
            clearTimeout(safetyTimeout);
            onProgress(1);
            const blob = new Blob(chunks, { type: mimeType || 'video/mp4' });
            cleanup(); 
            resolve(blob);
        };

        recorder.onerror = (e: any) => {
            clearTimeout(safetyTimeout);
            cleanup();
            reject(new Error("Ошибка записи: " + e.error?.message));
        };

        try {
            await video!.play();
        } catch (e) {
            clearTimeout(safetyTimeout);
            cleanup();
            reject(new Error("Браузер заблокировал воспроизведение. Попробуйте еще раз."));
            return;
        }

        recorder.start();

        const renderFrame = () => {
            if (!canvas || !ctx || !video) return; 

            if (video.paused || video.ended) {
                if (recorder && recorder.state === 'recording') recorder.stop();
                return;
            }

            if (video.duration && video.duration > 0) {
                const p = video.currentTime / video.duration;
                onProgress(Math.min(p, 0.99));
            }

            const hRatio = canvas.width / video.videoWidth;
            const vRatio = canvas.height / video.videoHeight;
            const ratio = Math.max(hRatio, vRatio);
            const centerShift_x = (canvas.width - video.videoWidth * ratio) / 2;
            const centerShift_y = (canvas.height - video.videoHeight * ratio) / 2;
            
            ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, centerShift_x, centerShift_y, video.videoWidth * ratio, video.videoHeight * ratio);
            
            if (overlayCanvas) ctx.drawImage(overlayCanvas, 0, 0);

            animationFrameId = requestAnimationFrame(renderFrame);
        };

        animationFrameId = requestAnimationFrame(renderFrame);
    };

    video.oncanplay = () => {
        startProcessing().catch(e => reject(e));
    };
  });
};
