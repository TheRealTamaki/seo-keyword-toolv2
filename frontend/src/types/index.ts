// User Types
export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

// Project Types
export interface Project {
  id: string;
  userId: string;
  name: string;
  domain: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Keyword Types
export interface Keyword {
  id: string;
  projectId: string;
  keyword: string;
  searchVolume?: number;
  difficulty?: number;
  cpc?: number;
  intent?: 'informational' | 'commercial' | 'transactional' | 'navigational';
  createdAt: Date;
  updatedAt: Date;
}

// Ranking Types
export interface Ranking {
  id: string;
  keywordId: string;
  domain: string;
  rank: number;
  url?: string;
  searchEngine: 'google' | 'bing' | 'youtube';
  device: 'desktop' | 'mobile';
  location?: string;
  serpFeatures?: string[];
  checkedAt: Date;
  createdAt: Date;
}

// Competitor Types
export interface Competitor {
  id: string;
  projectId: string;
  domain: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Key Types
export interface ApiKey {
  id: string;
  userId: string;
  apiKeyHash: string;
  isActive: boolean;
  createdAt: Date;
  lastValidatedAt: Date;
  validatedSuccessfully: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
