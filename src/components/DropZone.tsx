import { useState, useCallback } from 'react';

interface DropZoneProps {
  onDrop: (items: DataTransferItemList) => void;
}

export function DropZone({ onDrop }: DropZoneProps) {
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
        <div className="drop-zone-icon">📚</div>
        <h2>Drop Your Kindle Folder</h2>
        <p>
          Drag and drop the <strong>Kindle</strong> folder from your
          Amazon data export to see your reading stats.
        </p>
        <p className="hint">
          The folder should contain subfolders like Kindle.ReadingInsights,
          Kindle.Devices.ReadingSession, etc.
        </p>
      </div>
    </div>
  );
}
