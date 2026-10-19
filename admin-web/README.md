# VorldX Admin Web

Dark navy + cyan + ocean-wave glassmorphism admin UI built with React, Vite, React Router, Axios, Lucide, and Recharts.

## Run it
1. Install Node.js (LTS) if not installed.
2. Open terminal in this folder.
3. Run `npm install`
4. Copy `.env.example` to `.env` and confirm `VITE_API_URL=http://localhost:5000/api`
5. Run `npm run dev`
6. Open the URL Vite prints (usually http://localhost:5173).

## Pages included
- Login (API login, loading/error states, show/hide password)
- Dashboard (API-driven employee/attendance/request totals, quick actions, recent employees)
- Employees (list/search, create, edit, deactivate, CSV export)
- Attendance (date filter, search, CSV export)
- WFH & Leave (approve/reject)
- Office QR (requests short-lived QR session from `POST /api/qr/session`; displays QR only when API returns a token)
- Reports (summary + CSV export)
- HR Admins (Super Admin only)
- Organization (Super Admin only)
- Settings, unauthorized page
- Responsive sidebar, mobile nav, role-protected routes

## Backend integration
The frontend assumes the following routes under `VITE_API_URL`:
- `POST /auth/login` returns `{ token, user }` (or `accessToken`/`jwt` and `admin`/`employee`)
- `GET /auth/me`
- `GET /employees`, `POST /employees`, `PUT /employees/:id`, `PATCH /employees/:id/deactivate`
- `GET /attendance?date=YYYY-MM-DD`
- `GET /wfh`, `GET /leave`, `PATCH /wfh/:id/status`, `PATCH /leave/:id/status`
- `POST /qr/session`
- `GET/PUT /hr-admins`, `POST /hr-admins`, `PUT /hr-admins/:id`, `PATCH /hr-admins/:id/deactivate`
- `GET/PUT /organization`

Your backend may use different paths or response shapes. Update the API paths in the page file that calls them. This UI does not create missing backend endpoints, and a button cannot complete a server operation unless the corresponding API route exists.

## Important
- Demo chart trend is clearly labelled as illustrative.
- QR code is not a static permanent code. Backend must issue and validate short-lived tokens.
- Role checks in the UI are convenience only. Enforce permissions in Express middleware too.
- Do not commit real credentials or `.env` secrets.
