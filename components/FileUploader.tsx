import React, { useCallback, useState } from 'react';
import { UploadCloud, AlertCircle, FileType } from 'lucide-react';
import { UploadResponse, ProcessingError } from '../types';
import { apiService } from '../services/api';

interface FileUploaderProps {
  onUploadSuccess: (data: UploadResponse) => void;
  accept?: string;
  maxSizeMB?: number;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ 
  onUploadSuccess, 
  accept = "image/*", 
  maxSizeMB = 16 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File exceeds ${maxSizeMB}MB limit.`);
      return;
    }
    
    setIsUploading(true);
    try {
      const result = await apiService.uploadFile(file);
      if ('error' in result) {
        setError(result.message);
      } else {
        onUploadSuccess(result);
      }
    } catch (e) {
      setError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={`
        relative overflow-hidden rounded-3xl transition-all duration-300 p-12
        flex flex-col items-center justify-center text-center group cursor-pointer
        glass-panel
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 scale-[1.02]' 
          : 'hover:border-indigo-400/30 hover:bg-slate-50 dark:hover:bg-slate-800/40'
        }
      `}
    >
      <input 
        type="file" 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
        accept={accept}
        onChange={(e) => {
            if (e.target.files?.[0]) {
                handleFile(e.target.files[0]);
                e.target.value = ''; // Reset value to allow re-uploading same file
            }
        }}
        disabled={isUploading}
      />
      
      {isUploading ? (
        <div className="space-y-6 relative z-10 pointer-events-none">
          <div className="relative w-20 h-20 mx-auto">
             <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-700"></div>
             <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-indigo-500 border-b-transparent border-l-transparent animate-spin"></div>
          </div>
          <p className="text-indigo-500 dark:text-indigo-400 font-medium animate-pulse">Processing Asset...</p>
        </div>
      ) : (
        <div className="relative z-10 space-y-4 pointer-events-none">
          <div className={`
            w-20 h-20 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 flex items-center justify-center mx-auto transition-transform duration-500 shadow-2xl
            ${isDragging ? 'scale-110 rotate-6 shadow-indigo-500/20' : 'group-hover:scale-105 group-hover:shadow-indigo-500/10'}
          `}>
            {isDragging ? (
                 <UploadCloud className="w-10 h-10 text-indigo-500 dark:text-indigo-400 animate-bounce" />
            ) : (
                 <FileType className="w-10 h-10 text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
            )}
          </div>
          
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                {isDragging ? "Drop to Upload" : "Upload Artwork"}
            </h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
                Drag & Drop GIF, PNG, JPG <br/>
                <span className="text-xs opacity-70">Max size {maxSizeMB}MB</span>
            </p>
          </div>

          <div className="pt-2">
            <span className="px-5 py-2.5 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider group-hover:bg-indigo-50 dark:group-hover:bg-indigo-600/20 group-hover:border-indigo-200 dark:group-hover:border-indigo-500/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-all">
                Browse System
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-200 px-4 py-2 rounded-xl text-sm animate-fade-in backdrop-blur-md shadow-lg shadow-red-900/10 z-20 pointer-events-none">
          <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
          {error}
        </div>
      )}
    </div>
  );
};