import React from 'react';
import { 
  Maximize, Grid, Film, Layers, Scissors, Zap, 
  BoxSelect, FileText, ArrowRight, Clapperboard, User
} from 'lucide-react';
import { AdUnit } from '../components/ui/AdUnit';

interface HomeProps {
  onNavigate: (tool: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const tools = [
    { id: 'video-gif', label: 'Video to GIF', icon: Clapperboard, desc: 'Convert MP4/WebM to optimized GIFs with trim & crop.' },
    { id: 'resizer', label: 'Background Resizer', icon: Maximize, desc: 'Crop and resize artwork to fit Steam presets.' },
    { id: 'grid', label: 'Grid Generator', icon: Grid, desc: 'Create custom 600x900 cover art with overlays.' },
    { id: 'spritesheet', label: 'Spritesheet Maker', icon: Film, desc: 'Convert GIFs into static PNG spritesheets.' },
    { id: 'splitter', label: 'Grid Splitter', icon: Layers, desc: 'Slice GIFs into multiple tiles for showcases.' },
    { id: 'slicer', label: 'Artwork Slicer', icon: Scissors, desc: 'Split background images for Featured Artwork.' },
    { id: 'optimizer', label: 'GIF Optimizer', icon: Zap, desc: 'Compress GIFs by adjusting FPS and colors.' },
    { id: 'avatar-frame', label: 'Avatar Framer', icon: BoxSelect, desc: 'Test and overlay animated avatar frames.' },
    { id: 'description-gen', label: 'Profile Text Gen', icon: FileText, desc: 'Generate aesthetic bio text with AI.' },
    { id: 'avatar', label: 'Avatar Creator', icon: User, desc: 'Design custom avatars with borders and effects.' },
  ];

  return (
    <div className="animate-fade-in pb-20">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-12 pt-10">
        <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-800 to-indigo-600 dark:from-white dark:via-indigo-200 dark:to-indigo-400 mb-6 tracking-tight drop-shadow-sm">
          Craft Your Perfect <br/>Steam Profile
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
          A comprehensive suite of tools designed to help you create, optimize, and customize every aspect of your Steam presence.
        </p>
        <button 
            onClick={() => onNavigate('resizer')}
            className="px-8 py-4 bg-indigo-600 text-white dark:bg-white dark:text-slate-950 rounded-full font-bold text-lg hover:bg-indigo-700 dark:hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2 mx-auto"
        >
            Start Creating <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Ad Placement */}
      <div className="max-w-4xl mx-auto mb-12">
         <AdUnit variant="horizontal" />
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onNavigate(tool.id)}
            className="group relative flex flex-col items-start p-8 rounded-3xl border border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-800/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 text-left overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-500/5 dark:to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:bg-indigo-500 group-hover:border-indigo-400">
              <tool.icon className="w-7 h-7 text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-colors" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">{tool.label}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed group-hover:text-slate-700 dark:group-hover:text-slate-300">{tool.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
};