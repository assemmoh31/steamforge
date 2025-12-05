
import React, { useState, useEffect, useRef } from 'react';
import { UploadResponse } from '../types';
import { FileUploader } from '../components/FileUploader';
import { Button } from '../components/ui/Button';
import { Download, RefreshCcw, Move, Scissors, Film, Layers } from 'lucide-react';
import { AdUnit } from '../components/ui/AdUnit';
import { extractFramesFromGif, GifFrame } from '../utils/gifProcessing';

export const SlicerTool: React.FC = () => {
  const [fileData, setFileData] = useState<UploadResponse | null>(null);
  const [frames, setFrames] = useState<GifFrame[]>([]);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGif, setIsGif] = useState(false);

  // Layout State
  const [mainHeight, setMainHeight] = useState(506); 
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const sideCanvasRef = useRef<HTMLCanvasElement>(null);

  const MAIN_WIDTH = 506;
  const SIDE_WIDTH = 100;

  const handleUpload = async (data: UploadResponse) => {
    setFileData(data);
    setIsProcessing(true);
    setOffset({ x: 0, y: 0 });
    
    try {
      if (data.filename.toLowerCase().endsWith('.gif')) {
        setIsGif(true);
        const extracted = await extractFramesFromGif(data.url);
        setFrames(extracted);
        if (extracted.length > 0 && extracted[0].dims.height < 1000) {
             setMainHeight(extracted[0].dims.height);
        }
      } else {
        setIsGif(false);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = data.url;
        await new Promise((resolve) => { img.onload = resolve; });
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        
        setFrames([{
          canvas,
          delay: 100,
          dims: { width: img.width, height: img.height, left: 0, top: 0 }
        }]);
        setMainHeight(img.height);
      }
    } catch (e) {
      console.error("Error processing file", e);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!frames.length || !isGif) return;
    let timeoutId: ReturnType<typeof setTimeout>;
    const animate = () => {
      const frame = frames[currentFrameIdx];
      if (!frame) return;
      timeoutId = setTimeout(() => {
        setCurrentFrameIdx((prev) => (prev + 1) % frames.length);
      }, frame.delay);
    };
    animate();
    return () => clearTimeout(timeoutId);
  }, [frames, currentFrameIdx, isGif]);

  useEffect(() => {
    if (!frames.length) return;
    const frame = frames[currentFrameIdx];
    if (!frame) return;
    
    const draw = (canvas: HTMLCanvasElement | null, width: number, sliceOffsetX: number) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, mainHeight);
      
      ctx.fillStyle = '#1e293b';
      for(let i=0; i<width; i+=20) {
          for(let j=0; j<mainHeight; j+=20) {
              if ((i+j)%40 === 0) ctx.fillRect(i, j, 20, 20);
          }
      }

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, width, mainHeight);
      ctx.clip();
      
      ctx.drawImage(frame.canvas, offset.x - sliceOffsetX, offset.y);
      
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, width, mainHeight);
      
      ctx.restore();
    };

    draw(mainCanvasRef.current, MAIN_WIDTH, 0);
    draw(sideCanvasRef.current, SIDE_WIDTH, MAIN_WIDTH);

  }, [frames, currentFrameIdx, offset, mainHeight]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const downloadSlice = (type: 'main' | 'side') => {
    const canvas = type === 'main' ? mainCanvasRef.current : sideCanvasRef.current;
    if (!canvas) return;
    if (isGif) {
        alert("Downloading current frame for preview. Full animated GIF slicing requires the active Node.js backend.");
    }
    const link = document.createElement('a');
    link.download = `artwork_${type}_${isGif ? 'frame' : 'slice'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const reset = () => {
    setFileData(null);
    setFrames([]);
    setOffset({ x: 0, y: 0 });
    setIsGif(false);
  };

  if (!fileData) {
    return (
      <div className="space-y-8 animate-fade-in max-w-4xl mx-auto py-12">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-4xl font-extrabold text-white">Artwork Slicer</h2>
          <p className="text-slate-400 text-lg">Split wide images or GIFs into Steam Featured Artwork and SideBar parts.</p>
        </div>
        <FileUploader onUploadSuccess={handleUpload} />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)] animate-fade-in">
      {/* Workspace */}
      <div className="flex-1 glass-panel rounded-3xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden select-none p-8">
        
        {isProcessing && (
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center flex-col gap-4">
               <RefreshCcw className="w-10 h-10 text-indigo-500 animate-spin" />
               <p className="text-indigo-400 font-medium tracking-wide">PROCESSING...</p>
           </div>
        )}

        <div 
            className="relative flex gap-6 cursor-move active:cursor-grabbing p-12 transition-transform"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div className="flex flex-col gap-3">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">Featured (506px)</div>
                <canvas 
                    ref={mainCanvasRef}
                    width={MAIN_WIDTH}
                    height={mainHeight}
                    className="bg-slate-950 shadow-2xl shadow-black ring-1 ring-white/10"
                />
            </div>

            <div className="flex flex-col gap-3">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">Side (100px)</div>
                <canvas 
                    ref={sideCanvasRef}
                    width={SIDE_WIDTH}
                    height={mainHeight}
                    className="bg-slate-950 shadow-2xl shadow-black ring-1 ring-white/10"
                />
            </div>
            
            {!isDragging && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-md px-5 py-2.5 rounded-full text-white flex items-center gap-3 border border-white/10 shadow-xl opacity-0 hover:opacity-100 transition-all transform hover:scale-105">
                        <Move className="w-4 h-4 text-indigo-400" /> 
                        <span className="text-sm font-medium">Drag to position</span>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Sidebar Controls */}
      <div className="w-full lg:w-96 flex flex-col gap-6 h-fit">
         <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-6">
             <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-indigo-400" />
                    Slicer Controls
                </h3>
                <button onClick={reset} className="text-slate-500 hover:text-red-400 text-sm transition-colors">Reset</button>
            </div>

            <div className="space-y-6">
                <div className="p-5 bg-slate-800/40 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                         <h4 className="text-sm font-semibold text-slate-300">Slice Height</h4>
                         <span className="text-xs text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded">{mainHeight}px</span>
                    </div>
                    <input 
                        type="range" 
                        min="100" 
                        max="1200" 
                        value={mainHeight}
                        onChange={(e) => setMainHeight(parseInt(e.target.value))}
                        className="w-full accent-indigo-500 bg-slate-700 h-1.5 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                {isGif && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                             <Film className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <span className="text-purple-200 font-semibold text-sm block">GIF Mode Active</span>
                            <p className="text-purple-300/60 text-xs">{frames.length} frames detected</p>
                        </div>
                    </div>
                )}

                <div className="space-y-3 pt-2">
                    <Button 
                        className="w-full justify-between group" 
                        variant="secondary"
                        onClick={() => downloadSlice('main')}
                    >
                        <span className="group-hover:text-white transition-colors">Download Featured</span>
                        <Download className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                    </Button>
                    <Button 
                        className="w-full justify-between group" 
                        variant="secondary"
                        onClick={() => downloadSlice('side')}
                    >
                        <span className="group-hover:text-white transition-colors">Download Sidebar</span>
                        <Download className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                    </Button>
                </div>
            </div>
         </div>

         {/* Ad Unit */}
         <AdUnit variant="rectangle" className="w-full h-48" />
      </div>
    </div>
  );
};
