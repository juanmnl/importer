import type { ReactNode } from 'react';

interface LayoutProps {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
}

export function Layout({ left, center, right }: LayoutProps) {
  return (
    <div className="h-screen flex flex-col">
      {/* Titlebar drag region */}
      <div className="h-8 shrink-0 bg-neutral-850 [-webkit-app-region:drag]" />

      <div className="flex flex-1 min-h-0">
        {/* Left panel - Source */}
        <div className="w-60 shrink-0 border-r border-neutral-700 bg-neutral-850 overflow-y-auto">
          {left}
        </div>

        {/* Center panel - Thumbnails */}
        <div className="flex-1 min-w-0 overflow-y-auto bg-neutral-900">
          {center}
        </div>

        {/* Right panel - Destination + Settings */}
        <div className="w-72 shrink-0 border-l border-neutral-700 bg-neutral-850 overflow-y-auto">
          {right}
        </div>
      </div>
    </div>
  );
}
