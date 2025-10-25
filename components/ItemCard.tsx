import React, { useState } from 'react';
import type { PasteItem } from '../types';
import { ItemType } from '../types';
import { FileIcon, SparklesIcon, ClipboardIcon, CheckIcon, DownloadIcon } from './Icons';

interface ItemCardProps {
  item: PasteItem;
  onAiAction: (item: PasteItem) => void;
  isLoading: boolean;
  aiResponse?: string;
}

const AiResponseDisplay: React.FC<{ response: string }> = ({ response }) => (
    <div className="mt-3 pt-3 border-t border-slate-700">
        <p className="text-sm text-indigo-300 whitespace-pre-wrap font-sans">{response}</p>
    </div>
);


const ItemCard: React.FC<ItemCardProps> = ({ item, onAiAction, isLoading, aiResponse }) => {
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
    setTimeout(() => setIsDownloading(false), 2500);
  };

  const renderContent = () => {
    switch (item.type) {
      case ItemType.TEXT:
        return (
          <p className="text-slate-300 whitespace-pre-wrap break-words font-mono text-sm">
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
          <div className="flex items-center gap-3 p-2 bg-slate-700/50 rounded-lg">
            <FileIcon className="w-8 h-8 text-slate-400 flex-shrink-0" />
            <div className='flex-grow truncate'>
              <p className="font-semibold text-slate-200 truncate">{item.content}</p>
              <p className="text-xs text-slate-400">{item.fileType}</p>
            </div>
            {item.downloadUrl && (
                <a
                    href={item.downloadUrl}
                    download={item.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleDownloadClick}
                    className="flex-shrink-0 p-2 rounded-full text-slate-400 hover:bg-slate-600 hover:text-slate-100 transition-colors"
                    aria-label="Download file"
                >
                    {isDownloading ? (
                         <svg className="animate-spin h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <DownloadIcon className="w-5 h-5" />
                    )}
                </a>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const canUseAi = process.env.API_KEY && (item.type === ItemType.TEXT || (item.type === ItemType.IMAGE && !!item.file));

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm p-4 rounded-xl border border-slate-700/80 flex flex-col w-full">
      <div className="flex-grow mb-4">{renderContent()}</div>
      
      <div className="mt-auto space-y-3">
        <div className="flex items-center gap-2">
            {item.type === ItemType.TEXT && (
                <button
                    onClick={handleCopy}
                    className={`flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-md transition-colors duration-200 ${
                        copied 
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
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
            {item.type === ItemType.IMAGE && item.downloadUrl && (
                <a
                    href={item.downloadUrl}
                    download={item.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-md transition-colors duration-200 bg-slate-700 text-slate-300 hover:bg-slate-600"
                >
                    <DownloadIcon className="w-4 h-4" />
                    Download
                </a>
            )}
        </div>

        {(canUseAi || aiResponse) && (
            <div className="pt-3 border-t border-slate-700">
                {canUseAi && (
                    <button
                        onClick={() => onAiAction(item)}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-indigo-400 bg-indigo-500/20 rounded-md hover:bg-indigo-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Thinking...
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="w-4 h-4" />
                                {item.type === ItemType.TEXT ? 'Summarize with AI' : 'Describe with AI'}
                            </>
                        )}
                    </button>
                )}
                {aiResponse && !isLoading && <AiResponseDisplay response={aiResponse} />}
            </div>
        )}
      </div>
    </div>
  );
};

export default ItemCard;