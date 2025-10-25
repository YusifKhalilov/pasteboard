import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { PasteItem } from './types';
import { ItemType } from './types';
import { generateGeminiResponse } from './services/geminiService';
import { v4 as uuidv4 } from 'uuid';

import Header from './components/Header';
import PasteboardInput from './components/PasteboardInput';
import ItemCard from './components/ItemCard';

const isSecure = window.location.protocol === 'https:';
const wsProtocol = isSecure ? 'wss' : 'ws';
const httpProtocol = isSecure ? 'https' : 'http';
const SERVER_PORT = 3001;
const SERVER_HOST = window.location.hostname;

const SERVER_URL = `${wsProtocol}://${SERVER_HOST}:${SERVER_PORT}`;
const API_URL = `${httpProtocol}://${SERVER_HOST}:${SERVER_PORT}`;

const App: React.FC = () => {
  const [items, setItems] = useState<PasteItem[]>([]);
  const [serverAddress, setServerAddress] = useState<string>('');
  const [loadingAiItemId, setLoadingAiItemId] = useState<string | null>(null);
  const [aiResponses, setAiResponses] = useState<Record<string, string>>({});
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Function to connect to WebSocket
    const connect = () => {
      try {
        ws.current = new WebSocket(SERVER_URL);

        ws.current.onopen = () => {
          console.log('WebSocket connected');
        };

        ws.current.onmessage = (event) => {
          const message = JSON.parse(event.data);
          if (message.type === 'INIT') {
            setItems(message.payload.items);
            setServerAddress(message.payload.serverIp);
          } else if (message.type === 'ADD_ITEM') {
            setItems((prevItems) => {
              // Avoid adding duplicates from the sender's own broadcast
              if (prevItems.some(item => item.id === message.payload.id)) {
                return prevItems;
              }
              return [message.payload, ...prevItems];
            });
          } else if (message.type === 'DELETE_ITEM') {
            setItems((prevItems) => 
              prevItems.filter(item => item.id !== message.payload.id)
            );
          } else if (message.type === 'RESET_ITEMS') {
            setItems([]);
            setAiResponses({});
          }
        };

        ws.current.onclose = () => {
          console.log('WebSocket disconnected. Attempting to reconnect...');
          // Simple reconnection logic
          setTimeout(() => {
            connect();
          }, 3000);
        };

        ws.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          // The browser will fire the onclose event automatically after an error,
          // which will trigger our reconnection logic.
        };
      } catch (error) {
        console.error("Failed to create WebSocket connection. Real-time features may be disabled.", error);
      }
    }

    connect();

    // Cleanup on component unmount
    return () => {
      if (ws.current) {
        // When the component unmounts, we prevent the `onclose` handler from
        // triggering a reconnection attempt. In React's Strict Mode, the
        // component will be mounted, unmounted, and remounted, which can
        // cause a connection to be closed immediately after it's opened.
        // Nullifying the handlers prevents errors and logs from this process.
        ws.current.onopen = null;
        ws.current.onmessage = null;
        ws.current.onerror = null;
        ws.current.onclose = null;
        ws.current.close();
      }
    };
  }, []);

  const handleItemsAdd = useCallback(async (addedItems: (File | string)[]) => {
    for (const item of addedItems) {
      const id = uuidv4();
      let newItem: PasteItem;

      if (typeof item === 'string') {
        newItem = { id, type: ItemType.TEXT, content: item };
      } else {
        const formData = new FormData();
        formData.append('file', item);
        try {
          const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) throw new Error('File upload failed');
          
          const { downloadUrl } = await response.json();

          if (item.type.startsWith('image/')) {
            newItem = {
              id,
              type: ItemType.IMAGE,
              content: item.name,
              downloadUrl: downloadUrl,
              fileType: item.type,
              file: item, // Keep local file object for AI processing
            };
          } else {
            newItem = {
              id,
              type: ItemType.FILE,
              content: item.name,
              downloadUrl: downloadUrl,
              fileType: item.type,
              file: item,
            };
          }
        } catch (error) {
          console.error('Error uploading file:', error);
          alert(`Failed to upload file: ${item.name}`);
          continue; // Skip this item
        }
      }
      
      // Optimistically update local state for instant feedback
      setItems((prevItems) => [newItem, ...prevItems]);

      // Send to WebSocket server for broadcast
      if (ws.current?.readyState === WebSocket.OPEN) {
        // We don't send the file object over the network
        const { file, ...payload } = newItem;
        ws.current.send(JSON.stringify({ type: 'ADD_ITEM', payload }));
      }
    }
  }, []);

  const handleItemDelete = useCallback((id: string) => {
    const itemToDelete = items.find(item => item.id === id);

    // Optimistically remove from local state
    setItems(prevItems => prevItems.filter(item => item.id !== id));
    
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ 
        type: 'DELETE_ITEM', 
        payload: { 
          id, 
          // Send downloadUrl so server knows which file to delete from disk
          downloadUrl: itemToDelete?.downloadUrl 
        } 
      }));
    }
  }, [items]);

  const handleAiAction = useCallback(async (item: PasteItem) => {
    if (!item.file && item.type === ItemType.IMAGE) {
        alert("AI analysis for images is only available on the device that uploaded them.");
        return;
    }
    setLoadingAiItemId(item.id);
    setAiResponses(prev => ({...prev, [item.id]: ''}));
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

  const handleReset = useCallback(() => {
    if (window.confirm('Are you sure you want to delete all items? This action cannot be undone.')) {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'RESET_ITEMS' }));
        }
    }
  }, []);


  return (
    <div className="min-h-screen flex flex-col">
      <Header serverAddress={serverAddress} onReset={handleReset} />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-8">
          <PasteboardInput onItemsAdd={handleItemsAdd} />

          {items.length === 0 ? (
            <div className="text-center py-16 text-[#A8C5B3]">
              <p className="text-lg">Your pasteboard is empty.</p>
              <p>It's a blank canvas for your thoughts.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onAiAction={handleAiAction}
                  onItemDelete={handleItemDelete}
                  isLoading={loadingAiItemId === item.id}
                  aiResponse={aiResponses[item.id]}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-[#A8C5B3]/70">
        <p>This pasteboard is ephemeral. Content is stored in server memory and will be lost on server restart.</p>
      </footer>
    </div>
  );
};

export default App;