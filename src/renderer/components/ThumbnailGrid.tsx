import { useMemo, useEffect, useCallback, useRef } from 'react';
import { useAppState, useAppDispatch } from '../context/ImportContext';
import { ThumbnailCard } from './ThumbnailCard';
import { SingleView } from './SingleView';
import { EmptyState } from './EmptyState';

export function ThumbnailGrid() {
  const { files, phase, selectedSource, focusedIndex, viewMode } = useAppState();
  const dispatch = useAppDispatch();
  const gridRef = useRef<HTMLDivElement>(null);

  const sortedFiles = useMemo(
    () => files.length > 0
      ? [...files].sort((a, b) => (b.duplicate ? 1 : 0) - (a.duplicate ? 1 : 0))
      : [],
    [files],
  );

  // Compute grid columns for arrow key navigation
  const getColumnsCount = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return 1;
    return getComputedStyle(grid).gridTemplateColumns.split(' ').length;
  }, []);

  const setFocused = useCallback((index: number) => {
    dispatch({ type: 'SET_FOCUSED', index });
  }, [dispatch]);

  const pickFile = useCallback((pick: 'selected' | 'rejected' | undefined, advance: boolean) => {
    if (focusedIndex < 0 || focusedIndex >= sortedFiles.length) return;
    const file = sortedFiles[focusedIndex];
    const newPick = file.pick === pick ? undefined : pick;
    dispatch({ type: 'SET_PICK', filePath: file.path, pick: newPick });
    if (advance && newPick !== undefined && focusedIndex < sortedFiles.length - 1) {
      setFocused(focusedIndex + 1);
    }
  }, [focusedIndex, sortedFiles, dispatch, setFocused]);

  const toggleViewMode = useCallback(() => {
    const next = viewMode === 'grid' ? 'single' : 'grid';
    dispatch({ type: 'SET_VIEW_MODE', mode: next });
    // When entering single mode, focus first file if none focused
    if (next === 'single' && focusedIndex < 0 && sortedFiles.length > 0) {
      setFocused(0);
    }
  }, [viewMode, focusedIndex, sortedFiles.length, dispatch, setFocused]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (sortedFiles.length === 0) return;

      const cols = viewMode === 'single' ? 1 : getColumnsCount();

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          setFocused(Math.min(focusedIndex + 1, sortedFiles.length - 1));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFocused(Math.max(focusedIndex - 1, 0));
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (viewMode === 'single') {
            setFocused(Math.min(focusedIndex + 1, sortedFiles.length - 1));
          } else {
            setFocused(Math.min(focusedIndex + cols, sortedFiles.length - 1));
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (viewMode === 'single') {
            setFocused(Math.max(focusedIndex - 1, 0));
          } else {
            setFocused(Math.max(focusedIndex - cols, 0));
          }
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          pickFile('selected', true);
          break;
        case 'x':
        case 'X':
          e.preventDefault();
          pickFile('rejected', true);
          break;
        case 'u':
        case 'U':
          e.preventDefault();
          pickFile(undefined, false);
          break;
        case 'Enter':
          e.preventDefault();
          toggleViewMode();
          break;
        case 'Escape':
          if (viewMode === 'single') {
            e.preventDefault();
            dispatch({ type: 'SET_VIEW_MODE', mode: 'grid' });
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [focusedIndex, sortedFiles, viewMode, getColumnsCount, setFocused, pickFile, toggleViewMode, dispatch]);

  // Scroll focused card into view (grid mode)
  useEffect(() => {
    if (viewMode !== 'grid' || focusedIndex < 0 || !gridRef.current) return;
    const card = gridRef.current.children[focusedIndex] as HTMLElement | undefined;
    card?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedIndex, viewMode]);

  if (!selectedSource) {
    return <EmptyState />;
  }

  if (phase === 'scanning' && files.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-neutral-600 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm text-neutral-400">Scanning files...</p>
      </div>
    );
  }

  if (files.length === 0 && phase !== 'scanning') {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-neutral-500">No supported files found</p>
      </div>
    );
  }

  const photoCount = files.filter((f) => f.type === 'photo').length;
  const videoCount = files.filter((f) => f.type === 'video').length;
  const thumbCount = files.filter((f) => f.thumbnail).length;
  const duplicateCount = files.filter((f) => f.duplicate).length;
  const pickedCount = files.filter((f) => f.pick === 'selected').length;
  const rejectedCount = files.filter((f) => f.pick === 'rejected').length;
  const thumbsLoading = phase === 'scanning' && files.length > 0 && thumbCount < files.length;

  // Single view mode
  if (viewMode === 'single' && focusedIndex >= 0 && focusedIndex < sortedFiles.length) {
    return (
      <div className="h-full flex flex-col">
        {/* Compact header */}
        <div className="shrink-0 px-4 py-2 flex items-center gap-3 border-b border-neutral-700/50">
          <button
            onClick={() => dispatch({ type: 'SET_VIEW_MODE', mode: 'grid' })}
            className="text-neutral-400 hover:text-neutral-200 transition-colors"
            title="Back to grid (Esc)"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2 3.75A.75.75 0 012.75 3h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 3.75zm0 4.167a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zm0 4.166a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zm0 4.167a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="flex items-center gap-2 text-[11px] text-neutral-500">
            {pickedCount > 0 && <span className="text-emerald-400">{pickedCount} picked</span>}
            {pickedCount > 0 && rejectedCount > 0 && <span>&middot;</span>}
            {rejectedCount > 0 && <span className="text-red-400">{rejectedCount} rejected</span>}
          </div>
          <div className="flex items-center gap-1 ml-auto text-[11px] text-neutral-600">
            <kbd className="px-1 py-0.5 bg-neutral-700/50 rounded text-neutral-400">P</kbd> pick
            <kbd className="px-1 py-0.5 bg-neutral-700/50 rounded text-neutral-400 ml-1">X</kbd> reject
            <kbd className="px-1 py-0.5 bg-neutral-700/50 rounded text-neutral-400 ml-1">&#8592;&#8594;</kbd> nav
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <SingleView
            file={sortedFiles[focusedIndex]}
            index={focusedIndex}
            total={sortedFiles.length}
          />
        </div>
      </div>
    );
  }

  // Grid view mode
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-sm font-medium text-neutral-300">
            {files.length} file{files.length !== 1 ? 's' : ''}
          </h2>
          <div className="flex items-center gap-2 text-[11px] text-neutral-500">
            {photoCount > 0 && <span>{photoCount} photo{photoCount !== 1 ? 's' : ''}</span>}
            {photoCount > 0 && videoCount > 0 && <span>&middot;</span>}
            {videoCount > 0 && <span>{videoCount} video{videoCount !== 1 ? 's' : ''}</span>}
            {duplicateCount > 0 && <span>&middot;</span>}
            {duplicateCount > 0 && <span className="text-yellow-500">{duplicateCount} imported</span>}
            {pickedCount > 0 && <span>&middot;</span>}
            {pickedCount > 0 && <span className="text-emerald-400">{pickedCount} picked</span>}
            {rejectedCount > 0 && <span>&middot;</span>}
            {rejectedCount > 0 && <span className="text-red-400">{rejectedCount} rejected</span>}
          </div>
          {thumbsLoading && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-neutral-600 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-[11px] text-neutral-500">loading previews {thumbCount}/{files.length}</span>
            </div>
          )}

          {/* View mode toggle */}
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => dispatch({ type: 'SET_VIEW_MODE', mode: 'grid' })}
              className={`p-1 rounded transition-colors ${viewMode === 'grid' ? 'text-neutral-200 bg-neutral-700' : 'text-neutral-500 hover:text-neutral-300'}`}
              title="Grid view"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zm0 9A2.25 2.25 0 002 13.25v2.5A2.25 2.25 0 004.25 18h2.5A2.25 2.25 0 009 15.75v-2.5A2.25 2.25 0 006.75 11h-2.5zm9-9A2.25 2.25 0 0011 4.25v2.5A2.25 2.25 0 0013.25 9h2.5A2.25 2.25 0 0018 6.75v-2.5A2.25 2.25 0 0015.75 2h-2.5zm0 9A2.25 2.25 0 0011 13.25v2.5A2.25 2.25 0 0013.25 18h2.5A2.25 2.25 0 0018 15.75v-2.5A2.25 2.25 0 0015.75 11h-2.5z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={() => {
                dispatch({ type: 'SET_VIEW_MODE', mode: 'single' });
                if (focusedIndex < 0 && sortedFiles.length > 0) setFocused(0);
              }}
              className={`p-1 rounded transition-colors ${viewMode === 'single' ? 'text-neutral-200 bg-neutral-700' : 'text-neutral-500 hover:text-neutral-300'}`}
              title="Single view (Enter)"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M1 4.75C1 3.784 1.784 3 2.75 3h14.5c.966 0 1.75.784 1.75 1.75v10.515a1.75 1.75 0 01-1.75 1.75H2.75A1.75 1.75 0 011 15.265V4.75zm1.5 0a.25.25 0 01.25-.25h14.5a.25.25 0 01.25.25v10.515a.25.25 0 01-.25.25H2.75a.25.25 0 01-.25-.25V4.75z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Keyboard hints */}
        {files.length > 0 && phase === 'ready' && focusedIndex < 0 && (
          <div className="mb-3 text-[11px] text-neutral-600">
            Click a photo or press <kbd className="px-1 py-0.5 bg-neutral-700/50 rounded text-neutral-400">&#8594;</kbd> to start culling &mdash;
            <kbd className="px-1 py-0.5 bg-neutral-700/50 rounded text-neutral-400 ml-1">P</kbd> pick
            <kbd className="px-1 py-0.5 bg-neutral-700/50 rounded text-neutral-400 ml-1">X</kbd> reject
            <kbd className="px-1 py-0.5 bg-neutral-700/50 rounded text-neutral-400 ml-1">U</kbd> unflag
            <kbd className="px-1 py-0.5 bg-neutral-700/50 rounded text-neutral-400 ml-1">Enter</kbd> single view
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        <div
          ref={gridRef}
          className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3"
        >
          {sortedFiles.map((file, i) => (
            <ThumbnailCard
              key={file.path}
              file={file}
              focused={i === focusedIndex}
              onClick={() => setFocused(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
