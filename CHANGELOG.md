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

#### Module 3: Advanced Competitor Analysis (2025-11-12)
- **Keyword Gap Analysis**
  - Identify keywords competitors rank for but you don't (missing gaps)
  - Find keywords where competitors rank better (losing gaps)
  - Track keywords where you outrank competitors (winning gaps)
  - Automatic gap type classification
  - Opportunity scoring per keyword (0-100)
  - Filter analysis by specific competitors
  - Grouped results by gap type with summaries

- **Visibility Score Calculation**
  - Position-weighted visibility scoring (0-100 scale)
  - CTR-based algorithm using industry benchmarks
  - Top 3 and Top 10 ranking counts
  - Average position tracking
  - Estimated monthly traffic calculations
  - Traffic estimation by position (CTR × volume)
  - Compare project vs all competitors
  - Visibility trends and insights

- **Quick Wins Identification**
  - Find keywords on page 2-3 that can reach page 1
  - Identify low-hanging fruit opportunities
  - Calculate potential traffic gains
  - Win score algorithm (proximity + volume + difficulty)
  - Filter by rank range (default: 11-20)
  - Filter by volume and difficulty thresholds
  - Actionable recommendations per keyword
  - Limited to top 100 high-value opportunities

- **Competitor Keyword Discovery**
  - Extract all ranking keywords from competitor domains
  - DataForSEO domain keyword extraction
  - Full keyword enrichment (intent, questions, scores)
  - Multi-location and language support
  - Summary statistics per domain
  - Integration with keyword research engine

- **Opportunity Prioritization**
  - Combined gap + quick win recommendations
  - Priority scoring (0-100) across all opportunities
  - Effort classification (low/medium/high)
  - Impact assessment (low/medium/high) based on volume
  - Actionable recommendations with context
  - Grouped by effort and impact matrices
  - Low-effort high-impact filtering
  - Configurable limits and source selection

- **Keyword Overlap Analysis**
  - Calculate shared keyword percentages
  - Identify unique competitor keywords
  - Count competitive advantages (where they rank better)
  - Overlap metrics per competitor
  - Find most similar competitors
  - Total keyword comparison
  - Competitive positioning insights

- **Advanced Algorithms**
  - Position-based CTR weights (position 1 = 31.6%, position 10 = 2.5%)
  - Multi-factor opportunity scoring (volume + difficulty + CPC + position)
  - Traffic estimation formulas with CTR curves
  - Proximity scoring for quick wins
  - Weighted visibility calculations
  - Gap opportunity algorithms

- **API Endpoints - Competitor Analysis**
  - GET `/api/competitor-analysis/keyword-gap/:projectId` - Gap analysis
  - GET `/api/competitor-analysis/visibility/:projectId` - Visibility scores
  - GET `/api/competitor-analysis/quick-wins/:projectId` - Quick win opportunities
  - GET `/api/competitor-analysis/discover-keywords` - Competitor keyword discovery
  - GET `/api/competitor-analysis/opportunities/:projectId` - Prioritized opportunities
  - GET `/api/competitor-analysis/overlap/:projectId` - Keyword overlap analysis

- **Database Optimization**
  - Complex CTEs for efficient analysis
  - Lateral joins for latest rankings
  - Optimized queries for large datasets
  - Aggregated statistics and grouping
  - Indexed queries for performance

- **Services**
  - `competitor-analysis.service.ts` - Complete analysis engine (9+ functions)
  - Integration with existing ranking and keyword data
  - Leverages DataForSEO for discovery

#### Module 1.7: Alerts & Notifications System (2025-11-12)
- **Alert Configuration Management**
  - Full CRUD operations for alert configurations
  - 7 alert types supported:
    - Rank Change (any significant movement)
    - Rank Improvement (moving up in rankings)
    - Rank Drop (moving down in rankings)
    - New Ranking (entering top 100)
    - Lost Ranking (dropping out of top 100)
    - SERP Feature (appearing in featured snippets, PAA, etc.)
    - Competitor Movement (competitor rank changes)
  - Customizable alert conditions (JSON-based configuration)
  - Keyword filtering (by ID, search volume, search engine, device)
  - Alert enable/disable toggle
  - Per-alert notification preferences
  - Routes:
    - POST `/api/alerts` - Create alert
    - GET `/api/alerts` - List all alerts (with project filter)
    - GET `/api/alerts/:id` - Get specific alert
    - PUT `/api/alerts/:id` - Update alert
    - DELETE `/api/alerts/:id` - Delete alert
    - POST `/api/alerts/test/:id` - Test alert (manual trigger)

- **Alert Detection & Triggering**
  - Automatic alert evaluation on rank check completion
  - Ranking change detection by comparing current vs previous rankings
  - Advanced condition matching:
    - Position change thresholds (e.g., dropped >3 positions)
    - Rank range filtering (e.g., entered top 10)
    - Search volume minimums
    - SERP feature detection
    - Competitor position tracking
  - Real-time alert processing in rank check workflow
  - Efficient SQL queries with CTEs for historical comparison
  - Integration with job queue processor
  - Alert history tracking with full trigger data

- **Multi-Channel Notification System**
  - Email notifications:
    - HTML-formatted emails
    - Custom templates per alert type
    - Multiple recipients support
    - Rich alert context (keyword, positions, changes)
    - Production-ready integration points (SendGrid, AWS SES)
  - Webhook notifications:
    - Slack webhook support with rich formatting
    - Discord webhook support with embeds
    - Custom webhook support (generic JSON payload)
    - Configurable headers and authentication
    - Response code tracking
    - Error handling and retry logic
  - Notification delivery tracking:
    - Sent timestamp recording
    - Delivery status monitoring
    - Error logging for failures
    - Retry capability

- **Notification Preferences**
  - User-level notification settings
  - Global enable/disable per channel (email, webhook)
  - Default recipient configuration
  - Notification frequency control:
    - Immediate (real-time alerts)
    - Daily Digest (aggregated once per day)
    - Weekly Digest (aggregated once per week)
  - Quiet Hours feature:
    - Configurable time windows
    - Timezone support
    - Automatic suppression during quiet hours
  - Digest scheduling:
    - Daily digest time configuration
    - Weekly digest day selection
  - Routes:
    - GET `/api/alerts/preferences/settings` - Get preferences
    - PUT `/api/alerts/preferences/settings` - Update preferences

- **Alert History & Monitoring**
  - Complete audit trail of all triggered alerts
  - Detailed trigger data storage (positions, changes, volumes)
  - Notification delivery status per trigger
  - Error tracking for failed notifications
  - Historical alert performance analysis
  - Filter by project or user
  - Configurable result limits
  - Routes:
    - GET `/api/alerts/history/all` - Alert history with filters

- **Advanced Features**
  - Alert last-triggered timestamp tracking
  - Frequency-based throttling (prevent spam)
  - Quiet hours enforcement
  - Manual alert testing for validation
  - Graceful error handling (alerts don't fail rank checks)
  - Background processing (non-blocking)
  - Rich alert context in notifications:
    - Keyword name and metrics
    - Position changes with direction indicators
    - Search volume impact
    - Competitor positioning
    - SERP feature details
    - Domain information

- **Database Schema**
  - `alerts` table - Alert configurations with conditions
  - `alert_history` table - Triggered alert records
  - `notification_preferences` table - User notification settings
  - JSONB fields for flexible configuration storage
  - Comprehensive indexing for performance
  - Foreign key constraints for data integrity
  - Automatic timestamp management

- **Services & Models**
  - `alert.model.ts` - 15+ CRUD operations for alerts and preferences
  - `alert.service.ts` - Alert detection and processing engine
  - `notification.service.ts` - Multi-channel delivery service
  - Integration with `rank-check.processor.ts` for automatic triggering
  - Type-safe alert configurations and conditions
  - Comprehensive error handling

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
- `alerts` - Alert configurations and conditions
- `alert_history` - Triggered alert audit trail
- `notification_preferences` - User notification settings
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
- ✅ 1.8 Alerts & Notifications (7 alert types, multi-channel delivery, preferences)

#### Module 2: Keyword Research (✅ 100% Complete)
- ✅ 2.1 Keyword Discovery (Multi-source: seeds, domains, autocomplete, related)
- ✅ 2.2 Search Metrics (Volume, CPC, competition, difficulty, trends)
- ✅ 2.3 Question Keywords (7 types with automatic detection)
- ✅ 2.4 Search Intent Classification (4 intents: informational, commercial, transactional, navigational)
- ✅ 2.5 Opportunity Scoring (0-100 algorithm with customizable weights)
- ✅ 2.6 Keyword Lists (Full CRUD with stats, notes, CSV export)
- ✅ 2.7 Filtering & Search (12+ filters, flexible sorting, pagination)

#### Module 3: Competitor Analysis (✅ 100% Complete)
- ✅ Basic competitor tracking
- ✅ Competitor rank comparison
- ✅ 3.1 Keyword Gap Analysis (missing, losing, winning gaps with opportunity scoring)
- ✅ 3.2 Competitor Keyword Discovery (DataForSEO domain extraction + enrichment)
- ✅ 3.3 Visibility & Position Comparison (CTR-weighted scoring + traffic estimation)
- ✅ 3.4 Quick Wins Identification (page 2-3 keywords with traffic potential)
- ✅ 3.5 Priority Scoring (combined opportunities with effort/impact classification)
- ✅ 3.6 Competitor Monitoring (overlap analysis + competitive advantages)

### Overall Progress: ~80% Complete

**Completed:**
- ✅ Foundation (100%): Auth, DB, API keys, infrastructure
- ✅ Project/Keyword Management (100%): Full CRUD operations
- ✅ Competitor Management (100%): Full CRUD with limits
- ✅ Module 1: Rank Tracking (100%): Live checking, storage, retrieval, analytics, alerts
- ✅ Module 2: Keyword Research (100%): Discovery, intent, scoring, lists, filtering
- ✅ Module 3: Competitor Analysis (100%): Gap analysis, visibility, quick wins
- ✅ DataForSEO Integration (100%): Live rank checking + keyword research APIs
- ✅ Background Job Queue (100%): Automated scheduled rank checks with Bull/Redis
- ✅ Alerts & Notifications (100%): Multi-channel alerts with 7 types (Module 1.8)

**Pending:**
- ⏳ Frontend Dashboard: React components and visualization
- ⏳ Charts & Visualizations: Ranking trends and analytics
- ⏳ Export & Reporting: PDF reports, scheduled reports
- ⏳ Reporting System: Automated reports and exports
- ⏳ Content Optimization Suggestions (Module 4)
- ⏳ Performance Monitoring & Analytics (Module 5)

## [0.1.0] - 2025-11-11

### Added
- Initial project setup
- PRD documentation
- Basic infrastructure configuration
- Docker Compose environment
- Database schema design

---

**Project Status**: In Development
**Version**: 0.3.0
**Last Updated**: 2025-11-12
