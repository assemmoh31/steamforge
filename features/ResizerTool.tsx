
import React, { useRef, useState, useEffect } from 'react';
import { UploadResponse } from '../types';
import { FileUploader } from '../components/FileUploader';
import { Button } from '../components/ui/Button';
import { apiService } from '../services/api';
import { Download, RefreshCcw, ZoomIn, ZoomOut, Move, Maximize, Crop } from 'lucide-react';

const PRESETS = [
    { label: 'Profile Background (Full)', width: 1920, height: 1080 },
    { label: 'Library Hero', width: 1920, height: 620 },
    { label: 'Library Logo', width: 1280, height: 720 },
    { label: 'Mini Profile (Visible Area)', width: 640, height: 570 },
    { label: 'Library Portrait (Cover)', width: 600, height: 900 },
];

export const ResizerTool: React.FC = () => {
  const [fileData, setFileData] = useState<UploadResponse | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State
  const [presetIdx, setPresetIdx] = useState(0);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const currentPreset = PRESETS[presetIdx];

  // Draw loop
  useEffect(() => {
    if (!fileData || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = fileData.url;
    img.onload = () => {
        // Clear
        ctx.clearRect(0, 0, currentPreset.width, currentPreset.height);
        
        // Background Fill
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, currentPreset.width, currentPreset.height);

        // Draw Image with transforms
        const centerX = currentPreset.width / 2;
        const centerY = currentPreset.height / 2;

        ctx.save();
        ctx.translate(centerX + pos.x, centerY + pos.y);
        ctx.scale(scale, scale);
        
        const srcW = img.width;
        const srcH = img.height;

        ctx.drawImage(img, -srcW / 2, -srcH / 2);
        ctx.restore();
    };
  }, [fileData, scale, pos, currentPreset]);

  // Reset transforms when preset or file changes
  useEffect(() => {
      setPos({ x: 0, y: 0 });
      setScale(1);
  }, [presetIdx, fileData]);

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
        const url = canvasRef.current.toDataURL('image/jpeg', 0.95);
        const a = document.createElement('a');
        a.href = url;
        a.download = `steam_resized_${currentPreset.label.replace(/ /g, '_').toLowerCase()}.jpg`;
        a.click();
    }
  };

  const reset = () => {
    setFileData(null);
    setPos({ x: 0, y: 0 });
    setScale(1);
  };

  if (!fileData) {
    return (
      <div className="space-y-8 animate-fade-in max-w-4xl mx-auto py-12">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-4xl font-extrabold text-white">Background Resizer</h2>
          <p className="text-slate-400 text-lg">Crop and resize artwork to fit perfectly on your Steam profile.</p>
        </div>
        <FileUploader onUploadSuccess={setFileData} accept="image/*" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)] animate-fade-in">
      {/* Canvas Area */}
      <div className="flex-1 glass-panel rounded-3xl p-8 flex items-center justify-center relative overflow-hidden shadow-2xl bg-slate-900/50">
          <div className="relative group overflow-hidden max-w-full max-h-full flex items-center justify-center">
             {/* We wrap canvas in a container that scales down visually if it's too big, but keeps intrinsic resolution */}
             <div className="relative shadow-2xl ring-1 ring-white/10" style={{ maxWidth: '100%', maxHeight: '100%', aspectRatio: `${currentPreset.width}/${currentPreset.height}` }}>
                <canvas 
                    ref={canvasRef}
                    width={currentPreset.width}
                    height={currentPreset.height}
                    className="w-full h-full object-contain cursor-move bg-slate-950"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                />
             </div>
             
             {/* Overlay Guidelines (Rule of thirds maybe?) */}
             <div className="absolute inset-0 pointer-events-none border border-white/5"></div>
          </div>
          
          <div className="absolute top-4 right-4 bg-black/60 text-white text-[10px] font-bold px-3 py-1.5 rounded-full pointer-events-none backdrop-blur border border-white/5">
              {currentPreset.width} x {currentPreset.height}
          </div>
      </div>

      {/* Controls */}
      <div className="w-full lg:w-96 flex flex-col gap-6">
        <div className="glass-panel p-6 rounded-3xl space-y-6 flex-1 h-fit">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <Crop className="w-5 h-5 text-indigo-400" />
                    Crop & Resize
                </h3>
                <button onClick={reset} className="text-slate-500 hover:text-red-400 transition-colors text-sm flex items-center gap-1">
                    <RefreshCcw className="w-3 h-3" /> Reset
                </button>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Preset</label>
                    <select 
                        value={presetIdx}
                        onChange={(e) => setPresetIdx(parseInt(e.target.value))}
                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                    >
                        {PRESETS.map((p, i) => (
                            <option key={i} value={i}>{p.label} ({p.width}x{p.height})</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Scale / Zoom</label>
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

                <div className="p-4 rounded-xl border border-dashed border-slate-700/50 bg-slate-800/20">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-800 rounded-lg">
                            <Move className="w-4 h-4 text-slate-400" />
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                            Drag the image on the canvas to center your subject. Use zoom to fill the edges.
                        </p>
                    </div>
                </div>
            </div>

            <Button className="w-full shadow-xl shadow-indigo-900/20 mt-4" onClick={handleDownload} size="lg">
                <Download className="w-5 h-5" /> Export Resized Image
            </Button>
        </div>
      </div>
    </div>
  );
};