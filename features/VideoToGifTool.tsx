
import React, { useState, useRef, useEffect } from 'react';
import { UploadResponse } from '../types';
import { FileUploader } from '../components/FileUploader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Clapperboard, Download, RefreshCcw, Play, Pause, Clock, MoveHorizontal, Zap, Repeat } from 'lucide-react';
import { AdUnit } from '../components/ui/AdUnit';
// @ts-ignore
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

export const VideoToGifTool: React.FC = () => {
  const [fileData, setFileData] = useState<UploadResponse | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultSize, setResultSize] = useState(0);

  // Video State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayTime, setCurrentPlayTime] = useState(0);

  // Config State
  const [config, setConfig] = useState({
    startTime: 0,
    endTime: 5,
    fps: 15,
    width: 506, // Default Steam Artwork width
    maintainAspect: true,
    speed: 1,
    loop: true,
    quality: 10,
    colors: 256,
  });

  const handleUpload = (data: UploadResponse) => {
    setFileData(data);
    setVideoUrl(data.url);
    // Reset defaults
    setResultBlob(null);
    setConfig(prev => ({ ...prev, startTime: 0, endTime: 5 }));
    setCurrentPlayTime(0);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      // Set default end time to max 5s or full duration
      setConfig(prev => ({
        ...prev,
        endTime: Math.min(dur, 5),
        width: videoRef.current?.videoWidth || 506
      }));
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      // If we are at the end of the loop, restart from beginning
      if (videoRef.current.currentTime >= config.endTime) {
        videoRef.current.currentTime = config.startTime;
      }
      videoRef.current.play().catch(e => console.error("Play error:", e));
      setIsPlaying(true);
    }
  };

  // Playback Loop & Scrubbing Optimization
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    let rAF: number;

    const loop = () => {
      if (!vid.paused && !vid.ended) {
        setCurrentPlayTime(vid.currentTime);

        // Precise Looping Logic
        if (vid.currentTime >= config.endTime) {
          if (config.loop) {
             vid.currentTime = config.startTime;
             // Sometimes jumping back can cause a momentary pause, ensure play
             vid.play().catch(() => {});
          } else {
             vid.pause();
             setIsPlaying(false);
             vid.currentTime = config.startTime;
          }
        }
        rAF = requestAnimationFrame(loop);
      } else if (!isPlaying) {
         // Even if paused, update state if scrubbing happens externally or metadata loads
         setCurrentPlayTime(vid.currentTime);
      }
    };

    if (isPlaying) {
      rAF = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(rAF!);
    }

    return () => cancelAnimationFrame(rAF!);
  }, [isPlaying, config.endTime, config.startTime, config.loop]);


  // Input Handlers with Seek (Scrubbing)
  const handleStartChange = (val: number) => {
    const v = Math.max(0, Math.min(val, config.endTime - 0.1));
    setConfig(p => ({ ...p, startTime: v }));
    if (videoRef.current) {
        videoRef.current.currentTime = v;
        setCurrentPlayTime(v);
    }
  };

  const handleEndChange = (val: number) => {
    const v = Math.min(duration, Math.max(val, config.startTime + 0.1));
    setConfig(p => ({ ...p, endTime: v }));
    if (videoRef.current) {
        videoRef.current.currentTime = v;
        setCurrentPlayTime(v);
    }
  };

  // Timeline Click to Seek
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || !videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const newTime = pct * duration;
    
    videoRef.current.currentTime = newTime;
    setCurrentPlayTime(newTime);
  };

  const processGif = async () => {
    if (!videoRef.current) return;
    setIsProcessing(true);
    setProgress(0);
    setEstimatedTime(null);
    setResultBlob(null);

    const processStartTime = Date.now();

    try {
      const vid = videoRef.current;
      vid.pause();
      setIsPlaying(false);
      
      const { startTime, endTime, fps, width, speed, colors } = config;
      const totalSeconds = endTime - startTime;
      
      // Calculate dimensions
      const aspect = vid.videoWidth / vid.videoHeight;
      const finalWidth = width;
      const finalHeight = Math.round(width / aspect);

      // Canvas for frame extraction
      const canvas = document.createElement('canvas');
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error("No canvas context");

      const encoder = new GIFEncoder();
      
      const delay = 1000 / fps;
      const step = (1 / fps) * speed; 
      
      let currentTime = startTime;
      const totalFrames = Math.ceil(totalSeconds / step);
      let frameCount = 0;

      // Processing Loop
      while (currentTime < endTime) {
        vid.currentTime = currentTime;
        
        await new Promise<void>(resolve => {
            const onSeek = () => {
                vid.removeEventListener('seeked', onSeek);
                resolve();
            }
            vid.addEventListener('seeked', onSeek);
        });

        ctx.drawImage(vid, 0, 0, finalWidth, finalHeight);
        
        const imageData = ctx.getImageData(0, 0, finalWidth, finalHeight);
        const data = imageData.data;

        const palette = quantize(data, colors, { format: 'rgba4444' }); 
        const index = applyPalette(data, palette, { format: 'rgba4444' });

        encoder.writeFrame(index, finalWidth, finalHeight, {
            palette,
            delay,
            transparent: true,
            dispose: -1 
        });

        currentTime += step;
        frameCount++;
        
        const currentProgress = frameCount / totalFrames;
        const pct = Math.min(99, Math.round(currentProgress * 100));
        setProgress(pct);

        if (frameCount % 5 === 0 && currentProgress > 0) {
            const elapsed = (Date.now() - processStartTime) / 1000;
            const rate = currentProgress / elapsed;
            const remaining = (1 - currentProgress) / rate;
            setEstimatedTime(Math.max(0, Math.ceil(remaining)));
        }
        
        await new Promise(r => setTimeout(r, 0));
      }

      encoder.finish();
      const blob = new Blob([encoder.bytesView()], { type: 'image/gif' });
      setResultBlob(blob);
      setResultSize(blob.size);
      setProgress(100);

    } catch (e) {
      console.error(e);
      alert("Error processing video.");
    } finally {
      setIsProcessing(false);
      setEstimatedTime(null);
    }
  };

  const formatTime = (t: number) => {
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const formatSize = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + ' MB';

  const reset = () => {
      setFileData(null);
      setVideoUrl(null);
      setResultBlob(null);
      setProgress(0);
      setEstimatedTime(null);
  };

  if (!fileData || !videoUrl) {
    return (
      <div className="space-y-8 animate-fade-in max-w-4xl mx-auto py-12">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-4xl font-extrabold text-white">Video to GIF</h2>
          <p className="text-slate-400 text-lg">Convert MP4, WEBM, or AVI into optimized GIFs for Steam artwork.</p>
        </div>
        <FileUploader 
            onUploadSuccess={handleUpload} 
            accept="video/mp4,video/webm,video/ogg,video/x-msvideo,video/quicktime" 
            maxSizeMB={100}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-140px)] animate-fade-in">
        {/* SETTINGS PANEL */}
        <div className="flex flex-col gap-6 h-fit">
            <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="font-bold text-lg text-white flex items-center gap-2">
                        <Clapperboard className="w-5 h-5 text-indigo-400" />
                        Conversion Settings
                    </h3>
                    <button onClick={reset} className="text-slate-500 hover:text-red-400 text-sm transition-colors flex items-center gap-1">
                        <RefreshCcw className="w-3 h-3" /> Reset
                    </button>
                </div>

                <div className="space-y-6">
                    {/* TRIM SETTINGS */}
                    <div className="space-y-3 p-4 bg-slate-800/40 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            <Clock className="w-3 h-3" /> Trim (Seconds)
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input 
                                label="Start" 
                                type="number" 
                                step="0.1"
                                value={config.startTime}
                                onChange={(e) => handleStartChange(parseFloat(e.target.value))}
                            />
                            <Input 
                                label="End" 
                                type="number" 
                                step="0.1"
                                value={config.endTime}
                                onChange={(e) => handleEndChange(parseFloat(e.target.value))}
                            />
                        </div>
                        <div className="flex justify-between items-center pt-1">
                            <div className="text-xs text-indigo-300 font-mono">
                                Len: {Math.max(0, config.endTime - config.startTime).toFixed(2)}s
                            </div>
                            <button 
                                onClick={() => setConfig(p => ({...p, loop: !p.loop}))}
                                className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors ${config.loop ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500'}`}
                            >
                                <Repeat className="w-3 h-3" /> Loop
                            </button>
                        </div>
                    </div>

                    {/* DIMENSIONS */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <MoveHorizontal className="w-3 h-3" /> Dimensions
                        </div>
                        <Input 
                            label="Width (px)" 
                            type="number"
                            value={config.width}
                            onChange={(e) => setConfig({...config, width: parseInt(e.target.value)})} 
                        />
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setConfig({...config, width: 506})}
                                className="flex-1 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
                            >
                                Artwork (506px)
                            </button>
                            <button 
                                onClick={() => setConfig({...config, width: 184})}
                                className="flex-1 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
                            >
                                Avatar (184px)
                            </button>
                        </div>
                    </div>

                    {/* PERFORMANCE */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Frame Rate</label>
                            <select 
                                value={config.fps}
                                onChange={(e) => setConfig({...config, fps: parseInt(e.target.value)})}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                            >
                                <option value="10">10 FPS (Light)</option>
                                <option value="15">15 FPS (Standard)</option>
                                <option value="24">24 FPS (Smooth)</option>
                                <option value="30">30 FPS (Heavy)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Speed</label>
                            <select 
                                value={config.speed}
                                onChange={(e) => setConfig({...config, speed: parseFloat(e.target.value)})}
                                className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                            >
                                <option value="0.5">0.5x (Slow)</option>
                                <option value="1">1.0x (Normal)</option>
                                <option value="1.5">1.5x (Fast)</option>
                                <option value="2">2.0x (Turbo)</option>
                            </select>
                        </div>
                    </div>

                    {/* COLOR OPTIMIZATION */}
                    <div className="space-y-2 pt-2 border-t border-white/5">
                        <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <span>Color Reduction</span>
                            <span className="text-indigo-400">{config.colors} Colors</span>
                        </div>
                        <input 
                            type="range" 
                            min="32" 
                            max="256" 
                            step="16"
                            value={config.colors}
                            onChange={(e) => setConfig({...config, colors: parseInt(e.target.value)})}
                            className="w-full accent-indigo-500 bg-slate-700 h-1.5 rounded-lg appearance-none cursor-pointer"
                        />
                         <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                            <span>Small File</span>
                            <span>High Quality</span>
                        </div>
                    </div>
                </div>

                {isProcessing ? (
                    <div className="mt-4 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-xl space-y-3 animate-fade-in opacity-50">
                        <div className="flex justify-between text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                            <span>Processing...</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                ) : (
                    <Button 
                        size="lg" 
                        onClick={processGif} 
                        className="mt-2"
                    >
                        Convert to GIF
                    </Button>
                )}
            </div>
            <AdUnit variant="rectangle" className="w-full h-48" />
        </div>

        {/* PREVIEW AREA */}
        <div className="lg:col-span-2 flex flex-col gap-6 h-full">
            <div className="flex-1 glass-panel rounded-3xl p-8 flex flex-col relative overflow-hidden bg-black/40">
                
                {/* Processing Overlay */}
                {isProcessing && (
                     <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in gap-8">
                         <div className="relative w-40 h-40">
                             <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl">
                                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800" />
                                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={439.82} strokeDashoffset={439.82 * (1 - progress / 100)} strokeLinecap="round" className="text-indigo-500 transition-all duration-300 ease-out" />
                             </svg>
                             <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-4xl font-extrabold text-white tracking-tighter">{Math.round(progress)}%</span>
                                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mt-1">Processing</span>
                             </div>
                         </div>
                         <div className="text-center space-y-2">
                              <h3 className="text-2xl font-bold text-white tracking-tight">Rendering GIF</h3>
                              <div className="flex items-center justify-center gap-2 text-slate-400 font-mono text-sm bg-white/5 px-4 py-2 rounded-full border border-white/5">
                                 <Clock className="w-4 h-4 text-indigo-400" />
                                 {estimatedTime !== null ? `Time Remaining: ${estimatedTime}s` : 'Calculating time...'}
                              </div>
                         </div>
                     </div>
                )}

                {/* Video Preview */}
                <div className={`relative flex-1 flex flex-col items-center justify-center ${resultBlob ? 'hidden' : 'flex'}`}>
                     <div className="relative w-full max-h-[50vh] flex items-center justify-center group bg-black/50 rounded-lg overflow-hidden ring-1 ring-white/10">
                        <video 
                            ref={videoRef}
                            src={videoUrl}
                            className="max-h-full max-w-full"
                            onLoadedMetadata={handleLoadedMetadata}
                            playsInline
                            muted
                        />
                        <button 
                            onClick={togglePlay}
                            className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all duration-300"
                        >
                            <div className={`w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-300 ${isPlaying ? 'opacity-0 group-hover:opacity-100 scale-100' : 'opacity-100 scale-110'}`}>
                                {isPlaying ? <Pause className="w-8 h-8 text-white fill-current" /> : <Play className="w-8 h-8 text-white fill-current ml-1" />}
                            </div>
                        </button>
                     </div>
                     
                     {/* Interactive Timeline */}
                     <div className="mt-6 w-full max-w-2xl flex items-center gap-4 px-6 py-3 bg-slate-900/60 rounded-2xl border border-white/5">
                        <span className="text-xs font-mono text-indigo-400 w-12 text-right">{formatTime(currentPlayTime)}</span>
                        
                        <div 
                            className="relative flex-1 h-3 bg-slate-800 rounded-full cursor-pointer group"
                            onClick={handleTimelineClick}
                        >
                            {/* Total Duration Track */}
                            <div className="absolute inset-0 rounded-full overflow-hidden">
                                {/* Selected Range Highlight */}
                                {duration > 0 && (
                                    <div 
                                        className="absolute top-0 h-full bg-indigo-500/20 group-hover:bg-indigo-500/30 transition-colors pointer-events-none"
                                        style={{ 
                                            left: `${(config.startTime / duration) * 100}%`,
                                            width: `${((config.endTime - config.startTime) / duration) * 100}%`
                                        }}
                                    />
                                )}
                            </div>

                            {/* Playhead */}
                            {duration > 0 && (
                                <div 
                                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-indigo-500 transform -translate-x-1/2 pointer-events-none transition-transform duration-75"
                                    style={{ left: `${(currentPlayTime / duration) * 100}%` }}
                                >
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full animate-pulse opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                            )}
                        </div>
                        
                        <span className="text-xs font-mono text-slate-500 w-12">{formatTime(duration)}</span>
                     </div>
                </div>

                {/* Result Preview */}
                {resultBlob && (
                     <div className="relative flex-1 flex flex-col items-center justify-center animate-fade-in w-full">
                        <div className="bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] p-8 rounded-xl border border-white/5 inline-block">
                             <img 
                                src={URL.createObjectURL(resultBlob)} 
                                alt="Generated GIF"
                                className="max-h-[50vh] max-w-full rounded shadow-2xl mx-auto"
                             />
                        </div>
                        <div className="mt-6 flex gap-4">
                            <Button variant="secondary" onClick={() => setResultBlob(null)}>
                                <RefreshCcw className="w-4 h-4" /> Edit Settings
                            </Button>
                            <a href={URL.createObjectURL(resultBlob)} download={`converted_${fileData.filename.split('.')[0]}.gif`}>
                                <Button className="shadow-lg shadow-emerald-900/20 bg-gradient-to-r from-emerald-600 to-teal-600 border-none">
                                    <Download className="w-5 h-5" /> Download GIF ({formatSize(resultSize)})
                                </Button>
                            </a>
                        </div>
                     </div>
                )}
            </div>
        </div>
    </div>
  );
};
