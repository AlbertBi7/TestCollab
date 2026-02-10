export interface User {
  userId: string;
  email: string;
  displayName: string;
  skills: string[];
  bio?: string;
  photoUrl?: string;
}

export interface Workspace {
  wsId: string;
  title: string;
  ownerId: string;
  description?: string;
  privacy: 'public' | 'private';
  members: Record<string, 'owner' | 'editor' | 'viewer'>;
  createdAt: number;
}

export interface Reference {
  refId: string;
  wsId: string;
  url: string;
  title?: string;
  mediaType: 'video' | 'pdf' | 'image' | 'link';
  tags: string[];
  storagePath?: string; 
  createdAt: number;
}

export interface Message {
  id: string;
  workspaceId: string;
  senderId: string;
  content: string;
  createdAt: number;
}