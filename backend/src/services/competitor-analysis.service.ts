import { pool } from '../config/database';
import { getKeywordIdeasFromDomain } from './dataforseo.service';
import { enrichKeywordIdeas, EnrichedKeywordIdea } from './keyword-research.service';

export interface KeywordGap {
  keyword: string;
  competitorDomain: string;
  competitorRank: number;
  projectRank: number | null; // null if not ranking
  searchVolume: number;
  difficulty: number;
  cpc: number;
  gapType: 'missing' | 'losing' | 'winning'; // missing = not ranking, losing = ranking lower, winning = ranking higher
  opportunityScore: number;
}

export interface VisibilityScore {
  domain: string;
  totalKeywords: number;
  avgPosition: number;
  visibilityScore: number; // 0-100 score based on rankings and volume
  topRankings: number; // count of top 3 rankings
  top10Rankings: number; // count of top 10 rankings
  estimatedTraffic: number; // estimated monthly traffic
}

export interface QuickWin {
  keywordId: string;
  keyword: string;
  projectRank: number;
  bestCompetitorRank: number;
  competitorDomain: string;
  rankDifference: number; // how many positions behind
  searchVolume: number;
  difficulty: number;
  cpc: number;
  potentialTrafficGain: number; // estimated traffic if ranking improved
  winScore: number; // 0-100 score for prioritization
}

export interface CompetitorOpportunity {
  type: 'keyword_gap' | 'quick_win' | 'content_gap';
  keyword: string;
  competitorDomain: string;
  priority: number; // 0-100
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  metrics: {
    searchVolume: number;
    difficulty: number;
    cpc: number;
    projectRank?: number;
    competitorRank: number;
  };
  recommendation: string;
}

/**
 * Calculate visibility score based on rankings
 * Uses weighted position scoring: position 1 = 100%, position 2 = 85%, etc.
 */
export function calculateVisibilityScore(rankings: Array<{
  position: number;
  searchVolume: number;
}>): number {
  if (rankings.length === 0) return 0;

  // Position weights (CTR approximation)
  const positionWeights: Record<number, number> = {
    1: 1.00,
    2: 0.85,
    3: 0.70,
    4: 0.55,
    5: 0.45,
    6: 0.35,
    7: 0.30,
    8: 0.25,
    9: 0.20,
    10: 0.15,
  };

  let totalWeightedVolume = 0;
  let totalVolume = 0;

  rankings.forEach(({ position, searchVolume }) => {
    const weight = positionWeights[position] || (position <= 20 ? 0.10 : 0.05);
    totalWeightedVolume += searchVolume * weight;
    totalVolume += searchVolume;
  });

  // Normalize to 0-100 scale
  return totalVolume > 0 ? Math.min(100, (totalWeightedVolume / totalVolume) * 100) : 0;
}

/**
 * Estimate traffic based on position and search volume
 */
export function estimateTraffic(position: number, searchVolume: number): number {
  const ctrByPosition: Record<number, number> = {
    1: 0.316,
    2: 0.158,
    3: 0.107,
    4: 0.074,
    5: 0.059,
    6: 0.048,
    7: 0.040,
    8: 0.034,
    9: 0.029,
    10: 0.025,
  };

  const ctr = ctrByPosition[position] || (position <= 20 ? 0.01 : 0.005);
  return Math.round(searchVolume * ctr);
}

/**
 * Perform keyword gap analysis between project and competitors
 */
export async function analyzeKeywordGap(
  projectId: string,
  competitorIds?: string[]
): Promise<KeywordGap[]> {
  // Build competitor filter
  let competitorFilter = '';
  const params: any[] = [projectId];

  if (competitorIds && competitorIds.length > 0) {
    competitorFilter = 'AND c.id = ANY($2)';
    params.push(competitorIds);
  }

  const query = `
    WITH project_domain AS (
      SELECT domain FROM projects WHERE id = $1
    ),
    project_rankings AS (
      SELECT
        k.id as keyword_id,
        k.keyword,
        k.search_volume,
        k.difficulty,
        k.cpc,
        r.position as project_rank
      FROM keywords k
      LEFT JOIN LATERAL (
        SELECT position
        FROM rankings
        WHERE keyword_id = k.id
          AND domain = (SELECT domain FROM project_domain)
        ORDER BY checked_at DESC
        LIMIT 1
      ) r ON true
      WHERE k.project_id = $1
    ),
    competitor_rankings AS (
      SELECT
        k.id as keyword_id,
        k.keyword,
        k.search_volume,
        k.difficulty,
        k.cpc,
        c.domain as competitor_domain,
        r.position as competitor_rank
      FROM keywords k
      CROSS JOIN competitors c
      LEFT JOIN LATERAL (
        SELECT position
        FROM rankings
        WHERE keyword_id = k.id
          AND domain = c.domain
        ORDER BY checked_at DESC
        LIMIT 1
      ) r ON true
      WHERE k.project_id = $1
        AND c.project_id = $1
        ${competitorFilter}
        AND r.position IS NOT NULL
    )
    SELECT
      cr.keyword,
      cr.competitor_domain as "competitorDomain",
      cr.competitor_rank as "competitorRank",
      pr.project_rank as "projectRank",
      cr.search_volume as "searchVolume",
      cr.difficulty,
      cr.cpc
    FROM competitor_rankings cr
    LEFT JOIN project_rankings pr ON cr.keyword_id = pr.keyword_id
    WHERE cr.competitor_rank <= 20
    ORDER BY
      CASE
        WHEN pr.project_rank IS NULL THEN 0
        WHEN pr.project_rank > cr.competitor_rank THEN 1
        ELSE 2
      END,
      cr.search_volume DESC,
      cr.competitor_rank ASC
  `;

  const result = await pool.query(query, params);

  // Classify gaps and calculate opportunity scores
  return result.rows.map((row) => {
    let gapType: 'missing' | 'losing' | 'winning';
    let opportunityScore: number;

    if (row.projectRank === null) {
      gapType = 'missing';
      // Higher score for missing keywords with good metrics
      opportunityScore = Math.round(
        (Math.min(100, Math.log10(row.searchVolume + 1) * 20) * 0.4) +
        ((100 - row.difficulty) * 0.3) +
        (Math.min(100, Math.log10(row.cpc * 100 + 1) * 25) * 0.2) +
        ((20 - row.competitorRank) * 0.5)
      );
    } else if (row.projectRank > row.competitorRank) {
      gapType = 'losing';
      // Score based on how far behind and keyword value
      const rankGap = row.projectRank - row.competitorRank;
      opportunityScore = Math.round(
        (Math.min(100, Math.log10(row.searchVolume + 1) * 20) * 0.4) +
        ((100 - row.difficulty) * 0.2) +
        (Math.min(100, (20 - rankGap) * 5) * 0.4)
      );
    } else {
      gapType = 'winning';
      // Lower priority, but still track
      opportunityScore = Math.round(
        (Math.min(100, Math.log10(row.searchVolume + 1) * 20) * 0.5) +
        ((100 - row.difficulty) * 0.3) +
        (row.projectRank <= 3 ? 20 : 10)
      );
    }

    return {
      ...row,
      gapType,
      opportunityScore,
    };
  });
}

/**
 * Calculate visibility scores for project and competitors
 */
export async function calculateVisibilityScores(
  projectId: string
): Promise<VisibilityScore[]> {
  const query = `
    WITH project_info AS (
      SELECT domain FROM projects WHERE id = $1
    ),
    all_domains AS (
      SELECT domain FROM project_info
      UNION
      SELECT domain FROM competitors WHERE project_id = $1
    ),
    domain_rankings AS (
      SELECT
        d.domain,
        COUNT(DISTINCT r.keyword_id) as total_keywords,
        AVG(r.position)::NUMERIC as avg_position,
        COUNT(CASE WHEN r.position <= 3 THEN 1 END) as top_rankings,
        COUNT(CASE WHEN r.position <= 10 THEN 1 END) as top10_rankings,
        json_agg(
          json_build_object(
            'position', r.position,
            'searchVolume', k.search_volume
          )
        ) as rankings_data
      FROM all_domains d
      CROSS JOIN keywords k
      LEFT JOIN LATERAL (
        SELECT position
        FROM rankings
        WHERE keyword_id = k.id
          AND domain = d.domain
        ORDER BY checked_at DESC
        LIMIT 1
      ) r ON true
      WHERE k.project_id = $1
        AND r.position IS NOT NULL
      GROUP BY d.domain
    )
    SELECT
      domain,
      total_keywords as "totalKeywords",
      ROUND(avg_position, 1)::FLOAT as "avgPosition",
      top_rankings as "topRankings",
      top10_rankings as "top10Rankings",
      rankings_data as "rankingsData"
    FROM domain_rankings
    ORDER BY total_keywords DESC, avg_position ASC
  `;

  const result = await pool.query(query, [projectId]);

  return result.rows.map((row) => {
    const rankingsData = row.rankingsData || [];
    const visibilityScore = calculateVisibilityScore(rankingsData);

    // Calculate estimated traffic
    const estimatedTraffic = rankingsData.reduce((sum: number, r: any) => {
      return sum + estimateTraffic(r.position, r.searchVolume);
    }, 0);

    return {
      domain: row.domain,
      totalKeywords: row.totalKeywords,
      avgPosition: row.avgPosition,
      visibilityScore: Math.round(visibilityScore),
      topRankings: row.topRankings,
      top10Rankings: row.top10Rankings,
      estimatedTraffic: Math.round(estimatedTraffic),
    };
  });
}

/**
 * Identify quick win opportunities
 * These are keywords where the project ranks on page 2-3 and could easily reach page 1
 */
export async function identifyQuickWins(
  projectId: string,
  options: {
    maxProjectRank?: number; // Only consider keywords ranking below this (default: 20)
    minSearchVolume?: number; // Minimum search volume (default: 100)
    maxDifficulty?: number; // Maximum difficulty (default: 70)
  } = {}
): Promise<QuickWin[]> {
  const {
    maxProjectRank = 20,
    minSearchVolume = 100,
    maxDifficulty = 70,
  } = options;

  const query = `
    WITH project_domain AS (
      SELECT domain FROM projects WHERE id = $1
    ),
    project_rankings AS (
      SELECT
        k.id as keyword_id,
        k.keyword,
        k.search_volume,
        k.difficulty,
        k.cpc,
        r.position as project_rank
      FROM keywords k
      INNER JOIN LATERAL (
        SELECT position
        FROM rankings
        WHERE keyword_id = k.id
          AND domain = (SELECT domain FROM project_domain)
        ORDER BY checked_at DESC
        LIMIT 1
      ) r ON true
      WHERE k.project_id = $1
        AND k.search_volume >= $2
        AND k.difficulty <= $3
        AND r.position > 10
        AND r.position <= $4
    ),
    best_competitor_ranks AS (
      SELECT
        pr.keyword_id,
        pr.keyword,
        pr.project_rank,
        pr.search_volume,
        pr.difficulty,
        pr.cpc,
        MIN(r.position) as best_competitor_rank,
        (array_agg(c.domain ORDER BY r.position ASC))[1] as competitor_domain
      FROM project_rankings pr
      CROSS JOIN competitors c
      LEFT JOIN LATERAL (
        SELECT position
        FROM rankings
        WHERE keyword_id = pr.keyword_id
          AND domain = c.domain
        ORDER BY checked_at DESC
        LIMIT 1
      ) r ON true
      WHERE c.project_id = $1
        AND r.position IS NOT NULL
        AND r.position < pr.project_rank
      GROUP BY pr.keyword_id, pr.keyword, pr.project_rank, pr.search_volume, pr.difficulty, pr.cpc
    )
    SELECT
      keyword_id as "keywordId",
      keyword,
      project_rank as "projectRank",
      best_competitor_rank as "bestCompetitorRank",
      competitor_domain as "competitorDomain",
      (project_rank - best_competitor_rank) as "rankDifference",
      search_volume as "searchVolume",
      difficulty,
      cpc
    FROM best_competitor_ranks
    WHERE best_competitor_rank <= 10
    ORDER BY
      (project_rank - best_competitor_rank) ASC,
      search_volume DESC
    LIMIT 100
  `;

  const result = await pool.query(query, [
    projectId,
    minSearchVolume,
    maxDifficulty,
    maxProjectRank,
  ]);

  return result.rows.map((row) => {
    // Calculate potential traffic gain
    const currentTraffic = estimateTraffic(row.projectRank, row.searchVolume);
    const potentialTraffic = estimateTraffic(row.bestCompetitorRank, row.searchVolume);
    const potentialTrafficGain = potentialTraffic - currentTraffic;

    // Calculate win score (0-100)
    // Factors: close to page 1, high volume, low difficulty, high traffic potential
    const proximityScore = Math.min(100, ((20 - row.rankDifference) / 20) * 100);
    const volumeScore = Math.min(100, Math.log10(row.searchVolume + 1) * 20);
    const difficultyScore = 100 - row.difficulty;
    const trafficScore = Math.min(100, (potentialTrafficGain / 1000) * 50);

    const winScore = Math.round(
      proximityScore * 0.3 +
      volumeScore * 0.25 +
      difficultyScore * 0.25 +
      trafficScore * 0.2
    );

    return {
      ...row,
      potentialTrafficGain,
      winScore,
    };
  });
}

/**
 * Discover competitor keywords using DataForSEO
 */
export async function discoverCompetitorKeywords(
  apiKey: string,
  competitorDomain: string,
  options: {
    locationCode?: number;
    languageCode?: string;
    limit?: number;
  } = {}
): Promise<EnrichedKeywordIdea[]> {
  // Get keywords from competitor domain
  const keywords = await getKeywordIdeasFromDomain(apiKey, competitorDomain, options);

  // Enrich with intent, questions, and scores
  return enrichKeywordIdeas(keywords);
}

/**
 * Generate prioritized competitor opportunities
 */
export async function generateCompetitorOpportunities(
  projectId: string,
  options: {
    includeGaps?: boolean;
    includeQuickWins?: boolean;
    limit?: number;
  } = {}
): Promise<CompetitorOpportunity[]> {
  const {
    includeGaps = true,
    includeQuickWins = true,
    limit = 50,
  } = options;

  const opportunities: CompetitorOpportunity[] = [];

  // Get keyword gaps
  if (includeGaps) {
    const gaps = await analyzeKeywordGap(projectId);

    gaps.slice(0, Math.floor(limit * 0.6)).forEach((gap) => {
      const opportunity: CompetitorOpportunity = {
        type: 'keyword_gap',
        keyword: gap.keyword,
        competitorDomain: gap.competitorDomain,
        priority: gap.opportunityScore,
        effort: gap.difficulty > 70 ? 'high' : gap.difficulty > 40 ? 'medium' : 'low',
        impact: gap.searchVolume > 1000 ? 'high' : gap.searchVolume > 300 ? 'medium' : 'low',
        metrics: {
          searchVolume: gap.searchVolume,
          difficulty: gap.difficulty,
          cpc: gap.cpc,
          projectRank: gap.projectRank || undefined,
          competitorRank: gap.competitorRank,
        },
        recommendation: gap.gapType === 'missing'
          ? `Create content targeting "${gap.keyword}" - competitor ranks #${gap.competitorRank}`
          : `Improve content for "${gap.keyword}" - currently #${gap.projectRank} vs competitor #${gap.competitorRank}`,
      };
      opportunities.push(opportunity);
    });
  }

  // Get quick wins
  if (includeQuickWins) {
    const quickWins = await identifyQuickWins(projectId);

    quickWins.slice(0, Math.floor(limit * 0.4)).forEach((win) => {
      const opportunity: CompetitorOpportunity = {
        type: 'quick_win',
        keyword: win.keyword,
        competitorDomain: win.competitorDomain,
        priority: win.winScore,
        effort: 'low',
        impact: win.searchVolume > 1000 ? 'high' : win.searchVolume > 300 ? 'medium' : 'low',
        metrics: {
          searchVolume: win.searchVolume,
          difficulty: win.difficulty,
          cpc: win.cpc,
          projectRank: win.projectRank,
          competitorRank: win.bestCompetitorRank,
        },
        recommendation: `Quick win: Optimize for "${win.keyword}" - you're at #${win.projectRank}, just ${win.rankDifference} positions behind #${win.bestCompetitorRank}`,
      };
      opportunities.push(opportunity);
    });
  }

  // Sort by priority and limit
  return opportunities
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}

/**
 * Compare keyword overlap between project and competitors
 */
export async function analyzeKeywordOverlap(
  projectId: string
): Promise<{
  competitorDomain: string;
  totalKeywords: number;
  sharedKeywords: number;
  overlapPercentage: number;
  uniqueToCompetitor: number;
  competitorAdvantage: number; // keywords where competitor ranks better
}[]> {
  const query = `
    WITH project_domain AS (
      SELECT domain FROM projects WHERE id = $1
    ),
    project_keywords AS (
      SELECT DISTINCT k.keyword
      FROM keywords k
      INNER JOIN rankings r ON k.id = r.keyword_id
      WHERE k.project_id = $1
        AND r.domain = (SELECT domain FROM project_domain)
    ),
    competitor_stats AS (
      SELECT
        c.domain as competitor_domain,
        COUNT(DISTINCT CASE WHEN r.position IS NOT NULL THEN k.keyword END) as total_keywords,
        COUNT(DISTINCT CASE WHEN pk.keyword IS NOT NULL AND r.position IS NOT NULL THEN k.keyword END) as shared_keywords,
        COUNT(DISTINCT CASE WHEN pk.keyword IS NULL AND r.position IS NOT NULL THEN k.keyword END) as unique_to_competitor,
        COUNT(DISTINCT CASE
          WHEN r.position IS NOT NULL
            AND pr.position IS NOT NULL
            AND r.position < pr.position
          THEN k.keyword
        END) as competitor_advantage
      FROM competitors c
      CROSS JOIN keywords k
      LEFT JOIN project_keywords pk ON k.keyword = pk.keyword
      LEFT JOIN LATERAL (
        SELECT position
        FROM rankings
        WHERE keyword_id = k.id
          AND domain = c.domain
        ORDER BY checked_at DESC
        LIMIT 1
      ) r ON true
      LEFT JOIN LATERAL (
        SELECT position
        FROM rankings
        WHERE keyword_id = k.id
          AND domain = (SELECT domain FROM project_domain)
        ORDER BY checked_at DESC
        LIMIT 1
      ) pr ON true
      WHERE c.project_id = $1
        AND k.project_id = $1
      GROUP BY c.domain
    )
    SELECT
      competitor_domain as "competitorDomain",
      total_keywords as "totalKeywords",
      shared_keywords as "sharedKeywords",
      CASE
        WHEN total_keywords > 0
        THEN ROUND((shared_keywords::FLOAT / total_keywords * 100), 1)
        ELSE 0
      END as "overlapPercentage",
      unique_to_competitor as "uniqueToCompetitor",
      competitor_advantage as "competitorAdvantage"
    FROM competitor_stats
    WHERE total_keywords > 0
    ORDER BY shared_keywords DESC
  `;

  const result = await pool.query(query, [projectId]);
  return result.rows;
}
