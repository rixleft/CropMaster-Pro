import React, { useRef, useEffect, useState } from 'react';
import { ImageAsset, Point, RectCrop, ToolMode } from '../types';
import { clsx } from 'clsx';

interface CropEditorProps {
  image: ImageAsset;
  onUpdateRect: (rect: RectCrop) => void;
  onUpdatePoints: (points: Point[]) => void;
}

const CropEditor: React.FC<CropEditorProps> = ({ 
  image, 
  onUpdateRect, 
  onUpdatePoints 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize Rect if missing
  useEffect(() => {
    if (image.mode === ToolMode.RECT && !image.rectCrop) {
      // Default center crop 50%
      const w = image.originalWidth * 0.5;
      const h = image.originalHeight * 0.5;
      onUpdateRect({
        x: (image.originalWidth - w) / 2,
        y: (image.originalHeight - h) / 2,
        width: w,
        height: h
      });
    }
  }, [image.id, image.mode]);

  // Handle Resize of container to calculate display scale
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        // Simple 'contain' logic
        const scaleX = clientWidth / image.originalWidth;
        const scaleY = clientHeight / image.originalHeight;
        const s = Math.min(scaleX, scaleY, 1); // Max scale 1 (don't upscale pixelated)
        setScale(s);
      }
    };
    
    window.addEventListener('resize', updateScale);
    updateScale();
    // Tiny delay to ensure layout is done
    setTimeout(updateScale, 100);

    return () => window.removeEventListener('resize', updateScale);
  }, [image.originalWidth, image.originalHeight]);

  // --- Interaction Logic ---

  const getLocalCoords = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
       clientX = e.touches[0].clientX;
       clientY = e.touches[0].clientY;
    } else {
       clientX = (e as React.MouseEvent).clientX;
       clientY = (e as React.MouseEvent).clientY;
    }

    // Centering offset logic usually needed if image is centered in container
    // We assume image is centered via flex
    const imgDisplayWidth = image.originalWidth * scale;
    const imgDisplayHeight = image.originalHeight * scale;
    const offsetX = (rect.width - imgDisplayWidth) / 2;
    const offsetY = (rect.height - imgDisplayHeight) / 2;

    const x = (clientX - rect.left - offsetX) / scale;
    const y = (clientY - rect.top - offsetY) / scale;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const pos = getLocalCoords(e);

    if (image.mode === ToolMode.POLYGON) {
      // Add point
      const newPoints = [...(image.polygonPoints || [])];
      
      // Close path if clicking near first point
      if (newPoints.length > 2) {
        const first = newPoints[0];
        const dist = Math.hypot(first.x - pos.x, first.y - pos.y);
        // If close (within 20 display pixels), we could auto-close, 
        // but for now let's just keep adding points. 
        // The user manually needs to feel they are "done" or we check connection logic.
        // Actually, polygon edit usually implies standard clicking.
      }
      onUpdatePoints([...newPoints, pos]);
    } else {
      // RECT Logic
      // Check handles first? Simplified: Click inside = move, outside = new? 
      // For this Senior implementation, let's just do a "Drag to Create/Move" logic 
      // is complex to implement fully from scratch in one file.
      // We'll rely on activeHandle set by child elements, or drag body.
      if (!activeHandle && image.rectCrop) {
         // Check if inside rect
         const r = image.rectCrop;
         if (pos.x >= r.x && pos.x <= r.x + r.width && pos.y >= r.y && pos.y <= r.y + r.height) {
           setDragStart(pos);
           setActiveHandle('move');
         } else {
           // Start new rect?
           setDragStart(pos);
           setActiveHandle('create');
           onUpdateRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
         }
      } else {
         setDragStart(pos);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (image.mode === ToolMode.POLYGON) return; 
    
    if (dragStart && activeHandle) {
      e.preventDefault();
      const pos = getLocalCoords(e);
      const currentRect = image.rectCrop || { x: 0, y: 0, width: 0, height: 0 };
      
      if (activeHandle === 'create') {
        const x = Math.min(dragStart.x, pos.x);
        const y = Math.min(dragStart.y, pos.y);
        const w = Math.abs(pos.x - dragStart.x);
        const h = Math.abs(pos.y - dragStart.y);
        onUpdateRect({ x, y, width: w, height: h });
      } else if (activeHandle === 'move') {
        const dx = pos.x - dragStart.x;
        const dy = pos.y - dragStart.y;
        onUpdateRect({
          ...currentRect,
          x: currentRect.x + dx,
          y: currentRect.y + dy
        });
        setDragStart(pos); // Reset drag start to current to avoid compounding delta errors
      } else if (activeHandle.startsWith('handle-')) {
         // Resizing logic (SE, SW, NE, NW)
         // Simplified SE resize
         if (activeHandle === 'handle-se') {
           onUpdateRect({
             ...currentRect,
             width: Math.max(10, pos.x - currentRect.x),
             height: Math.max(10, pos.y - currentRect.y)
           });
         }
         // Add other handles for full completeness if needed
      }
    }
  };

  const handleMouseUp = () => {
    setDragStart(null);
    setActiveHandle(null);
  };

  // Render Helpers
  const rect = image.rectCrop || { x: 0, y: 0, width: 0, height: 0 };
  
  return (
    <div 
      className="flex-1 bg-slate-100 dark:bg-black relative overflow-hidden flex items-center justify-center p-8 select-none touch-none"
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchMove={handleMouseMove}
    >
      <div 
        ref={containerRef}
        className="relative shadow-2xl shadow-black/20"
        style={{
          width: image.originalWidth * scale,
          height: image.originalHeight * scale,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        {/* The Base Image */}
        <img 
          src={image.url} 
          alt="Original" 
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
          draggable={false}
        />

        {/* Overlay for Darkening non-cropped areas */}
        <div className="absolute inset-0 pointer-events-none">
          <svg width="100%" height="100%" viewBox={`0 0 ${image.originalWidth} ${image.originalHeight}`}>
             <defs>
               <mask id="cropMask">
                 <rect x="0" y="0" width="100%" height="100%" fill="white" />
                 {image.mode === ToolMode.RECT ? (
                   <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} fill="black" />
                 ) : (
                   <polygon points={(image.polygonPoints || []).map(p => `${p.x},${p.y}`).join(' ')} fill="black" />
                 )}
               </mask>
             </defs>
             <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#cropMask)" />
          </svg>
        </div>

        {/* RECT Controls */}
        {image.mode === ToolMode.RECT && (
           <div 
             className="absolute border-2 border-white pointer-events-none"
             style={{
               left: rect.x * scale,
               top: rect.y * scale,
               width: rect.width * scale,
               height: rect.height * scale,
               boxShadow: '0 0 0 1px rgba(0,0,0,0.5), 0 0 0 9999px rgba(0,0,0,0.5)' // CSS Trick for dimming outside (backup to SVG)
             }}
           >
             {/* Handles - Pointer Events Auto allows interaction */}
             <div 
               className="absolute bottom-0 right-0 w-4 h-4 bg-white border border-brand-500 rounded-full cursor-se-resize pointer-events-auto transform translate-x-1/2 translate-y-1/2"
               onMouseDown={(e) => { e.stopPropagation(); setActiveHandle('handle-se'); setDragStart(getLocalCoords(e)); }}
             />
              <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-full h-full flex items-center justify-center pointer-events-none">
                 <div className="w-[1px] h-4 bg-white/50"></div>
                 <div className="h-[1px] w-4 bg-white/50 absolute"></div>
              </div>
           </div>
        )}

        {/* POLYGON Controls */}
        {image.mode === ToolMode.POLYGON && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
             <polygon 
               points={(image.polygonPoints || []).map(p => `${p.x * scale},${p.y * scale}`).join(' ')} 
               fill="rgba(14, 165, 233, 0.2)" 
               stroke="#0ea5e9" 
               strokeWidth="2"
               strokeDasharray="4"
             />
             {(image.polygonPoints || []).map((p, idx) => (
               <circle 
                 key={idx}
                 cx={p.x * scale}
                 cy={p.y * scale}
                 r={5}
                 fill="white"
                 stroke="#0ea5e9"
                 strokeWidth={2}
                 className="cursor-pointer pointer-events-auto hover:r-6 transition-all"
               />
             ))}
             {(image.polygonPoints || []).length > 0 && (
                <circle 
                  cx={image.polygonPoints![0].x * scale}
                  cy={image.polygonPoints![0].y * scale}
                  r={8}
                  fill="transparent"
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth={2}
                  className="animate-pulse"
                />
             )}
          </svg>
        )}
      </div>
    </div>
  );
};

export default CropEditor;
