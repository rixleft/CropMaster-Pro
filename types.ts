export enum ToolMode {
  RECT = 'RECT',
  POLYGON = 'POLYGON'
}

export interface Point {
  x: number;
  y: number;
}

export interface RectCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageAsset {
  id: string;
  name: string;
  url: string; // The original object URL
  originalWidth: number;
  originalHeight: number;
  
  // Crop State
  mode: ToolMode;
  rectCrop?: RectCrop;
  polygonPoints?: Point[];
  
  // UI State
  isProcessed: boolean; // Has the user "applied" a crop? (Used for visual feedback)
  isGenerated?: boolean; // Is this a result of a crop?
  thumbnailUrl?: string; // Preview of the crop
}

export interface AspectRatio {
  label: string;
  value: number | null; // null for Free
}