import React from 'react';

interface AdUnitProps {
  className?: string;
  variant?: 'horizontal' | 'vertical' | 'rectangle';
  slotId?: string;
}

export const AdUnit: React.FC<AdUnitProps> = ({ 
  className = '', 
  variant = 'horizontal', 
  slotId = '0000000000' 
}) => {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center ${className}`}>
      
      {/* Label */}
      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-[9px] font-bold text-slate-500 uppercase tracking-wider">
        Ad
      </div>

      {/* Placeholder Visuals */}
      <div className={`
        flex flex-col items-center justify-center gap-2 p-6 w-full
        ${variant === 'vertical' ? 'min-h-[300px]' : 'min-h-[120px]'}
      `}>
         <div className="w-12 h-12 rounded-full bg-slate-200/50 dark:bg-slate-800/50 flex items-center justify-center mb-2">
            <span className="text-slate-400 dark:text-slate-600 font-bold text-lg">$</span>
         </div>
         <p className="text-slate-400 dark:text-slate-500 text-xs font-medium text-center max-w-[200px]">
           Space reserved for AdSense <br/>
           <span className="font-mono text-[10px] opacity-50">data-ad-slot="{slotId}"</span>
         </p>
      </div>
    </div>
  );
};