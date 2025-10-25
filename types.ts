
export enum ItemType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
}

export interface PasteItem {
  id: string;
  type: ItemType;
  content: string; // for text or file name
  downloadUrl?: string; // for images and other files
  fileType?: string; // for other files, e.g., 'application/pdf'
}
