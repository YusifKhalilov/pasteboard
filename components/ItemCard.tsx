import React from 'react';
import type { PasteItem } from '../types';
import { ItemType } from '../types';
import { FileIcon, SparklesIcon } from './Icons';

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
            src={item.dataUrl}
            alt={item.content}
            className="rounded-lg object-contain max-h-96 w-full"
          />
        );
      case ItemType.FILE:
        return (
          <div className="flex items-center gap-3 p-2 bg-slate-700 rounded-lg">
            <FileIcon className="w-8 h-8 text-slate-400 flex-shrink-0" />
            <div className='truncate'>
              <p className="font-semibold text-slate-200 truncate">{item.content}</p>
              <p className="text-xs text-slate-400">{item.fileType}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const canUseAi = process.env.API_KEY && (item.type === ItemType.TEXT || item.type === ItemType.IMAGE);

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm p-4 rounded-xl border border-slate-700/80 transition-colors w-full">
      <div className="flex flex-col h-full">
        <div className="flex-grow">{renderContent()}</div>
        
        {(canUseAi || aiResponse) && (
            <div className="mt-4 pt-4 border-t border-slate-700">
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