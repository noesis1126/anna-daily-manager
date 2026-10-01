# Anna Daily Manager

Next.js 14 (App Router) + Tailwind + MongoDB.

## Run
1. `npm install`
2. Edit `.env.local` -> set `MONGODB_URI`, `DM_USER`, `DM_PASS`
3. `npm run dev`
4. Open http://localhost:3000  (goes to /admin/daily-manager)

## Production
`npm run build && npm start`

## Orders link
Sales from your existing orders collection are read in `lib/daily-manager/config.js`
(collection name, date field, paid filter, amount fields). Change those 5 lines if
your orders use different names.
