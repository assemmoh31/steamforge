
import React, { useState, useEffect, useRef } from 'react';
import { UploadResponse } from '../types';
import { FileUploader } from '../components/FileUploader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Grid, Layers, Download, RefreshCcw, Archive } from 'lucide-react';
import { extractFramesFromGif, GifFrame, cropAndEncodeGif } from '../utils/gifProcessing';
// @ts-ignore
import JSZip from 'jszip';

export const SplitterTool: React.FC = () => {
  const [fileData, setFileData] = useState<UploadResponse | null>(null);
  const [frames, setFrames] = useState<GifFrame[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [cols, setCols] = useState(2);
  const [rows, setRows] = useState(1);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  
  // ZIP State
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  const handleUpload = async (data: UploadResponse) => {
    setFileData(data);
    setLoadingMsg('Initializing Engine...');
    setIsProcessing(true);
    try {
      if (data.filename.toLowerCase().endsWith('.gif')) {
        const extracted = await extractFramesFromGif(data.url);
        setFrames(extracted);
      } else {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = data.url;
        await new Promise(r => img.onload = r);
        const cvs = document.createElement('canvas');
        cvs.width = img.width;
        cvs.height = img.height;
        cvs.getContext('2d')?.drawImage(img, 0, 0);
        setFrames([{
          canvas: cvs,
          delay: 100,
          dims: { width: img.width, height: img.height, left: 0, top: 0 }
        }]);
      }
    } catch (e) {
      console.error(e);
      setLoadingMsg('Failed to parse file.');
    } finally {
      setIsProcessing(false);
      setLoadingMsg('');
    }
  };

  useEffect(() => {
    if (frames.length === 0) return;
    let timeoutId: any;
    const animate = () => {
      const frame = frames[currentFrameIdx];
      if (!frame) return;
      timeoutId = setTimeout(() => {
        setCurrentFrameIdx((prev) => (prev + 1) % frames.length);
      }, frame.delay);
    };
    animate();
    return () => clearTimeout(timeoutId);
  }, [frames, currentFrameIdx]);

  useEffect(() => {
    if (frames.length === 0) return;
    const frame = frames[currentFrameIdx];
    if (!frame) return;
    const fullW = frame.dims.width;
    const fullH = frames[0].dims.height;
    const partW = Math.floor(fullW / cols);
    const partH = Math.floor(fullH / rows);

    canvasRefs.current.forEach((canvas, idx) => {
       if (!canvas) return;
       const ctx = canvas.getContext('2d');
       if (!ctx) return;
       const c = idx % cols;
       const r = Math.floor(idx / cols);
       const x = c * partW;
       const y = r * partH;
       if (canvas.width !== partW || canvas.height !== partH) {
           canvas.width = partW;
           canvas.height = partH;
       }
       ctx.clearRect(0, 0, partW, partH);
       ctx.drawImage(frame.canvas, x, y, partW, partH, 0, 0, partW, partH);
    });
  }, [currentFrameIdx, cols, rows, frames]);

  const handleDownloadPart = async (index: number) => {
    if (frames.length === 0) return;
    setDownloadingIndex(index);
    const fullW = frames[0].dims.width;
    const fullH = frames[0].dims.height;
    const partW = Math.floor(fullW / cols);
    const partH = Math.floor(fullH / rows);
    const c = index % cols;
    const r = Math.floor(index / cols);
    const x = c * partW;
    const y = r * partH;

    try {
      await new Promise(r => setTimeout(r, 50));
      const blob = await cropAndEncodeGif(frames, { x, y, width: partW, height: partH });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `split_part_${index + 1}.gif`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Encoding failed", e);
      alert("Failed to generate GIF.");
    } finally {
      setDownloadingIndex(null);
    }
  };

  const handleDownloadAll = async () => {
    if (frames.length === 0) return;
    setIsZipping(true);
    setZipProgress(0);
    
    try {
      const zip = new JSZip();
      const totalParts = cols * rows;
      
      const fullW = frames[0].dims.width;
      const fullH = frames[0].dims.height;
      const partW = Math.floor(fullW / cols);
      const partH = Math.floor(fullH / rows);

      for (let i = 0; i < totalParts; i++) {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const x = c * partW;
        const y = r * partH;
        
        // Update UI
        setZipProgress(Math.round((i / totalParts) * 100));
        
        // Small delay to allow UI render loop to update
        await new Promise(resolve => setTimeout(resolve, 10));

        const blob = await cropAndEncodeGif(frames, { 
            x, y, width: partW, height: partH 
        });
        
        zip.file(`part_${c + 1}_${r + 1}.gif`, blob);
      }
      
      setZipProgress(100);
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `split_images_${fileData?.filename ? fileData.filename.split('.')[0] : 'export'}.zip`;
      a.click();
      URL.revokeObjectURL(url);

    } catch (e) {
      console.error("ZIP creation failed", e);
      alert("Failed to create ZIP archive.");
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  };

  const reset = () => {
    setFileData(null);
    setFrames([]);
    setCurrentFrameIdx(0);
  };

  if (!fileData) {
    return (
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto py-12">
            <div className="text-center space-y-3 mb-10">
            <h2 className="text-4xl font-extrabold text-white">Grid Splitter</h2>
            <p className="text-slate-400 text-lg">
                Divide GIFs into multiple animated tiles for custom Steam showcases.
            </p>
            </div>
            <FileUploader onUploadSuccess={handleUpload} accept="image/gif,image/png,image/jpeg" />
        </div>
    );
  }

  const totalParts = cols * rows;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-140px)] animate-fade-in">
      {/* Settings */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6 h-fit">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
             <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Grid className="w-5 h-5 text-indigo-400" />
                Layout Config
             </h3>
             <button onClick={reset} className="text-slate-500 hover:text-red-400 text-sm transition-colors">Reset</button>
        </div>

        {isProcessing ? (
             <div className="py-12 text-center text-indigo-400 animate-pulse flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-medium tracking-wide text-sm uppercase">{loadingMsg}</span>
             </div>
        ) : (
            <>
                <div className="space-y-5">
                    <div className="p-4 bg-slate-800/40 rounded-xl border border-white/5 text-xs text-slate-400 flex flex-col gap-1">
                        <span className="uppercase tracking-wider font-semibold text-slate-500">Source Info</span>
                        <div className="text-slate-200">Processing <span className="text-indigo-400 font-mono">{frames.length}</span> frames</div>
                        <div className="text-slate-200">Outputting <span className="text-indigo-400 font-mono">{totalParts}</span> animated tiles</div>
                    </div>

                    <Input 
                        label="Columns (X)"
                        type="number"
                        min={1}
                        max={8}
                        value={cols}
                        onChange={(e) => setCols(Math.max(1, parseInt(e.target.value)))}
                    />
                    
                    <Input 
                        label="Rows (Y)"
                        type="number"
                        min={1}
                        max={8}
                        value={rows}
                        onChange={(e) => setRows(Math.max(1, parseInt(e.target.value)))}
                    />

                    <div className="grid grid-cols-4 gap-2 mt-2">
                        {[2, 4, 6, 8].map(num => (
                             <button
                                key={num}
                                onClick={() => { setCols(num); setRows(1); }}
                                className="px-3 py-2 bg-slate-800 hover:bg-indigo-600/20 hover:text-indigo-300 hover:border-indigo-500/30 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-all"
                             >
                                {num}x1
                             </button>
                        ))}
                    </div>
                </div>

                <div className="pt-2 border-t border-white/5">
                    <Button 
                        onClick={handleDownloadAll} 
                        isLoading={isZipping}
                        disabled={isZipping}
                        className="w-full shadow-lg shadow-indigo-900/20 group"
                        size="lg"
                    >
                        {isZipping ? `Archiving ${zipProgress}%` : (
                           <>
                             <Archive className="w-5 h-5 group-hover:scale-110 transition-transform" /> Download All (ZIP)
                           </>
                        )}
                    </Button>
                </div>
            </>
        )}
      </div>

      {/* Grid Preview */}
      <div className="lg:col-span-2 space-y-4 h-full flex flex-col">
         <div className="glass-panel rounded-3xl border border-white/5 p-8 flex-1 flex items-center justify-center relative overflow-hidden">
             {isProcessing ? (
                 <div className="flex flex-col items-center gap-4 animate-pulse opacity-50">
                    <Layers className="w-12 h-12 text-slate-600" />
                 </div>
             ) : (
                 <div 
                    className="grid gap-2 p-2 bg-slate-950/80 border border-white/10 shadow-2xl rounded-xl backdrop-blur-sm"
                    style={{ 
                        gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    }}
                 >
                    {Array.from({ length: totalParts }).map((_, i) => (
                        <div key={i} className="relative group bg-slate-900 border border-slate-800 overflow-hidden rounded transition-all hover:ring-2 hover:ring-indigo-500 hover:z-10">
                            <canvas 
                                ref={el => canvasRefs.current[i] = el}
                                className="w-full h-full block object-cover"
                            />
                            <div className="absolute inset-0 bg-indigo-900/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                <Button 
                                    size="sm" 
                                    onClick={() => handleDownloadPart(i)}
                                    disabled={downloadingIndex !== null || isZipping}
                                    className="scale-90 shadow-xl"
                                >
                                    {downloadingIndex === i ? (
                                        <span className="flex items-center gap-2"><RefreshCcw className="w-3 h-3 animate-spin"/> Encoding</span>
                                    ) : (
                                        <span className="flex items-center gap-2"><Download className="w-3 h-3"/> Save GIF</span>
                                    )}
                                </Button>
                            </div>
                            <div className="absolute top-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded pointer-events-none border border-white/10">
                                PART {i + 1}
                            </div>
                        </div>
                    ))}
                 </div>
             )}
         </div>
         
         {!isProcessing && (
            <div className="glass-panel-lighter rounded-xl p-3 text-center text-xs text-slate-400 border border-white/5 flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                Live Preview Active. Download parts individually or grab the full ZIP archive.
            </div>
         )}
      </div>
    </div>
  );
};
