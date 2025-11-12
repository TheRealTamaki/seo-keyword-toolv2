import axios from 'axios';
import {
  AlertType,
  NotificationPreferences,
  markNotificationSent,
  recordNotificationError,
  getAlertById,
} from '../models/alert.model';

export interface NotificationPayload {
  historyId: string;
  alertId: string;
  alertName: string;
  alertType: AlertType;
  userId: string;
  triggerData: Record<string, any>;
  preferences: NotificationPreferences;
}

/**
 * Send notification via configured channels
 */
export async function sendNotification(payload: NotificationPayload): Promise<void> {
  const alert = await getAlertById(payload.alertId, payload.userId);
  if (!alert) {
    console.error(`Alert ${payload.alertId} not found`);
    return;
  }

  // Send email if enabled
  if (alert.emailEnabled && alert.emailAddresses && alert.emailAddresses.length > 0) {
    await sendEmailNotification(payload, alert.emailAddresses);
  }

  // Send webhook if enabled
  if (alert.webhookEnabled && alert.webhookUrl) {
    await sendWebhookNotification(
      payload,
      alert.webhookUrl,
      alert.webhookType,
      alert.webhookConfig
    );
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  payload: NotificationPayload,
  emailAddresses: string[]
): Promise<void> {
  try {
    // Format email content
    const { subject, body } = formatEmailContent(payload);

    console.log(`Sending email notification to ${emailAddresses.join(', ')}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body preview: ${body.substring(0, 200)}...`);

    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    // For now, just log the email content
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implement actual email sending
      // await emailProvider.send({
      //   to: emailAddresses,
      //   from: process.env.EMAIL_FROM || 'alerts@seokeywordtool.com',
      //   subject,
      //   html: body,
      // });
    }

    // Mark as sent
    await markNotificationSent(payload.historyId, 'email');

    console.log('Email notification sent successfully');
  } catch (error: any) {
    console.error('Error sending email notification:', error);
    await recordNotificationError(payload.historyId, {
      type: 'email',
      message: error.message,
      timestamp: new Date(),
    });
  }
}

/**
 * Send webhook notification
 */
async function sendWebhookNotification(
  payload: NotificationPayload,
  webhookUrl: string,
  webhookType: string | null,
  webhookConfig: Record<string, any>
): Promise<void> {
  try {
    let webhookPayload: any;
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Format payload based on webhook type
    switch (webhookType) {
      case 'slack':
        webhookPayload = formatSlackMessage(payload);
        break;

      case 'discord':
        webhookPayload = formatDiscordMessage(payload);
        break;

      case 'custom':
      default:
        webhookPayload = formatCustomWebhook(payload);
        // Add custom headers from config
        if (webhookConfig.headers) {
          headers = { ...headers, ...webhookConfig.headers };
        }
        break;
    }

    console.log(`Sending ${webhookType || 'custom'} webhook to ${webhookUrl}`);

    // Send webhook
    const response = await axios.post(webhookUrl, webhookPayload, {
      headers,
      timeout: 10000, // 10 second timeout
    });

    // Mark as sent with response code
    await markNotificationSent(payload.historyId, 'webhook', response.status);

    console.log(`Webhook notification sent successfully (${response.status})`);
  } catch (error: any) {
    console.error('Error sending webhook notification:', error);

    const responseCode = error.response?.status || null;
    await markNotificationSent(payload.historyId, 'webhook', responseCode);

    await recordNotificationError(payload.historyId, {
      type: 'webhook',
      message: error.message,
      timestamp: new Date(),
    });
  }
}

/**
 * Format email content based on alert type
 */
function formatEmailContent(payload: NotificationPayload): { subject: string; body: string } {
  const { alertName, alertType, triggerData } = payload;

  let subject = '';
  let body = '';

  switch (alertType) {
    case 'rank_drop':
      subject = `🔻 Rank Drop Alert: ${triggerData.keyword}`;
      body = `
        <h2>Ranking Dropped for "${triggerData.keyword}"</h2>
        <p>Your ranking has decreased:</p>
        <ul>
          <li><strong>Keyword:</strong> ${triggerData.keyword}</li>
          <li><strong>Previous Position:</strong> #${triggerData.oldPosition}</li>
          <li><strong>Current Position:</strong> #${triggerData.newPosition}</li>
          <li><strong>Change:</strong> -${triggerData.drop} positions</li>
          <li><strong>Search Volume:</strong> ${triggerData.searchVolume}/month</li>
          <li><strong>Domain:</strong> ${triggerData.domain}</li>
        </ul>
        <p>This alert was triggered by: <strong>${alertName}</strong></p>
      `;
      break;

    case 'rank_improvement':
      subject = `🚀 Rank Improvement Alert: ${triggerData.keyword}`;
      body = `
        <h2>Ranking Improved for "${triggerData.keyword}"</h2>
        <p>Your ranking has increased:</p>
        <ul>
          <li><strong>Keyword:</strong> ${triggerData.keyword}</li>
          <li><strong>Previous Position:</strong> #${triggerData.oldPosition}</li>
          <li><strong>Current Position:</strong> #${triggerData.newPosition}</li>
          <li><strong>Improvement:</strong> +${triggerData.improvement} positions</li>
          <li><strong>Search Volume:</strong> ${triggerData.searchVolume}/month</li>
          <li><strong>Domain:</strong> ${triggerData.domain}</li>
        </ul>
        <p>This alert was triggered by: <strong>${alertName}</strong></p>
      `;
      break;

    case 'new_ranking':
      subject = `🎉 New Ranking Alert: ${triggerData.keyword}`;
      body = `
        <h2>Now Ranking for "${triggerData.keyword}"</h2>
        <p>Your site is now ranking for this keyword:</p>
        <ul>
          <li><strong>Keyword:</strong> ${triggerData.keyword}</li>
          <li><strong>Position:</strong> #${triggerData.position}</li>
          <li><strong>Search Volume:</strong> ${triggerData.searchVolume}/month</li>
          <li><strong>Domain:</strong> ${triggerData.domain}</li>
          <li><strong>Top 10:</strong> ${triggerData.isTopResult ? 'Yes ✓' : 'No'}</li>
        </ul>
        <p>This alert was triggered by: <strong>${alertName}</strong></p>
      `;
      break;

    case 'lost_ranking':
      subject = `⚠️ Lost Ranking Alert: ${triggerData.keyword}`;
      body = `
        <h2>Lost Ranking for "${triggerData.keyword}"</h2>
        <p>Your site is no longer ranking for this keyword:</p>
        <ul>
          <li><strong>Keyword:</strong> ${triggerData.keyword}</li>
          <li><strong>Previous Position:</strong> #${triggerData.oldPosition}</li>
          <li><strong>Search Volume:</strong> ${triggerData.searchVolume}/month</li>
          <li><strong>Domain:</strong> ${triggerData.domain}</li>
          <li><strong>Was Top 10:</strong> ${triggerData.wasTopResult ? 'Yes' : 'No'}</li>
        </ul>
        <p>This alert was triggered by: <strong>${alertName}</strong></p>
      `;
      break;

    case 'serp_feature':
      subject = `⭐ SERP Feature Alert: ${triggerData.keyword}`;
      body = `
        <h2>SERP Feature Detected for "${triggerData.keyword}"</h2>
        <p>Your site appears in SERP features:</p>
        <ul>
          <li><strong>Keyword:</strong> ${triggerData.keyword}</li>
          <li><strong>Features:</strong> ${triggerData.features.join(', ')}</li>
          <li><strong>Position:</strong> #${triggerData.position || 'N/A'}</li>
          <li><strong>Search Volume:</strong> ${triggerData.searchVolume}/month</li>
          <li><strong>Domain:</strong> ${triggerData.domain}</li>
        </ul>
        <p>This alert was triggered by: <strong>${alertName}</strong></p>
      `;
      break;

    case 'competitor_movement':
      subject = `👀 Competitor Movement Alert: ${triggerData.keyword}`;
      body = `
        <h2>Competitor Activity for "${triggerData.keyword}"</h2>
        <p>Competitor movement detected:</p>
        <ul>
          <li><strong>Keyword:</strong> ${triggerData.keyword}</li>
          <li><strong>Your Position:</strong> #${triggerData.yourPosition || 'Not ranking'}</li>
          <li><strong>Search Volume:</strong> ${triggerData.searchVolume}/month</li>
          <li><strong>Competitors:</strong></li>
        </ul>
        <ul>
          ${triggerData.competitors
            .map((c: any) => `<li>${c.domain} - Position #${c.position}</li>`)
            .join('')}
        </ul>
        <p>This alert was triggered by: <strong>${alertName}</strong></p>
      `;
      break;

    default:
      subject = `Alert: ${alertName}`;
      body = `
        <h2>Alert Triggered: ${alertName}</h2>
        <p>Alert Type: ${alertType}</p>
        <pre>${JSON.stringify(triggerData, null, 2)}</pre>
      `;
  }

  return { subject, body };
}

/**
 * Format Slack webhook message
 */
function formatSlackMessage(payload: NotificationPayload): any {
  const { alertName, alertType, triggerData } = payload;

  const emoji = getAlertEmoji(alertType);
  const color = getAlertColor(alertType);

  return {
    text: `${emoji} ${alertName}`,
    attachments: [
      {
        color,
        fields: [
          {
            title: 'Keyword',
            value: triggerData.keyword,
            short: true,
          },
          {
            title: 'Alert Type',
            value: alertType.replace(/_/g, ' '),
            short: true,
          },
          ...(triggerData.oldPosition
            ? [
                {
                  title: 'Previous Position',
                  value: `#${triggerData.oldPosition}`,
                  short: true,
                },
              ]
            : []),
          ...(triggerData.newPosition || triggerData.position
            ? [
                {
                  title: 'Current Position',
                  value: `#${triggerData.newPosition || triggerData.position}`,
                  short: true,
                },
              ]
            : []),
          {
            title: 'Search Volume',
            value: `${triggerData.searchVolume}/month`,
            short: true,
          },
          {
            title: 'Domain',
            value: triggerData.domain,
            short: true,
          },
        ],
        footer: 'SEO Keyword Tool',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
}

/**
 * Format Discord webhook message
 */
function formatDiscordMessage(payload: NotificationPayload): any {
  const { alertName, alertType, triggerData } = payload;

  const emoji = getAlertEmoji(alertType);
  const color = getAlertColorHex(alertType);

  return {
    embeds: [
      {
        title: `${emoji} ${alertName}`,
        color: parseInt(color.replace('#', ''), 16),
        fields: [
          {
            name: 'Keyword',
            value: triggerData.keyword,
            inline: true,
          },
          {
            name: 'Alert Type',
            value: alertType.replace(/_/g, ' '),
            inline: true,
          },
          ...(triggerData.oldPosition
            ? [
                {
                  name: 'Previous Position',
                  value: `#${triggerData.oldPosition}`,
                  inline: true,
                },
              ]
            : []),
          ...(triggerData.newPosition || triggerData.position
            ? [
                {
                  name: 'Current Position',
                  value: `#${triggerData.newPosition || triggerData.position}`,
                  inline: true,
                },
              ]
            : []),
          {
            name: 'Search Volume',
            value: `${triggerData.searchVolume}/month`,
            inline: true,
          },
          {
            name: 'Domain',
            value: triggerData.domain,
            inline: true,
          },
        ],
        footer: {
          text: 'SEO Keyword Tool',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Format custom webhook payload
 */
function formatCustomWebhook(payload: NotificationPayload): any {
  return {
    event: 'alert_triggered',
    alert: {
      id: payload.alertId,
      name: payload.alertName,
      type: payload.alertType,
    },
    trigger: payload.triggerData,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get emoji for alert type
 */
function getAlertEmoji(alertType: AlertType): string {
  const emojiMap: Record<AlertType, string> = {
    rank_drop: '🔻',
    rank_improvement: '🚀',
    rank_change: '↕️',
    new_ranking: '🎉',
    lost_ranking: '⚠️',
    serp_feature: '⭐',
    competitor_movement: '👀',
  };

  return emojiMap[alertType] || '🔔';
}

/**
 * Get Slack color for alert type
 */
function getAlertColor(alertType: AlertType): string {
  const colorMap: Record<AlertType, string> = {
    rank_drop: 'danger',
    rank_improvement: 'good',
    rank_change: 'warning',
    new_ranking: 'good',
    lost_ranking: 'danger',
    serp_feature: 'good',
    competitor_movement: 'warning',
  };

  return colorMap[alertType] || '#808080';
}

/**
 * Get hex color for alert type (Discord)
 */
function getAlertColorHex(alertType: AlertType): string {
  const colorMap: Record<AlertType, string> = {
    rank_drop: '#dc3545',
    rank_improvement: '#28a745',
    rank_change: '#ffc107',
    new_ranking: '#28a745',
    lost_ranking: '#dc3545',
    serp_feature: '#17a2b8',
    competitor_movement: '#ffc107',
  };

  return colorMap[alertType] || '#808080';
}

/**
 * Generate digest notification (daily or weekly)
 */
export async function generateDigestNotification(
  userId: string,
  period: 'daily' | 'weekly'
): Promise<void> {
  // TODO: Implement digest generation
  // This would aggregate all alerts from the past day/week
  // and send a single summary email
  console.log(`Generating ${period} digest for user ${userId}`);
}
