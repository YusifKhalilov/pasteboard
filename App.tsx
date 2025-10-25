
import React, { useState, useCallback, useEffect } from 'react';
import type { PasteItem } from './types';
import { ItemType } from './types';
import { generateGeminiResponse } from './services/geminiService';

import Header from './components/Header';
import PasteboardInput from './components/PasteboardInput';
import ItemCard from './components/ItemCard';


const getLocalIP = (): Promise<string> => {
  console.log("getLocalIP: Attempting to find local IP or hostname via WebRTC...");
  return new Promise((resolve, reject) => {
    const RTCPeerConnection = window.RTCPeerConnection || (window as any).mozRTCPeerConnection || (window as any).webkitRTCPeerConnection;
    if (!RTCPeerConnection) {
        console.error("getLocalIP: WebRTC is not supported by this browser.");
        reject(new Error('WebRTC not supported by this browser.'));
        return;
    }
    console.log("getLocalIP: RTCPeerConnection is available.");

    const pc = new RTCPeerConnection({ iceServers: [] });
    let candidateFound = false;

    const resolveOnce = (ip: string) => {
      if (!candidateFound) {
        console.log(`getLocalIP: Found usable local network address: ${ip}`);
        candidateFound = true;
        pc.close();
        resolve(ip);
      }
    };

    pc.onicecandidate = (ice) => {
      if (candidateFound) {
        return;
      }
      if (!ice || !ice.candidate || !ice.candidate.candidate) {
        if (ice && !ice.candidate) {
            console.log("getLocalIP: onicecandidate gathering complete.");
        }
        return;
      }
      
      const candidateStr = ice.candidate.candidate;
      console.log(`getLocalIP: onicecandidate found a candidate: ${candidateStr}`);
      
      // Regex for private IPv4 addresses.
      const ipRegex = /(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})/;
      const ipMatch = ipRegex.exec(candidateStr);

      if (ipMatch && ipMatch[0]) {
        console.log(`getLocalIP: Matched private IP address: ${ipMatch[0]}`);
        resolveOnce(ipMatch[0]);
        return;
      }

      // Fallback regex for mDNS hostnames, used by modern browsers for privacy.
      const mdnsRegex = /([a-f0-9\-]+\.local)/;
      const mdnsMatch = mdnsRegex.exec(candidateStr);

      if (mdnsMatch && mdnsMatch[0]) {
        console.log(`getLocalIP: Matched mDNS hostname: ${mdnsMatch[0]}`);
        resolveOnce(mdnsMatch[0]);
        return;
      }
      
      console.log("getLocalIP: Candidate was not a usable private IP or mDNS hostname.");
    };
    
    pc.createDataChannel('');
    console.log("getLocalIP: Created data channel to trigger ICE gathering.");
    
    pc.createOffer()
      .then(offer => {
        console.log("getLocalIP: Created offer, setting local description.");
        return pc.setLocalDescription(offer);
      })
      .catch(err => {
        console.error("getLocalIP: Error creating offer or setting local description:", err);
        reject(err)
      });

    setTimeout(() => {
        if (!candidateFound) {
            console.warn("getLocalIP: Timeout reached. Could not find a suitable local network address.");
            pc.close();
            reject(new Error('Timeout: Could not find local IP or hostname via WebRTC.'));
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
      .then(ipOrHost => {
        const port = window.location.port;
        const protocol = window.location.protocol;
        const url = port ? `${protocol}//${ipOrHost}:${port}` : `${protocol}//${ipOrHost}`;
        console.log(`App.useEffect: Setting access URL to: ${url}`);
        setAccessUrl(url);
      })
      .catch(error => {
        console.warn("App.useEffect: Could not determine local IP/hostname. Falling back to window.location.host.", error);
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
