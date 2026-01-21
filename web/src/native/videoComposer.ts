
import { registerPlugin } from '@capacitor/core';

export interface VideoComposerPlugin {
  /**
   * Composes a video with an overlay image.
   * @param options 
   * - videoPath: Path to local file (if available)
   * - videoBase64: Base64 string of video file (fallback for web selected files)
   * - overlayBase64: Base64 string of the PNG overlay
   * - duration: Duration in seconds (optional)
   */
  compose(options: {
    videoPath?: string;
    videoBase64?: string;
    overlayBase64: string;
    bitrate?: number;
  }): Promise<{ output: string; success: boolean }>;
}

const VideoComposer = registerPlugin<VideoComposerPlugin>('VideoComposer');

export default VideoComposer;
