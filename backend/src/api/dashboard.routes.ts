import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { pool } from '../config/database';

const router = Router();

// Get dashboard stats
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    // Get total projects
    const projectsResult = await pool.query(
      'SELECT COUNT(*) as count FROM projects WHERE user_id = $1',
      [userId]
    );
    const totalProjects = parseInt(projectsResult.rows[0]?.count || '0');

    // Get total keywords
    const keywordsResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM keywords k
       JOIN projects p ON k.project_id = p.id
       WHERE p.user_id = $1`,
      [userId]
    );
    const totalKeywords = parseInt(keywordsResult.rows[0]?.count || '0');

    // Get tracked keywords (with rankings)
    const trackedResult = await pool.query(
      `SELECT COUNT(DISTINCT k.id) as count
       FROM keywords k
       JOIN projects p ON k.project_id = p.id
       JOIN rankings r ON k.id = r.keyword_id
       WHERE p.user_id = $1`,
      [userId]
    );
    const trackedKeywords = parseInt(trackedResult.rows[0]?.count || '0');

    // Get average rank
    const avgRankResult = await pool.query(
      `SELECT AVG(r.rank) as avg_rank
       FROM (
         SELECT DISTINCT ON (keyword_id) rank, keyword_id
         FROM rankings
         WHERE keyword_id IN (
           SELECT k.id FROM keywords k
           JOIN projects p ON k.project_id = p.id
           WHERE p.user_id = $1
         )
         ORDER BY keyword_id, checked_at DESC
       ) r`,
      [userId]
    );
    const avgRank = avgRankResult.rows[0]?.avg_rank
      ? parseFloat(avgRankResult.rows[0].avg_rank).toFixed(1)
      : null;

    // Get total competitors
    const competitorsResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM competitors c
       JOIN projects p ON c.project_id = p.id
       WHERE p.user_id = $1`,
      [userId]
    );
    const totalCompetitors = parseInt(competitorsResult.rows[0]?.count || '0');

    // Get total alerts
    const alertsResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM alerts a
       WHERE a.user_id = $1 AND a.is_active = true`,
      [userId]
    );
    const totalAlerts = parseInt(alertsResult.rows[0]?.count || '0');

    res.json({
      success: true,
      data: {
        totalProjects,
        totalKeywords,
        trackedKeywords,
        avgRank: avgRank ? parseFloat(avgRank) : null,
        totalCompetitors,
        totalAlerts,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
  }
});

// Get recent ranking changes (last 24 hours)
router.get('/recent-changes', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await pool.query(
      `SELECT
        k.id as keyword_id,
        k.keyword,
        p.id as project_id,
        p.name as project_name,
        r.rank as current_rank,
        LAG(r.rank) OVER (PARTITION BY k.id ORDER BY r.checked_at) as previous_rank,
        r.rank - LAG(r.rank) OVER (PARTITION BY k.id ORDER BY r.checked_at) as change,
        r.checked_at
       FROM rankings r
       JOIN keywords k ON r.keyword_id = k.id
       JOIN projects p ON k.project_id = p.id
       WHERE p.user_id = $1
         AND r.checked_at >= NOW() - INTERVAL '24 hours'
       ORDER BY r.checked_at DESC
       LIMIT $2`,
      [userId, limit * 2] // Get more to filter out nulls
    );

    // Filter out first rankings (where previous_rank is null) and limit
    const changes = result.rows
      .filter((row) => row.previous_rank !== null && row.change !== 0)
      .slice(0, limit)
      .map((row) => ({
        keywordId: row.keyword_id,
        keyword: row.keyword,
        projectId: row.project_id,
        projectName: row.project_name,
        currentRank: row.current_rank,
        previousRank: row.previous_rank,
        change: row.change,
        checkedAt: row.checked_at,
      }));

    res.json({
      success: true,
      data: changes,
    });
  } catch (error) {
    console.error('Error fetching recent changes:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recent changes' });
  }
});

// Get project overview stats
router.get('/projects-overview', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 5;

    // Get projects with stats
    const result = await pool.query(
      `SELECT
        p.id,
        p.name,
        p.domain,
        p.description,
        p.created_at,
        p.updated_at,
        COUNT(DISTINCT k.id) as keyword_count,
        COUNT(DISTINCT r.keyword_id) as tracked_count,
        AVG(latest_ranks.rank) as avg_rank,
        COUNT(DISTINCT c.id) as competitor_count
       FROM projects p
       LEFT JOIN keywords k ON p.id = k.project_id
       LEFT JOIN competitors c ON p.id = c.project_id
       LEFT JOIN (
         SELECT DISTINCT ON (keyword_id) keyword_id, rank
         FROM rankings
         ORDER BY keyword_id, checked_at DESC
       ) latest_ranks ON k.id = latest_ranks.keyword_id
       LEFT JOIN rankings r ON k.id = r.keyword_id
       WHERE p.user_id = $1
       GROUP BY p.id, p.name, p.domain, p.description, p.created_at, p.updated_at
       ORDER BY p.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    const projects = result.rows.map((row) => ({
      project: {
        id: row.id,
        name: row.name,
        domain: row.domain,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
      keywordCount: parseInt(row.keyword_count),
      trackedCount: parseInt(row.tracked_count),
      avgRank: row.avg_rank ? parseFloat(row.avg_rank) : null,
      competitorCount: parseInt(row.competitor_count),
    }));

    res.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error('Error fetching projects overview:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch projects overview' });
  }
});

// Get top ranking keywords
router.get('/top-keywords', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await pool.query(
      `SELECT
        k.id as keyword_id,
        k.keyword,
        p.id as project_id,
        p.name as project_name,
        latest.rank,
        previous.rank as previous_rank,
        latest.url,
        latest.search_engine
       FROM keywords k
       JOIN projects p ON k.project_id = p.id
       JOIN LATERAL (
         SELECT rank, url, search_engine, checked_at
         FROM rankings
         WHERE keyword_id = k.id
         ORDER BY checked_at DESC
         LIMIT 1
       ) latest ON true
       LEFT JOIN LATERAL (
         SELECT rank
         FROM rankings
         WHERE keyword_id = k.id AND checked_at < latest.checked_at
         ORDER BY checked_at DESC
         LIMIT 1
       ) previous ON true
       WHERE p.user_id = $1
       ORDER BY latest.rank ASC
       LIMIT $2`,
      [userId, limit]
    );

    const keywords = result.rows.map((row) => ({
      keywordId: row.keyword_id,
      keyword: row.keyword,
      projectId: row.project_id,
      projectName: row.project_name,
      rank: row.rank,
      previousRank: row.previous_rank,
      url: row.url,
      searchEngine: row.search_engine,
    }));

    res.json({
      success: true,
      data: keywords,
    });
  } catch (error) {
    console.error('Error fetching top keywords:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch top keywords' });
  }
});

// Get worst ranking keywords (opportunities to improve)
router.get('/worst-keywords', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await pool.query(
      `SELECT
        k.id as keyword_id,
        k.keyword,
        p.id as project_id,
        p.name as project_name,
        latest.rank,
        previous.rank as previous_rank,
        latest.url,
        latest.search_engine
       FROM keywords k
       JOIN projects p ON k.project_id = p.id
       JOIN LATERAL (
         SELECT rank, url, search_engine, checked_at
         FROM rankings
         WHERE keyword_id = k.id
         ORDER BY checked_at DESC
         LIMIT 1
       ) latest ON true
       LEFT JOIN LATERAL (
         SELECT rank
         FROM rankings
         WHERE keyword_id = k.id AND checked_at < latest.checked_at
         ORDER BY checked_at DESC
         LIMIT 1
       ) previous ON true
       WHERE p.user_id = $1 AND latest.rank > 10
       ORDER BY latest.rank DESC
       LIMIT $2`,
      [userId, limit]
    );

    const keywords = result.rows.map((row) => ({
      keywordId: row.keyword_id,
      keyword: row.keyword,
      projectId: row.project_id,
      projectName: row.project_name,
      rank: row.rank,
      previousRank: row.previous_rank,
      url: row.url,
      searchEngine: row.search_engine,
    }));

    res.json({
      success: true,
      data: keywords,
    });
  } catch (error) {
    console.error('Error fetching worst keywords:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch worst keywords' });
  }
});

module.exports = router;
