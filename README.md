# SEO Keyword Tool v2

A comprehensive web-based SEO tool for rank tracking, keyword research, and competitor analysis using the DataForSEO API.

## 🎯 Key Features

- **Rank Tracking**: Monitor keyword rankings across Google, Bing, and YouTube
- **Keyword Research**: Discover high-opportunity keywords with detailed metrics
- **Competitor Analysis**: Analyze competitor strategies and identify gaps
- **SERP Feature Detection**: Track featured snippets, PAA, and other SERP features
- **Historical Data**: Unlimited historical tracking and trend analysis

## 📋 Architecture

### Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + TypeScript + Recharts
- **Database**: PostgreSQL + TimescaleDB (time-series)
- **Caching**: Redis
- **API**: DataForSEO (BYOK - Bring Your Own Key)

### Project Structure

```
seo-keyword-toolv2/
├── backend/                 # Express API
│   ├── src/
│   │   ├── api/             # Route handlers
│   │   ├── models/          # Database models
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth, validation
│   │   ├── config/          # DB, Redis config
│   │   ├── types/           # TypeScript types
│   │   └── index.ts         # Entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # React application
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable components
│   │   ├── services/        # API client
│   │   ├── hooks/           # Custom hooks
│   │   ├── types/           # TypeScript types
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
├── database/
│   ├── schema.sql           # Database schema
│   ├── migrations/          # Migration scripts
│   └── seeds/               # Seed data
├── docker-compose.yml       # Local dev environment
├── .env.example             # Environment variables template
├── PRD.md                   # Product requirements
└── README.md                # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

### Setup

1. **Clone and setup environment**

```bash
cd seo-keyword-toolv2
cp .env.example .env
```

2. **Start services with Docker**

```bash
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- TimescaleDB (port 5433)
- Redis (port 6379)

3. **Initialize database**

```bash
# Connect to PostgreSQL and run schema
psql -h localhost -U postgres -d seo_keyword_tool -f database/schema.sql
```

4. **Install dependencies**

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

5. **Start development servers**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

## 📚 Database Schema

The application uses:

- **PostgreSQL**: Relational data (users, projects, keywords, competitors)
- **TimescaleDB**: Time-series data (rank history with automatic compression)
- **Redis**: Caching and real-time data

Key tables:
- `users` - User accounts
- `api_keys` - Encrypted DataForSEO API keys
- `projects` - User projects
- `keywords` - Keywords being tracked
- `rankings` - Time-series rank data (hypertable)
- `competitors` - Competitor tracking
- `keyword_lists` - User-created keyword collections

## 🔑 API Key Management

The tool implements BYOK (Bring Your Own Key) model:

1. Users provide their DataForSEO API keys
2. Keys are encrypted at rest using AES-256
3. Validation tests ensure key functionality
4. Usage is monitored against account limits
5. Support for key rotation and updates

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Projects
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Keywords
- `GET /api/keywords/:projectId` - List project keywords
- `POST /api/keywords` - Add keyword
- `DELETE /api/keywords/:id` - Remove keyword

### Rankings
- `GET /api/rankings/:keywordId` - Get rank history
- `POST /api/rankings/check` - Check keyword ranks

### Competitors
- `GET /api/competitors/:projectId` - List competitors
- `POST /api/competitors` - Add competitor
- `DELETE /api/competitors/:id` - Remove competitor

### API Keys
- `GET /api/api-keys/:userId` - Get user's API key
- `POST /api/api-keys` - Create/update API key
- `POST /api/api-keys/:id/validate` - Validate API key

## 🛠️ Development

### Code Style

```bash
# Format code
npm run format

# Lint code
npm run lint
```

### Building

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Access PostgreSQL
docker exec -it seo_tool_postgres psql -U postgres -d seo_keyword_tool

# Access Redis
docker exec -it seo_tool_redis redis-cli
```

## 📝 Environment Variables

See `.env.example` for all available options:

- `NODE_ENV` - Development/Production
- `PORT` - Backend port (default: 3001)
- `DB_*` - PostgreSQL connection
- `REDIS_*` - Redis connection
- `JWT_SECRET` - JWT signing key
- `ENCRYPTION_KEY` - API key encryption
- `REACT_APP_API_URL` - Frontend API endpoint

## 🔐 Security

- Password hashing with bcrypt
- JWT authentication
- AES-256 encryption for API keys
- CORS protection
- Rate limiting (to be implemented)
- Input validation (to be implemented)

## 📊 Performance Targets

- Rank checks within 24 hours
- Support 10,000+ keywords per account
- Sub-2 second dashboard loads
- Real-time filtering for 50,000 keywords

## 🚢 Deployment

Infrastructure setup for production:
- Dockerized backend and frontend
- Horizontal scaling for rank checking
- Database replication for reliability
- CDN for global performance
- CI/CD pipeline (to be configured)

## 📄 Documentation

- `PRD.md` - Full product requirements and specifications
- Individual endpoint documentation (to be added)
- Architecture decisions document (to be added)

## 🤝 Contributing

This project follows TypeScript strict mode and uses ESLint/Prettier for code consistency.

## 📞 Support

For issues and feedback, please refer to GitHub issues or documentation.

---

**Version**: 0.1.0
**Status**: In Development
**Last Updated**: 2025-11-11
