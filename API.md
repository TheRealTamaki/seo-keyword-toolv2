# SEO Keyword Tool - API Documentation

## Base URL

```
http://localhost:3001/api
```

## Authentication

All endpoints (except `/auth/*`) require JWT authentication via Bearer token:

```
Authorization: Bearer <jwt_token>
```

## Response Format

All responses follow this format:

```json
{
  "success": boolean,
  "data": {},
  "error": "error message (if failed)",
  "message": "optional message"
}
```

---

## Authentication Endpoints

### Register User

```
POST /auth/register
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "createdAt": "2025-11-11T00:00:00Z"
  }
}
```

### Login

```
POST /auth/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    }
  }
}
```

### Logout

```
POST /auth/logout
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Projects Endpoints

### List Projects

```
GET /projects
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "userId": "uuid",
        "name": "My Website",
        "domain": "example.com",
        "description": "Optional description",
        "createdAt": "2025-11-11T00:00:00Z",
        "updatedAt": "2025-11-11T00:00:00Z"
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### Get Project

```
GET /projects/:id
```

**Response (200):** Single project object

### Create Project

```
POST /projects
```

**Request:**
```json
{
  "name": "My Website",
  "domain": "example.com",
  "description": "Optional description"
}
```

**Response (201):** Created project object

### Update Project

```
PUT /projects/:id
```

**Request:**
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Response (200):** Updated project object

### Delete Project

```
DELETE /projects/:id
```

**Response (204):** No content

---

## Keywords Endpoints

### List Keywords by Project

```
GET /keywords/:projectId
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `sortBy` (optional): Field to sort by (search_volume, difficulty, cpc)
- `order` (optional): asc or desc

**Response (200):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "projectId": "uuid",
        "keyword": "seo tips",
        "searchVolume": 1200,
        "difficulty": 35,
        "cpc": 2.5,
        "intent": "informational",
        "createdAt": "2025-11-11T00:00:00Z",
        "updatedAt": "2025-11-11T00:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### Add Keyword

```
POST /keywords
```

**Request:**
```json
{
  "projectId": "uuid",
  "keyword": "seo tips",
  "competitors": ["competitor1.com", "competitor2.com"]
}
```

**Response (201):** Created keyword object

### Delete Keyword

```
DELETE /keywords/:id
```

**Response (204):** No content

---

## Rankings Endpoints

### Get Ranking History

```
GET /rankings/:keywordId
```

**Query Parameters:**
- `startDate` (optional): ISO 8601 date string
- `endDate` (optional): ISO 8601 date string
- `searchEngine` (optional): google, bing, youtube
- `device` (optional): desktop, mobile
- `location` (optional): Location string

**Response (200):**
```json
{
  "success": true,
  "data": {
    "keyword": "seo tips",
    "rankings": [
      {
        "id": "uuid",
        "keywordId": "uuid",
        "domain": "example.com",
        "rank": 5,
        "url": "https://example.com/article",
        "searchEngine": "google",
        "device": "desktop",
        "location": "United States",
        "serpFeatures": ["snippet", "paa"],
        "checkedAt": "2025-11-11T00:00:00Z",
        "createdAt": "2025-11-11T00:00:00Z"
      }
    ]
  }
}
```

### Check Rankings (Trigger DataForSEO Check)

```
POST /rankings/check
```

**Request:**
```json
{
  "projectId": "uuid",
  "keywords": ["keyword1", "keyword2"],
  "searchEngines": ["google", "bing"],
  "devices": ["desktop", "mobile"],
  "locations": ["United States", "United Kingdom"]
}
```

**Response (202):** Accepted - job queued
```json
{
  "success": true,
  "data": {
    "jobId": "uuid",
    "message": "Ranking check started"
  }
}
```

---

## Competitors Endpoints

### List Competitors

```
GET /competitors/:projectId
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "domain": "competitor.com",
      "name": "Competitor Name",
      "createdAt": "2025-11-11T00:00:00Z",
      "updatedAt": "2025-11-11T00:00:00Z"
    }
  ]
}
```

### Add Competitor

```
POST /competitors
```

**Request:**
```json
{
  "projectId": "uuid",
  "domain": "competitor.com",
  "name": "Competitor Name"
}
```

**Response (201):** Created competitor object

### Delete Competitor

```
DELETE /competitors/:id
```

**Response (204):** No content

---

## API Keys Endpoints

### Get User's API Key

```
GET /api-keys/:userId
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "isActive": true,
    "createdAt": "2025-11-11T00:00:00Z",
    "lastValidatedAt": "2025-11-11T00:00:00Z",
    "validatedSuccessfully": true
  }
}
```

### Create/Update API Key

```
POST /api-keys
```

**Request:**
```json
{
  "apiKey": "your-dataforseo-api-key"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "isActive": true,
    "createdAt": "2025-11-11T00:00:00Z"
  }
}
```

### Validate API Key

```
POST /api-keys/:id/validate
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "message": "API key is valid"
  }
}
```

### Delete API Key

```
DELETE /api-keys/:id
```

**Response (204):** No content

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Missing or invalid authentication token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Rate Limiting

Rate limiting will be implemented with the following limits:
- 100 requests per minute per user
- 10 ranking checks per hour
- 1000 API calls per day

Headers returned with rate limit info:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1636545600
```

---

## Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response includes:**
```json
{
  "total": 150,
  "page": 1,
  "limit": 10,
  "totalPages": 15
}
```

---

## Sorting

Sortable fields vary by endpoint. Use query parameters:
- `sortBy`: Field name
- `order`: asc or desc (default: desc)

Example:
```
GET /keywords/:projectId?sortBy=search_volume&order=desc
```

---

## Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `202 Accepted` - Async operation accepted (e.g., rank check)
- `204 No Content` - Successful deletion or update with no response body
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server error

---

## Example Usage

### Complete Flow

```bash
# 1. Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'

# 2. Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'

# 3. Create project
TOKEN="your_jwt_token"
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"My Site","domain":"example.com"}'

# 4. Add API key
curl -X POST http://localhost:3001/api/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"apiKey":"your-dataforseo-key"}'

# 5. Add keywords
curl -X POST http://localhost:3001/api/keywords \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"projectId":"project_uuid","keyword":"seo tips"}'
```

---

**API Version**: 0.1.0
**Last Updated**: 2025-11-11
