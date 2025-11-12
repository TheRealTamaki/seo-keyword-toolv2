# Changelog

All notable changes to the SEO Keyword Tool project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Project & Keyword Management (2025-11-12)
- **Project Management System**
  - Full CRUD operations for SEO projects
  - Pagination support for project listings
  - Project statistics endpoint (keyword count, competitor count, list count)
  - Domain normalization and validation
  - Ownership verification on all routes
  - Routes: GET/POST/PUT/DELETE `/api/projects`, GET `/api/projects/:id/stats`

- **Keyword Management System**
  - Full CRUD operations for keywords
  - Single and bulk keyword creation (up to 100 at once)
  - Advanced filtering: search volume, difficulty, CPC, intent, text search
  - Flexible sorting on any field (ASC/DESC)
  - Keyword metrics tracking (volume, difficulty, CPC, intent)
  - Get untracked keywords (never checked)
  - Get keywords with latest rankings
  - Routes: GET/POST/PUT/DELETE `/api/keywords`, GET `/api/keywords/project/:projectId/untracked`

#### Competitor Management & Rank Tracking (2025-11-12)
- **Competitor Management**
  - Full CRUD operations for competitor tracking
  - Single and bulk competitor creation (up to 20 at once)
  - 10 competitor limit per project (enforced per PRD)
  - Domain normalization and duplicate prevention
  - Routes: GET/POST/PUT/DELETE `/api/competitors`

- **Rank Tracking System**
  - Historical ranking data storage with unlimited retention
  - TimescaleDB hypertables for time-series optimization
  - Multi-platform support (Google, Bing, YouTube)
  - Device-specific tracking (desktop, mobile)
  - Location-based tracking (configurable locations)
  - SERP feature detection (snippets, PAA, image packs, etc.)
  - Ranking history with advanced filters
  - Latest ranking retrieval
  - Rank change tracking (current vs previous comparison)
  - Competitor rank comparison
  - Average rank calculations over time periods
  - Routes:
    - GET `/api/rankings/keyword/:keywordId/history`
    - GET `/api/rankings/keyword/:keywordId/latest`
    - GET `/api/rankings/keyword/:keywordId/changes`
    - GET `/api/rankings/keyword/:keywordId/competitors`
    - GET `/api/rankings/keyword/:keywordId/serp-features`
    - GET `/api/rankings/keyword/:keywordId/average`
    - POST `/api/rankings/check` (placeholder for DataForSEO integration)

#### Authentication & API Key Management (2025-11-11)
- **Supabase Authentication**
  - Complete migration to Supabase Auth
  - User registration with email verification
  - Login/logout with JWT tokens
  - Password reset flow
  - Token refresh mechanism
  - Session management
  - Routes: POST `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/refresh`

- **DataForSEO API Key Management (BYOK)**
  - AES-256-GCM encryption for API keys
  - API key validation against DataForSEO
  - Account info retrieval (balance, usage stats)
  - Secure storage with SHA-256 hashing
  - Key rotation support
  - API key middleware for feature gating
  - Routes: GET/POST/DELETE `/api/api-keys`, POST `/api/api-keys/validate`

#### Infrastructure (2025-11-11)
- **Database Setup**
  - PostgreSQL schema with all tables
  - TimescaleDB hypertables for rankings data
  - Automatic compression for old rankings
  - Proper indexes and foreign keys
  - Cascade deletes for data integrity
  - Database connection pooling
  - Health check endpoints

- **Backend Services**
  - Express.js + TypeScript server
  - Redis caching and session management
  - Supabase client configuration
  - DataForSEO service with validation
  - Encryption service for API keys
  - Authentication middleware
  - API key validation middleware

- **Development Environment**
  - Docker Compose setup (PostgreSQL, TimescaleDB, Redis)
  - Environment variable configuration
  - TypeScript configuration
  - Project structure and organization

### Database Schema

#### Tables
- `users` - User accounts (managed by Supabase)
- `api_keys` - Encrypted DataForSEO API keys
- `projects` - User SEO projects
- `keywords` - Keywords being tracked
- `rankings` - Time-series rank data (TimescaleDB hypertable)
- `competitors` - Competitor tracking
- `keyword_lists` - User-created keyword collections
- `keyword_list_items` - Junction table for keyword lists
- `rank_changes` - Computed rank change history

#### Features
- UUID primary keys throughout
- Automatic timestamps (created_at, updated_at)
- Cascade deletes for data integrity
- Composite indexes for performance
- TimescaleDB compression for rankings
- ON CONFLICT handling for idempotent operations

### PRD Implementation Status

#### Module 1: Rank Tracking (~85% Complete)
- ✅ 1.1 Multi-Platform Tracking (Google, Bing, YouTube)
- ✅ 1.2 Device-Specific Tracking (Desktop, Mobile)
- ✅ 1.3 Location-Based Tracking
- ✅ 1.4 Historical Data (Unlimited retention)
- ✅ 1.5 Competitor Tracking (Up to 10 per project)
- ✅ 1.6 SERP Feature Detection
- ⏳ 1.7 Reporting & Alerts (Basic APIs ready, UI/alerts pending)

#### Module 2: Keyword Research (0% Complete)
- ⏳ 2.1 Keyword Discovery
- ⏳ 2.2 Search Metrics
- ⏳ 2.3 Question Keywords
- ⏳ 2.4 Search Intent Classification
- ⏳ 2.5 Opportunity Scoring
- ⏳ 2.6 Keyword Lists
- ⏳ 2.7 Filtering & Search

#### Module 3: Competitor Analysis (~30% Complete)
- ✅ Basic competitor tracking
- ✅ Competitor rank comparison
- ⏳ 3.1 Keyword Gap Analysis
- ⏳ 3.2 Competitor Keyword Discovery
- ⏳ 3.3 Visibility & Position Comparison
- ⏳ 3.4 Quick Wins Identification
- ⏳ 3.5 Priority Scoring
- ⏳ 3.6 Competitor Monitoring

### Overall Progress: ~40-45% Complete

**Completed:**
- ✅ Foundation (100%): Auth, DB, API keys, infrastructure
- ✅ Project/Keyword Management (100%): Full CRUD
- ✅ Competitor Management (100%): Full CRUD with limits
- 🔄 Rank Tracking (85%): Data storage/retrieval complete

**Pending:**
- ⏳ DataForSEO Integration: Live rank checking
- ⏳ Background Job Queue: Automated rank checks
- ⏳ Keyword Research Module: Discovery and metrics
- ⏳ Advanced Competitor Analysis: Gap analysis, quick wins
- ⏳ Frontend Dashboard: React components
- ⏳ Charts & Visualizations: Ranking trends
- ⏳ Alert System: Email/webhook notifications

## [0.1.0] - 2025-11-11

### Added
- Initial project setup
- PRD documentation
- Basic infrastructure configuration
- Docker Compose environment
- Database schema design

---

**Project Status**: In Development
**Version**: 0.1.0
**Last Updated**: 2025-11-12
