
export enum ItemType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
}

export interface PasteItem {
  id: string;
  type: ItemType;
  content: string; // for text or file name
  dataUrl?: string; // for images
  fileType?: string; // for other files, e.g., 'application/pdf'
  file?: File; // Keep the original file object for AI processing
}
