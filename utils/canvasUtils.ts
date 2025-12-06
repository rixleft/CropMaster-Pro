import { Point, RectCrop } from '../types';
import JSZip from 'jszip';
import FileSaver from 'file-saver';

// Helper to load an image
export const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
};

/**
 * Crops an image based on a rectangle.
 */
export const cropRectImage = async (
  imageSrc: string,
  crop: RectCrop,
  origWidth: number,
  origHeight: number
): Promise<string> => {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  
  // Set canvas size to the crop size
  canvas.width = crop.width;
  canvas.height = crop.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2d context');

  // Draw the portion of the image
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  return canvas.toDataURL('image/png');
};

/**
 * Crops an image based on polygon points.
 */
export const cropPolygonImage = async (
  imageSrc: string,
  points: Point[],
  origWidth: number,
  origHeight: number
): Promise<string> => {
  if (points.length < 3) return imageSrc;

  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  
  // Calculate bounding box of the polygon to minimize canvas size
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const width = maxX - minX;
  const height = maxY - minY;

  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2d context');

  // Shift points so the top-left is at 0,0
  const shiftedPoints = points.map(p => ({ x: p.x - minX, y: p.y - minY }));

  ctx.beginPath();
  ctx.moveTo(shiftedPoints[0].x, shiftedPoints[0].y);
  for (let i = 1; i < shiftedPoints.length; i++) {
    ctx.lineTo(shiftedPoints[i].x, shiftedPoints[i].y);
  }
  ctx.closePath();
  
  // Clip the canvas to the path
  ctx.clip();

  // Draw the image shifted by minX, minY
  ctx.drawImage(
    image,
    -minX,
    -minY,
    origWidth,
    origHeight
  );

  return canvas.toDataURL('image/png');
};

/**
 * Generates a ZIP file containing all processed images.
 */
export const exportImagesAsZip = async (images: any[]) => {
  const zip = new JSZip();
  const folder = zip.folder("cropped_images");
  
  if (!folder) return;

  let count = 0;
  
  for (const img of images) {
    // Only export if we have a thumbnail (which represents the processed result) or fallback to original
    // Ideally we re-process high quality here, but for this demo we use the logic below
    
    let base64Data = img.thumbnailUrl;
    
    // If no crop applied, just fetch original? 
    // For this app, let's assume if it's not processed, we export original
    // But getting base64 from original URL requires fetch.
    
    if (!base64Data) {
       // Quick helper to convert url to base64 if needed, or skip
       // For now, let's assume user wants to export what they see.
       // If they haven't cropped, we skip or we need to draw original to canvas.
       try {
         const tempImg = await loadImage(img.url);
         const c = document.createElement('canvas');
         c.width = img.originalWidth;
         c.height = img.originalHeight;
         const ctx = c.getContext('2d');
         ctx?.drawImage(tempImg, 0, 0);
         base64Data = c.toDataURL('image/png');
       } catch (e) {
         console.warn("Skipping image export due to load error", img.name);
         continue;
       }
    }

    const idx = base64Data.indexOf('base64,') + 'base64,'.length;
    const content = base64Data.substring(idx);
    
    const fileName = `${img.name.replace(/\.[^/.]+$/, "")}_crop_${count + 1}.png`;
    folder.file(fileName, content, { base64: true });
    count++;
  }
  
  const content = await zip.generateAsync({ type: "blob" });
  
  // Robust way to get saveAs function regardless of how file-saver is packaged (ESM vs CJS default)
  const save = (FileSaver as any).saveAs || FileSaver;
  save(content, "processed_images.zip");
};