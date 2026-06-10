export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  language?: string;
  content?: string;
  children?: FileNode[];
  isOpen?: boolean;
}

export interface EditorTab {
  id: string;
  fileId: string;
  name: string;
  language: string;
  content: string;
  isDirty: boolean;
}

export interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isActive: boolean;
  cursor?: { line: number; col: number };
  currentFile?: string;
}
