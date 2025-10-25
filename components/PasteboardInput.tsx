import React, { useState, useCallback, useRef } from 'react';

interface PasteboardInputProps {
  onItemsAdd: (items: (File | string)[]) => void;
}

const PasteboardInput: React.FC<PasteboardInputProps> = ({ onItemsAdd }) => {
  const [text, setText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextSubmit = useCallback(() => {
    if (text.trim()) {
      onItemsAdd([text.trim()]);
      setText('');
    }
  }, [text, onItemsAdd]);

  const handlePaste = useCallback((event: React.ClipboardEvent) => {
    const items = event.clipboardData.items;
    const addedItems: (File | string)[] = [];
    
    const textData = event.clipboardData.getData('text/plain');
    if (textData) {
      addedItems.push(textData);
    }
    
    // FIX: Iterate using a for loop to avoid type inference issues with DataTransferItemList.
    // `Array.from(event.clipboardData.items).forEach` was inferring `item` as `unknown`.
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          addedItems.push(file);
        }
      }
    }

    if(addedItems.length > 0) {
        onItemsAdd(addedItems);
        // prevent pasting into the text area if we handled it
        event.preventDefault();
    }
  }, [onItemsAdd]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      onItemsAdd(Array.from(event.dataTransfer.files));
    }
  }, [onItemsAdd]);

  const handleDragEvents = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === 'dragenter' || event.type === 'dragover') {
      setIsDragging(true);
    } else if (event.type === 'dragleave') {
      setIsDragging(false);
    }
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleTextSubmit();
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragEnter={handleDragEvents}
      onDragOver={handleDragEvents}
      onDragLeave={handleDragEvents}
      className={`relative border-2 border-dashed rounded-2xl p-4 transition-all duration-300 ${
        isDragging ? 'border-indigo-500 bg-indigo-950/50' : 'border-slate-600 hover:border-slate-500'
      }`}
    >
      <textarea
        ref={textAreaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        placeholder="Drop files, paste content, or type here and press Enter..."
        className="w-full h-24 p-2 bg-transparent rounded-lg resize-none focus:outline-none focus:ring-0 text-slate-200 placeholder:text-slate-500"
      />
       {isDragging && (
        <div className="absolute inset-0 bg-indigo-900/50 rounded-2xl flex items-center justify-center pointer-events-none">
          <p className="text-indigo-400 font-semibold">Drop to add</p>
        </div>
      )}
    </div>
  );
};

export default PasteboardInput;
