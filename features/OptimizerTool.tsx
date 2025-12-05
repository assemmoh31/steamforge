
import React, { useState, useEffect, useRef } from 'react';
import { UploadResponse, OptimizerConfig } from '../types';
import { FileUploader } from '../components/FileUploader';
import { Button } from '../components/ui/Button';
import { RefreshCcw, Download, Zap, ArrowRight, Play, Pause, Loader2 } from 'lucide-react';
import { extractFramesFromGif, GifFrame, optimizeGif } from '../utils/gifProcessing';

interface GifPlayerProps {
  frames: GifFrame[];
  isLoading: boolean;
  className?: string;
}

const GifPlayer: React.FC<GifPlayerProps> = ({ frames, isLoading, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  // Playback refs
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);

  // Calculate total duration and frame timestamps
  const { totalDuration, frameTimestamps } = React.useMemo(() => {
    let total = 0;
    const timestamps = frames.map(f => {
      const start = total;
      total += f.delay;
      return start;
    });
    return { totalDuration: total, frameTimestamps: timestamps };
  }, [frames]);

  // Render Frame
  const drawFrame = (index: number) => {
    const canvas = canvasRef.current;
    const frame = frames[index];
    if (!canvas || !frame) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas if needed to match frame aspect
    if (canvas.width !== frame.dims.width || canvas.height !== frame.dims.height) {
      canvas.width = frame.dims.width;
      canvas.height = frame.dims.height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(frame.canvas, 0, 0);
  };

  // Animation Loop
  const animate = (time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    accumulatorRef.current += deltaTime;

    const currentDelay = frames[currentFrameIdx]?.delay || 100;

    if (accumulatorRef.current >= currentDelay) {
      const nextIdx = (currentFrameIdx + 1) % frames.length;
      setCurrentFrameIdx(nextIdx);
      accumulatorRef.current -= currentDelay;
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (frames.length > 0 && !isLoading) {
      drawFrame(currentFrameIdx);
      
      // Update progress bar visual
      if (totalDuration > 0) {
        const currentTimestamp = frameTimestamps[currentFrameIdx] || 0;
        // Add accumulator for smooth slider movement between frames
        const smoothTime = currentTimestamp + Math.min(accumulatorRef.current, frames[currentFrameIdx]?.delay || 0);
        setProgress((smoothTime / totalDuration) * 100);
      }
    }
  }, [currentFrameIdx, frames, isLoading, totalDuration, frameTimestamps]);

  useEffect(() => {
    if (isPlaying && frames.length > 0 && !isLoading) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      lastTimeRef.current = 0;
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, frames, isLoading, currentFrameIdx]); // Re-bind if index changed externally

  // Scrubbing
  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (totalDuration === 0 || frames.length === 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    
    const targetTime = pct * totalDuration;
    
    // Find frame index corresponding to time
    let idx = frames.findIndex((_, i) => {
        const start = frameTimestamps[i];
        const end = start + frames[i].delay;
        return targetTime >= start && targetTime < end;
    });

    if (idx === -1) idx = frames.length - 1;

    setCurrentFrameIdx(idx);
    accumulatorRef.current = targetTime - frameTimestamps[idx]; // Sync accumulator for smooth resume
    drawFrame(idx);
    setProgress(pct * 100);
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  if (isLoading) {
    return (
      <div className={`glass-panel p-4 rounded-2xl flex flex-col items-center justify-center gap-4 min-h-[300px] ${className}`}>
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Extracting Frames...</p>
      </div>
    );
  }

  if (frames.length === 0) {
     return (
        <div className={`glass-panel p-4 rounded-2xl flex items-center justify-center min-h-[300px] ${className}`}>
            <p className="text-slate-500 text-sm">No content loaded</p>
        </div>
     );
  }

  return (
    <div className={`glass-panel p-1 rounded-2xl flex flex-col gap-0 overflow-hidden ${className}`}>
        {/* Canvas Container */}
        <div className="relative flex-1 bg-slate-950/50 rounded-t-xl overflow-hidden flex items-center justify-center min-h-[250px] bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
            <canvas ref={canvasRef} className="max-w-full max-h-[40vh] object-contain shadow-2xl" />
            
            {/* Overlay Play Button (if paused) */}
            {!isPlaying && (
                <button 
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/10 transition-colors group"
                >
                    <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 text-white fill-current ml-1" />
                    </div>
                </button>
            )}
        </div>

        {/* Controls */}
        <div className="bg-slate-900/80 p-3 border-t border-white/5 flex flex-col gap-2">
             {/* Timeline */}
             <div 
                className="relative h-6 w-full cursor-pointer group flex items-center"
                onClick={handleScrub}
                ref={containerRef}
             >
                 <div className="absolute inset-x-0 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                     <div 
                        className="h-full bg-indigo-500 transition-all duration-75 ease-out"
                        style={{ width: `${progress}%` }}
                     ></div>
                 </div>
                 {/* Thumb */}
                 <div 
                    className="absolute h-3.5 w-3.5 bg-white rounded-full shadow border border-indigo-500 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-75 ease-out"
                    style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
                 ></div>
             </div>

             <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                 <button onClick={togglePlay} className="hover:text-white transition-colors flex items-center gap-2">
                     {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                     {isPlaying ? 'PAUSE' : 'PLAY'}
                 </button>
                 <span>FRAME {currentFrameIdx + 1} / {frames.length}</span>
             </div>
        </div>
    </div>
  );
};

export const OptimizerTool: React.FC = () => {
  const [fileData, setFileData] = useState<UploadResponse | null>(null);
  const [frames, setFrames] = useState<GifFrame[]>([]);
  const [isLoadingFrames, setIsLoadingFrames] = useState(false);
  const [optimizedBlob, setOptimizedBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [config, setConfig] = useState<OptimizerConfig>({
    targetFps: 15,
    widthScale: 1.0,
    colors: 256
  });
  
  // Stats
  const [originalSize, setOriginalSize] = useState(0);
  const [optimizedSize, setOptimizedSize] = useState(0);

  const handleUpload = async (data: UploadResponse) => {
    setFileData(data);
    setOptimizedBlob(null);
    setOptimizedSize(0);
    setOriginalSize(0);
    setFrames([]); // Clear previous frames
    
    // Fetch file to get size
    fetch(data.url).then(r => r.blob()).then(b => setOriginalSize(b.size));

    if (data.filename.toLowerCase().endsWith('.gif')) {
        setIsLoadingFrames(true);
        try {
            // Small delay to ensure UI updates
            await new Promise(r => setTimeout(r, 100));
            const extracted = await extractFramesFromGif(data.url);
            setFrames(extracted);
        } catch (e) {
            console.error(e);
            alert("Failed to parse GIF");
        } finally {
            setIsLoadingFrames(false);
        }
    } else {
        alert("Please upload a GIF file.");
        setFileData(null);
    }
  };

  const handleOptimize = async () => {
      if (frames.length === 0) return;
      setIsProcessing(true);
      setProgress(0);
      
      try {
        await new Promise(r => setTimeout(r, 100));
        const blob = await optimizeGif(frames, config, (p) => setProgress(Math.round(p * 100)));
        setOptimizedBlob(blob);
        setOptimizedSize(blob.size);
      } catch (e) {
          console.error("Optimization failed", e);
          alert("Optimization failed.");
      } finally {
          setIsProcessing(false);
      }
  };

  const reset = () => {
      setFileData(null);
      setFrames([]);
      setOptimizedBlob(null);
      setProgress(0);
  };

  const formatSize = (bytes: number) => {
      if (bytes === 0) return '0 KB';
      return (bytes / 1024).toFixed(1) + ' KB';
  };

  if (!fileData) {
    return (
      <div className="space-y-8 animate-fade-in max-w-4xl mx-auto py-12">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-4xl font-extrabold text-white">GIF FPS Optimizer</h2>
          <p className="text-slate-400 text-lg">Reduce file size by adjusting framerate, scale, and colors.</p>
        </div>
        <FileUploader onUploadSuccess={handleUpload} accept="image/gif" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-140px)] animate-fade-in">
       {/* Config Panel */}
       <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6 h-fit">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-400" />
                Settings
            </h3>
            <button onClick={reset} className="text-slate-500 hover:text-red-400 text-sm transition-colors">Reset</button>
          </div>

          <div className="space-y-6">
              <div className="space-y-2">
                 <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase">
                    <span>Target FPS</span>
                    <span className="text-indigo-400">{config.targetFps} FPS</span>
                 </div>
                 <input 
                    type="range" 
                    min="1" max="60" 
                    value={config.targetFps}
                    onChange={(e) => setConfig({...config, targetFps: parseInt(e.target.value)})}
                    className="w-full accent-indigo-500 bg-slate-700 h-1.5 rounded-lg appearance-none cursor-pointer"
                 />
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase">
                    <span>Scale / Resize</span>
                    <span className="text-indigo-400">{Math.round(config.widthScale * 100)}%</span>
                 </div>
                 <input 
                    type="range" 
                    min="10" max="100" step="10"
                    value={config.widthScale * 100}
                    onChange={(e) => setConfig({...config, widthScale: parseInt(e.target.value) / 100})}
                    className="w-full accent-indigo-500 bg-slate-700 h-1.5 rounded-lg appearance-none cursor-pointer"
                 />
              </div>

               <div className="space-y-2">
                 <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase">
                    <span>Color Reduction</span>
                    <span className="text-indigo-400">{config.colors} Colors</span>
                 </div>
                 <input 
                    type="range" 
                    min="2" max="256" step="2"
                    value={config.colors}
                    onChange={(e) => setConfig({...config, colors: parseInt(e.target.value)})}
                    className="w-full accent-indigo-500 bg-slate-700 h-1.5 rounded-lg appearance-none cursor-pointer"
                 />
              </div>
          </div>

          <Button 
            onClick={handleOptimize} 
            isLoading={isProcessing} 
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
             {isProcessing ? `Processing ${progress}%` : 'Run Optimizer'}
          </Button>

          {optimizedSize > 0 && (
             <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-sm">
                   <span className="text-emerald-200">Reduction</span>
                   <span className="font-bold text-emerald-400">
                      -{Math.round(((originalSize - optimizedSize) / originalSize) * 100)}%
                   </span>
                </div>
                <div className="flex items-center justify-between text-xs opacity-70">
                   <span>{formatSize(originalSize)}</span>
                   <ArrowRight className="w-3 h-3" />
                   <span>{formatSize(optimizedSize)}</span>
                </div>
             </div>
          )}
       </div>

       {/* Comparison View */}
       <div className="lg:col-span-2 flex flex-col gap-4 h-full overflow-hidden">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
              {/* Original - Now with Player */}
              <div className="flex flex-col gap-3">
                 <div className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Original Source</div>
                 <GifPlayer frames={frames} isLoading={isLoadingFrames} className="h-full" />
                 <div className="text-center text-xs text-slate-400 font-mono">{formatSize(originalSize)}</div>
              </div>

              {/* Optimized - Keep as Blob for fidelity */}
              <div className="flex flex-col gap-3">
                 <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider text-center flex items-center justify-center gap-2">
                    <Zap className="w-3 h-3" /> Optimized Result
                 </div>
                 
                 <div className="glass-panel p-1 rounded-2xl flex flex-col h-full overflow-hidden relative">
                     <div className="relative flex-1 bg-slate-950/50 rounded-xl overflow-hidden flex items-center justify-center border border-indigo-500/20 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                         {isProcessing ? (
                             <div className="text-center space-y-4">
                                 <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                 <div>
                                    <p className="text-indigo-300 font-medium">Optimizing...</p>
                                    <p className="text-xs text-indigo-400/60 mt-1">Compressing frames</p>
                                 </div>
                             </div>
                         ) : optimizedBlob ? (
                             <img src={URL.createObjectURL(optimizedBlob)} alt="Optimized" className="max-w-full max-h-[40vh] object-contain shadow-2xl" />
                         ) : (
                             <div className="text-slate-600 text-sm flex flex-col items-center gap-2">
                                <Zap className="w-8 h-8 opacity-20" />
                                <span>Run settings to generate result</span>
                             </div>
                         )}
                     </div>
                 </div>
                 
                 <div className="text-center text-xs text-indigo-300 font-mono">
                    {optimizedSize > 0 ? formatSize(optimizedSize) : '---'}
                 </div>
              </div>
           </div>

           {optimizedBlob && (
               <div className="flex justify-center md:justify-end pt-2">
                   <a 
                     href={URL.createObjectURL(optimizedBlob)} 
                     download={`optimized-${fileData.filename}`}
                     className="w-full md:w-auto"
                   >
                     <Button className="w-full md:w-auto shadow-xl shadow-emerald-900/20 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-none px-8">
                        <Download className="w-5 h-5" /> Download Optimized GIF
                     </Button>
                   </a>
               </div>
           )}
       </div>
    </div>
  );
};
