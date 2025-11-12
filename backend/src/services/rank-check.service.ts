import {
  checkGoogleRankings,
  checkBingRankings,
  checkYoutubeRankings,
  extractSerpFeatures,
  SerpTaskOptions,
  SerpResponse
} from './dataforseo.service';
import { bulkCreateRankings, CreateRankingInput } from '../models/ranking.model';
import { getKeywordById } from '../models/keyword.model';
import { getProjectById } from '../models/project.model';
import { getProjectCompetitors } from '../models/competitor.model';

export interface RankCheckRequest {
  keywordId: string;
  keyword: string;
  projectDomain: string;
  searchEngine: 'google' | 'bing' | 'youtube';
  device: 'desktop' | 'mobile';
  location: string;
  locationCode?: number;
  languageCode?: string;
}

export interface RankCheckResult {
  keywordId: string;
  keyword: string;
  searchEngine: string;
  device: string;
  location: string;
  yourRank: number | null;
  yourUrl: string | null;
  competitorRankings: Array<{
    domain: string;
    rank: number;
    url: string;
  }>;
  serpFeatures: string[];
  totalResults: number;
  checkedAt: Date;
}

export interface BulkRankCheckResult {
  success: number;
  failed: number;
  results: RankCheckResult[];
  errors: Array<{
    keywordId: string;
    error: string;
  }>;
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }
}

/**
 * Normalize domain for comparison
 */
function normalizeDomain(domain: string): string {
  return domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .toLowerCase()
    .trim();
}

/**
 * Check if a URL belongs to a specific domain
 */
function urlMatchesDomain(url: string, targetDomain: string): boolean {
  const urlDomain = normalizeDomain(extractDomain(url));
  const normalizedTarget = normalizeDomain(targetDomain);
  return urlDomain === normalizedTarget;
}

/**
 * Perform a single rank check
 */
export async function performRankCheck(
  apiKey: string,
  request: RankCheckRequest,
  competitorDomains: string[] = []
): Promise<RankCheckResult> {
  // Prepare SERP task options
  const options: SerpTaskOptions = {
    keyword: request.keyword,
    device: request.device,
    depth: 100, // Check top 100 results
  };

  // Set location based on search engine
  if (request.searchEngine === 'youtube') {
    options.locationCode = request.locationCode || 2840; // Default to United States
  } else {
    options.locationName = request.location;
  }

  if (request.languageCode) {
    options.languageCode = request.languageCode;
  }

  // Call the appropriate DataForSEO API
  let serpResponse: SerpResponse;

  try {
    switch (request.searchEngine) {
      case 'google':
        serpResponse = await checkGoogleRankings(apiKey, options);
        break;
      case 'bing':
        serpResponse = await checkBingRankings(apiKey, options);
        break;
      case 'youtube':
        serpResponse = await checkYoutubeRankings(apiKey, options);
        break;
      default:
        throw new Error(`Unsupported search engine: ${request.searchEngine}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to check rankings: ${error.message}`);
  }

  // Parse results to find rankings
  const checkedAt = new Date(serpResponse.datetime || new Date());
  let yourRank: number | null = null;
  let yourUrl: string | null = null;
  const competitorRankings: Array<{ domain: string; rank: number; url: string }> = [];

  // Extract SERP features
  const serpFeatures = extractSerpFeatures(serpResponse.items);

  // Find rankings for project domain and competitors
  for (const item of serpResponse.items) {
    if (item.type !== 'organic') continue;

    const rank = item.rank_absolute;

    // Check if this is the project's domain
    if (urlMatchesDomain(item.url, request.projectDomain)) {
      if (yourRank === null || rank < yourRank) {
        yourRank = rank;
        yourUrl = item.url;
      }
    }

    // Check if this is a competitor's domain
    for (const competitorDomain of competitorDomains) {
      if (urlMatchesDomain(item.url, competitorDomain)) {
        // Only add if we haven't seen this competitor yet (take best rank)
        const existing = competitorRankings.find(c =>
          normalizeDomain(c.domain) === normalizeDomain(competitorDomain)
        );

        if (!existing) {
          competitorRankings.push({
            domain: normalizeDomain(competitorDomain),
            rank,
            url: item.url
          });
        } else if (rank < existing.rank) {
          existing.rank = rank;
          existing.url = item.url;
        }
      }
    }
  }

  return {
    keywordId: request.keywordId,
    keyword: request.keyword,
    searchEngine: request.searchEngine,
    device: request.device,
    location: request.location,
    yourRank,
    yourUrl,
    competitorRankings,
    serpFeatures,
    totalResults: serpResponse.se_results_count || 0,
    checkedAt
  };
}

/**
 * Perform bulk rank checks
 */
export async function performBulkRankChecks(
  apiKey: string,
  userId: string,
  keywordIds: string[],
  searchEngines: string[] = ['google'],
  devices: string[] = ['desktop'],
  locations: string[] = ['United States']
): Promise<BulkRankCheckResult> {
  const results: RankCheckResult[] = [];
  const errors: Array<{ keywordId: string; error: string }> = [];
  let successCount = 0;
  let failedCount = 0;

  // Process each keyword
  for (const keywordId of keywordIds) {
    try {
      // Get keyword data
      const keyword = await getKeywordById(keywordId);
      if (!keyword) {
        errors.push({ keywordId, error: 'Keyword not found' });
        failedCount++;
        continue;
      }

      // Get project data
      const project = await getProjectById(keyword.projectId, userId);
      if (!project) {
        errors.push({ keywordId, error: 'Project not found' });
        failedCount++;
        continue;
      }

      // Get competitors
      const competitors = await getProjectCompetitors(keyword.projectId);
      const competitorDomains = competitors.map(c => c.domain);

      // Check rankings for each combination of search engine, device, and location
      for (const searchEngine of searchEngines) {
        for (const device of devices) {
          for (const location of locations) {
            try {
              const request: RankCheckRequest = {
                keywordId: keyword.id,
                keyword: keyword.keyword,
                projectDomain: project.domain,
                searchEngine: searchEngine as 'google' | 'bing' | 'youtube',
                device: device as 'desktop' | 'mobile',
                location
              };

              const result = await performRankCheck(apiKey, request, competitorDomains);
              results.push(result);
              successCount++;

              // Small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error: any) {
              errors.push({
                keywordId,
                error: `${searchEngine}/${device}/${location}: ${error.message}`
              });
              failedCount++;
            }
          }
        }
      }
    } catch (error: any) {
      errors.push({ keywordId, error: error.message });
      failedCount++;
    }
  }

  return {
    success: successCount,
    failed: failedCount,
    results,
    errors
  };
}

/**
 * Store rank check results in the database
 */
export async function storeRankCheckResults(results: RankCheckResult[]): Promise<number> {
  const rankings: CreateRankingInput[] = [];

  for (const result of results) {
    // Store the project's ranking
    if (result.yourRank !== null) {
      rankings.push({
        keywordId: result.keywordId,
        domain: extractDomain(result.yourUrl || ''),
        rank: result.yourRank,
        url: result.yourUrl || undefined,
        searchEngine: result.searchEngine as 'google' | 'bing' | 'youtube',
        device: result.device as 'desktop' | 'mobile',
        location: result.location,
        serpFeatures: result.serpFeatures,
        checkedAt: result.checkedAt
      });
    }

    // Store competitor rankings
    for (const competitor of result.competitorRankings) {
      rankings.push({
        keywordId: result.keywordId,
        domain: competitor.domain,
        rank: competitor.rank,
        url: competitor.url,
        searchEngine: result.searchEngine as 'google' | 'bing' | 'youtube',
        device: result.device as 'desktop' | 'mobile',
        location: result.location,
        serpFeatures: result.serpFeatures,
        checkedAt: result.checkedAt
      });
    }
  }

  if (rankings.length === 0) return 0;

  return await bulkCreateRankings(rankings);
}
