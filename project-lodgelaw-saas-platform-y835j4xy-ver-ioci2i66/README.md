# LodgeLaw Compliance Suite - Texas STR SaaS (2026 Ready)

LodgeLaw is a full-stack SaaS platform built for the 2026 Short-Term Rental (STR) regulatory landscape in Texas. Designed for property managers and owners in Austin, Houston, and Dallas.

## 🚀 Turnkey Tech Stack
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **UI Framework**: @blinkdotnew/ui (High-fidelity SaaS components)
- **State & Routing**: TanStack React Query & React Router
- **Backend/Auth**: Blink SDK (Managed Auth, SQLite-powered DB)
- **AI Engine**: Google Gemini (Ordinance Summarization)
- **Payments**: Stripe Ready (Basic & Pro Tiers)

## 🛠️ Core Features
1. **Compliance Command Center**: Health checks for Airbnb/VRBO license visibility and Zip-based Risk Scoring.
2. **Managed Properties**: Tracking for night limits (e.g., Austin's 90-day cap) and license validity.
3. **Document Vault**: Secure storage for Fire Safety, Permits, and Insurance with expiry countdowns.
4. **Tax Reporting Assistant**: Automated Hotel Occupancy Tax (HOT) calculations and filing logs.
5. **AI Summarizer**: Instant "Action Items" from complex city council meeting notes or ordinance updates.
6. **Digital Guest Packet**: One-click generation of guest-facing rule sheets (PDF).

## 📈 Scalability Notes (For the Buyer)
### 1. Compliance Scraper Logic
The `Platform Health Check` currently uses a heuristic pattern. To scale, integrate a headless browser (Puppeteer/Playwright) in a Cloudflare Worker to scrape OTA listings and verify License IDs against city API databases.

### 2. Live Newsfeed
The `Compliance Feed` is currently driven by static data. Scale this by setting up a cron job that fetches RSS feeds from Texas city council portals and uses the `AI Summarizer` to categorize them automatically.

### 3. Zip Code Risk Engine
Expand the `RISK_SCORE_DATA` in `src/lib/compliance.ts` into a dedicated database table. Use a backend worker to update scores based on local news sentiment analysis and municipal voting records.

## 💼 Business Model
- **Basic ($29/mo)**: Compliance tracking for up to 3 units.
- **Pro ($79/mo)**: Unlimited units + AI features + PDF generators.

---
Built with pride for the Texas STR Community.
