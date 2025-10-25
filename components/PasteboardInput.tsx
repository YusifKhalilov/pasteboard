import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TextIcon, UploadIcon } from './Icons';

interface PasteboardInputProps {
  onItemsAdd: (items: (File | string)[]) => void;
}

const PasteboardInput: React.FC<PasteboardInputProps> = ({ onItemsAdd }) => {
  const [text, setText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<'choice' | 'text'>('choice');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'text' && textAreaRef.current) {
        textAreaRef.current.focus();
    }
  }, [mode]);

  const handleTextSubmit = useCallback(() => {
    if (text.trim()) {
      onItemsAdd([text.trim()]);
      setText('');
      setMode('choice');
    }
  }, [text, onItemsAdd]);
  
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
        onItemsAdd(Array.from(event.target.files));
    }
    // Reset file input to allow selecting the same file again
    if(event.target) {
        event.target.value = '';
    }
  }, [onItemsAdd]);

  // Fix: Rewrote handlePaste to be more explicit and type-safe.
  const handlePaste = useCallback((event: React.ClipboardEvent) => {
    const files = Array.from(event.clipboardData.files);
    
    // In text mode, if there are no files, we let the default paste-into-textarea behavior happen.
    if (mode === 'text' && files.length === 0) {
      return; 
    }

    const addedItems: (File | string)[] = [];
    const textData = event.clipboardData.getData('text/plain');

    if (files.length > 0) {
      addedItems.push(...files);
    }
    if (textData) {
      addedItems.push(textData);
    }
    
    if (addedItems.length > 0) {
      onItemsAdd(addedItems);
      event.preventDefault();
    }
  }, [onItemsAdd, mode]);

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
    if (event.key === 'Escape') {
        setMode('choice');
        setText('');
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragEnter={handleDragEvents}
      onDragOver={handleDragEvents}
      onDragLeave={handleDragEvents}
      onPaste={handlePaste}
      className={`relative bg-[#0F2D27]/50 rounded-2xl p-4 transition-all duration-300 min-h-[144px] flex flex-col justify-center items-center ${
        isDragging ? 'bg-[#FF6B6B]/30' : 'hover:bg-[#0F2D27]/80'
      }`}
    >
        <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            aria-hidden="true"
        />

        {mode === 'choice' && (
            <div className="text-center">
                 <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={() => setMode('text')}
                        className="flex items-center justify-center gap-3 w-48 px-4 py-3 bg-[#0F3830] text-[#F0EAD6] font-semibold rounded-lg hover:bg-[#1a4a40] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A1D1A] focus:ring-[#4ECDC4]"
                        aria-label="Add text"
                    >
                        <TextIcon className="w-5 h-5" />
                        <span>Add Text</span>
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-3 w-48 px-4 py-3 bg-[#FF6B6B] text-black font-bold rounded-lg hover:bg-[#E55A5A] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A1D1A] focus:ring-[#FFD166]"
                        aria-label="Upload a file"
                    >
                        <UploadIcon className="w-5 h-5" />
                        <span>Upload File</span>
                    </button>
                </div>
                <p className="text-[#A8C5B3] text-sm mt-4">Or drop files, or paste anything.</p>
            </div>
        )}

        {mode === 'text' && (
             <div className="w-full h-full flex flex-col">
                <textarea
                    ref={textAreaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type here and press Enter to submit..."
                    className="w-full flex-grow p-2 bg-transparent rounded-lg resize-none focus:outline-none focus:ring-0 text-[#F0EAD6] placeholder:text-[#A8C5B3] min-h-[80px]"
                    aria-label="Text input"
                />
                <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => { setMode('choice'); setText(''); }} className="px-3 py-1 text-sm font-semibold text-[#F0EAD6] bg-[#0F3830] rounded-md hover:bg-[#1a4a40]">Cancel</button>
                    <button onClick={handleTextSubmit} className="px-3 py-1 text-sm font-semibold text-black font-bold bg-[#FF6B6B] rounded-md hover:bg-[#E55A5A] disabled:opacity-50" disabled={!text.trim()}>Submit</button>
                </div>
            </div>
        )}

       {isDragging && (
        <div className="absolute inset-0 bg-[#FF6B6B]/50 rounded-2xl flex items-center justify-center pointer-events-none z-10">
          <p className="text-white font-semibold text-lg">Drop to add</p>
        </div>
      )}
    </div>
  );
};

export default PasteboardInput;