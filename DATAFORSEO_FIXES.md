# DataForSEO API Fixes Required

## Priority 1: Critical Endpoint Fixes

### 1. Fix YouTube Endpoint
**File:** `backend/src/services/dataforseo.service.ts`
**Line:** 333

**Change from:**
```typescript
`${DATAFORSEO_API_BASE}/serp/youtube/video/live/advanced`
```

**Change to:**
```typescript
`${DATAFORSEO_API_BASE}/serp/youtube/organic/live/advanced`
```

---

### 2. Fix Autocomplete Endpoint
**File:** `backend/src/services/dataforseo.service.ts`
**Line:** 577

**Change from:**
```typescript
`${DATAFORSEO_API_BASE}/keywords_data/google/suggestions/live`
```

**Change to:**
```typescript
`${DATAFORSEO_API_BASE}/serp/google/autocomplete/live/advanced`
```

**Also update the payload structure to match SERP API:**
```typescript
const payload = [
  {
    keyword,
    location_code: options.locationCode || 2840,
    language_code: options.languageCode || 'en',
  },
];
```

---

### 3. Fix Related Keywords Function
**File:** `backend/src/services/dataforseo.service.ts`
**Lines:** 610-668

**Replace entire function with:**
```typescript
export async function getRelatedKeywords(
  apiKey: string,
  keyword: string,
  options: {
    locationCode?: number;
    languageCode?: string;
    limit?: number;
  } = {}
): Promise<KeywordIdea[]> {
  const credentials = parseApiKey(apiKey);

  const payload = [
    {
      keyword,
      location_code: options.locationCode || 2840,
      language_code: options.languageCode || 'en',
      limit: options.limit || 100,
    },
  ];

  try {
    const response = await axios.post(
      `${DATAFORSEO_API_BASE}/dataforseo_labs/google/related_keywords/live`,
      payload,
      {
        auth: {
          username: credentials.login,
          password: credentials.password,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    const result = response.data?.tasks?.[0]?.result?.[0];
    if (!result) {
      return [];
    }

    return (result.items || []).map((item: any) => ({
      keyword: item.keyword_data?.keyword || item.keyword,
      searchVolume: item.keyword_data?.keyword_info?.search_volume || 0,
      cpc: item.keyword_data?.keyword_info?.cpc || 0,
      competition: item.keyword_data?.keyword_info?.competition || 0,
      difficulty: item.keyword_data?.keyword_properties?.keyword_difficulty || 0,
      trends: item.keyword_data?.keyword_info?.monthly_searches?.map((m: any) => m.search_volume) || [],
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('DataForSEO Related Keywords API error:', axiosError.response?.data || axiosError.message);
      throw new Error(`DataForSEO Related Keywords API error: ${axiosError.message}`);
    }
    throw error;
  }
}
```

---

## Priority 2: Add Missing Functionality

### 4. Add Google Ads Status Check
**File:** `backend/src/services/dataforseo.service.ts`
**Add new function:**

```typescript
/**
 * Check when Google Ads keyword data was last updated
 * Google typically updates in mid-month
 */
export async function checkGoogleAdsStatus(apiKey: string): Promise<{
  updated: boolean;
  updateDate: string | null;
  message: string;
}> {
  const credentials = parseApiKey(apiKey);

  try {
    const response = await axios.get(
      `${DATAFORSEO_API_BASE}/keywords_data/google_ads/status`,
      {
        auth: {
          username: credentials.login,
          password: credentials.password,
        },
      }
    );

    if (response.data?.tasks?.[0]?.result?.[0]) {
      const result = response.data.tasks[0].result[0];
      return {
        updated: result.updated || false,
        updateDate: result.update_date || null,
        message: result.updated
          ? `Data updated on ${result.update_date}`
          : 'Waiting for monthly update',
      };
    }

    return {
      updated: false,
      updateDate: null,
      message: 'Unable to determine update status',
    };
  } catch (error) {
    console.error('Error checking Google Ads status:', error);
    return {
      updated: false,
      updateDate: null,
      message: 'Error checking status',
    };
  }
}
```

---

### 5. Improve Error Handling
**File:** `backend/src/services/dataforseo.service.ts`
**Add helper function:**

```typescript
/**
 * Check DataForSEO response for errors
 */
function checkDataForSEOResponse(response: any): void {
  if (!response.data) {
    throw new Error('Invalid response from DataForSEO API');
  }

  // Check for API-level status code
  const statusCode = response.data.status_code;
  if (statusCode && statusCode !== 20000) {
    const statusMessage = response.data.status_message || 'Unknown error';
    throw new Error(`DataForSEO API error (${statusCode}): ${statusMessage}`);
  }

  // Check task-level status
  if (response.data.tasks && response.data.tasks[0]) {
    const task = response.data.tasks[0];
    if (task.status_code && task.status_code !== 20000) {
      const taskMessage = task.status_message || 'Unknown task error';
      throw new Error(`DataForSEO task error (${task.status_code}): ${taskMessage}`);
    }
  }
}
```

**Then update all API calls to use it:**
```typescript
const response = await axios.post(/* ... */);
checkDataForSEOResponse(response);
// Continue with response.data.tasks[0].result[0]
```

---

### 6. Use Location Codes Instead of Names
**File:** `backend/src/services/dataforseo.service.ts`
**Lines:** 223, 275

**Update Google and Bing functions to use location_code:**

```typescript
// In checkGoogleRankings() and checkBingRankings()
const payload = [
  {
    keyword: options.keyword,
    location_code: options.locationCode || 2840, // United States
    language_code: options.languageCode || 'en',
    device: options.device || 'desktop',
    os: options.device === 'mobile' ? 'android' : undefined,
    depth: options.depth || 100,
    calculate_rectangles: false,
  },
];
```

**Add location fetcher function:**
```typescript
/**
 * Get available locations for SERP API
 */
export async function getAvailableLocations(
  apiKey: string,
  searchEngine: 'google' | 'bing' | 'youtube' = 'google'
): Promise<any[]> {
  const credentials = parseApiKey(apiKey);

  const endpoint =
    searchEngine === 'google' ? '/serp/google/locations' :
    searchEngine === 'bing' ? '/serp/bing/locations' :
    '/serp/youtube/locations';

  const response = await axios.get(
    `${DATAFORSEO_API_BASE}${endpoint}`,
    {
      auth: {
        username: credentials.login,
        password: credentials.password,
      },
    }
  );

  return response.data?.tasks?.[0]?.result || [];
}
```

---

## Testing Checklist

After applying fixes:

- [ ] Test YouTube rank checking
- [ ] Test autocomplete suggestions
- [ ] Test related keywords discovery
- [ ] Verify location codes work for all search engines
- [ ] Check error handling with invalid credentials
- [ ] Verify Google Ads status check
- [ ] Test all keyword research endpoints

---

## Cost Considerations

**DataForSEO Labs API** (for Related Keywords) has different pricing than Google Ads API:
- Check pricing at: `https://dataforseo.com/apis/dataforseo-labs-api`
- Labs API typically more expensive but provides richer data
- Consider caching results to minimize API calls

---

## Documentation References

- YouTube Organic: https://docs.dataforseo.com/v3/serp/youtube/organic/live/advanced
- Google Autocomplete: https://docs.dataforseo.com/v3/serp/google/autocomplete/live/advanced
- Related Keywords: https://docs.dataforseo.com/v3/dataforseo_labs/google/related_keywords/live
- Google Ads Status: https://docs.dataforseo.com/v3/keywords_data/google_ads/status
- Locations API: https://docs.dataforseo.com/v3/serp/google/locations
