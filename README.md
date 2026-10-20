# AssetTrack

A role-based equipment and fleet management web app, built for a real landscaping and snow management company and published here as a sanitized portfolio edition.

> **About this repo:** This is a cleaned copy of a production app. There is no client data, employee information, credentials, environment files or company branding in it. Everything company-specific has been replaced with neutral demo content.

## The problem

The company has tools, vehicles and equipment spread across crews and job sites. Equipment assignments, check-in/check-out and damage reporting were handled manually, which made it hard to know who had what, what condition it was in, and what a vehicle's fuel and service history looked like.

## What I built

A mobile-friendly web app that crews use from their phones and the office uses from a desk.

**For employees**
- Browse equipment and filter by category, status, location, type and damage state
- Check tools out and back in, with every action timestamped
- Report damage, defects or missing parts with a severity level and photos
- Log fuel for vehicles and see their service history
- See company updates, notifications and forms assigned to them

**For admins**
- Add and manage assets, vehicles and users
- See every open checkout and who has what
- Review damage reports and the full activity history
- Post company updates and assign forms to specific people or roles

## How it works

- **Frontend:** React 19 and Vite, written as a single-page app with separate admin and employee views
- **Backend:** Supabase for authentication, a PostgreSQL database and file storage for photos
- **Access control:** each user has a profile with a role, and routes and features are gated on that role
- **Audit trail:** checkouts, returns, damage reports and admin changes all write to an activity log

### Data model (main tables)

| Table | What it holds |
| --- | --- |
| `profiles` | Users and their role (admin or employee) |
| `tools` | Every asset, including vehicles, with status, location and condition |
| `checkouts` | Who checked out what, when, and when it came back |
| `damage_reports` | Damage, defect and missing-part reports with severity |
| `asset_photos` | Photos attached to assets and reports |
| `vehicle_fuel_logs` | Fuel entries per vehicle |
| `vehicle_maintenance_logs` | Service and maintenance history per vehicle |
| `activity_log` | Timestamped record of user actions |
| `notifications` | Role-targeted or user-specific messages |
| `company_updates` | Announcements posted by admins |
| `company_forms`, `form_assignments` | Forms and who has been asked to complete them |

## What happened next

The production version has since moved off Supabase onto the company's own MySQL hosting and now runs as one module inside a larger internal operations platform. This repo keeps the original Supabase version so it can be run and reviewed on its own.

## Running it locally

You need Node.js 18 or newer and your own Supabase project with matching tables and row level security policies.

```bash
git clone https://github.com/zachhettich/assettrack-portfolio.git
cd assettrack-portfolio
npm install
cp .env.example .env
```

Add your own Supabase project URL and publishable key to `.env`:

```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-publishable-key>
```

Then start the dev server:

```bash
npm run dev
```

To build for production, run `npm run build`. The output goes to `dist/`.

## Author

Zachary Hettich, [LinkedIn](https://www.linkedin.com/in/zachhettich)
