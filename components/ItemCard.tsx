import React, { useState } from 'react';
import type { PasteItem } from '../types';
import { ItemType } from '../types';
import { FileIcon, ClipboardIcon, CheckIcon, DownloadIcon, TrashIcon } from './Icons';

interface ItemCardProps {
  item: PasteItem;
  onItemDelete: (id: string) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onItemDelete }) => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleCopy = () => {
      if (item.type !== ItemType.TEXT) return;
      navigator.clipboard.writeText(item.content).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
          console.error('Failed to copy text: ', err);
          alert('Failed to copy text.');
      });
  };
  
  const handleDownloadClick = () => {
    setIsDownloading(true);
    setTimeout(() => setIsDownloading(false), 3000);
  };

  const renderContent = () => {
    switch (item.type) {
      case ItemType.TEXT:
        return (
          <p className="text-[#F0EAD6] whitespace-pre-wrap break-words font-mono text-sm">
            {item.content}
          </p>
        );
      case ItemType.IMAGE:
        return (
          <img
            src={item.downloadUrl}
            alt={item.content}
            className="rounded-lg object-contain max-h-96 w-full"
          />
        );
      case ItemType.FILE:
        return (
          <div className="flex items-center gap-4">
            <FileIcon className="w-10 h-10 text-[#4ECDC4] flex-shrink-0" />
            <div className='flex-grow truncate min-w-0'>
              <p className="font-semibold text-[#F0EAD6] truncate">{item.content}</p>
              <p className="text-xs text-[#A8C5B3]">{item.fileType}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative bg-[#0F2D27]/70 backdrop-blur-sm p-4 rounded-xl flex flex-col w-full">
       <button 
        onClick={() => onItemDelete(item.id)}
        className="absolute top-1.5 right-1.5 p-1.5 rounded-full text-[#A8C5B3] bg-[#0F2D27]/50 hover:bg-[#FF6B6B] hover:text-white transition-colors z-10"
        aria-label="Delete item"
      >
        <TrashIcon className="w-4 h-4" />
      </button>

      <div className="flex-grow mb-3">{renderContent()}</div>
      
      <div className="mt-auto">
        <div className="flex items-center gap-2">
            {item.type === ItemType.TEXT && (
                <button
                    onClick={handleCopy}
                    className={`flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-md transition-colors duration-200 ${
                        copied 
                        ? 'bg-[#4ECDC4]/20 text-[#4ECDC4]'
                        : 'bg-[#0F3830] text-[#F0EAD6] hover:bg-[#1a4a40]'
                    }`}
                >
                    {copied ? (
                        <>
                            <CheckIcon className="w-4 h-4" />
                            Copied
                        </>
                    ) : (
                        <>
                            <ClipboardIcon className="w-4 h-4" />
                            Copy
                        </>
                    )}
                </button>
            )}
             {(item.type === ItemType.IMAGE || item.type === ItemType.FILE) && item.downloadUrl && (
                <a
                    href={item.downloadUrl}
                    download={item.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleDownloadClick}
                    className={`flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-md transition-colors duration-200 ${
                        isDownloading
                        ? 'bg-[#FFD166]/20 text-[#FFD166] cursor-wait'
                        : 'bg-[#0F3830] text-[#F0EAD6] hover:bg-[#1a4a40]'
                    }`}
                >
                    {isDownloading ? (
                        <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Downloading...</span>
                        </>
                    ) : (
                         <>
                            <DownloadIcon className="w-4 h-4" />
                            <span>Download</span>
                         </>
                    )}
                </a>
            )}
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
