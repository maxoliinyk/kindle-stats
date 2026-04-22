import { useState, useCallback } from 'react';
import { useAppearance } from '../hooks/useAppearance';

interface DropZoneProps {
  onDrop: (items: DataTransferItemList) => void;
}

function KindleBookGlyph() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 18c4-3 10-4 16-4s12 1 16 4v40c-4-3-10-4-16-4s-12 1-16 4z" />
      <path d="M60 18c-4-3-10-4-16-4s-12 1-16 4v40c4-3 10-4 16-4s12 1 16 4z" />
      <path d="M28 18v40" />
    </svg>
  );
}

export function DropZone({ onDrop }: DropZoneProps) {
  const { skin } = useAppearance();
  const [dragging, setDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (e.dataTransfer.items.length > 0) {
      onDrop(e.dataTransfer.items);
    }
  }, [onDrop]);

  return (
    <div className="drop-zone-overlay">
      <div
        className={`drop-zone ${dragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {skin === 'kindle' ? (
          <div className="drop-zone-glyph"><KindleBookGlyph /></div>
        ) : (
          <div className="drop-zone-icon">📚</div>
        )}
        <h2>{skin === 'kindle' ? 'Import your Kindle data' : 'Drop Your Kindle Folder'}</h2>
        <p>
          {skin === 'kindle' ? (
            <>Drag the <strong>Kindle</strong> folder from your Amazon data export onto this page.</>
          ) : (
            <>Drag and drop the <strong>Kindle</strong> folder from your Amazon data export to see your reading stats.</>
          )}
        </p>
        <p className="hint">
          {skin === 'kindle'
            ? 'Your data stays on your device. Nothing is uploaded.'
            : 'The folder should contain subfolders like Kindle.ReadingInsights, Kindle.Devices.ReadingSession, etc.'}
        </p>
      </div>
    </div>
  );
}
