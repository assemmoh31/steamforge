import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">{label}</label>}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg blur opacity-0 group-focus-within:opacity-20 transition duration-300"></div>
        <input
            className={`
                relative w-full 
                bg-white dark:bg-slate-950/50 
                border border-slate-200 dark:border-white/10 
                rounded-lg px-4 py-2.5 text-sm 
                text-slate-900 dark:text-white 
                placeholder:text-slate-400 dark:placeholder:text-slate-600
                focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900/80
                transition-all duration-200
                ${className}
            `}
            {...props}
        />
      </div>
      {error && <p className="text-red-500 dark:text-red-400 text-xs pl-1">{error}</p>}
    </div>
  );
};