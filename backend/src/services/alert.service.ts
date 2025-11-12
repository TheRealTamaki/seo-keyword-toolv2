import { pool } from '../config/database';
import {
  Alert,
  AlertType,
  createAlertHistory,
  updateAlertLastTriggered,
  getEnabledAlerts,
  getNotificationPreferences,
} from '../models/alert.model';
import { sendNotification } from './notification.service';

export interface RankingChange {
  keywordId: string;
  rankingId: string;
  keyword: string;
  domain: string;
  searchEngine: string;
  deviceType: string;
  locationCode: number;
  oldPosition: number | null;
  newPosition: number | null;
  positionChange: number;
  searchVolume: number;
  serpFeatures: string[];
  competitorRankings?: Array<{
    domain: string;
    position: number;
  }>;
}

export interface AlertTrigger {
  alertId: string;
  alertName: string;
  alertType: AlertType;
  keywordId: string;
  keyword: string;
  triggerData: Record<string, any>;
  userId: string;
  projectId: string | null;
}

/**
 * Process ranking changes and trigger appropriate alerts
 */
export async function processRankingChanges(changes: RankingChange[]): Promise<void> {
  if (changes.length === 0) return;

  console.log(`Processing ${changes.length} ranking changes for alerts`);

  // Get all enabled alerts (we'll filter by project later)
  const allAlerts = await getEnabledAlerts();

  if (allAlerts.length === 0) {
    console.log('No enabled alerts to process');
    return;
  }

  // Group alerts by project for efficient processing
  const alertsByProject = new Map<string, Alert[]>();
  allAlerts.forEach((alert) => {
    const projectId = alert.projectId || 'global';
    if (!alertsByProject.has(projectId)) {
      alertsByProject.set(projectId, []);
    }
    alertsByProject.get(projectId)!.push(alert);
  });

  // Process each ranking change
  const triggeredAlerts: AlertTrigger[] = [];

  for (const change of changes) {
    // Get project ID for this keyword
    const projectId = await getProjectIdForKeyword(change.keywordId);
    const relevantAlerts = alertsByProject.get(projectId || 'global') || [];

    for (const alert of relevantAlerts) {
      // Check if this change matches the alert's filters
      if (!matchesKeywordFilters(alert, change)) {
        continue;
      }

      // Check if this change triggers the alert
      const trigger = await checkAlertConditions(alert, change);
      if (trigger) {
        triggeredAlerts.push({
          alertId: alert.id,
          alertName: alert.name,
          alertType: alert.alertType,
          keywordId: change.keywordId,
          keyword: change.keyword,
          triggerData: trigger,
          userId: alert.userId,
          projectId: alert.projectId,
        });
      }
    }
  }

  console.log(`Triggered ${triggeredAlerts.length} alerts`);

  // Process triggered alerts
  for (const trigger of triggeredAlerts) {
    await processTrigger(trigger);
  }
}

/**
 * Check if alert conditions are met for a ranking change
 */
async function checkAlertConditions(
  alert: Alert,
  change: RankingChange
): Promise<Record<string, any> | null> {
  const { alertType, conditions } = alert;

  switch (alertType) {
    case 'rank_change':
      return checkRankChange(conditions, change);

    case 'rank_improvement':
      return checkRankImprovement(conditions, change);

    case 'rank_drop':
      return checkRankDrop(conditions, change);

    case 'new_ranking':
      return checkNewRanking(conditions, change);

    case 'lost_ranking':
      return checkLostRanking(conditions, change);

    case 'serp_feature':
      return checkSerpFeature(conditions, change);

    case 'competitor_movement':
      return checkCompetitorMovement(conditions, change);

    default:
      return null;
  }
}

/**
 * Check for any rank change (up or down)
 */
function checkRankChange(
  conditions: Record<string, any>,
  change: RankingChange
): Record<string, any> | null {
  const minChange = conditions.min_position_change || 3;
  const absChange = Math.abs(change.positionChange);

  if (absChange >= minChange && change.oldPosition !== null && change.newPosition !== null) {
    return {
      oldPosition: change.oldPosition,
      newPosition: change.newPosition,
      change: change.positionChange,
      direction: change.positionChange < 0 ? 'improved' : 'declined',
      searchVolume: change.searchVolume,
      keyword: change.keyword,
      domain: change.domain,
    };
  }

  return null;
}

/**
 * Check for rank improvement (moving up)
 */
function checkRankImprovement(
  conditions: Record<string, any>,
  change: RankingChange
): Record<string, any> | null {
  const minChange = conditions.min_position_change || 3;

  if (
    change.positionChange < 0 &&
    Math.abs(change.positionChange) >= minChange &&
    change.oldPosition !== null &&
    change.newPosition !== null
  ) {
    return {
      oldPosition: change.oldPosition,
      newPosition: change.newPosition,
      improvement: Math.abs(change.positionChange),
      searchVolume: change.searchVolume,
      keyword: change.keyword,
      domain: change.domain,
    };
  }

  return null;
}

/**
 * Check for rank drop (moving down)
 */
function checkRankDrop(
  conditions: Record<string, any>,
  change: RankingChange
): Record<string, any> | null {
  const minChange = conditions.min_position_change || 3;

  if (
    change.positionChange > 0 &&
    change.positionChange >= minChange &&
    change.oldPosition !== null &&
    change.newPosition !== null
  ) {
    return {
      oldPosition: change.oldPosition,
      newPosition: change.newPosition,
      drop: change.positionChange,
      searchVolume: change.searchVolume,
      keyword: change.keyword,
      domain: change.domain,
    };
  }

  return null;
}

/**
 * Check for new ranking (wasn't ranking before, now is)
 */
function checkNewRanking(
  conditions: Record<string, any>,
  change: RankingChange
): Record<string, any> | null {
  const maxPosition = conditions.max_position || 100;

  if (
    change.oldPosition === null &&
    change.newPosition !== null &&
    change.newPosition <= maxPosition
  ) {
    return {
      position: change.newPosition,
      searchVolume: change.searchVolume,
      keyword: change.keyword,
      domain: change.domain,
      isTopResult: change.newPosition <= 10,
    };
  }

  return null;
}

/**
 * Check for lost ranking (was ranking before, now isn't)
 */
function checkLostRanking(
  conditions: Record<string, any>,
  change: RankingChange
): Record<string, any> | null {
  const wasInTop = conditions.was_in_top || 100;

  if (
    change.oldPosition !== null &&
    change.oldPosition <= wasInTop &&
    change.newPosition === null
  ) {
    return {
      oldPosition: change.oldPosition,
      searchVolume: change.searchVolume,
      keyword: change.keyword,
      domain: change.domain,
      wasTopResult: change.oldPosition <= 10,
    };
  }

  return null;
}

/**
 * Check for SERP feature appearances
 */
function checkSerpFeature(
  conditions: Record<string, any>,
  change: RankingChange
): Record<string, any> | null {
  const targetFeatures = conditions.feature_types || [];

  if (targetFeatures.length === 0 || change.serpFeatures.length === 0) {
    return null;
  }

  // Check if any target features are present
  const matchedFeatures = change.serpFeatures.filter((feature) =>
    targetFeatures.includes(feature)
  );

  if (matchedFeatures.length > 0) {
    return {
      features: matchedFeatures,
      keyword: change.keyword,
      domain: change.domain,
      position: change.newPosition,
      searchVolume: change.searchVolume,
    };
  }

  return null;
}

/**
 * Check for competitor movements
 */
function checkCompetitorMovement(
  conditions: Record<string, any>,
  change: RankingChange
): Record<string, any> | null {
  const targetCompetitors = conditions.competitor_domains || [];
  // const minChange = conditions.min_change || 5; // TODO: Use when implementing historical comparison

  if (targetCompetitors.length === 0 || !change.competitorRankings) {
    return null;
  }

  // Check if any target competitor has significant movement
  const significantMovements = change.competitorRankings.filter((comp) => {
    if (!targetCompetitors.includes(comp.domain)) return false;

    // Get their previous position (would need historical data)
    // For now, just check if they're in top positions
    return comp.position <= 10;
  });

  if (significantMovements.length > 0) {
    return {
      competitors: significantMovements,
      keyword: change.keyword,
      yourPosition: change.newPosition,
      searchVolume: change.searchVolume,
    };
  }

  return null;
}

/**
 * Check if ranking change matches alert's keyword filters
 */
function matchesKeywordFilters(alert: Alert, change: RankingChange): boolean {
  const filters = alert.keywordFilters || {};

  // Check keyword IDs filter
  if (filters.keyword_ids && filters.keyword_ids.length > 0) {
    if (!filters.keyword_ids.includes(change.keywordId)) {
      return false;
    }
  }

  // Check minimum search volume filter
  if (filters.min_search_volume && change.searchVolume < filters.min_search_volume) {
    return false;
  }

  // Check search engine filter
  if (filters.search_engines && !filters.search_engines.includes(change.searchEngine)) {
    return false;
  }

  // Check device type filter
  if (filters.device_types && !filters.device_types.includes(change.deviceType)) {
    return false;
  }

  return true;
}

/**
 * Process a triggered alert (record history and send notifications)
 */
async function processTrigger(trigger: AlertTrigger): Promise<void> {
  try {
    // Record in alert history
    const history = await createAlertHistory({
      alertId: trigger.alertId,
      keywordId: trigger.keywordId,
      alertType: trigger.alertType,
      triggerData: trigger.triggerData,
    });

    // Update alert's last triggered timestamp
    await updateAlertLastTriggered(trigger.alertId);

    // Get user's notification preferences
    const preferences = await getNotificationPreferences(trigger.userId);

    // Check quiet hours
    if (preferences.quietHoursEnabled && isInQuietHours(preferences)) {
      console.log(`Alert ${trigger.alertId} triggered during quiet hours, skipping immediate notification`);
      return;
    }

    // Send notification
    await sendNotification({
      historyId: history.id,
      alertId: trigger.alertId,
      alertName: trigger.alertName,
      alertType: trigger.alertType,
      userId: trigger.userId,
      triggerData: trigger.triggerData,
      preferences,
    });

    console.log(`Alert ${trigger.alertId} processed successfully`);
  } catch (error) {
    console.error(`Error processing alert trigger ${trigger.alertId}:`, error);
  }
}

/**
 * Check if current time is within user's quiet hours
 */
function isInQuietHours(preferences: any): boolean {
  if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
    return false;
  }

  // Simple time comparison (would need timezone handling in production)
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMin] = preferences.quietHoursStart.split(':').map(Number);
  const [endHour, endMin] = preferences.quietHoursEnd.split(':').map(Number);

  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime <= endTime;
  } else {
    // Quiet hours span midnight
    return currentTime >= startTime || currentTime <= endTime;
  }
}

/**
 * Get project ID for a keyword
 */
async function getProjectIdForKeyword(keywordId: string): Promise<string | null> {
  const query = 'SELECT project_id FROM keywords WHERE id = $1';
  const result = await pool.query(query, [keywordId]);
  return result.rows.length > 0 ? result.rows[0].project_id : null;
}

/**
 * Manually trigger alert evaluation for a specific keyword
 * (useful for testing or on-demand checks)
 */
export async function evaluateAlertsForKeyword(keywordId: string): Promise<number> {
  // Get latest two rankings for comparison
  const query = `
    SELECT k.*, r.position, r.id as ranking_id, r.serp_features, r.checked_at
    FROM keywords k
    LEFT JOIN LATERAL (
      SELECT id, position, serp_features, checked_at
      FROM rankings
      WHERE keyword_id = k.id
      ORDER BY checked_at DESC
      LIMIT 2
    ) r ON true
    WHERE k.id = $1
  `;

  const result = await pool.query(query, [keywordId]);
  if (result.rows.length < 2) {
    return 0; // Need at least 2 rankings to compare
  }

  const [current, previous] = result.rows;

  const change: RankingChange = {
    keywordId: keywordId,
    rankingId: current.ranking_id,
    keyword: current.keyword,
    domain: current.domain || '',
    searchEngine: current.search_engine || 'google',
    deviceType: current.device_type || 'desktop',
    locationCode: current.location_code || 2840,
    oldPosition: previous.position,
    newPosition: current.position,
    positionChange: (current.position || 0) - (previous.position || 0),
    searchVolume: current.search_volume || 0,
    serpFeatures: current.serp_features || [],
  };

  await processRankingChanges([change]);
  return 1;
}
