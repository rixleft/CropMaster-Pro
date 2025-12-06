import React from 'react';
import { ImageAsset, ToolMode } from '../types';
import { Trash2, Copy, Image as ImageIcon, Scissors } from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  images: ImageAsset[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  images, 
  selectedId, 
  onSelect, 
  onRemove, 
  onDuplicate,
  onUpload
}) => {
  return (
    <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full transition-colors duration-200">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Images</h2>
        <label className="flex items-center justify-center w-full h-12 px-4 transition bg-brand-500 hover:bg-brand-600 text-white rounded-lg cursor-pointer font-medium shadow-sm">
          <span className="mr-2">+ Upload Images</span>
          <input 
            type="file" 
            className="hidden" 
            multiple 
            accept="image/*" 
            onChange={onUpload} 
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {images.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-600">
            <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
            <span className="text-sm">No images added</span>
          </div>
        )}
        
        {images.map((img) => (
          <div 
            key={img.id}
            onClick={() => onSelect(img.id)}
            className={clsx(
              "group relative flex items-center p-2 rounded-lg cursor-pointer border transition-all",
              selectedId === img.id 
                ? "bg-brand-50 border-brand-500 dark:bg-slate-800 dark:border-brand-500" 
                : "bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
            )}
          >
            <div className="relative w-16 h-16 rounded overflow-hidden bg-slate-200 dark:bg-slate-900 flex-shrink-0 border border-slate-100 dark:border-slate-700">
              <img 
                src={img.thumbnailUrl || img.url} 
                alt={img.name} 
                className="w-full h-full object-contain bg-slate-100 dark:bg-black" 
              />
              {img.isGenerated && (
                <div className="absolute top-0 right-0 bg-brand-500 p-0.5 rounded-bl-md" title="Generated Crop">
                   <Scissors className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            
            <div className="ml-3 flex-1 min-w-0">
              <p className={clsx("text-sm font-medium truncate", img.isGenerated ? "text-brand-600 dark:text-brand-400" : "text-slate-700 dark:text-slate-200")}>
                {img.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {Math.round(img.originalWidth)} x {Math.round(img.originalHeight)}
              </p>
              {!img.isGenerated && (
                <div className="flex items-center gap-1 mt-1">
                  <span className={clsx(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium border",
                    img.mode === ToolMode.RECT 
                      ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                      : "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800"
                  )}>
                    {img.mode === ToolMode.RECT ? 'Rect' : 'Poly'}
                  </span>
                </div>
              )}
            </div>

            <div className="absolute right-2 top-2 bottom-2 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); onRemove(img.id); }}
                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {!img.isGenerated && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDuplicate(img.id); }}
                  className="p-1 text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded"
                  title="Duplicate Source"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;