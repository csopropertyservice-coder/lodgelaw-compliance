import type { Document } from '../hooks/useDocuments'

export interface ExpiringDoc {
  doc: Document
  daysLeft: number
  propertyName: string
}

export function getExpiringDocuments(documents: Document[], thresholdDays = 30): ExpiringDoc[] {
  const now = Date.now()
  return documents
    .filter(d => {
      if (!d.expiryDate) return false
      const msLeft = new Date(d.expiryDate).getTime() - now
      const daysLeft = Math.ceil(msLeft / 86400000)
      return daysLeft >= 0 && daysLeft <= thresholdDays
    })
    .map(d => ({
      doc: d,
      daysLeft: Math.ceil((new Date(d.expiryDate!).getTime() - now) / 86400000),
      propertyName: '',
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft)
}

function urgencyColor(days: number) {
  if (days <= 7) return '#dc2626'   // red
  if (days <= 14) return '#d97706'  // amber
  return '#0f1729'                   // primary navy
}

function urgencyLabel(days: number) {
  if (days === 0) return 'Expires TODAY'
  if (days === 1) return 'Expires TOMORROW'
  if (days <= 7) return `Expires in ${days} days — URGENT`
  return `Expires in ${days} days`
}

function documentRow(item: ExpiringDoc) {
  const color = urgencyColor(item.daysLeft)
  const label = urgencyLabel(item.daysLeft)
  const expDate = new Date(item.doc.expiryDate!).toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'long', day: 'numeric',
  })

  return `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
        <strong style="display:block;font-size:14px;color:#0f1729;">${item.doc.name}</strong>
        <span style="font-size:12px;color:#6b7280;">${item.doc.type}${item.propertyName ? ' · ' + item.propertyName : ''}</span>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;text-align:right;white-space:nowrap;">
        <span style="display:inline-block;background:${color}1a;color:${color};border:1px solid ${color}33;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">${label}</span>
        <span style="display:block;font-size:11px;color:#9ca3af;margin-top:4px;">${expDate}</span>
      </td>
    </tr>`
}

export function buildExpiryEmailHtml(
  userName: string,
  items: ExpiringDoc[],
  vaultUrl: string
): string {
  const critical = items.filter(i => i.daysLeft <= 7)
  const subject = critical.length > 0
    ? `🚨 ${critical.length} document${critical.length > 1 ? 's' : ''} expiring this week — LodgeLaw`
    : `⚠️ ${items.length} document${items.length > 1 ? 's' : ''} expiring soon — LodgeLaw`

  const rows = items.map(documentRow).join('')

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Document Expiry Alert</title></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#0f1729;border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="display:inline-flex;align-items:center;gap:8px;">
                    <span style="background:#fbbf24;border-radius:8px;padding:6px 8px;font-size:16px;line-height:1;">🛡</span>
                    <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">LodgeLaw</span>
                  </span>
                  <p style="color:#94a3b8;font-size:12px;margin:6px 0 0;text-transform:uppercase;letter-spacing:0.08em;">STR Compliance Suite</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Alert banner -->
        <tr>
          <td style="background:${critical.length > 0 ? '#fef2f2' : '#fffbeb'};border-left:4px solid ${critical.length > 0 ? '#dc2626' : '#d97706'};padding:16px 32px;">
            <strong style="color:${critical.length > 0 ? '#dc2626' : '#92400e'};font-size:14px;">
              ${critical.length > 0 ? '🚨 Immediate Action Required' : '⚠️ Upcoming Expiry Alert'}
            </strong>
            <p style="color:#374151;font-size:13px;margin:4px 0 0;line-height:1.5;">
              ${items.length} of your compliance document${items.length > 1 ? 's' : ''} 
              ${items.length > 1 ? 'are' : 'is'} expiring within 30 days. 
              Expired permits may result in <strong>platform delisting</strong> and city fines.
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:32px;">
            <p style="color:#374151;font-size:15px;margin:0 0 8px;">Hi ${userName || 'there'},</p>
            <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">
              Your LodgeLaw vault has detected the following documents requiring attention.
              Please renew or replace them before they expire to stay compliant with 2026 Texas STR regulations.
            </p>

            <!-- Documents table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:28px;">
              <thead>
                <tr style="background:#f9fafb;">
                  <th style="padding:10px 16px;text-align:left;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;font-weight:700;border-bottom:1px solid #e5e7eb;">Document</th>
                  <th style="padding:10px 16px;text-align:right;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;font-weight:700;border-bottom:1px solid #e5e7eb;">Status</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>

            <!-- CTA button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${vaultUrl}" target="_blank"
                    style="display:inline-block;background:#0f1729;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 32px;border-radius:8px;letter-spacing:0.05em;text-transform:uppercase;">
                    Open Document Vault →
                  </a>
                  <p style="color:#9ca3af;font-size:11px;margin:12px 0 0;">
                    Or copy this link: <span style="color:#0f1729;">${vaultUrl}</span>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Checklist tip -->
        <tr>
          <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
            <p style="color:#374151;font-size:13px;font-weight:700;margin:0 0 8px;">📋 Renewal Checklist</p>
            <ul style="color:#6b7280;font-size:12px;margin:0;padding:0 0 0 16px;line-height:2;">
              <li>Contact your city's STR permit office to renew</li>
              <li>Upload the new document to LodgeLaw (it creates a version history)</li>
              <li>Update the expiry date in the document metadata</li>
              <li>Verify the new license number is visible on Airbnb/VRBO</li>
            </ul>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0f1729;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;">
            <p style="color:#64748b;font-size:11px;margin:0;">
              © 2026 LodgeLaw Compliance Suite · Texas STR Operations
            </p>
            <p style="color:#475569;font-size:10px;margin:6px 0 0;line-height:1.5;">
              You received this because you have active documents in your LodgeLaw vault.<br>
              This is an automated compliance alert — no action needed if documents have already been renewed.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  return html
}

export function buildExpiryEmailText(userName: string, items: ExpiringDoc[], vaultUrl: string): string {
  const lines = [
    `LodgeLaw — Document Expiry Alert`,
    ``,
    `Hi ${userName || 'there'},`,
    ``,
    `${items.length} compliance document${items.length > 1 ? 's' : ''} in your vault ${items.length > 1 ? 'are' : 'is'} expiring within 30 days:`,
    ``,
    ...items.map(i =>
      `• ${i.doc.name} (${i.doc.type}${i.propertyName ? ' · ' + i.propertyName : ''}) — ${urgencyLabel(i.daysLeft)}`
    ),
    ``,
    `Visit your Document Vault to renew:`,
    vaultUrl,
    ``,
    `Expired STR permits may cause platform delisting and city fines.`,
    ``,
    `— LodgeLaw Compliance Suite`,
  ]
  return lines.join('\n')
}

export function buildExpiryEmailSubject(items: ExpiringDoc[]): string {
  const critical = items.filter(i => i.daysLeft <= 7)
  if (critical.length > 0) {
    return `🚨 ${critical.length} document${critical.length > 1 ? 's' : ''} expiring this week — LodgeLaw`
  }
  return `⚠️ ${items.length} document${items.length > 1 ? 's' : ''} expiring soon — LodgeLaw`
}
