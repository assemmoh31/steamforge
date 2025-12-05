
export interface UploadResponse {
  id: string;
  filename: string;
  width: number;
  height: number;
  frames?: number;
  url: string; // Preview URL
}

export interface ProcessingError {
  error: boolean;
  code: string;
  message: string;
}

export type ToolType = 'spritesheet' | 'grid' | 'avatar' | 'resizer' | 'slicer' | 'splitter' | 'optimizer' | 'avatar-frame' | 'description-gen' | 'video-gif';

export interface SpritesheetConfig {
  uploadId: string;
  columns?: number;
  rows?: number;
  padding: number;
  bgColor: string;
  outputFormat: 'png' | 'gif';
  preserveTransparency: boolean;
}

export interface GridConfig {
  uploadId: string;
  zoom: number;
  x: number;
  y: number;
  rounded: boolean;
  title: string;
}

export interface AvatarConfig {
  uploadId: string;
  shape: 'square' | 'circle';
  borderWidth: number;
  borderColor: string;
}

export interface OptimizerConfig {
  targetFps: number;
  widthScale: number; // 0.1 to 1.0
  colors: number; // 2 to 256
}