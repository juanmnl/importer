import { useState, useEffect, useRef, useCallback } from 'react';
import type { MediaFile } from '../../shared/types';

interface SingleViewProps {
  file: MediaFile;
  index: number;
  total: number;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.008;

function fmtAperture(v: number): string {
  return v % 1 === 0 ? `f/${v}` : `f/${v.toFixed(1)}`;
}

function fmtShutter(v: number): string {
  return v < 1 ? `1/${Math.round(1 / v)}s` : `${v}s`;
}

function fmtFocal(v: number): string {
  return `${Math.round(v)}mm`;
}

function buildExposure(file: MediaFile): string | null {
  const parts: string[] = [];
  if (file.aperture != null) parts.push(fmtAperture(file.aperture));
  if (file.shutterSpeed != null) parts.push(fmtShutter(file.shutterSpeed));
  if (file.iso != null) parts.push(`ISO ${file.iso}`);
  if (file.focalLength != null) parts.push(fmtFocal(file.focalLength));
  return parts.length > 0 ? parts.join(' \u00b7 ') : null;
}

export function SingleView({ file, index, total }: SingleViewProps) {
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const isPicked = file.pick === 'selected';
  const isRejected = file.pick === 'rejected';

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset zoom/pan when file changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [file.path]);

  useEffect(() => {
    let cancelled = false;
    setPreview(undefined);
    setLoading(true);

    window.electronAPI.getPreview(file.path).then((result) => {
      if (!cancelled) {
        setPreview(result);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [file.path]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => {
      // Exponential zoom: constant scroll feels uniform at any zoom level
      const factor = Math.exp(-e.deltaY * ZOOM_STEP);
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * factor));
      if (next < 1.02) { setPan({ x: 0, y: 0 }); return 1; }
      return next;
    });
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (zoom <= 1) return;
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [zoom]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (zoom > 1) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      setZoom(2);
    }
  }, [zoom]);

  const imageSrc = preview || file.thumbnail;
  const isZoomed = zoom > 1;
  const exposure = buildExposure(file);
  const cameraName = file.cameraModel || null;

  return (
    <div
      ref={containerRef}
      className="h-full flex items-center justify-center bg-neutral-100 dark:bg-black relative overflow-hidden"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      style={{ cursor: isZoomed ? (isDragging.current ? 'grabbing' : 'grab') : 'default' }}
    >
      <div
        className={`relative max-h-full max-w-full ${isRejected ? 'opacity-40' : ''}`}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isDragging.current ? 'none' : 'transform 0.15s ease-out',
        }}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={file.name}
            className="max-h-[calc(100vh-6rem)] max-w-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="text-text-muted text-sm">No preview</div>
        )}

        {/* Viewfinder corner ticks */}
        {imageSrc && (
          <div className="absolute inset-0 pointer-events-none z-[5]">
            <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t border-l border-white/25" />
            <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t border-r border-white/25" />
            <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b border-l border-white/25" />
            <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b border-r border-white/25" />
          </div>
        )}

        {isPicked && imageSrc && (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute top-2 left-2 w-5 h-5 border-t-[2px] border-l-[2px] border-yellow-400/80" />
            <div className="absolute top-2 right-2 w-5 h-5 border-t-[2px] border-r-[2px] border-yellow-400/80" />
            <div className="absolute bottom-2 left-2 w-5 h-5 border-b-[2px] border-l-[2px] border-yellow-400/80" />
            <div className="absolute bottom-2 right-2 w-5 h-5 border-b-[2px] border-r-[2px] border-yellow-400/80" />
          </div>
        )}

        {isRejected && imageSrc && (
          <div className="absolute top-2 right-2 pointer-events-none z-10">
            <svg className="w-6 h-6" viewBox="0 0 16 16">
              <line x1="3" y1="3" x2="13" y2="13" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8" />
              <line x1="13" y1="3" x2="3" y2="13" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8" />
            </svg>
          </div>
        )}
      </div>

      {loading && file.thumbnail && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <div className="w-3 h-3 border-[1.5px] border-text-muted border-t-text rounded-full animate-spin" />
        </div>
      )}

      {/* Metadata HUD — hidden when zoomed */}
      {!isZoomed && (exposure || cameraName) && (
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between pointer-events-none z-[5]">
          {exposure && (
            <span className="text-[9px] font-mono text-text-muted bg-black/30 dark:bg-black/50 px-1.5 py-0.5 rounded">
              {exposure}
            </span>
          )}
          {cameraName && (
            <span className="text-[9px] font-mono text-text-muted bg-black/30 dark:bg-black/50 px-1.5 py-0.5 rounded ml-auto">
              {cameraName}
            </span>
          )}
        </div>
      )}

      {/* Zoom indicator */}
      {isZoomed && (
        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-mono px-1.5 py-0.5 rounded z-20">
          {Math.round(zoom * 100)}%
        </div>
      )}
    </div>
  );
}
