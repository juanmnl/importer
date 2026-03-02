export function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 px-8">
      <svg className="w-16 h-16 text-text-faint" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
        <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 01-3 3H4.5a3 3 0 01-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 001.11-.71l.822-1.315a2.942 2.942 0 012.332-1.39zM6.75 12.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0zm12-2.625a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H19.5a.75.75 0 01-.75-.75v-.008z" clipRule="evenodd" />
      </svg>
      <div className="text-center">
        <p className="text-sm text-text-secondary font-medium">No source selected</p>
        <p className="text-xs text-text-muted mt-1">
          Connect a camera or SD card, or choose a folder
        </p>
      </div>
    </div>
  );
}
