import { SpritesheetConfig, UploadResponse, ProcessingError } from '../types';
import { GoogleGenAI } from "@google/genai";

// Mock delay to simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Safely retrieve API Key to prevent "process is not defined" crashes in pure browser environments
const getApiKey = () => {
  try {
    // Check if process exists (Node/Build env)
    if (typeof process !== 'undefined' && process.env) {
      return process.env.API_KEY;
    }
    // Check global window fallback (Browser polyfill)
    if (typeof window !== 'undefined' && (window as any).process && (window as any).process.env) {
      return (window as any).process.env.API_KEY;
    }
  } catch (e) {
    console.warn("Failed to read environment variables safely.");
  }
  return '';
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const apiService = {
  
  async uploadFile(file: File): Promise<UploadResponse | ProcessingError> {
    await delay(1500); // Simulate upload time

    if (file.size > 16 * 1024 * 1024) {
      return {
        error: true,
        code: "ERR_TOO_LARGE",
        message: "File exceeds 16MB limit"
      };
    }

    // Mock response based on file type
    const isGif = file.type === 'image/gif';
    
    return {
      id: Math.random().toString(36).substring(7),
      filename: file.name,
      width: 1920, // Mock dimensions
      height: 1080,
      frames: isGif ? 45 : 1,
      url: URL.createObjectURL(file)
    };
  },

  async generateSpritesheet(config: SpritesheetConfig): Promise<string> {
    await delay(3000); // Simulate processing time (gif-frames -> sharp -> composite)
    // Return a dummy placeholder image that represents a spritesheet
    // In production: fetch(`/api/tools/spritesheet`, { method: 'POST', body: JSON.stringify(config) })
    return "https://picsum.photos/800/600"; 
  },

  async downloadGrid(canvas: HTMLCanvasElement): Promise<void> {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'steam-grid.png';
          a.click();
          URL.revokeObjectURL(url);
        }
        resolve();
      }, 'image/png');
    });
  },

  async generateAiProfile(params: { theme: string, vibe: string }): Promise<string> {
    try {
      const prompt = `
        Act as an elite Steam Profile Designer. 
        Create a very short, aesthetic bio sample (Maximum 5 lines).
        
        **Input Context:** ${params.theme}
        **Visual Vibe:** ${params.vibe}

        **Strict Constraints:**
        1. **MAXIMUM 5 LINES OF TEXT.**
        2. No generic intros like "Welcome to my profile".
        3. Use aesthetic formatting (spacers like ⎯⎯ or //, or centered text styles).
        4. Focus on abstract, cool, or punchy phrasing.
        
        **Formatting Rules:**
        - Use ONLY Steam BBCode: [b], [i], [u], [h1], [strike], [code].
        - DO NOT use Markdown (**bold**).
        - Return ONLY the raw BBCode.

        **Example Output Structure (Vibe dependent):**
        [h1]V I B E[/h1]
        [i]Quote or short tagline here.[/i]
        ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
        Keyword • Keyword • Keyword
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text || "[Error: No content generated]";
    } catch (error) {
      console.error("AI Generation failed:", error);
      throw new Error("Failed to generate profile description.");
    }
  }
};