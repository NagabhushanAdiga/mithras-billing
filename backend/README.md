# Billing Backend (MERN — MongoDB + Express)

REST API for the billing/POS frontend. Uses **Model–View–Controller** layout with **MongoDB** via **Mongoose**.

## Stack

- **Node.js** + **Express**
- **MongoDB** via **Mongoose**
- **React** frontend (Vite)
- **JWT** authentication
- **bcrypt** password hashing

## Project structure

```
backend/
  src/
    config/          # env + MongoDB connection
    database/        # seed + reset scripts
    models/
      schemas/       # Mongoose schemas
    controllers/     # Request handlers (MVC Controllers)
    routes/          # HTTP routes
    middleware/      # Auth, errors
    utils/
    app.js           # Express app
    server.js        # Entry point
```

## Quick start

1. Install and start **MongoDB** locally, or create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).

2. Configure the API:

```bash
cd backend
cp .env.example .env
npm install
npm run db:reset    # seed store data
npm run dev         # http://localhost:4000
```

Set `INITIAL_ADMIN_PASSWORD` in `.env` before `db:reset` to create the first admin account.

### Local MongoDB (macOS)

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

Or with Docker from the project root:

```bash
docker compose up -d
```

Default URI: `mongodb://127.0.0.1:27017/billing`

## API overview

All routes except login require header:

```
Authorization: Bearer <token>
```

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check (includes DB status) |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/store/bootstrap` | Load products, groups, batches, orders, settings |
| GET/POST | `/api/products` | List / create products |
| PUT/DELETE | `/api/products/:id` | Update / delete |
| GET | `/api/products/barcode/:code` | Lookup by barcode |
| GET/POST | `/api/groups` | Categories |
| POST | `/api/groups/:id/subcategories` | Add subcategory |
| GET/POST | `/api/batches` | Batch catalog |
| GET/POST | `/api/orders` | Bills (POST deducts stock) |
| GET/PUT | `/api/settings` | Store settings |
| GET/POST/DELETE | `/api/audit` | Audit log (admin) |
| GET/POST/DELETE | `/api/users` | Team management (admin) |

## Connect the frontend

1. Start MongoDB and the API: `npm run dev` (port 4000)
2. In `frontend/.env`:

```
VITE_API_URL=http://localhost:4000/api
```

3. Start the frontend: `cd frontend && npm run dev`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with auto-reload |
| `npm start` | Production start |
| `npm run db:init` | Verify MongoDB connection |
| `npm run db:seed` | Seed store data (if empty) |
| `npm run db:reset` | Clear all collections + seed |

## Production notes

- Set a strong `JWT_SECRET` in `.env`
- Use MongoDB Atlas or a managed MongoDB instance
- Set `MONGODB_URI` to your Atlas connection string
- Enable network access and database user in Atlas
