
import React, { useState, useEffect, useRef } from 'react';
import { UploadResponse } from '../types';
import { FileUploader } from '../components/FileUploader';
import { Button } from '../components/ui/Button';
import { Download, RefreshCcw, BoxSelect, Check, Upload } from 'lucide-react';
import { extractFramesFromGif, GifFrame, composeGif, optimizeGif } from '../utils/gifProcessing';
// @ts-ignore
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

interface FrameAsset {
  id: string;
  name: string;
  type: 'static' | 'animated';
  url: string;
  frames?: GifFrame[];
}

export const AvatarFrameTool: React.FC = () => {
  const [fileData, setFileData] = useState<UploadResponse | null>(null);
  const [avatarFrames, setAvatarFrames] = useState<GifFrame[]>([]);
  const [library, setLibrary] = useState<FrameAsset[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<FrameAsset | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewCanvas, setPreviewCanvas] = useState<HTMLCanvasElement | null>(null);

  // Animation Loop State
  const requestRef = useRef<number>();
  const [currentTime, setCurrentTime] = useState(0);

  // On Mount: Generate Mock Assets
  useEffect(() => {
    const generateAssets = async () => {
        const assets: FrameAsset[] = [];

        // 1. Static Gold Border
        const cvs1 = document.createElement('canvas');
        cvs1.width = 184; cvs1.height = 184;
        const ctx1 = cvs1.getContext('2d')!;
        ctx1.lineWidth = 8;
        ctx1.strokeStyle = '#fbbf24';
        ctx1.strokeRect(4,4,176,176);
        // Inner detail
        ctx1.lineWidth = 2;
        ctx1.strokeStyle = '#f59e0b';
        ctx1.strokeRect(10,10,164,164);
        assets.push({ 
            id: 'gold', name: 'Gold Standard', type: 'static', 
            url: cvs1.toDataURL(),
            frames: [{ canvas: cvs1, delay: 100, dims: {width:184,height:184,left:0,top:0} }]
        });

        // 2. Static Neon Blue
        const cvs2 = document.createElement('canvas');
        cvs2.width = 184; cvs2.height = 184;
        const ctx2 = cvs2.getContext('2d')!;
        ctx2.shadowBlur = 15;
        ctx2.shadowColor = '#60a5fa';
        ctx2.strokeStyle = '#3b82f6';
        ctx2.lineWidth = 6;
        ctx2.beginPath();
        ctx2.arc(92, 92, 86, 0, Math.PI * 2);
        ctx2.stroke();
        assets.push({ 
            id: 'neon', name: 'Neon Circle', type: 'static', 
            url: cvs2.toDataURL(),
            frames: [{ canvas: cvs2, delay: 100, dims: {width:184,height:184,left:0,top:0} }]
        });

        // 3. Animated RGB Pulse (Programmatic GIF)
        const encoder = new GIFEncoder();
        const frames: GifFrame[] = [];
        // Generate 12 frames of rotating hue
        for(let i=0; i<12; i++) {
            const fCvs = document.createElement('canvas');
            fCvs.width = 184; fCvs.height = 184;
            const fCtx = fCvs.getContext('2d')!;
            const hue = (i / 12) * 360;
            
            fCtx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
            fCtx.lineWidth = 8;
            fCtx.strokeRect(4,4,176,176);
            
            fCtx.shadowColor = `hsl(${hue}, 80%, 60%)`;
            fCtx.shadowBlur = 10;
            fCtx.fillStyle = 'rgba(255,255,255,0.1)';
            fCtx.fillRect(0,0,184,184); // faint glow

            const idata = fCtx.getImageData(0,0,184,184);
            const palette = quantize(idata.data, 64);
            const index = applyPalette(idata.data, palette);
            encoder.writeFrame(index, 184, 184, { palette, delay: 100, transparent: true, dispose: -1 });

            frames.push({ canvas: fCvs, delay: 100, dims: {width:184,height:184,left:0,top:0} });
        }
        encoder.finish();
        const blob = new Blob([encoder.bytesView()], { type: 'image/gif' });
        assets.push({ 
            id: 'rgb', name: 'Gamer Pulse', type: 'animated', 
            url: URL.createObjectURL(blob),
            frames: frames
        });

        setLibrary(assets);
        setSelectedFrame(assets[0]);
    };
    generateAssets();
  }, []);

  const handleUpload = async (data: UploadResponse) => {
      setFileData(data);
      if (data.filename.toLowerCase().endsWith('.gif')) {
          const frames = await extractFramesFromGif(data.url);
          setAvatarFrames(frames);
      } else {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = data.url;
          await new Promise(r => img.onload = r);
          const cvs = document.createElement('canvas');
          cvs.width = img.width; cvs.height = img.height;
          cvs.getContext('2d')?.drawImage(img, 0, 0);
          setAvatarFrames([{ 
              canvas: cvs, delay: 100, 
              dims: { width: img.width, height: img.height, left:0, top:0 } 
          }]);
      }
  };

  // Preview Loop
  useEffect(() => {
    if (!selectedFrame || !fileData) return;
    
    const cvs = previewCanvas || document.createElement('canvas');
    if (!previewCanvas) {
        cvs.width = 184; cvs.height = 184;
        setPreviewCanvas(cvs);
    }
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    // We assume 100ms tick for simplicity in preview
    const tick = () => {
        const now = Date.now();
        // Determine indices
        const avatarIdx = avatarFrames.length > 0 
            ? Math.floor(now / (avatarFrames[0].delay || 100)) % avatarFrames.length 
            : 0;
        
        const frameIdx = selectedFrame.frames && selectedFrame.frames.length > 0
            ? Math.floor(now / (selectedFrame.frames[0].delay || 100)) % selectedFrame.frames.length
            : 0;

        ctx.clearRect(0,0,184,184);

        // Draw Avatar
        if (avatarFrames[avatarIdx]) {
            ctx.drawImage(avatarFrames[avatarIdx].canvas, 0, 0, 184, 184);
        }

        // Draw Frame
        if (selectedFrame.frames && selectedFrame.frames[frameIdx]) {
            ctx.drawImage(selectedFrame.frames[frameIdx].canvas, 0, 0, 184, 184);
        }

        requestRef.current = requestAnimationFrame(tick);
    };

    requestRef.current = requestAnimationFrame(tick);
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [selectedFrame, avatarFrames, fileData, previewCanvas]);

  const handleDownload = async (onlyFrame: boolean) => {
      if (!selectedFrame) return;
      setIsProcessing(true);
      
      try {
          // If only frame, just download the frame asset
          if (onlyFrame) {
              const a = document.createElement('a');
              a.href = selectedFrame.url;
              a.download = `${selectedFrame.id}_frame.${selectedFrame.type === 'animated' ? 'gif' : 'png'}`;
              a.click();
              setIsProcessing(false);
              return;
          }

          // Composite
          if (!avatarFrames.length || !selectedFrame.frames) return;

          const blob = await composeGif(avatarFrames, selectedFrame.frames, 184);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `avatar_combo_${fileData?.filename || 'export'}.gif`;
          a.click();
          URL.revokeObjectURL(url);

      } catch (e) {
          console.error(e);
          alert("Failed to export.");
      } finally {
          setIsProcessing(false);
      }
  };

  // Attach canvas to DOM
  const canvasRefCallback = (node: HTMLCanvasElement | null) => {
      if (node) setPreviewCanvas(node);
  };

  const reset = () => {
      setFileData(null);
      setAvatarFrames([]);
  };

  if (!fileData) {
    return (
      <div className="space-y-8 animate-fade-in max-w-4xl mx-auto py-12">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-4xl font-extrabold text-white">Avatar Framer</h2>
          <p className="text-slate-400 text-lg">Overlay Steam-style frames on your avatar and preview animations.</p>
        </div>
        <FileUploader onUploadSuccess={handleUpload} accept="image/gif,image/png,image/jpeg" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-140px)] animate-fade-in">
        {/* Library Panel */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-6 h-fit max-h-full overflow-hidden">
             <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <BoxSelect className="w-5 h-5 text-indigo-400" />
                    Frame Library
                </h3>
                <button onClick={reset} className="text-slate-500 hover:text-red-400 text-sm flex items-center gap-1">
                    <RefreshCcw className="w-3 h-3" /> Reset
                </button>
            </div>
            
            <div className="overflow-y-auto pr-2 grid grid-cols-2 gap-4">
                {library.map((frame) => (
                    <button
                        key={frame.id}
                        onClick={() => setSelectedFrame(frame)}
                        className={`
                            relative group p-3 rounded-xl border transition-all duration-300 flex flex-col items-center gap-3
                            ${selectedFrame?.id === frame.id 
                                ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500/50' 
                                : 'bg-slate-800/40 border-white/5 hover:bg-slate-800/80 hover:border-white/20'
                            }
                        `}
                    >
                        <div className="relative w-20 h-20">
                            {/* Placeholder Avatar BG */}
                            <div className="absolute inset-2 bg-slate-700 rounded-full opacity-50"></div>
                            <img src={frame.url} className="absolute inset-0 w-full h-full object-contain drop-shadow-lg" />
                        </div>
                        <div className="text-xs font-medium text-slate-300 group-hover:text-white">{frame.name}</div>
                        
                        {frame.type === 'animated' && (
                            <span className="absolute top-2 right-2 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-2 flex flex-col gap-6 h-full">
            <div className="flex-1 glass-panel rounded-3xl p-8 flex items-center justify-center relative bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                <div className="relative flex flex-col items-center gap-6">
                    <div className="relative w-[184px] h-[184px] group">
                        <div className="absolute -inset-4 bg-indigo-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <canvas 
                            ref={canvasRefCallback}
                            width={184}
                            height={184}
                            className="relative w-full h-full rounded shadow-2xl shadow-black ring-1 ring-white/10"
                        />
                    </div>
                    <div className="text-center">
                        <h4 className="text-white font-bold text-lg tracking-tight">Preview</h4>
                        <p className="text-slate-500 text-sm">184 x 184 px</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="glass-panel-lighter border border-white/5 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button variant="secondary" onClick={() => handleDownload(true)} disabled={isProcessing}>
                    <Download className="w-4 h-4" /> Download Frame Only
                </Button>
                <Button onClick={() => handleDownload(false)} isLoading={isProcessing}>
                    <Download className="w-4 h-4" /> Export Combined GIF
                </Button>
            </div>
        </div>
    </div>
  );
};