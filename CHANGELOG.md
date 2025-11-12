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
    - POST `/api/rankings/check` (live rank checking)

#### Background Job Queue System (2025-11-12)
- **Bull Queue with Redis**
  - Background job processing with Bull queue
  - Redis-backed job storage and state management
  - Configurable concurrency and retry logic
  - Exponential backoff retry strategy (3 attempts)
  - Job retention policies (1 week completed, 2 weeks failed)
  - Queue statistics and monitoring

- **Scheduled Rank Checks**
  - Cron-based recurring rank checks per project
  - Automatic keyword discovery for scheduled checks
  - Project-level scheduling with unique job IDs
  - Schedule management (create, update, cancel)
  - Support for custom search engines, devices, locations

- **Immediate Rank Checks**
  - One-time rank check job queuing
  - Priority processing for manual checks
  - Bulk keyword support (up to 100 keywords)
  - Real-time job status tracking

- **Job Management**
  - Job status monitoring (queued, active, completed, failed)
  - Progress tracking during execution
  - Result retrieval with detailed metrics
  - Failed job reporting with error messages
  - List all scheduled jobs
  - Queue statistics (active, waiting, completed, failed counts)

- **Worker Process**
  - Automatic job processor initialization
  - API key retrieval and validation
  - Bulk rank check execution
  - Result storage automation
  - Progress updates (10%, 80%, 100%)
  - Error handling and retry logic

- **API Endpoints**
  - POST `/api/jobs/rank-check/schedule` - Schedule recurring checks
  - POST `/api/jobs/rank-check/queue` - Queue immediate check
  - GET `/api/jobs/rank-check/schedule/:projectId` - View schedule
  - PUT `/api/jobs/rank-check/schedule/:projectId` - Update schedule
  - DELETE `/api/jobs/rank-check/schedule/:projectId` - Cancel schedule
  - GET `/api/jobs/:jobId/status` - Job status and results
  - GET `/api/jobs/scheduled` - List all scheduled jobs
  - GET `/api/jobs/stats` - Queue statistics

- **Graceful Shutdown**
  - Clean queue closure on SIGINT
  - In-flight job completion
  - Resource cleanup (queues, DB, Redis)

#### DataForSEO Integration for Live Rank Checking (2025-11-12)
- **Live Rank Checking**
  - Real-time SERP data via DataForSEO APIs
  - Google Organic SERP rankings
  - Bing SERP rankings
  - YouTube video rankings
  - Automatic SERP feature extraction (featured snippets, PAA, images, videos, etc.)
  - Smart domain matching for project and competitor tracking
  - Multi-engine, multi-device, multi-location support
  - Bulk processing up to 100 keywords per request
  - Built-in rate limiting (1s delay between requests)
  - Comprehensive error handling and reporting

- **Rank Check Orchestration**
  - Single and bulk rank check operations
  - Automatic competitor rank tracking
  - Result parsing and database storage
  - Detailed success/failure reporting
  - Integration with existing ranking models

- **Enhanced Services**
  - Extended DataForSEO service with SERP API methods
  - API key middleware with automatic decryption
  - TypeScript type extensions for Express Request
  - Services: `rank-check.service.ts`, enhanced `dataforseo.service.ts`

#### Module 2: Keyword Research System (2025-11-12)
- **DataForSEO Keyword Research APIs**
  - Keywords For Keywords - Seed keyword expansion
  - Keywords For Site - Competitor keyword extraction
  - Autocomplete Suggestions - Google autocomplete API
  - Related Keywords - Keyword variations and alternatives
  - Search volume, CPC, competition, difficulty metrics
  - 12-month trend data support
  - Multi-location and multi-language support

- **Keyword Analysis Engine**
  - Search Intent Classification (4 types):
    - Informational (default, how-to, guides)
    - Commercial (reviews, comparisons, best of)
    - Transactional (buy, purchase, order)
    - Navigational (login, website, brand)
  - Question Detection (7 types):
    - What, How, Why, When, Where, Who, Which
    - Pattern-based regex matching
    - Automatic question type classification
  - Opportunity Scoring Algorithm (0-100):
    - Logarithmic volume scoring
    - Inverse difficulty scoring
    - CPC commercial value scoring
    - Customizable weight configuration
  - Keyword Enrichment:
    - Automatic intent assignment
    - Question detection and typing
    - Opportunity score calculation
    - Word count analysis
    - Metadata preservation

- **Keyword Discovery**
  - Multi-source keyword discovery from:
    - Seed keywords (expansion)
    - Competitor domains
    - Autocomplete suggestions
    - Related keyword variations
  - Automatic deduplication
  - Bulk processing support
  - Enrichment pipeline integration

- **Advanced Filtering & Sorting**
  - Filter by search volume range
  - Filter by difficulty range
  - Filter by CPC range
  - Filter by search intent
  - Questions-only filter
  - Question type filter
  - Word count range filter
  - Opportunity score threshold
  - Text search in keywords
  - Sort by any metric (ASC/DESC)

- **Statistical Insights**
  - Total keyword count
  - Average search volume
  - Average difficulty
  - Average CPC
  - Average opportunity score
  - Intent distribution breakdown
  - Question keyword count
  - Question type distribution
  - Word count distribution

- **Keyword List Management**
  - Create and organize keyword lists
  - Associate lists with projects (optional)
  - Bulk add keywords with enrichment data
  - Store search metrics per keyword
  - Add notes to individual keywords
  - Update keyword metrics
  - Advanced filtering on list items
  - Pagination support (50 items/page)
  - Sort by any field
  - Bulk delete operations
  - CSV export with all metrics

- **Database Schema (Migration 006)**
  - `keyword_lists` table: List metadata
  - `keyword_list_items` table: Keywords with enrichment
  - Indexes for performance optimization
  - Automatic timestamp updates
  - Cascade delete for data integrity

- **API Endpoints - Keyword Research**
  - POST `/api/keyword-research/discover` - Multi-source discovery
  - POST `/api/keyword-research/analyze` - Enrich keyword list
  - GET `/api/keyword-research/autocomplete` - Autocomplete suggestions
  - GET `/api/keyword-research/related` - Related keywords
  - GET `/api/keyword-research/domain` - Domain keyword extraction
  - POST `/api/keyword-research/filter` - Advanced filtering
  - POST `/api/keyword-research/insights` - Statistical analysis

- **API Endpoints - Keyword Lists**
  - POST `/api/keyword-lists` - Create list
  - GET `/api/keyword-lists` - List all with stats
  - GET `/api/keyword-lists/:id` - Get specific list
  - PUT `/api/keyword-lists/:id` - Update list
  - DELETE `/api/keyword-lists/:id` - Delete list
  - POST `/api/keyword-lists/:id/keywords` - Add keywords
  - GET `/api/keyword-lists/:id/keywords` - Get with filters
  - PATCH `/api/keyword-lists/:id/keywords/:itemId` - Update keyword
  - DELETE `/api/keyword-lists/:id/keywords/:itemId` - Delete keyword
  - POST `/api/keyword-lists/:id/keywords/bulk-delete` - Bulk delete
  - GET `/api/keyword-lists/:id/export` - Export as CSV

- **Services**
  - `keyword-research.service.ts` - Analysis engine (10+ functions)
  - Enhanced `dataforseo.service.ts` - Keyword APIs (4 new endpoints)
  - `keyword-list.model.ts` - List management (12+ operations)

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

#### Module 1: Rank Tracking (✅ 100% Complete)
- ✅ 1.1 Multi-Platform Tracking (Google, Bing, YouTube)
- ✅ 1.2 Device-Specific Tracking (Desktop, Mobile)
- ✅ 1.3 Location-Based Tracking
- ✅ 1.4 Historical Data (Unlimited retention)
- ✅ 1.5 Competitor Tracking (Up to 10 per project)
- ✅ 1.6 SERP Feature Detection
- ✅ 1.7 Live Rank Checking (DataForSEO Integration)
- ⏳ 1.8 Reporting & Alerts (Basic APIs ready, advanced alerts pending)

#### Module 2: Keyword Research (✅ 100% Complete)
- ✅ 2.1 Keyword Discovery (Multi-source: seeds, domains, autocomplete, related)
- ✅ 2.2 Search Metrics (Volume, CPC, competition, difficulty, trends)
- ✅ 2.3 Question Keywords (7 types with automatic detection)
- ✅ 2.4 Search Intent Classification (4 intents: informational, commercial, transactional, navigational)
- ✅ 2.5 Opportunity Scoring (0-100 algorithm with customizable weights)
- ✅ 2.6 Keyword Lists (Full CRUD with stats, notes, CSV export)
- ✅ 2.7 Filtering & Search (12+ filters, flexible sorting, pagination)

#### Module 3: Competitor Analysis (~30% Complete)
- ✅ Basic competitor tracking
- ✅ Competitor rank comparison
- ⏳ 3.1 Keyword Gap Analysis
- ⏳ 3.2 Competitor Keyword Discovery
- ⏳ 3.3 Visibility & Position Comparison
- ⏳ 3.4 Quick Wins Identification
- ⏳ 3.5 Priority Scoring
- ⏳ 3.6 Competitor Monitoring

### Overall Progress: ~65% Complete

**Completed:**
- ✅ Foundation (100%): Auth, DB, API keys, infrastructure
- ✅ Project/Keyword Management (100%): Full CRUD operations
- ✅ Competitor Management (100%): Full CRUD with limits
- ✅ Rank Tracking (100%): Live checking, storage, retrieval, analytics
- ✅ DataForSEO Integration (100%): Live rank checking + keyword research APIs
- ✅ Background Job Queue (100%): Automated scheduled rank checks with Bull/Redis
- ✅ Keyword Research Module (100%): Discovery, intent, scoring, lists (Module 2)

**In Progress:**
- 🔄 Advanced Alerts: Email/webhook notifications

**Pending:**
- ⏳ Advanced Competitor Analysis: Gap analysis, quick wins (Module 3)
- ⏳ Frontend Dashboard: React components and visualization
- ⏳ Charts & Visualizations: Ranking trends and analytics
- ⏳ Reporting System: Automated reports and exports

## [0.1.0] - 2025-11-11

### Added
- Initial project setup
- PRD documentation
- Basic infrastructure configuration
- Docker Compose environment
- Database schema design

---

**Project Status**: In Development
**Version**: 0.2.0
**Last Updated**: 2025-11-12
