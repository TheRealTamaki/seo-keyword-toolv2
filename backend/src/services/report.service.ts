import { pool } from '../config/database';

export interface ReportConfig {
  title?: string;
  subtitle?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  sections?: string[];
  includeCharts?: boolean;
  branding?: {
    companyName?: string;
    logoUrl?: string;
    primaryColor?: string;
    websiteUrl?: string;
  };
}

export interface ReportData {
  project?: any;
  keywords?: any[];
  rankings?: any[];
  competitors?: any[];
  gaps?: any[];
  quickWins?: any[];
  visibility?: any[];
  summary?: Record<string, any>;
}

export type ReportType =
  | 'ranking_performance'
  | 'keyword_research'
  | 'competitor_analysis'
  | 'project_overview'
  | 'custom';

/**
 * Generate a comprehensive report in HTML format
 * (Can be converted to PDF using Puppeteer or similar)
 */
export async function generateHTMLReport(
  reportType: ReportType,
  data: ReportData,
  _config: ReportConfig = {}
): Promise<string> {
  const {
    title = 'SEO Report',
    subtitle = 'Keyword Ranking and Analysis',
    branding = {},
  } = config;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      background: #fff;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      margin: 0 auto;
      background: white;
    }

    .header {
      border-bottom: 3px solid ${branding.primaryColor || '#007bff'};
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .header h1 {
      color: ${branding.primaryColor || '#007bff'};
      font-size: 28px;
      margin-bottom: 5px;
    }

    .header h2 {
      color: #666;
      font-size: 16px;
      font-weight: normal;
    }

    .branding {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .branding .company {
      font-size: 18px;
      font-weight: bold;
      color: ${branding.primaryColor || '#007bff'};
    }

    .branding .date {
      color: #666;
      font-size: 12px;
    }

    .section {
      margin-bottom: 30px;
    }

    .section h3 {
      color: ${branding.primaryColor || '#007bff'};
      font-size: 18px;
      margin-bottom: 15px;
      border-bottom: 2px solid #eee;
      padding-bottom: 5px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }

    .summary-card {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      border-left: 4px solid ${branding.primaryColor || '#007bff'};
    }

    .summary-card .value {
      font-size: 24px;
      font-weight: bold;
      color: ${branding.primaryColor || '#007bff'};
      margin-bottom: 5px;
    }

    .summary-card .label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }

    th {
      background: ${branding.primaryColor || '#007bff'};
      color: white;
      padding: 10px;
      text-align: left;
      font-weight: 600;
    }

    td {
      padding: 10px;
      border-bottom: 1px solid #eee;
    }

    tr:hover {
      background: #f8f9fa;
    }

    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
    }

    .badge-success {
      background: #28a745;
      color: white;
    }

    .badge-warning {
      background: #ffc107;
      color: #333;
    }

    .badge-danger {
      background: #dc3545;
      color: white;
    }

    .badge-info {
      background: #17a2b8;
      color: white;
    }

    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #eee;
      text-align: center;
      color: #666;
      font-size: 10px;
    }

    .chart-placeholder {
      background: #f8f9fa;
      padding: 40px;
      text-align: center;
      color: #999;
      border: 2px dashed #ddd;
      border-radius: 5px;
      margin: 20px 0;
    }

    @media print {
      .page {
        margin: 0;
        border: none;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    ${branding.companyName ? `
    <div class="branding">
      <div class="company">${branding.companyName}</div>
      <div class="date">Generated on ${new Date().toLocaleDateString()}</div>
    </div>
    ` : ''}

    <div class="header">
      <h1>${title}</h1>
      <h2>${subtitle}</h2>
      ${config.dateRange ? `
        <p style="margin-top: 10px; color: #666;">
          Period: ${new Date(config.dateRange.start).toLocaleDateString()} - ${new Date(config.dateRange.end).toLocaleDateString()}
        </p>
      ` : ''}
    </div>

    ${generateReportContent(reportType, data, config)}

    <div class="footer">
      <p>Generated by SEO Keyword Tool${branding.websiteUrl ? ` | ${branding.websiteUrl}` : ''}</p>
      <p>Report Date: ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Generate report content based on report type
 */
function generateReportContent(
  reportType: ReportType,
  data: ReportData,
  _config: ReportConfig
): string {
  switch (reportType) {
    case 'ranking_performance':
      return generateRankingPerformanceContent(data, config);

    case 'keyword_research':
      return generateKeywordResearchContent(data, config);

    case 'competitor_analysis':
      return generateCompetitorAnalysisContent(data, config);

    case 'project_overview':
      return generateProjectOverviewContent(data, config);

    default:
      return '<p>Report type not implemented</p>';
  }
}

/**
 * Generate ranking performance report content
 */
function generateRankingPerformanceContent(data: ReportData, _config: ReportConfig): string {
  const { summary = {}, rankings = [] } = data;

  return `
    <div class="section">
      <h3>Executive Summary</h3>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="value">${summary.totalKeywords || 0}</div>
          <div class="label">Total Keywords</div>
        </div>
        <div class="summary-card">
          <div class="value">${summary.avgPosition || 'N/A'}</div>
          <div class="label">Average Position</div>
        </div>
        <div class="summary-card">
          <div class="value">${summary.top10Keywords || 0}</div>
          <div class="label">Top 10 Rankings</div>
        </div>
        <div class="summary-card">
          <div class="value">${summary.improvements || 0}</div>
          <div class="label">Improvements</div>
        </div>
      </div>
    </div>

    ${config.includeCharts ? `
    <div class="section">
      <h3>Ranking Trend</h3>
      <div class="chart-placeholder">
        [Chart: Ranking trends over time would be rendered here]
      </div>
    </div>
    ` : ''}

    <div class="section">
      <h3>Top Performing Keywords</h3>
      <table>
        <thead>
          <tr>
            <th>Keyword</th>
            <th>Position</th>
            <th>Search Volume</th>
            <th>Change</th>
            <th>URL</th>
          </tr>
        </thead>
        <tbody>
          ${rankings.slice(0, 20).map((r) => `
            <tr>
              <td>${r.keyword}</td>
              <td><span class="badge ${r.position <= 3 ? 'badge-success' : r.position <= 10 ? 'badge-info' : 'badge-warning'}">${r.position}</span></td>
              <td>${r.search_volume || 0}</td>
              <td>
                ${r.change ? (r.change < 0 ? `<span class="badge badge-success">↑ ${Math.abs(r.change)}</span>` : `<span class="badge badge-danger">↓ ${r.change}</span>`) : '-'}
              </td>
              <td style="font-size: 10px; max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${r.url || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Generate keyword research report content
 */
function generateKeywordResearchContent(data: ReportData, _config: ReportConfig): string {
  const { keywords = [], summary = {} } = data;

  return `
    <div class="section">
      <h3>Keyword Research Summary</h3>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="value">${keywords.length}</div>
          <div class="label">Total Keywords</div>
        </div>
        <div class="summary-card">
          <div class="value">${summary.avgSearchVolume || 0}</div>
          <div class="label">Avg Search Volume</div>
        </div>
        <div class="summary-card">
          <div class="value">${summary.avgDifficulty || 0}</div>
          <div class="label">Avg Difficulty</div>
        </div>
        <div class="summary-card">
          <div class="value">${summary.highOpportunity || 0}</div>
          <div class="label">High Opportunity</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h3>Top Keyword Opportunities</h3>
      <table>
        <thead>
          <tr>
            <th>Keyword</th>
            <th>Search Volume</th>
            <th>Difficulty</th>
            <th>CPC</th>
            <th>Intent</th>
            <th>Opportunity Score</th>
          </tr>
        </thead>
        <tbody>
          ${keywords.slice(0, 30).map((k) => `
            <tr>
              <td>${k.keyword}</td>
              <td>${k.search_volume || 0}</td>
              <td><span class="badge ${k.difficulty < 30 ? 'badge-success' : k.difficulty < 60 ? 'badge-warning' : 'badge-danger'}">${k.difficulty || 0}</span></td>
              <td>$${k.cpc || 0}</td>
              <td><span class="badge badge-info">${k.intent || 'N/A'}</span></td>
              <td><strong>${k.opportunity_score || 0}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Generate competitor analysis report content
 */
function generateCompetitorAnalysisContent(data: ReportData, _config: ReportConfig): string {
  const { gaps = [], quickWins = [], visibility = [], summary = {} } = data;

  return `
    <div class="section">
      <h3>Competitive Landscape</h3>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="value">${gaps.length}</div>
          <div class="label">Keyword Gaps</div>
        </div>
        <div class="summary-card">
          <div class="value">${quickWins.length}</div>
          <div class="label">Quick Wins</div>
        </div>
        <div class="summary-card">
          <div class="value">${summary.yourVisibility || 0}</div>
          <div class="label">Your Visibility</div>
        </div>
        <div class="summary-card">
          <div class="value">${summary.competitorAvg || 0}</div>
          <div class="label">Competitor Avg</div>
        </div>
      </div>
    </div>

    ${visibility.length > 0 ? `
    <div class="section">
      <h3>Visibility Comparison</h3>
      <table>
        <thead>
          <tr>
            <th>Domain</th>
            <th>Visibility Score</th>
            <th>Avg Position</th>
            <th>Traffic Estimate</th>
          </tr>
        </thead>
        <tbody>
          ${visibility.map((v) => `
            <tr>
              <td>${v.domain}</td>
              <td><strong>${v.visibilityScore}</strong></td>
              <td>${v.avgPosition}</td>
              <td>${v.estimatedTraffic}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    ${quickWins.length > 0 ? `
    <div class="section">
      <h3>Quick Win Opportunities</h3>
      <table>
        <thead>
          <tr>
            <th>Keyword</th>
            <th>Your Position</th>
            <th>Search Volume</th>
            <th>Traffic Potential</th>
            <th>Win Score</th>
          </tr>
        </thead>
        <tbody>
          ${quickWins.slice(0, 15).map((w) => `
            <tr>
              <td>${w.keyword}</td>
              <td><span class="badge badge-warning">${w.currentRank}</span></td>
              <td>${w.searchVolume}</td>
              <td>${w.potentialTrafficGain}</td>
              <td><strong>${w.winScore}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}
  `;
}

/**
 * Generate project overview report content
 */
function generateProjectOverviewContent(data: ReportData, _config: ReportConfig): string {
  const { project = {}, summary = {} } = data;

  return `
    <div class="section">
      <h3>Project Information</h3>
      <table>
        <tr>
          <td style="font-weight: bold; width: 200px;">Project Name</td>
          <td>${project.name}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Domain</td>
          <td>${project.domain}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Description</td>
          <td>${project.description || 'N/A'}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Created</td>
          <td>${new Date(project.created_at).toLocaleDateString()}</td>
        </tr>
      </table>
    </div>

    <div class="section">
      <h3>Overall Performance</h3>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="value">${summary.totalKeywords || 0}</div>
          <div class="label">Keywords Tracked</div>
        </div>
        <div class="summary-card">
          <div class="value">${summary.totalCompetitors || 0}</div>
          <div class="label">Competitors</div>
        </div>
        <div class="summary-card">
          <div class="value">${summary.avgPosition || 'N/A'}</div>
          <div class="label">Avg Position</div>
        </div>
        <div class="summary-card">
          <div class="value">${summary.estimatedTraffic || 0}</div>
          <div class="label">Est. Traffic</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Fetch report data from database
 */
export async function fetchReportData(
  reportType: ReportType,
  _projectId: string,
  dateRange?: { start: Date; end: Date }
): Promise<ReportData> {
  const data: ReportData = {};

  // Fetch project info
  const projectQuery = 'SELECT * FROM projects WHERE id = $1';
  const projectResult = await pool.query(projectQuery, [projectId]);
  data.project = projectResult.rows[0];

  switch (reportType) {
    case 'ranking_performance':
      data.rankings = await fetchRankingData(projectId, dateRange);
      data.summary = await calculateRankingSummary(projectId, dateRange);
      break;

    case 'keyword_research':
      data.keywords = await fetchKeywordData(projectId);
      data.summary = await calculateKeywordSummary(projectId);
      break;

    case 'competitor_analysis':
      data.gaps = await fetchKeywordGaps(projectId);
      data.quickWins = await fetchQuickWins(projectId);
      data.visibility = await fetchVisibilityData(projectId);
      data.summary = await calculateCompetitorSummary(projectId);
      break;

    case 'project_overview':
      data.summary = await calculateProjectSummary(projectId);
      break;
  }

  return data;
}

// Helper functions to fetch specific data
async function fetchRankingData(_projectId: string, dateRange?: any) {
  const query = `
    SELECT k.keyword, k.search_volume, r.position, r.url, r.checked_at
    FROM rankings r
    INNER JOIN keywords k ON r.keyword_id = k.id
    WHERE k.project_id = $1
    ORDER BY r.checked_at DESC, r.position ASC
    LIMIT 100
  `;
  const result = await pool.query(query, [projectId]);
  return result.rows;
}

async function fetchKeywordData(projectId: string) {
  const query = `
    SELECT * FROM keywords
    WHERE project_id = $1
    ORDER BY search_volume DESC
    LIMIT 100
  `;
  const result = await pool.query(query, [projectId]);
  return result.rows;
}

async function fetchKeywordGaps(projectId: string) {
  // Placeholder - would integrate with competitor-analysis.service
  return [];
}

async function fetchQuickWins(projectId: string) {
  // Placeholder - would integrate with competitor-analysis.service
  return [];
}

async function fetchVisibilityData(projectId: string) {
  // Placeholder - would integrate with competitor-analysis.service
  return [];
}

async function calculateRankingSummary(_projectId: string, dateRange?: any) {
  const query = `
    SELECT
      COUNT(DISTINCT k.id) as "totalKeywords",
      ROUND(AVG(r.position), 1) as "avgPosition",
      COUNT(*) FILTER (WHERE r.position <= 10) as "top10Keywords",
      COUNT(*) FILTER (WHERE r.position < 20) as improvements
    FROM keywords k
    LEFT JOIN rankings r ON k.id = r.keyword_id
    WHERE k.project_id = $1
  `;
  const result = await pool.query(query, [projectId]);
  return result.rows[0];
}

async function calculateKeywordSummary(projectId: string) {
  const query = `
    SELECT
      ROUND(AVG(search_volume), 0) as "avgSearchVolume",
      ROUND(AVG(difficulty), 0) as "avgDifficulty",
      COUNT(*) FILTER (WHERE difficulty < 30) as "highOpportunity"
    FROM keywords
    WHERE project_id = $1
  `;
  const result = await pool.query(query, [projectId]);
  return result.rows[0];
}

async function calculateCompetitorSummary(projectId: string) {
  return {
    yourVisibility: 0,
    competitorAvg: 0,
  };
}

async function calculateProjectSummary(projectId: string) {
  const query = `
    SELECT
      COUNT(DISTINCT k.id) as "totalKeywords",
      COUNT(DISTINCT c.id) as "totalCompetitors",
      ROUND(AVG(r.position), 1) as "avgPosition"
    FROM projects p
    LEFT JOIN keywords k ON k.project_id = p.id
    LEFT JOIN competitors c ON c.project_id = p.id
    LEFT JOIN rankings r ON r.keyword_id = k.id
    WHERE p.id = $1
    GROUP BY p.id
  `;
  const result = await pool.query(query, [projectId]);
  return result.rows[0] || {};
}
