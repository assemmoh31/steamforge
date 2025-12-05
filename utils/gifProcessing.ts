
// @ts-ignore
import * as gifuct from 'gifuct-js';
// @ts-ignore
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

// Defensive import handling for gifuct-js which might be wrapped in default by some CDNs
const parseGIF = gifuct.parseGIF || (gifuct as any).default?.parseGIF;
const decompressFrames = gifuct.decompressFrames || (gifuct as any).default?.decompressFrames;

export interface GifFrame {
  canvas: HTMLCanvasElement;
  delay: number;
  dims: { width: number; height: number; left: number; top: number };
}

export async function extractFramesFromGif(url: string): Promise<GifFrame[]> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  
  if (!parseGIF || !decompressFrames) {
      throw new Error("GIF Library not loaded correctly");
  }

  // Parse the GIF
  const parsedGif = parseGIF(buffer);
  
  // Decompress frames
  const frames = decompressFrames(parsedGif, true);

  const loadedFrames: GifFrame[] = [];
  
  // Set dimensions based on GIF header
  const width = parsedGif.lsd.width;
  const height = parsedGif.lsd.height;

  // Temporary canvas for composing frames (handling disposal/patches)
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

  if (!tempCtx) throw new Error("Could not create canvas context");

  // Iterate frames and composite
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const dims = frame.dims;
    
    // Create ImageData from patch
    const patchData = new ImageData(
        new Uint8ClampedArray(frame.patch),
        dims.width,
        dims.height
    );

    // Draw patch
    tempCtx.putImageData(patchData, dims.left, dims.top);

    // Snapshot full frame
    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = width;
    frameCanvas.height = height;
    const frameCtx = frameCanvas.getContext('2d');
    if (frameCtx) {
        frameCtx.drawImage(tempCanvas, 0, 0);
    }
    
    loadedFrames.push({
        canvas: frameCanvas,
        delay: frame.delay,
        dims: { width, height, left: 0, top: 0 }
    });

    // Handle Disposal
    // 2: Restore to background (clear area)
    if (frame.disposalType === 2) {
        tempCtx.clearRect(dims.left, dims.top, dims.width, dims.height);
    }
    // 3: Restore to previous is complex and rare, simplified here to "do nothing" (keep previous)
    // or we'd need to save state. For most GIFs, cumulative (1) or background (2) is sufficient.
  }

  return loadedFrames;
}

export async function generateSpritesheetBlob(
  frames: GifFrame[], 
  columns: number, 
  padding: number, 
  bgColor: string,
  preserveTransparency: boolean
): Promise<string> {
  if (frames.length === 0) return '';

  const frameWidth = frames[0].dims.width;
  const frameHeight = frames[0].dims.height;
  
  const rows = Math.ceil(frames.length / columns);
  const sheetWidth = (frameWidth * columns) + (padding * (columns - 1));
  const sheetHeight = (frameHeight * rows) + (padding * (rows - 1));

  const canvas = document.createElement('canvas');
  canvas.width = sheetWidth;
  canvas.height = sheetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  // Background
  if (!preserveTransparency) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, sheetWidth, sheetHeight);
  }

  frames.forEach((frame, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      
      const x = col * (frameWidth + padding);
      const y = row * (frameHeight + padding);
      
      ctx.drawImage(frame.canvas, x, y);
  });

  return canvas.toDataURL('image/png');
}

export async function cropAndEncodeGif(
  frames: GifFrame[],
  crop: { x: number; y: number; width: number; height: number },
  progressCallback?: (progress: number) => void
): Promise<Blob> {
  const encoder = new GIFEncoder();
  
  // Create a reusable canvas for cropping
  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  if (!ctx) throw new Error("No context");

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    
    if (progressCallback) progressCallback(i / frames.length);

    // Clear and Draw cropped region
    ctx.clearRect(0, 0, crop.width, crop.height);
    // Draw full frame shifted by negative offset
    ctx.drawImage(frame.canvas, -crop.x, -crop.y);
    
    const imageData = ctx.getImageData(0, 0, crop.width, crop.height);
    const data = imageData.data;
    
    // Quantize (gifenc defaults to max 256 colors)
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);
    
    // Write frame
    encoder.writeFrame(index, crop.width, crop.height, {
      palette,
      delay: frame.delay || 100, // delay in ms
      transparent: true,
      dispose: -1 // Auto
    });
    
    // Yield to main thread
    if (i % 5 === 0) await new Promise(r => setTimeout(r, 0));
  }
  
  encoder.finish();
  
  // gifenc 1.0.3 uses bytesView() for the output
  return new Blob([encoder.bytesView()], { type: 'image/gif' });
}

export async function optimizeGif(
  frames: GifFrame[],
  config: { targetFps: number; widthScale: number; colors: number },
  progressCallback?: (progress: number) => void
): Promise<Blob> {
  const encoder = new GIFEncoder();
  const targetDelay = 1000 / config.targetFps;
  
  const originalWidth = frames[0].dims.width;
  const originalHeight = frames[0].dims.height;
  const targetWidth = Math.floor(originalWidth * config.widthScale);
  const targetHeight = Math.floor(originalHeight * config.widthScale);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error("No context");

  let timeAccumulator = 0;
  let processedFrames = 0;

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    timeAccumulator += frame.delay;
    
    if (timeAccumulator >= targetDelay || i === frames.length - 1) {
       // We emit this frame
       if (progressCallback) progressCallback(i / frames.length);

       // Resize
       ctx.clearRect(0, 0, targetWidth, targetHeight);
       ctx.drawImage(frame.canvas, 0, 0, targetWidth, targetHeight);
       
       const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
       const data = imageData.data;

       // Quantize
       const palette = quantize(data, config.colors);
       const index = applyPalette(data, palette);

       encoder.writeFrame(index, targetWidth, targetHeight, {
           palette,
           delay: targetDelay, // Use consistent delay for smoother output if forcing FPS, or use accumulated if keeping variable.
           // For an "Optimizer", forcing constant FPS is usually safer for size.
           transparent: true,
           dispose: -1
       });

       // Reduce accumulator by targetDelay steps until it's below threshold
       while (timeAccumulator >= targetDelay) {
           timeAccumulator -= targetDelay;
       }
       processedFrames++;
       
       // Yield
       if (processedFrames % 5 === 0) await new Promise(r => setTimeout(r, 0));
    }
  }

  encoder.finish();
  return new Blob([encoder.bytesView()], { type: 'image/gif' });
}

export async function composeGif(
  baseFrames: GifFrame[],
  overlayFrames: GifFrame[],
  size: number = 184,
  progressCallback?: (progress: number) => void
): Promise<Blob> {
    const encoder = new GIFEncoder();
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error("No context");

    // Determine the total duration and frame count based on the longer animation
    // Simplified: We loop the shorter one to match the longer one, or just take the longer one's length.
    // For smoothness, we should find LCM of durations, but for this tool, we will limit to max 100 frames to avoid crashes.
    
    const baseLen = baseFrames.length;
    const overlayLen = overlayFrames.length;
    
    const maxFrames = Math.max(baseLen, overlayLen);
    const totalFrames = Math.min(maxFrames * 2, 120); // Cap at 120 frames to prevent crazy LCM

    // Logic: We iterate 'totalFrames'. For each step, we pick the corresponding frame from base and overlay using modulo.
    // Note: This assumes delays are somewhat similar or we ignore delay sync perfection for MVP.
    // Ideally we track time accumulator. Let's do index modulo for simplicity as most Steam assets are uniform framerate.
    
    for (let i = 0; i < totalFrames; i++) {
        if (progressCallback) progressCallback(i / totalFrames);

        const baseFrame = baseFrames[i % baseLen];
        const overlayFrame = overlayFrames[i % overlayLen];

        ctx.clearRect(0, 0, size, size);
        
        // Draw Base (scaled)
        ctx.drawImage(baseFrame.canvas, 0, 0, size, size);
        
        // Draw Overlay (scaled)
        ctx.drawImage(overlayFrame.canvas, 0, 0, size, size);
        
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        
        // Quantize
        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);
        
        // Delay logic: use the delay of the "main" animated element (the one with more frames)
        const delay = baseLen >= overlayLen ? baseFrame.delay : overlayFrame.delay;

        encoder.writeFrame(index, size, size, {
            palette,
            delay: delay || 100,
            transparent: true,
            dispose: -1
        });

        // Loop breaker check: if we've completed a cycle of both
        if ((i + 1) % baseLen === 0 && (i + 1) % overlayLen === 0) {
            break;
        }

        if (i % 5 === 0) await new Promise(r => setTimeout(r, 0));
    }

    encoder.finish();
    return new Blob([encoder.bytesView()], { type: 'image/gif' });
}