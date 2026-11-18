# Hungry Hut

Premium fast-food ordering platform for **Hungry Hut** — customer website + secure admin dashboard.

**Brand:** Hungry Hut  
**Taglines:** “Crispy Bites, Happier Nights” · “Freshly Fried. Always Delicious.” · “The Ultimate Fast-Food Experience” · “Good Food, Good Mood”

## Stack

- **Client:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, React Router, Lucide React
- **Server:** Node.js, Express (REST), Mongoose/MongoDB, JWT (httpOnly cookie) admin auth, Zod validation, Multer uploads
- **Payments (India):** UPI QR/manual UTR submission with admin verification, optional Razorpay (server-side order create + HMAC signature verification + gateway confirmation/capture), COD/counter where enabled
- **Storage:** Local uploads (`server/uploads`, served from `/uploads`) by default; optional Cloudinary-ready env placeholders (image storage configurable via env/integration)

## Repository layout

```text
.
├─ client/                 # React + Vite app (customer + /admin)
│  ├─ dist/                # Production build output
│  ├─ public/
│  └─ src/
├─ server/                 # Express API + MongoDB models/routes
│  ├─ src/
│  └─ uploads/             # Local upload storage (dev/runtime)
├─ .env.example            # Environment template (copy to server/.env)
└─ package.json            # Root scripts (install/dev/build/start)
```

## Prerequisites

- Node.js 18+ and npm
- MongoDB for persistent/production data (local MongoDB or MongoDB Atlas)
  - **Development fallback:** if `MONGODB_URI` is unreachable and `DEV_EMBEDDED_DB=true`, the API can start with an in-process `mongodb-memory-server` using persistent local data in `server/.mongo-data` (best-effort). Embedded dev data/state can be reset/reseeded depending on startup conditions; restarting the API in this mode may reseed and lose in-memory/dev state.

## Setup

### 1. Install dependencies

```bash
# from repo root
npm install
npm run install:all
```

Or install separately:

```bash
npm --prefix server install
npm --prefix client install
```

### 2. Configure environment

Copy the template to `server/.env` and adjust values:

```bash
# Windows PowerShell
Copy-Item .env.example server/.env

# macOS/Linux
cp .env.example server/.env
```

> The server loads environment variables via `dotenv` from its working directory (`server/.env` when run with the provided scripts).

### 3. Run in development

Start API + client together (recommended):

```bash
npm run dev
```

Or run separately:

```bash
npm run dev:server   # API on http://localhost:4000
npm run dev:client   # Vite dev server on http://localhost:5173
```

Dev client proxy (`client/vite.config.ts`): `/api` and `/uploads` -> `http://localhost:4000`.

### 4. Seed database

The API seeds/bootstrap data automatically on startup when needed. To run seed explicitly:

```bash
npm run seed
```

## Environment variables

Defined in `.env.example` (copy to `server/.env`).

| Variable | Required | Default / example | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | No | `development` | `production` enforces secure cookie behavior and requires valid secrets/config. |
| `PORT` | No | `4000` | API server port. |
| `CLIENT_ORIGIN` | No | `http://localhost:5173` | Allowed client origin(s) context / public site origin fallback in some flows. |
| `PUBLIC_BASE_URL` | No | `http://localhost:4000` | Public base URL for API/server-generated links where applicable. |
| `PUBLIC_SITE_URL` | No | *(unset)* | Optional public site URL override used for generated menu QR links when set. |
| `MONGODB_URI` | **Yes in production** | `mongodb://127.0.0.1:27017/hungry-hut` | MongoDB connection string. Required for production; dev may fall back to embedded DB if enabled and unreachable. |
| `DEV_EMBEDDED_DB` | No | `true` | Dev-only in-process Mongo fallback when `MONGODB_URI` is unreachable. Set `false` to disable. |
| `JWT_SECRET` | **Yes** (prod enforces min length) | replace with long random string | Admin JWT signing secret; must be strong/long (>= 24 chars expected). |
| `JWT_EXPIRES_IN` | No | `8h` | Admin session JWT expiry. |
| `ADMIN_EMAIL` | No | `admin@hungryhut.in` | Seed/bootstrap admin email (used on initial setup/seed). |
| `ADMIN_PASSWORD` | No | `HungryHut@2026` | Seed/bootstrap admin password. **Change in production.** |
| `ADMIN_NAME` | No | `Hungry Hut Admin` | Seed/bootstrap admin display name. |
| `CLOUDINARY_CLOUD_NAME` | No | *(empty)* | Optional image storage integration. |
| `CLOUDINARY_API_KEY` | No | *(empty)* | Optional image storage integration. |
| `CLOUDINARY_API_SECRET` | No | *(empty)* | Optional image storage integration. |
| `RAZORPAY_KEY_ID` | No | *(empty)* | Optional Razorpay checkout (required together with secret for Razorpay flow). |
| `RAZORPAY_KEY_SECRET` | No | *(empty)* | Optional Razorpay checkout/verification. |
| `RAZORPAY_WEBHOOK_SECRET` | No | *(empty)* | Optional Razorpay webhook signature verification. |
| `MAPS_EMBED_QUERY` | No | `Hauz+Khas+New+Delhi+India` | Map/embed query fallback. |
| `SERVE_CLIENT` | No | `true` | When `true` (or in production mode per server config), API serves built client from `client/dist`. |

## Admin setup

- **Admin URL:** `/admin/login` (e.g. `http://localhost:5173/admin/login` in dev, or same-origin in production-served build)
- **Default seeded credentials (development/demo):**
  - Email: `admin@hungryhut.in`
  - Password: `HungryHut@2026`
- Admin authentication uses a **JWT stored in an httpOnly cookie**.
- Change admin credentials/secrets before production use. Seed values come from `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`.

## Development and production deployment

### Build client

```bash
npm run build
```

Generates `client/dist` (`tsc --noEmit && vite build`).

### Run API (serving built client)

```bash
# ensure client is built and server env is configured
npm start
# equivalent: npm --prefix server start
```

For production-style single-server deployment:

1. Set environment in `server/.env` (at minimum `NODE_ENV=production`, strong `JWT_SECRET`, and `MONGODB_URI`).
2. Set `SERVE_CLIENT=true`.
3. Build client: `npm run build` (creates `client/dist`).
4. Start server: `npm start`.
5. The API serves the built React app from `client/dist` (with SPA fallback) and static uploads from `/uploads`.

### Important production notes

- **MongoDB:** `MONGODB_URI` is required in production. Do not rely on embedded dev DB in production.
- **CORS/origin/cookies:** configure `CLIENT_ORIGIN`/public URLs appropriately for your deployment domain and HTTPS.
- **Uploads:** local `server/uploads` is ephemeral on many hosts; use persistent storage or external image storage for production as needed.
- **Razorpay:** set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to enable Razorpay checkout; payments are verified server-side (signature + gateway confirmation/capture). Webhook support requires `RAZORPAY_WEBHOOK_SECRET`.

## API overview

Base URL (dev): `http://localhost:4000`

- `GET /api/health` — service/database health
- Auth/session for admin via httpOnly cookie (`/api/auth/*`)
- Public/customer APIs under `/api/*` (menu, settings, offers, quote, orders, payments, secret unlock, contact, etc.)
- Admin APIs under `/api/admin/*` (protected)

### Auth (`/api/auth`)

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/login` | Public | Admin login (`{ email, password }`), sets session cookie |
| POST | `/logout` | Public | Clears session cookie |
| GET | `/me` | Admin | Current admin user |
| POST | `/password` | Admin | Change password (`{ currentPassword, newPassword }`) |

### Public / customer APIs

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/settings` | Public restaurant settings/content |
| GET | `/api/categories` | Active categories |
| GET | `/api/products` | Available products (filters: `category`, `q`, `diet`, `sort`, `limit`) |
| GET | `/api/products/:slug` | Product detail |
| GET | `/api/offers` | Active offers/coupons-facing offers (`limit` optional) |
| GET | `/api/bucket/ingredients` | Active Build Your Bucket ingredients |
| POST | `/api/secret/unlock` | Unlock secret menu with passphrase (`{ code }`) |
| GET | `/api/testimonials` | Approved testimonials |
| GET | `/api/gallery` | Active gallery items |
| GET | `/api/crispy-meter` | Crispy meter/live kitchen-style data |
| GET | `/api/home` | Aggregated home payload (settings/categories/featured/offers/testimonials/gallery/crispy/faqs) |
| POST | `/api/quote` | Server-side pricing/discount quote for cart (`items`, `couponCode`, `fulfilmentType`) |
| POST | `/api/contact` | Submit contact message |
| POST | `/api/orders` | Create order (customer/cart/fulfilment/payment; server validates and prices) |
| GET | `/api/orders/:orderNumber?phone=...` | Fetch order (phone-verified) |
| POST | `/api/orders/:orderNumber/payment` | Submit UPI payment details for verification (`phone`, `utr`, optional `screenshotUrl`) |
| POST | `/api/orders/:orderNumber/payment-proof` | Upload UPI payment screenshot (`multipart/form-data`, field `screenshot`, `phone`) |
| POST | `/api/payments/razorpay/create` | Create Razorpay order for an existing app order (`orderNumber`, `phone`) |
| POST | `/api/payments/razorpay/verify` | Verify Razorpay payment (signature + gateway confirmation; may capture authorized payment) |
| POST | `/api/payments/razorpay/webhook` | Razorpay webhook (signature-verified when secret configured) |

### Admin APIs (`/api/admin`, auth required)

| Area | Endpoints (summary) |
| --- | --- |
| Dashboard/stats | `GET /stats`, `GET /activity` |
| Orders | `GET /orders`, `GET /orders/:id`, `PATCH /orders/:id/status`, `PATCH /orders/:id/payment`, `PATCH /orders/:id/notes` |
| Payments/customers | `GET /payments`, `GET /customers` |
| Products | `GET/POST /products`, `PUT/DELETE /products/:id` |
| Categories | `GET/POST /categories`, `PUT/DELETE /categories/:id` |
| Bucket ingredients | `GET/POST /bucket/ingredients`, `PUT/DELETE /bucket/ingredients/:id` |
| Secret menu items | `GET/POST /secret`, `PUT/DELETE /secret/:id` |
| Offers & coupons | `GET/POST /offers`, `PUT/DELETE /offers/:id`, `GET /coupons`, `PATCH /coupons/:id` |
| Testimonials | `GET/POST /testimonials`, `PUT/DELETE /testimonials/:id` |
| Gallery | `GET/POST /gallery`, `PUT/DELETE /gallery/:id` |
| Messages | `GET /messages`, `PATCH /messages/:id`, `DELETE /messages/:id` |
| Settings | `GET/PUT /settings` (admin role required for update) |
| QR | `GET /qr`, `PUT /qr/:type` (`menu`/`payment`, admin role required) |
| Uploads | `POST /upload` (`multipart/form-data`, field `image`) |

> For exact request/response shapes and validation rules, see `server/src/routes/*.js` and `server/src/routes/admin/*.js`.

## Key behavior notes

- **Pricing integrity:** order totals/discounts are computed server-side (quote/order flows), not trusted from the client.
- **UPI flow:** customer can submit UTR/screenshot; order/payment remains pending until admin verification.
- **Razorpay:** optional; when configured, checkout/verification is server-confirmed and signature-verified.
- **Guest order tracking:** order history can be stored client-side and tracking is phone-verified.
- **Secret menu:** passphrase is validated server-side; client may cache unlocked state/items per device for UX.
- **Dev DB volatility:** embedded dev MongoDB state may be reseeded/lost on API restart depending on mode/state.

## Useful scripts

| Command | Description |
| --- | --- |
| `npm run install:all` | Install server and client dependencies |
| `npm run dev` | Run server + client concurrently (dev) |
| `npm run dev:server` | Run API in watch mode |
| `npm run dev:client` | Run Vite dev server |
| `npm run seed` | Run seed script |
| `npm run build` | Build client to `client/dist` |
| `npm start` | Start API server (`SERVE_CLIENT=true` serves built client when configured) |

## Verification

Recommended checks before handoff/deploy:

```bash
npm.cmd --prefix client run build
```

Manual smoke checks (dev/prod build): customer browse/cart/checkout/quote, order placement, order tracking, admin login, admin CRUD/toggles reflecting on customer site, UPI submission/admin verification flow, and QR/menu/payment pages.

## Known limitations / notes

- **Pixel-perfect fidelity:** without an authoritative Hungry Hut reference image, UI is implemented to match the written brand/design spec (not guaranteed pixel-identical).
- **Dev runtime:** Vite dev mode may occasionally have lazy-route loading issues in some local states; a clean restart/cache clear or testing against `client/dist` (preview/`SERVE_CLIENT=true`) can be used for stable verification. Production build (`client/dist`) is the source of truth for deploy.
- **Embedded dev DB:** restarting the API while using embedded dev DB can reseed and discard prior dev orders/state.
