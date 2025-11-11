// User Types
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

// DataForSEO API Key Types
export interface ApiKey {
  id: string;
  userId: string;
  apiKey: string; // encrypted
  apiKeyHash: string; // hash for validation
  isActive: boolean;
  createdAt: Date;
  lastValidatedAt: Date;
  validatedSuccessfully: boolean;
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

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// DataForSEO API Request/Response Types
export interface DataForSEOKeywordMetrics {
  keyword: string;
  search_volume: number;
  difficulty: number;
  cpc: number;
  competition: number;
}

export interface DataForSEORankingData {
  domain: string;
  rank: number;
  url: string;
  title: string;
  serp_features: string[];
}

// Request Validation Types
export interface CreateProjectRequest {
  name: string;
  domain: string;
  description?: string;
}

export interface AddKeywordRequest {
  keyword: string;
  competitors?: string[];
}

export interface AuthRequest {
  email: string;
  password: string;
}
