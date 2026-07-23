# AssetTrack

**AssetTrack** is a sanitized portfolio demo of a role-based inventory and equipment-management progressive web application (PWA).

> **Privacy Statement:** This repository contains no client data, employee information, production credentials, or proprietary branding. All company-specific assets and identifiers have been replaced with neutral demo content. No real credentials, Supabase keys, or deployment secrets are included.

---

## Features

- **Inventory / Assets** — Browse and filter tools and vehicles by category, status, location, asset type, and damage state.
- **Check-In / Check-Out** — Employees can check out and return tools; admins oversee all assignments.
- **Activity Logs** — Timestamped audit trail of all user actions (checkouts, additions, damage reports, etc.).
- **Damage Reporting** — Submit damage, defect, or missing-part reports with severity levels and photo uploads.
- **Vehicles & Equipment** — Dedicated vehicle management with fuel-log tracking and maintenance/service history.
- **Forms & Assignments** — Admins can create, assign, and track completion of company forms.
- **Notifications** — Role-targeted or user-specific in-app notifications.
- **Role-Based Access** — Admin and employee views with route guards and feature gating.

---

## Tech Stack

- **React 19** — UI framework
- **Vite** — Build tool and dev server
- **Supabase** — Authentication, database (PostgreSQL), and storage
- **Role-Based Auth** — Admin/employee profiles with protected routes

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project with the required database schema

### Setup

1. Clone the repository:

   ```bash
   git clone <repo-url>
   cd assettrack-portfolio
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local environment file by copying the example:

   ```bash
   cp .env.example .env
   ```

4. Open `.env` and add your Supabase project credentials:

   ```
   VITE_SUPABASE_URL=<your-supabase-url>
   VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

> **Note:** The app requires a configured Supabase backend with the appropriate database tables and Row Level Security (RLS) policies to function fully.

---

## Build

```bash
npm run build
```

Output is written to the `dist/` directory.

---

## License

This project is provided as a portfolio demonstration. No real production data or credentials are included.
