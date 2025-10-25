import React, { useState, useCallback, useEffect } from 'react';
import type { PasteItem } from './types';
import { ItemType } from './types';
import { generateGeminiResponse } from './services/geminiService';

import Header from './components/Header';
import PasteboardInput from './components/PasteboardInput';
import ItemCard from './components/ItemCard';


const getLocalIP = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    // NOTE: This is a trick to get the local IP address using WebRTC.
    // It might not work in all browsers or network configurations,
    // especially with increased browser privacy features.
    
    const RTCPeerConnection = window.RTCPeerConnection || (window as any).mozRTCPeerConnection || (window as any).webkitRTCPeerConnection;
    if (!RTCPeerConnection) {
        reject(new Error('WebRTC not supported by this browser.'));
        return;
    }

    const pc = new RTCPeerConnection({ iceServers: [] });
    let ipResolved = false;

    const resolveOnce = (ip: string) => {
      if (!ipResolved) {
        ipResolved = true;
        pc.close();
        resolve(ip);
      }
    };

    pc.onicecandidate = (ice) => {
      if (ipResolved || !ice || !ice.candidate || !ice.candidate.candidate) {
        return;
      }
      
      const candidateStr = ice.candidate.candidate;
      
      // Regex for private IPv4 addresses, which is what we want for LAN access.
      // This is more specific than a generic IPv4 regex and avoids other candidates.
      const ipRegex = /(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})/;
      const match = ipRegex.exec(candidateStr);

      if (match && match[0]) {
        resolveOnce(match[0]);
      }
    };
    
    // Create a bogus data channel to trigger ICE candidate gathering.
    pc.createDataChannel('');
    
    // Create an offer.
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .catch(err => reject(err));

    // Fallback timeout in case we can't find an IP.
    setTimeout(() => {
        if (!ipResolved) {
            pc.close();
            reject(new Error('Timeout: Could not find local IP address via WebRTC. This can happen due to browser privacy settings or network configuration.'));
        }
    }, 1500);
  });
};


const App: React.FC = () => {
  const [items, setItems] = useState<PasteItem[]>([]);
  const [loadingAiItemId, setLoadingAiItemId] = useState<string | null>(null);
  const [aiResponses, setAiResponses] = useState<Record<string, string>>({});
  const [accessUrl, setAccessUrl] = useState('');

  useEffect(() => {
    getLocalIP()
      .then(ip => {
        const port = window.location.port;
        setAccessUrl(port ? `${ip}:${port}` : ip);
      })
      .catch(error => {
        console.warn("Could not determine local IP. Falling back to hostname.", error);
        setAccessUrl(window.location.host);
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
