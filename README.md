# ⚖️ LodgeLaw — Texas STR Compliance Platform

> The all-in-one compliance command center for Texas short-term rental hosts. Built for the 2026 regulatory landscape in Austin, Houston, and Dallas.

🌐 **Live Demo:** [lodgelaw-compliance.vercel.app](https://lodgelaw-compliance.vercel.app)

---

## 🚀 What is LodgeLaw?

LodgeLaw is a production-ready SaaS platform that helps Texas short-term rental (STR) hosts stay compliant with 2026 city ordinances. It combines compliance tracking, document management, tax estimation, and neighbor dispute resolution into a single, elegant dashboard.

---

## ✨ Key Features

### 🛡️ Compliance Command Center
- Real-time risk scores by Texas zip code
- Tracks Austin Type 1/2 licenses, Houston registration, and Dallas zoning
- Live compliance alerts and ordinance updates
- Platform health check for Airbnb/VRBO listings

### 📄 Document Vault
- Upload and manage permits, licenses, and insurance documents
- Full version history per document
- Expiry date tracking with email alerts
- Secure file storage via Supabase Storage

### 🧮 HOT Tax Estimator
- Calculate Hotel Occupancy Tax liability by month and property
- State (6%) + city rates for Austin, Houston, Dallas, San Antonio
- Save entries to database for record-keeping
- Export/print tax estimates as PDF

### 📱 Neighbor Resolution Center
- Generate unique QR codes per property
- Neighbors submit anonymous reports via public form (no login needed)
- Host dashboard to review, manage, and resolve reports
- Status tracking: New → In Review → Resolved

### 🏠 Portfolio Management
- Track all STR properties in one place
- Monitor nights rented against Austin's 90-night annual cap
- Per-property AI compliance analysis (requires OpenAI key)
- License number tracking and status badges

### 🔔 Smart Notifications
- Email alerts for expiring documents (30-day threshold)
- Pending report counter on dashboard
- Monthly tax estimate summary

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + TypeScript |
| **Build Tool** | Vite 8 |
| **Styling** | Tailwind CSS + custom inline styles |
| **Routing** | TanStack Router v1 |
| **State/Data** | TanStack Query v5 |
| **Backend/DB** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (Google OAuth) |
| **Storage** | Supabase Storage |
| **UI Components** | BlinkUI component library |
| **Deployment** | Vercel |
| **AI Features** | OpenAI GPT-4.1-mini (optional) |

---

## 🗄️ Database Schema

| Table | Description |
|---|---|
| `users` | User profiles mirrored from Supabase Auth |
| `properties` | STR property listings with compliance metadata |
| `documents` | Compliance documents with expiry tracking |
| `document_versions` | Full version history per document |
| `ordinances` | Texas city ordinance data (Austin, Houston, Dallas) |
| `tax_records` | HOT filing records |
| `revenue_entries` | Monthly revenue entries for tax estimation |
| `neighbor_reports` | Anonymous neighbor submissions via QR code |

All tables use **Row Level Security (RLS)** — users can only access their own data.

---

## ⚙️ Setup & Deployment

### Prerequisites
- Node.js 18+
- A Supabase project
- A Vercel account (for deployment)

### Environment Variables
Create a `.env.local` file in the project root:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Install & Run
```bash
npm install
npm run dev
```

### Database Setup
Run the SQL schema in your Supabase SQL Editor — file is located in the repo as `supabase_schema.sql`.

### Deploy to Vercel
1. Connect your GitHub repo to Vercel
2. Set Root Directory to the project folder
3. Add environment variables in Vercel dashboard
4. Deploy

---

## 🤖 AI Features (Optional)

Two features use AI and require an OpenAI API key:
- **Property Compliance Analysis** — `src/hooks/usePropertyCompliance.ts`
- **Ordinance Summaries** — `src/hooks/useOrdinanceSummary.ts`

To enable, replace `blink.ai.generateText` calls with OpenAI API calls using model `gpt-4.1-mini`.

---

## 📋 Compliance Coverage

| City | Risk Level | Key 2026 Rule |
|---|---|---|
| **Austin** | 🔴 Extreme (92) | Type 2 restricted. $1,058 fee. Platform transparency July 1. |
| **Houston** | 🟠 High (85) | Mandatory OTA display. $275 annual fee. |
| **Dallas** | 🟡 Medium (45) | Registration required. Zoning injunction active. |

---

## 📁 Project Structure
