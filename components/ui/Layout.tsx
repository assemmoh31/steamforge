import React from 'react';
import { Menu, Settings, Grid, Film, Scissors, Layers, User, Zap, BoxSelect, FileText, Maximize, Image as ImageIcon, Home, Clapperboard, Sun, Moon } from 'lucide-react';
import { AdUnit } from './AdUnit';

interface LayoutProps {
  children: React.ReactNode;
  activeTool: string;
  onNavigate: (tool: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTool, onNavigate, theme, onToggleTheme }) => {
  return (
    <div className="flex h-screen overflow-hidden font-sans text-slate-900 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-20 lg:w-72 flex-shrink-0 flex flex-col glass-panel border-r-0 border-slate-200 dark:border-white/5 relative z-20 transition-all duration-300">
        {/* Logo Area */}
        <div 
          onClick={() => onNavigate('home')}
          className="h-20 flex items-center justify-between px-3 lg:px-6 border-b border-slate-200 dark:border-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
              <div className="relative w-10 h-10 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center ring-1 ring-slate-200 dark:ring-white/10 shadow-sm">
                <Settings className="text-indigo-600 dark:text-indigo-400 w-5 h-5" />
              </div>
            </div>
            <div className="ml-3 hidden lg:block">
              <h1 className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">Steam<span className="text-indigo-600 dark:text-indigo-400">Forge</span></h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">Asset Toolkit</p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
          <NavItem 
            icon={<Home className="w-5 h-5" />}
            label="Dashboard" 
            isActive={activeTool === 'home'} 
            onClick={() => onNavigate('home')} 
          />
          
          <div className="my-2 border-t border-slate-200 dark:border-white/5 mx-2"></div>

          <NavItem 
            icon={<Clapperboard className="w-5 h-5" />}
            label="Video to GIF" 
            isActive={activeTool === 'video-gif'} 
            onClick={() => onNavigate('video-gif')} 
          />
          
          <NavItem 
            icon={<Maximize className="w-5 h-5" />}
            label="Background Resizer" 
            isActive={activeTool === 'resizer'} 
            onClick={() => onNavigate('resizer')} 
          />
          <NavItem 
            icon={<Grid className="w-5 h-5" />}
            label="Grid Generator" 
            isActive={activeTool === 'grid'} 
            onClick={() => onNavigate('grid')} 
          />
          <NavItem 
            icon={<Film className="w-5 h-5" />}
            label="Spritesheet Maker" 
            isActive={activeTool === 'spritesheet'} 
            onClick={() => onNavigate('spritesheet')} 
          />
          <NavItem 
            icon={<Layers className="w-5 h-5" />}
            label="Grid Splitter" 
            isActive={activeTool === 'splitter'} 
            onClick={() => onNavigate('splitter')} 
          />
          <NavItem 
            icon={<Scissors className="w-5 h-5" />}
            label="Artwork Slicer" 
            isActive={activeTool === 'slicer'} 
            onClick={() => onNavigate('slicer')} 
          />
           <NavItem 
            icon={<Zap className="w-5 h-5" />}
            label="GIF Optimizer" 
            isActive={activeTool === 'optimizer'} 
            onClick={() => onNavigate('optimizer')} 
          />
           <NavItem 
            icon={<BoxSelect className="w-5 h-5" />}
            label="Avatar Framer" 
            isActive={activeTool === 'avatar-frame'} 
            onClick={() => onNavigate('avatar-frame')} 
          />
           <NavItem 
            icon={<FileText className="w-5 h-5" />}
            label="Profile Text Gen" 
            isActive={activeTool === 'description-gen'} 
            onClick={() => onNavigate('description-gen')} 
          />
           <NavItem 
            icon={<User className="w-5 h-5" />}
            label="Avatar Creator" 
            isActive={activeTool === 'avatar'} 
            onClick={() => onNavigate('avatar')} 
          />
        </nav>

        {/* Theme & Ad Placement */}
        <div className="px-3 pb-3 hidden lg:flex flex-col gap-3">
           <button 
             onClick={onToggleTheme}
             className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl bg-slate-200/50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-slate-400"
           >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="text-sm font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
           </button>
           <AdUnit variant="vertical" className="bg-slate-200/50 dark:bg-slate-900/50" />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-white/5 hidden lg:block">
          <div className="glass-panel-lighter rounded-xl p-3">
             <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">System Ready</span>
             </div>
             <p className="text-[10px] text-slate-500">v1.7.0 • Client Processing</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative scrollbar-hide bg-transparent">
         {/* Top ambient glow */}
        <div className="absolute top-0 left-0 w-full h-96 bg-indigo-500/5 dark:bg-indigo-900/10 blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12 relative z-10 flex flex-col min-h-full">
          {/* Mobile Theme Toggle */}
          <div className="lg:hidden flex justify-end mb-4">
            <button 
             onClick={onToggleTheme}
             className="p-2 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-slate-200" /> : <Moon className="w-5 h-5 text-slate-700" />}
            </button>
          </div>

          <div className="flex-1">
            {children}
          </div>

          {/* Footer Ad Area */}
          <div className="mt-16 pt-8 border-t border-slate-200 dark:border-white/5">
            <div className="flex flex-col items-center gap-4 text-center mb-8">
               <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Supported by</p>
               <AdUnit variant="horizontal" className="w-full max-w-3xl mx-auto" />
            </div>
            <p className="text-center text-slate-500 text-xs">
              © 2024 SteamAssets Forge. Not affiliated with Valve Corporation.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden
      ${isActive 
        ? 'text-slate-900 dark:text-white shadow-lg shadow-indigo-500/10 dark:shadow-indigo-900/20' 
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-white/5'
      }
    `}
  >
    {isActive && (
       <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-blue-50 dark:from-indigo-600/20 dark:to-blue-600/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl" />
    )}
    <span className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110 text-indigo-600 dark:text-indigo-400' : 'group-hover:scale-110'}`}>
        {icon}
    </span>
    <span className="relative z-10 font-medium text-sm hidden lg:block">{label}</span>
    
    {isActive && (
        <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.5)] hidden lg:block" />
    )}
  </button>
);