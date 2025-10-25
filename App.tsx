import React, { useState, useCallback, useEffect } from 'react';
import type { PasteItem } from './types';
import { ItemType } from './types';
import { generateGeminiResponse } from './services/geminiService';

import Header from './components/Header';
import PasteboardInput from './components/PasteboardInput';
import ItemCard from './components/ItemCard';

const App: React.FC = () => {
  const [items, setItems] = useState<PasteItem[]>([]);
  const [loadingAiItemId, setLoadingAiItemId] = useState<string | null>(null);
  const [aiResponses, setAiResponses] = useState<Record<string, string>>({});
  const [accessUrl, setAccessUrl] = useState<string>('');

  useEffect(() => {
    // Set initial URL to localhost as a fallback
    const { protocol, hostname, port } = window.location;
    const fallbackUrl = `${protocol}//${hostname}${port ? ':' + port : ''}`;
    setAccessUrl(fallbackUrl);

    // Fetch the local IP from our new Node.js server
    fetch('http://localhost:3001/api/ip')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (data.ip) {
          const newUrl = `${protocol}//${data.ip}${port ? ':' + port : ''}`;
          setAccessUrl(newUrl);
        }
      })
      .catch(error => {
        console.warn(
          'Could not fetch local IP from server. Sharing link will default to current hostname.',
          'Please ensure the server.js is running.',
          error
        );
      });
  }, []);

  const handleItemsAdd = useCallback((addedItems: (File | string)[]) => {
    const newPasteItems: PasteItem[] = addedItems.map((item) => {
      const id = `${Date.now()}-${Math.random()}`;
      if (typeof item === 'string') {
        return { id, type: ItemType.TEXT, content: item };
      } else {
        if (item.type.startsWith('image/')) {
          return {
            id,
            type: ItemType.IMAGE,
            content: item.name,
            dataUrl: URL.createObjectURL(item),
            fileType: item.type,
            file: item,
          };
        } else {
          return {
            id,
            type: ItemType.FILE,
            content: item.name,
            fileType: item.type,
            file: item,
          };
        }
      }
    });
    setItems((prevItems) => [...newPasteItems, ...prevItems]);
  }, []);

  const handleAiAction = useCallback(async (item: PasteItem) => {
    setLoadingAiItemId(item.id);
    setAiResponses(prev => ({...prev, [item.id]: ''})); // Clear previous response
    try {
      const response = await generateGeminiResponse(item);
      setAiResponses(prev => ({ ...prev, [item.id]: response }));
    } catch (error) {
      console.error("AI action failed", error);
      setAiResponses(prev => ({ ...prev, [item.id]: "Sorry, something went wrong." }));
    } finally {
      setLoadingAiItemId(null);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header accessUrl={accessUrl} />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-8">
          <PasteboardInput onItemsAdd={handleItemsAdd} />

          {items.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <p className="text-lg">Your pasteboard is empty.</p>
              <p>It's a blank canvas for your thoughts.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onAiAction={handleAiAction}
                  isLoading={loadingAiItemId === item.id}
                  aiResponse={aiResponses[item.id]}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-slate-500">
        <p>This pasteboard is ephemeral. Content is not saved and will disappear on refresh.</p>
      </footer>
    </div>
  );
};

export default App;
