import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import CropEditor from './components/CropEditor';
import Toolbar from './components/Toolbar';
import { ImageAsset, ToolMode, RectCrop, Point } from './types';
import { cropRectImage, cropPolygonImage, exportImagesAsZip, loadImage } from './utils/canvasUtils';

// Simple UUID fallback
const generateId = () => Math.random().toString(36).substr(2, 9);

function App() {
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  // Initialize Theme
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages: ImageAsset[] = [];
      
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const url = URL.createObjectURL(file);
        
        // Load image to get dims
        try {
          const img = await loadImage(url);
          newImages.push({
            id: generateId(),
            name: file.name,
            url,
            originalWidth: img.width,
            originalHeight: img.height,
            mode: ToolMode.RECT,
            isProcessed: false,
            // Default Polygon Points (Triangle default)
            polygonPoints: [
               { x: img.width * 0.25, y: img.height * 0.75 },
               { x: img.width * 0.5, y: img.height * 0.25 },
               { x: img.width * 0.75, y: img.height * 0.75 }
            ]
          });
        } catch (err) {
          console.error("Failed to load image", file.name, err);
        }
      }
      
      setImages(prev => [...prev, ...newImages]);
      if (!selectedId && newImages.length > 0) {
        setSelectedId(newImages[0].id);
      }
    }
  };

  const handleRemove = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // Allow "splitting" by duplicating the image to crop a different part
  const handleDuplicate = (id: string) => {
    const original = images.find(img => img.id === id);
    if (original) {
      const copy = {
        ...original,
        id: generateId(),
        name: `${original.name} (Copy)`,
        isProcessed: false,
        isGenerated: false,
        thumbnailUrl: undefined,
        // Deep copy points/rect if needed, for now reset crop
        rectCrop: undefined 
      };
      setImages(prev => [...prev, copy]);
    }
  };

  const updateCurrentImage = (updates: Partial<ImageAsset>) => {
    if (!selectedId) return;
    setImages(prev => prev.map(img => img.id === selectedId ? { ...img, ...updates } : img));
  };

  const handleUpdateRect = (updates: Partial<RectCrop>) => {
     const img = images.find(i => i.id === selectedId);
     if(img && img.rectCrop) {
       updateCurrentImage({ rectCrop: { ...img.rectCrop, ...updates } });
     }
  };

  const handleApplyCrop = async () => {
    if (!selectedId) return;
    const current = images.find(img => img.id === selectedId);
    if (!current) return;

    try {
      let resultUrl = '';
      let width = 0;
      let height = 0;

      if (current.mode === ToolMode.RECT && current.rectCrop) {
        resultUrl = await cropRectImage(current.url, current.rectCrop, current.originalWidth, current.originalHeight);
        width = current.rectCrop.width;
        height = current.rectCrop.height;
      } else if (current.mode === ToolMode.POLYGON && current.polygonPoints) {
        resultUrl = await cropPolygonImage(current.url, current.polygonPoints, current.originalWidth, current.originalHeight);
        // Estimate dims for meta
        width = current.originalWidth; 
        height = current.originalHeight;
      } else {
        return; // Nothing to crop
      }

      // Create a NEW generated image asset
      const newId = generateId();
      // Calculate a name: "OriginalName_crop_1"
      // Count how many crops exist for this image to append number? 
      // Simplified: just timestamp or random suffix
      const suffix = Math.floor(Math.random() * 1000);
      
      const newAsset: ImageAsset = {
        id: newId,
        name: `${current.name.replace(/\.[^/.]+$/, "")}_crop_${suffix}.png`,
        url: resultUrl,
        thumbnailUrl: resultUrl, // It's already the result
        originalWidth: width,
        originalHeight: height,
        mode: ToolMode.RECT,
        isProcessed: true,
        isGenerated: true,
        rectCrop: undefined, // No initial crop on the result
        polygonPoints: []
      };

      setImages(prev => [...prev, newAsset]);
      
      // OPTIONAL: Feedback to user? 
      // We do NOT change selection, so they can keep cropping the original.
      
    } catch (e) {
      console.error("Crop failed", e);
      alert("Failed to crop image.");
    }
  };

  const handleReset = () => {
    if (!selectedId) return;
    const current = images.find(img => img.id === selectedId);
    if (!current) return;
    
    // Reset Rect to default center
    const w = current.originalWidth * 0.5;
    const h = current.originalHeight * 0.5;
    
    updateCurrentImage({
      isProcessed: false,
      thumbnailUrl: undefined,
      rectCrop: {
        x: (current.originalWidth - w) / 2,
        y: (current.originalHeight - h) / 2,
        width: w,
        height: h
      },
      polygonPoints: [] // Reset polygon
    });
  };

  const selectedImage = images.find(img => img.id === selectedId);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Toolbar 
        mode={selectedImage?.mode || ToolMode.RECT}
        currentRect={selectedImage?.rectCrop}
        isDark={isDark}
        onSetMode={(m) => updateCurrentImage({ mode: m })}
        onUpdateRect={handleUpdateRect}
        onReset={handleReset}
        onApply={handleApplyCrop}
        onExportAll={() => exportImagesAsZip(images)}
        onToggleTheme={() => setIsDark(!isDark)}
        canExport={images.length > 0}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          images={images}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onRemove={handleRemove}
          onDuplicate={handleDuplicate}
          onUpload={handleUpload}
        />
        
        {selectedImage ? (
          <CropEditor 
            image={selectedImage}
            onUpdateRect={(rect) => updateCurrentImage({ rectCrop: rect })}
            onUpdatePoints={(points) => updateCurrentImage({ polygonPoints: points })}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-black text-slate-400 dark:text-slate-600 transition-colors">
            <h1 className="text-2xl font-bold mb-2 text-slate-700 dark:text-slate-300">CropMaster Pro</h1>
            <p>Upload images to start cropping</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;