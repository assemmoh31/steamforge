
import React, { useRef, useState, useEffect } from 'react';
import { UploadResponse } from '../types';
import { FileUploader } from '../components/FileUploader';
import { Button } from '../components/ui/Button';
import { apiService } from '../services/api';
import { Download, RefreshCcw, ZoomIn, ZoomOut, Move, Film, Image as ImageIcon, Check } from 'lucide-react';
import { AdUnit } from '../components/ui/AdUnit';
import { extractFramesFromGif, GifFrame } from '../utils/gifProcessing';

export const GridTool: React.FC = () => {
  const [fileData, setFileData] = useState<UploadResponse | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Transform State
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [title, setTitle] = useState("");
  const [hasShadow, setHasShadow] = useState(false);

  // GIF State
  const [isGif, setIsGif] = useState(false);
  const [gifFrames, setGifFrames] = useState<GifFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isLoadingGif, setIsLoadingGif] = useState(false);

  const STEAM_GRID_W = 600;
  const STEAM_GRID_H = 900;

  useEffect(() => {
    if (fileData) {
        if (fileData.filename.toLowerCase().endsWith('.gif')) {
            setIsGif(true);
            setIsLoadingGif(true);
            extractFramesFromGif(fileData.url).then(frames => {
                setGifFrames(frames);
                setIsLoadingGif(false);
            }).catch(err => {
                console.error("Failed to parse GIF", err);
                setIsLoadingGif(false);
            });
        } else {
            setIsGif(false);
            setGifFrames([]);
        }
    }
  }, [fileData]);

  // Draw loop
  useEffect(() => {
    if (!fileData || !canvasRef.current) return;
    if (isGif && (isLoadingGif || gifFrames.length === 0)) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = (imageSource: HTMLImageElement | HTMLCanvasElement) => {
        // Clear
        ctx.clearRect(0, 0, STEAM_GRID_W, STEAM_GRID_H);
        
        // Draw Background (dark fill)
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, STEAM_GRID_W, STEAM_GRID_H);

        // Draw Image with transforms
        const centerX = STEAM_GRID_W / 2;
        const centerY = STEAM_GRID_H / 2;

        ctx.save();
        ctx.translate(centerX + pos.x, centerY + pos.y);
        ctx.scale(scale, scale);
        
        if (hasShadow) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
            ctx.shadowBlur = 50;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 20;
        }
        
        const srcW = imageSource.width;
        const srcH = imageSource.height;

        ctx.drawImage(imageSource, -srcW / 2, -srcH / 2);
        ctx.restore();

        // Draw Overlay Text (Logo Placeholder)
        if (title) {
            ctx.shadowColor = "rgba(0,0,0,0.8)";
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 4;
            ctx.fillStyle = "white";
            ctx.font = "bold 60px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.fillText(title, STEAM_GRID_W / 2, STEAM_GRID_H - 40);
        }
    };

    if (isGif) {
        draw(gifFrames[currentFrameIndex].canvas);
    } else {
        const img = new Image();
        img.src = fileData.url;
        img.onload = () => draw(img);
    }

  }, [fileData, scale, pos, title, isGif, gifFrames, currentFrameIndex, isLoadingGif, hasShadow]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleDownload = () => {
    if (canvasRef.current) {
      apiService.downloadGrid(canvasRef.current);
    }
  };

  const handleReset = () => {
    setFileData(null);
    setPos({ x: 0, y: 0 });
    setScale(1);
    setTitle("");
    setIsGif(false);
    setGifFrames([]);
    setCurrentFrameIndex(0);
    setHasShadow(false);
  };

  if (!fileData) {
    return (
      <div className="space-y-8 animate-fade-in max-w-4xl mx-auto py-12">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Grid Creator</h2>
          <p className="text-slate-400 text-lg">Create custom 600x900 cover art for your Steam library.</p>
        </div>
        <FileUploader onUploadSuccess={setFileData} />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)] animate-fade-in">
      {/* Canvas Area */}
      <div className="flex-1 glass-panel rounded-3xl p-8 flex items-center justify-center relative overflow-hidden shadow-2xl">
        {isLoadingGif ? (
            <div className="flex flex-col items-center gap-6 animate-pulse">
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                    <Film className="w-8 h-8 text-indigo-400" />
                </div>
                <p className="text-indigo-300 font-medium tracking-wide">EXTRACTING FRAMES...</p>
            </div>
        ) : (
            <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-75"></div>
                <canvas 
                    ref={canvasRef}
                    width={STEAM_GRID_W}
                    height={STEAM_GRID_H}
                    className="relative max-h-[70vh] w-auto cursor-move rounded-xl shadow-2xl ring-1 ring-white/10"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                />
                <div className="absolute top-4 right-4 bg-black/60 text-white text-[10px] font-bold px-3 py-1.5 rounded-full pointer-events-none backdrop-blur border border-white/5">
                    {Math.round(scale * 100)}%
                </div>
            </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full lg:w-96 flex flex-col gap-6">
        <div className="glass-panel p-6 rounded-3xl space-y-6 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="font-bold text-lg text-white">Editor</h3>
                <button onClick={handleReset} className="text-slate-500 hover:text-red-400 transition-colors p-2 hover:bg-white/5 rounded-lg">
                    <RefreshCcw className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-6">
                {isGif && !isLoadingGif && (
                    <div className="p-4 bg-indigo-950/30 rounded-xl border border-indigo-500/20 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                                <Film className="w-3 h-3" /> Frame Selector
                            </label>
                            <span className="text-xs text-indigo-300 font-mono bg-indigo-500/10 px-2 py-0.5 rounded">{currentFrameIndex + 1} / {gifFrames.length}</span>
                        </div>
                        <input 
                            type="range"
                            min="0"
                            max={gifFrames.length - 1}
                            value={currentFrameIndex}
                            onChange={(e) => setCurrentFrameIndex(parseInt(e.target.value))}
                            className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer hover:bg-slate-700 transition-colors"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Scale & Zoom</label>
                    <div className="flex items-center gap-3 bg-slate-950/50 p-2 rounded-xl border border-white/5">
                        <button onClick={() => setScale(Math.max(0.1, scale - 0.1))} className="p-1 text-slate-400 hover:text-white"><ZoomOut className="w-4 h-4" /></button>
                        <input 
                            type="range" 
                            min="0.1" 
                            max="3" 
                            step="0.05"
                            value={scale}
                            onChange={(e) => setScale(parseFloat(e.target.value))}
                            className="flex-1 accent-indigo-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                         <button onClick={() => setScale(Math.min(3, scale + 0.1))} className="p-1 text-slate-400 hover:text-white"><ZoomIn className="w-4 h-4" /></button>
                    </div>
                </div>

                <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/30 border border-white/5 hover:bg-slate-800/50 transition-colors">
                    <label className="flex items-center gap-3 cursor-pointer w-full">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${hasShadow ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'}`}>
                             {hasShadow && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <input 
                            type="checkbox" 
                            checked={hasShadow}
                            onChange={(e) => setHasShadow(e.target.checked)}
                            className="hidden"
                        />
                        <span className="text-sm font-medium text-slate-300">Drop Shadow</span>
                    </label>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Overlay Text</label>
                    <input 
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Game Title..."
                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
                    />
                </div>

                <div className="p-4 rounded-xl border border-dashed border-slate-700/50 bg-slate-800/20">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-800 rounded-lg">
                            <Move className="w-4 h-4 text-slate-400" />
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                            Click and drag directly on the canvas preview to reposition your artwork.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <Button className="w-full shadow-xl shadow-indigo-900/20" onClick={handleDownload} size="lg">
            <Download className="w-5 h-5" /> Export Grid Image
        </Button>
        
        {/* Ad Unit */}
        <AdUnit variant="rectangle" className="w-full h-48" />
      </div>
    </div>
  );
};
