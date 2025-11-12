<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/11GyofuXFd3FYWddq1H5l4O3uxNcIXxnr

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Provide a Gemini API key in [.env.local](.env.local). You can set any of these variables:
   - `VITE_GEMINI_API_KEY`
   - `GEMINI_API_KEY`
   - `API_KEY`
   - `VITE_API_KEY`
3. Run the app:
   `npm run dev`

### Gemini mock mode (optional)

If you want to run the UI without calling the Gemini APIs, add `VITE_GEMINI_MOCK=true` (or `GEMINI_MOCK=true`) to your `.env.local`.  
The app will surface structured placeholder data for every Gemini-powered feature while still logging actions to the console for troubleshooting.

## Serverless backend (Vercel + Neon)

The `/api` directory contains Vercel Serverless Functions that persist state to Neon PostgreSQL and proxy Gemini requests.

- `GET /api/bootstrap` returns all stored resources for fast client hydration.
- `GET|PUT|DELETE /api/resources/[resource]` reads or replaces a single resource payload (e.g. `userProfiles`, `allAssignments`).
- `POST /api/gemini/proxy` forwards Gemini requests with the API key kept on the server.

### Required environment variables

| Variable        | Where to set it | Description |
| --------------- | ----------------| ----------- |
| `DATABASE_URL`  | Vercel Project → Settings → Environment Variables | Neon PostgreSQL connection string |
| `GEMINI_API_KEY`| Vercel Project → Settings → Environment Variables | Google Gemini secret (kept server-side) |

For local development you can use `vercel dev` so that `/api/*` routes resolve to the serverless functions. When using `npm run dev` you will need a proxy (or rely on mock mode) because Vite alone will not execute the functions.
