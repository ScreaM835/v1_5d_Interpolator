# v1_5d_Interpolator
Cambridge_C1_Coursework

## Containers

### Backend (FastAPI)

```bash
cd backend
# Development image with autoreload
docker build -t v1-5d-backend:dev --target development .
docker run --rm -p 8000:8000 v1-5d-backend:dev

# Production-ready image
docker build -t v1-5d-backend:prod --target production .
docker run --rm -p 8000:8000 v1-5d-backend:prod
```

The backend image exposes `8000` and runs `uvicorn main:app`. Customize origins via `NEXT_PUBLIC_API_URL` when starting the frontend.

### Frontend (Next.js)

```bash
cd frontend
# Build the optimized Next.js bundle
docker build -t v1-5d-frontend .
docker run --rm -p 3000:3000 -e NEXT_PUBLIC_API_URL="http://localhost:8000" v1-5d-frontend
```

The frontend image serves the pre-built app with `next start` on port `3000`. Override `NEXT_PUBLIC_API_URL` if your backend lives elsewhere.
