import React from 'react';
import { ToolMode, RectCrop } from '../types';
import { MousePointer2, Hexagon, Scissors, Download, RefreshCcw, Sun, Moon } from 'lucide-react';
import { clsx } from 'clsx';

interface ToolbarProps {
  mode: ToolMode;
  currentRect?: RectCrop;
  isDark: boolean;
  onSetMode: (mode: ToolMode) => void;
  onUpdateRect: (updates: Partial<RectCrop>) => void;
  onReset: () => void;
  onApply: () => void;
  onExportAll: () => void;
  onToggleTheme: () => void;
  canExport: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  mode, 
  currentRect,
  isDark, 
  onSetMode, 
  onUpdateRect,
  onReset, 
  onApply,
  onExportAll,
  onToggleTheme,
  canExport
}) => {
  
  const handleDimensionChange = (e: React.ChangeEvent<HTMLInputElement>, key: 'width' | 'height') => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      onUpdateRect({ [key]: val });
    }
  };

  return (
    <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 transition-colors duration-200 gap-4">
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg shrink-0">
          <button
            onClick={() => onSetMode(ToolMode.RECT)}
            className={clsx(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              mode === ToolMode.RECT 
                ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <MousePointer2 className="w-4 h-4" />
            <span>Rect</span>
          </button>
          <button
            onClick={() => onSetMode(ToolMode.POLYGON)}
            className={clsx(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              mode === ToolMode.POLYGON 
                ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <Hexagon className="w-4 h-4" />
            <span>Poly</span>
          </button>
        </div>

        {mode === ToolMode.RECT && currentRect && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 border-l border-slate-200 dark:border-slate-700 pl-4">
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs text-slate-400">W:</span>
              <input 
                type="number" 
                value={Math.round(currentRect.width)} 
                onChange={(e) => handleDimensionChange(e, 'width')}
                className="w-16 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-transparent text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-brand-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs text-slate-400">H:</span>
              <input 
                type="number" 
                value={Math.round(currentRect.height)} 
                onChange={(e) => handleDimensionChange(e, 'height')}
                className="w-16 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-transparent text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-brand-500 outline-none"
              />
            </div>
            <span className="text-xs text-slate-400">px</span>
          </div>
        )}

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2 shrink-0" />

        <button 
          onClick={onReset}
          className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-sm font-medium flex items-center gap-1.5 shrink-0"
        >
          <RefreshCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleTheme}
          className="p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-full transition-colors"
          title="Toggle Theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button 
          onClick={onApply}
          className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm shadow-brand-500/30"
          title="Add crop to list"
        >
          <Scissors className="w-4 h-4" />
          Apply Crop
        </button>
        
        <button 
          onClick={onExportAll}
          disabled={!canExport}
          className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export All
        </button>
      </div>
    </div>
  );
};

export default Toolbar;