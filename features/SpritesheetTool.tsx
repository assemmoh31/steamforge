import React, { useState } from 'react';
import { UploadResponse, SpritesheetConfig } from '../types';
import { FileUploader } from '../components/FileUploader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { apiService } from '../services/api';
import { Download, RefreshCcw, Image as ImageIcon, Check } from 'lucide-react';
import { extractFramesFromGif, generateSpritesheetBlob } from '../utils/gifProcessing';

export const SpritesheetTool: React.FC = () => {
  const [fileData, setFileData] = useState<UploadResponse | null>(null);
  const [config, setConfig] = useState<SpritesheetConfig>({
    uploadId: '',
    columns: 5,
    padding: 0,
    bgColor: '#000000',
    outputFormat: 'png',
    preserveTransparency: true
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [frameInfo, setFrameInfo] = useState<{count: number, w: number, h: number} | null>(null);

  const handleUpload = async (data: UploadResponse) => {
      setFileData(data);
      if (data.filename.toLowerCase().endsWith('.gif')) {
         try {
             const frames = await extractFramesFromGif(data.url);
             setFrameInfo({
                 count: frames.length,
                 w: frames[0]?.dims.width || 0,
                 h: frames[0]?.dims.height || 0
             });
             const optimalCols = Math.ceil(Math.sqrt(frames.length));
             setConfig(prev => ({ ...prev, columns: optimalCols }));
         } catch (e) {
             console.error("Analysis failed", e);
         }
      }
  };

  const handleGenerate = async () => {
    if (!fileData) return;
    setIsGenerating(true);
    setResultUrl(null);

    try {
        let finalUrl = '';
        if (fileData.filename.toLowerCase().endsWith('.gif')) {
            const frames = await extractFramesFromGif(fileData.url);
            finalUrl = await generateSpritesheetBlob(
                frames, 
                config.columns || 5, 
                config.padding, 
                config.bgColor, 
                config.preserveTransparency
            );
        } else {
            finalUrl = await apiService.generateSpritesheet({ ...config, uploadId: fileData.id });
        }
        setResultUrl(finalUrl);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const reset = () => {
    setFileData(null);
    setResultUrl(null);
    setFrameInfo(null);
  };

  if (!fileData) {
    return (
      <div className="space-y-8 animate-fade-in max-w-4xl mx-auto py-12">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-4xl font-extrabold text-white">Spritesheet Maker</h2>
          <p className="text-slate-400 text-lg">Convert animated GIFs into optimized static PNG spritesheets.</p>
        </div>
        <FileUploader onUploadSuccess={handleUpload} accept="image/gif,image/png" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-140px)] animate-fade-in">
      {/* Config Panel */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-6 h-fit">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="font-bold text-lg text-white">Settings</h3>
            <button onClick={reset} className="text-slate-500 hover:text-red-400 text-sm flex items-center gap-1 transition-colors">
                <RefreshCcw className="w-3 h-3" /> Reset
            </button>
        </div>
        
        {frameInfo && (
            <div className="px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
                <div>
                   <span className="block font-semibold">Source Analyzed</span>
                   <span className="opacity-70">{frameInfo.count} frames • {frameInfo.w}x{frameInfo.h}px</span>
                </div>
            </div>
        )}

        <div className="space-y-5">
          <Input 
            label="Grid Columns" 
            type="number" 
            value={config.columns} 
            onChange={(e) => setConfig({...config, columns: parseInt(e.target.value) || 1})}
            min={1}
            max={50}
          />
          
          <Input 
            label="Spacing (px)" 
            type="number" 
            value={config.padding} 
            onChange={(e) => setConfig({...config, padding: parseInt(e.target.value) || 0})}
            min={0}
            max={50}
          />

          <div>
             <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Background</label>
             <div className="flex items-center gap-3 bg-slate-950/50 p-2 rounded-xl border border-white/10">
                <input 
                    type="color" 
                    value={config.bgColor}
                    onChange={(e) => setConfig({...config, bgColor: e.target.value})}
                    className="h-8 w-8 rounded-lg overflow-hidden cursor-pointer border-none bg-transparent"
                />
                <input 
                    type="text"
                    value={config.bgColor}
                    onChange={(e) => setConfig({...config, bgColor: e.target.value})}
                    className="flex-1 bg-transparent text-sm focus:outline-none"
                />
             </div>
          </div>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-white/5 cursor-pointer hover:bg-slate-800/50 transition-colors">
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${config.preserveTransparency ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'}`}>
                {config.preserveTransparency && <Check className="w-3 h-3 text-white" />}
            </div>
            <input 
                type="checkbox" 
                checked={config.preserveTransparency}
                onChange={(e) => setConfig({...config, preserveTransparency: e.target.checked})}
                className="hidden"
            />
            <span className="text-sm font-medium text-slate-300">Preserve Transparency</span>
          </label>
        </div>

        <Button 
            className="w-full mt-2" 
            onClick={handleGenerate} 
            isLoading={isGenerating}
            size="lg"
        >
            Generate Spritesheet
        </Button>
      </div>

      {/* Preview Area */}
      <div className="lg:col-span-2 flex flex-col gap-6 h-full overflow-hidden">
        <div className="flex-1 glass-panel rounded-3xl p-1 relative overflow-hidden flex flex-col">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 pointer-events-none"></div>
            <div className="flex-1 overflow-auto p-8 flex items-center justify-center relative scrollbar-thin">
                {resultUrl ? (
                    <img 
                        src={resultUrl} 
                        alt="Spritesheet" 
                        className="max-w-none shadow-2xl rounded border border-white/10" 
                    />
                ) : (
                    <div className="text-center opacity-30 flex flex-col items-center gap-4">
                        <ImageIcon className="w-16 h-16" />
                        <p className="text-xl font-medium">Ready to Process</p>
                    </div>
                )}
            </div>
        </div>

        {/* Action Bar */}
        {resultUrl && (
            <div className="glass-panel-lighter border border-indigo-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 animate-fade-in shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                <div>
                    <h4 className="font-bold text-white text-lg">Spritesheet Ready</h4>
                    <p className="text-sm text-slate-400">Generated successfully. Ready for download.</p>
                </div>
                <a href={resultUrl} download={`spritesheet-${fileData.filename.split('.')[0]}.png`} className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto px-8">
                        <Download className="w-5 h-5" /> Download PNG
                    </Button>
                </a>
            </div>
        )}
      </div>
    </div>
  );
};