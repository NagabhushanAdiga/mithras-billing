# Billing Software (MERN)

POS and billing app built with the **MERN stack**:

- **M**ongoDB (Atlas or local)
- **E**xpress (Node.js API)
- **R**eact (Vite frontend)
- **N**ode.js

## Project structure

```
billing-software-mern/
  backend/     Express API + Mongoose
  frontend/    React (Vite)
  docker-compose.yml   Optional local MongoDB
```

## Quick start

### 1. MongoDB

Use [MongoDB Atlas](https://www.mongodb.com/atlas) or start local MongoDB:

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI and INITIAL_ADMIN_PASSWORD
npm install
npm run db:reset
npm run dev
```

API runs at `http://localhost:4000`

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App runs at `http://localhost:5173`

Set `VITE_API_URL=/api` (Vite proxy) or `http://localhost:4000/api`.

### 4. Login

Default admin (from `backend/.env` after seed):

- Username: `naga`
- Password: value of `INITIAL_ADMIN_PASSWORD` (default `12345`)

## Scripts

| Location | Command | Description |
|----------|---------|-------------|
| backend | `npm run dev` | Start API with reload |
| backend | `npm run db:reset` | Clear DB and seed sample data |
| frontend | `npm run dev` | Start React app |
| frontend | `npm run build` | Production build |

See `backend/README.md` for API details.
