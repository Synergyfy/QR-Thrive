import React, { useState, useRef, useCallback } from 'react';
import { X, Check, RotateCw, FlipHorizontal, FlipVertical, Sliders } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ImageEditorProps {
  imageSrc: string;
  onSave: (editedImage: string) => void;
  onCancel: () => void;
}

const FILTER_PRESETS = [
  { name: 'None', filters: {} },
  { name: 'Grayscale', filters: { grayscale: '100%' } },
  { name: 'Sepia', filters: { sepia: '80%' } },
  { name: 'High Contrast', filters: { contrast: '150%', brightness: '110%' } },
  { name: 'Warm', filters: { sepia: '30%', contrast: '110%' } },
  { name: 'Cool', filters: { hueRotate: '180deg', contrast: '120%' } },
  { name: 'Vintage', filters: { sepia: '50%', contrast: '90%', brightness: '90%' } },
  { name: 'Bright', filters: { brightness: '130%', contrast: '90%' } },
];

const ImageEditor: React.FC<ImageEditorProps> = ({
  imageSrc,
  onSave,
  onCancel,
}) => {
  const [rotate, setRotate] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getFilterStyle = () => {
    const filter = FILTER_PRESETS[selectedFilter].filters;
    return {
      filter: `${Object.entries(filter)
        .map(([key, value]) => `${key}(${value})`)
        .join(' ')}`,
    };
  };

  const getTransform = () => {
    const transforms: string[] = [];
    if (rotate) transforms.push(`rotate(${rotate}deg)`);
    if (flipH) transforms.push('scaleX(-1)');
    if (flipV) transforms.push('scaleY(-1)');
    return transforms.join(' ');
  };

  const applyEdits = useCallback(() => {
    const image = imgRef.current;
    const canvas = canvasRef.current;

    if (!image || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    ctx.filter = getFilterStyle().filter;

    ctx.save();
    if (rotate) {
      ctx.translate(image.width / 2, image.height / 2);
      ctx.rotate((rotate * Math.PI) / 180);
      ctx.translate(-image.width / 2, -image.height / 2);
    }
    if (flipH) {
      ctx.translate(image.width, 0);
      ctx.scale(-1, 1);
    }
    if (flipV) {
      ctx.translate(0, image.height);
      ctx.scale(1, -1);
    }

    ctx.drawImage(image, 0, 0);
    ctx.restore();

    const editedImage = canvas.toDataURL('image/png');
    onSave(editedImage);
  }, [rotate, flipH, flipV, selectedFilter, onSave]);

  const rotateLeft = () => setRotate(r => r - 90);
  const rotateRight = () => setRotate(r => r + 90);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">Edit Image</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="flex flex-col items-center">
            <div className="relative max-h-[50vh] flex items-center justify-center bg-gray-100 rounded-2xl p-4">
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Edit"
                style={{
                  maxHeight: '50vh',
                  transform: getTransform(),
                  ...getFilterStyle(),
                }}
                className="max-w-full"
              />
            </div>

            <div className="flex items-center gap-4 mt-4">
              <button
                onClick={rotateLeft}
                className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                title="Rotate Left"
              >
                <RotateCw className="w-5 h-5 text-gray-700 rotate-180" />
              </button>
              <button
                onClick={rotateRight}
                className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                title="Rotate Right"
              >
                <RotateCw className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={() => setFlipH(!flipH)}
                className={cn(
                  'p-3 rounded-xl transition-colors',
                  flipH ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
                title="Flip Horizontal"
              >
                <FlipHorizontal className="w-5 h-5" />
              </button>
              <button
                onClick={() => setFlipV(!flipV)}
                className={cn(
                  'p-3 rounded-xl transition-colors',
                  flipV ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
                title="Flip Vertical"
              >
                <FlipVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Sliders className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-bold text-gray-700">Filters</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {FILTER_PRESETS.map((preset, index) => (
                <button
                  key={preset.name}
                  onClick={() => setSelectedFilter(index)}
                  className={cn(
                    'relative aspect-square rounded-xl overflow-hidden border-2 transition-all',
                    selectedFilter === index
                      ? 'border-blue-600 ring-2 ring-blue-100'
                      : 'border-transparent hover:border-gray-200'
                  )}
                >
                  <img
                    src={imageSrc}
                    alt={preset.name}
                    style={{ filter: Object.values(preset.filters).join(' ') }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs font-bold py-1 text-center">
                    {preset.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={applyEdits}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
          >
            <Check className="w-4 h-4" />
            Apply
          </button>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default ImageEditor;
