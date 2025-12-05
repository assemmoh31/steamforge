import React, { useState, useEffect } from 'react';
import { Layout } from './components/ui/Layout';
import { Home } from './features/Home';
import { SpritesheetTool } from './features/SpritesheetTool';
import { GridTool } from './features/GridTool';
import { SlicerTool } from './features/SlicerTool';
import { SplitterTool } from './features/SplitterTool';
import { OptimizerTool } from './features/OptimizerTool';
import { AvatarFrameTool } from './features/AvatarFrameTool';
import { DescriptionGenTool } from './features/DescriptionGenTool';
import { ResizerTool } from './features/ResizerTool';
import { VideoToGifTool } from './features/VideoToGifTool';

// Placeholder components for tools not fully implemented in this demo
const PlaceholderTool = ({ title }: { title: string }) => (
  <div className="text-center py-20 opacity-50">
    <div className="text-6xl mb-4">🚧</div>
    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{title}</h2>
    <p className="text-slate-500">This tool is currently under construction.</p>
  </div>
);

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState('home');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Initialize theme from local storage or default to dark
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const renderTool = () => {
    switch (activeTool) {
      case 'home':
        return <Home onNavigate={setActiveTool} />;
      case 'video-gif':
        return <VideoToGifTool />;
      case 'resizer':
        return <ResizerTool />;
      case 'grid':
        return <GridTool />;
      case 'spritesheet':
        return <SpritesheetTool />;
      case 'splitter':
        return <SplitterTool />;
      case 'optimizer':
        return <OptimizerTool />;
      case 'avatar-frame':
        return <AvatarFrameTool />;
      case 'description-gen':
        return <DescriptionGenTool />;
      case 'avatar':
        return <PlaceholderTool title="Avatar Creator" />;
      case 'slicer':
        return <SlicerTool />;
      default:
        return <Home onNavigate={setActiveTool} />;
    }
  };

  return (
    <Layout 
      activeTool={activeTool} 
      onNavigate={setActiveTool}
      theme={theme}
      onToggleTheme={toggleTheme}
    >
      {renderTool()}
    </Layout>
  );
};

export default App;