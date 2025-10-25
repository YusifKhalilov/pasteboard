
import { GoogleGenAI } from "@google/genai";
import type { PasteItem } from '../types';
import { ItemType } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key not found. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const generateGeminiResponse = async (item: PasteItem): Promise<string> => {
  if (!API_KEY) {
    return "API key not configured. Please set up your environment.";
  }

  try {
    if (item.type === ItemType.TEXT) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Summarize the following text in a concise and clear manner:\n\n---\n${item.content}\n---`,
        config: {
          temperature: 0.3,
          topP: 0.9,
        }
      });
      return response.text;
    } else if (item.type === ItemType.IMAGE && item.file) {
      const imagePart = await fileToGenerativePart(item.file);
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, {text: "Describe this image in detail."}] },
      });
      return response.text;
    } else {
      return "AI analysis is not supported for this item type.";
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        return `An error occurred while contacting the AI: ${error.message}`;
    }
    return "An unknown error occurred while contacting the AI.";
  }
};
