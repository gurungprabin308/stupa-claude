
import React, { useState, useRef, useEffect } from 'react';
import { X, Check, ZoomIn, ZoomOut, RotateCcw, Image as ImageIcon, Move, Loader2 } from 'lucide-react';

interface ImageCropperProps {
  file: File;
  aspectRatio?: number; // width / height
  isRound?: boolean;
  onCrop: (croppedFile: File) => void;
  onCancel: () => void;
}

export const ImageCropper = ({ file, aspectRatio = 1, isRound = false, onCrop, onCancel }: ImageCropperProps) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // Visual offset in pixels
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const [baseScale, setBaseScale] = useState(1); // Scale to fit image in container

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Constants
  const CONTAINER_HEIGHT = 400; 
  const CONTAINER_WIDTH = CONTAINER_HEIGHT * aspectRatio;

  // Load Image
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  }, [file]);

  // Calculate Base Scale on Image Load
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    
    // Calculate the scale needed to "contain" the image within the crop box at zoom 1
    const widthRatio = CONTAINER_WIDTH / naturalWidth;
    const heightRatio = CONTAINER_HEIGHT / naturalHeight;
    
    // We start with "contain" behavior (fit entire image) or "cover" (fill box)
    // "Contain" is usually safer for starting crop
    const scale = Math.min(widthRatio, heightRatio);
    setBaseScale(scale);
  };

  // Drag Handlers
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const reset = () => {
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
  };

  const handleCrop = async () => {
    if (!imgRef.current) return;
    setLoading(true);

    // Run in timeout to allow UI to show loader
    setTimeout(() => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = imgRef.current!;

            if (!ctx) throw new Error('No 2d context');

            // 1. Setup High-Res Canvas
            const OUTPUT_SCALE = 2; // Higher quality output
            canvas.width = CONTAINER_WIDTH * OUTPUT_SCALE;
            canvas.height = CONTAINER_HEIGHT * OUTPUT_SCALE;

            // 2. Background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 3. Round Mask
            if (isRound) {
                ctx.beginPath();
                ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
                ctx.clip();
            }

            // 4. Transformations Matrix
            // Move origin to center of canvas
            ctx.translate(canvas.width / 2, canvas.height / 2);

            // Apply Pan (scaled to output)
            ctx.translate(offset.x * OUTPUT_SCALE, offset.y * OUTPUT_SCALE);

            // Apply Rotation
            ctx.rotate((rotation * Math.PI) / 180);

            // Apply Scale
            // Total scale = baseScale (fit to screen) * zoom (user) * outputScale (resolution)
            const totalScale = baseScale * zoom * OUTPUT_SCALE;
            ctx.scale(totalScale, totalScale);

            // Draw Image (centered at origin)
            ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

            // 5. Output
            canvas.toBlob((blob) => {
                if (blob) {
                    const newFile = new File([blob], file.name, { type: 'image/png', lastModified: Date.now() });
                    onCrop(newFile);
                } else {
                    throw new Error('Canvas blob failed');
                }
                setLoading(false);
            }, 'image/png', 0.95);

        } catch (error) {
            console.error("Crop failed", error);
            alert("Failed to crop image. Please try again.");
            setLoading(false);
        }
    }, 50);
  };

  if (!imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[95vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 z-10">
          <h3 className="font-bold text-white flex items-center gap-2">
            <ImageIcon size={18} className="text-blue-500"/>
            Adjust Image
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Viewport */}
        <div 
            className="flex-1 bg-black relative overflow-hidden flex items-center justify-center select-none"
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchEnd={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isDragging ? 'grabbing' : 'grab', minHeight: '400px' }}
        >
            {/* The Image */}
            <div 
                className="relative"
                style={{
                    width: CONTAINER_WIDTH,
                    height: CONTAINER_HEIGHT,
                    // Use flex centering for the crop box area, image moves relative to it
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                <img 
                    ref={imgRef}
                    src={imageSrc} 
                    alt="Edit" 
                    onLoad={handleImageLoad}
                    className="max-w-none transition-transform duration-75 will-change-transform"
                    style={{
                        // Apply same transforms as canvas logic
                        // Translate moves it relative to its center position
                        transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${zoom})`,
                        // Set explicit size based on baseScale to match logic
                        width: imgRef.current ? imgRef.current.naturalWidth * baseScale : 'auto',
                        height: 'auto', 
                        pointerEvents: 'none',
                        userSelect: 'none'
                    }}
                    draggable={false}
                />
            </div>

            {/* The Mask / Overlay */}
            <div className="absolute inset-0 pointer-events-none">
                <div 
                    className="w-full h-full"
                    style={{
                        background: 'rgba(0, 0, 0, 0.6)',
                        maskImage: `
                            linear-gradient(black, black), 
                            ${isRound 
                                ? `radial-gradient(circle at center, transparent ${CONTAINER_WIDTH/2}px, black ${CONTAINER_WIDTH/2 + 1}px)` 
                                : `linear-gradient(to right, black calc(50% - ${CONTAINER_WIDTH/2}px), transparent calc(50% - ${CONTAINER_WIDTH/2}px), transparent calc(50% + ${CONTAINER_WIDTH/2}px), black calc(50% + ${CONTAINER_WIDTH/2}px)), linear-gradient(to bottom, black calc(50% - ${CONTAINER_HEIGHT/2}px), transparent calc(50% - ${CONTAINER_HEIGHT/2}px), transparent calc(50% + ${CONTAINER_HEIGHT/2}px), black calc(50% + ${CONTAINER_HEIGHT/2}px))`
                            }
                        `,
                        maskComposite: 'exclude',
                        WebkitMaskComposite: 'xor'
                    }}
                ></div>
                
                {/* Border Guide */}
                <div 
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-white/50 shadow-2xl pointer-events-none ${isRound ? 'rounded-full' : 'rounded-lg'}`}
                    style={{ width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT }}
                >
                    {/* Grid */}
                    {!isRound && (
                        <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-30">
                            {[...Array(9)].map((_, i) => <div key={i} className="border-r border-b border-white last:border-0" />)}
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Hint */}
            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                <span className="text-xs font-medium text-white/50 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                    <Move size={12} className="inline mr-1"/> Drag to Pan
                </span>
            </div>
        </div>

        {/* Toolbar */}
        <div className="p-6 bg-slate-900 border-t border-slate-800 space-y-6">
            
            {/* Zoom Slider */}
            <div className="flex items-center gap-4">
                <ZoomOut size={16} className="text-slate-500" />
                <input 
                    type="range" 
                    min="0.5" 
                    max="3" 
                    step="0.05" 
                    value={zoom} 
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <ZoomIn size={16} className="text-slate-500" />
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    <button 
                        onClick={() => setRotation(r => r - 90)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex flex-col items-center gap-1 text-[10px]"
                        title="Rotate"
                    >
                        <RotateCcw size={18} />
                    </button>
                    <button 
                        onClick={reset}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex flex-col items-center gap-1 text-[10px]"
                        title="Reset"
                    >
                        <RotateCcw size={18} className="scale-x-[-1]" />
                    </button>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={onCancel}
                        className="px-5 py-2.5 rounded-xl font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleCrop}
                        disabled={loading}
                        className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <> <Loader2 size={16} className="animate-spin" /> Saving... </>
                        ) : (
                            <> Save <Check size={16} /> </>
                        )}
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
