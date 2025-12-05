
import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { apiService } from '../services/api';
import { 
  Sparkles, Copy, Eye, Palette, MessageSquare, Check, Terminal
} from 'lucide-react';
import { AdUnit } from '../components/ui/AdUnit';

export const DescriptionGenTool: React.FC = () => {
  const [style, setStyle] = useState("Mysterious");
  const [interests, setInterests] = useState("");
  const [generatedBio, setGeneratedBio] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [steamName, setSteamName] = useState("SteamUser");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!interests.trim()) return;
    setIsGenerating(true);
    
    // Fallback bio if API fails
    const fallbackBio = `[h1]N O  S I G N A L[/h1]\n[i]"Lost in the digital void..."[/i]\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\nFPS • RPG • Design`;

    try {
        const result = await apiService.generateAiProfile({
            theme: interests, // Use user input as theme/context
            vibe: style
        });
        setGeneratedBio(result);
        setViewMode('preview');
    } catch (e) {
        console.error(e);
        setGeneratedBio(fallbackBio); 
    } finally {
        setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedBio);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)] animate-fade-in">
        {/* Left: Controls */}
        <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-6">
                 <div>
                    <h2 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-yellow-400" />
                        AI Bio Generator
                    </h2>
                    <p className="text-slate-400">Instantly generate aesthetic Steam profiles.</p>
                 </div>

                 <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Palette className="w-3 h-3" /> Style
                        </label>
                        <select 
                            value={style} 
                            onChange={(e) => setStyle(e.target.value)}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer hover:bg-slate-900/50 transition-colors"
                        >
                            <option>Mysterious</option>
                            <option>Minimalist</option>
                            <option>Cyberpunk</option>
                            <option>Anime</option>
                            <option>Dark</option>
                            <option>Professional</option>
                            <option>Funny</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <MessageSquare className="w-3 h-3" /> Interests
                        </label>
                        <textarea
                            value={interests}
                            onChange={(e) => setInterests(e.target.value)}
                            placeholder="e.g. CS2, FPS games, RPG, Anime, Graphic Design..."
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[120px] resize-none placeholder:text-slate-600"
                        />
                    </div>

                    <Button 
                        size="lg" 
                        onClick={handleGenerate} 
                        isLoading={isGenerating}
                        disabled={!interests.trim()}
                        className="w-full shadow-lg shadow-indigo-900/20"
                    >
                        Generate Magic Bio
                    </Button>
                 </div>
            </div>

            {/* Preview Settings */}
            <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Preview Options</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-1">
                        <label className="text-xs text-slate-400">Profile Name</label>
                        <input 
                            type="text" 
                            value={steamName} 
                            onChange={(e) => setSteamName(e.target.value)}
                            className="w-full bg-transparent border-b border-white/10 py-1 text-sm text-white focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>
            </div>

            <AdUnit variant="horizontal" />
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-7 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex gap-2">
                    <button 
                        onClick={() => setViewMode('preview')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'preview' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' : 'text-slate-400 hover:bg-white/5'}`}
                    >
                        <Eye className="w-4 h-4" /> Profile Preview
                    </button>
                    <button 
                        onClick={() => setViewMode('code')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'code' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' : 'text-slate-400 hover:bg-white/5'}`}
                    >
                        <Terminal className="w-4 h-4" /> Raw BBCode
                    </button>
                </div>

                {generatedBio && (
                    <Button variant="secondary" size="sm" onClick={handleCopy}>
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        {copied ? "Copied" : "Copy Code"}
                    </Button>
                )}
            </div>

            {/* Steam UI Container */}
            <div className="flex-1 rounded-xl overflow-hidden shadow-2xl bg-[#1b2838] flex flex-col relative border border-black/40">
                {/* Header Graphic Mockup */}
                <div className="h-full overflow-y-auto scrollbar-thin relative">
                     <div className="absolute inset-0 bg-gradient-to-b from-[#101822] to-[#1b2838] min-h-full pointer-events-none"></div>
                     
                     <div className="relative p-6 max-w-2xl mx-auto">
                        {/* Profile Header */}
                        <div className="flex gap-5 mb-8">
                            <div className="w-32 h-32 rounded bg-gradient-to-b from-slate-700 to-slate-800 p-1 shrink-0 relative group cursor-pointer">
                                <img src="https://picsum.photos/seed/steam/200" className="w-full h-full object-cover" alt="avatar" />
                                <div className="absolute -bottom-2 -right-2 bg-[#2a475e] text-white text-xs px-2 py-0.5 border border-black rounded">
                                    Offline
                                </div>
                            </div>
                            <div className="pt-2 w-full">
                                <div className="flex justify-between items-start">
                                    <h1 className="text-2xl text-white font-normal truncate">{steamName}</h1>
                                    <div className="border border-[#4c829d] rounded p-1 min-w-[50px]">
                                        <div className="text-right text-lg leading-none font-bold text-[#f2f2f2]">42</div>
                                        <div className="text-right text-[10px] text-[#8f98a0] uppercase">Level</div>
                                    </div>
                                </div>
                                <div className="text-[#8f98a0] text-sm mt-1 flex items-center gap-2">
                                     <img src="https://community.cloudflare.steamstatic.com/public/images/countryflags/us.gif" alt="flag" />
                                     United States
                                </div>
                                <div className="mt-4 text-[#acb2b8] text-[13px] font-sans leading-relaxed whitespace-pre-wrap font-normal selection:bg-[#54a5d4] selection:text-white">
                                    {!generatedBio ? (
                                        <span className="opacity-50 italic">No information given.</span>
                                    ) : (
                                        viewMode === 'preview' ? (
                                            <SteamParser text={generatedBio} />
                                        ) : (
                                            <textarea 
                                                value={generatedBio}
                                                onChange={(e) => setGeneratedBio(e.target.value)}
                                                className="w-full h-64 bg-[#00000030] text-slate-300 font-mono text-xs p-3 rounded border border-white/10 focus:outline-none focus:border-[#66c0f4]"
                                                spellCheck={false}
                                            />
                                        )
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Showcase Mockup to add realism */}
                        <div className="mt-8 bg-[#00000030] rounded p-1">
                             <div className="bg-[#1b2838] p-2 flex items-center justify-between mb-1">
                                 <span className="text-white text-base">Artwork Showcase</span>
                             </div>
                             <div className="flex gap-1 h-64">
                                  <div className="flex-1 bg-[#000] flex items-center justify-center text-[#3d4450] text-sm border border-[#000]">
                                      Main Artwork (506px)
                                  </div>
                                  <div className="w-[100px] bg-[#000] flex items-center justify-center text-[#3d4450] text-xs border border-[#000]">
                                      Side (100px)
                                  </div>
                             </div>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
};

// Steam BBCode Parser
const SteamParser = ({ text }: { text: string }) => {
    const parse = (input: string) => {
        let s = input
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // Headers
        s = s.replace(/\[h1\](.*?)\[\/h1\]/g, '<h1 class="text-white text-[22px] font-normal font-serif mt-3 mb-1 border-b border-[#303842] pb-1">$1</h1>');
        
        // Formatting
        s = s.replace(/\[b\](.*?)\[\/b\]/g, '<b class="text-[#d6d7d8] font-bold">$1</b>');
        s = s.replace(/\[u\](.*?)\[\/u\]/g, '<u class="decoration-1 underline-offset-2">$1</u>');
        s = s.replace(/\[i\](.*?)\[\/i\]/g, '<i class="italic">$1</i>');
        s = s.replace(/\[strike\](.*?)\[\/strike\]/g, '<s class="opacity-60">$1</s>');
        s = s.replace(/\[spoiler\](.*?)\[\/spoiler\]/g, '<span class="bg-[#000] text-[#000] hover:text-white hover:bg-[#32363c] px-1 cursor-pointer transition-colors rounded-sm select-none">$1</span>');
        
        // Lists
        s = s.replace(/\[list\]/g, '<ul class="list-disc pl-5 my-0">');
        s = s.replace(/\[\/list\]/g, '</ul>');
        s = s.replace(/\[\*\]/g, '<li class="marker:text-[#67c1f5] text-[#acb2b8]">');
        
        // Quote
        s = s.replace(/\[quote\]([\s\S]*?)\[\/quote\]/g, '<blockquote class="bg-[#242c38] border-l-2 border-[#546b7a] p-3 my-2 text-[#8f98a0] italic text-sm">$1</blockquote>');
        
        // Code
        s = s.replace(/\[code\]([\s\S]*?)\[\/code\]/g, '<code class="block bg-[#16191e] border border-[#3e4147] p-3 font-mono text-sm text-[#66c0f4] my-2 whitespace-pre shadow-inner overflow-x-auto">$1</code>');
        
        // Url
        s = s.replace(/\[url=(.*?)\](.*?)\[\/url\]/g, '<a href="$1" class="text-[#ffffff] font-bold hover:text-[#66c0f4] transition-colors" target="_blank" rel="noopener noreferrer">$2</a>');
        
        // Newlines
        s = s.replace(/\n/g, '<br/>');
        
        return s;
    };

    return <div dangerouslySetInnerHTML={{ __html: parse(text) }} />;
};
