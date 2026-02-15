# Landscape Gallery

A self-hosted landscape photography gallery built with Next.js, featuring masonry grid layout, lightbox viewer with EXIF metadata, album management, and a built-in analytics dashboard.

## Features

- **Masonry Grid Gallery** — Responsive 3-column layout with lazy loading and blur placeholders
- **Lightbox Viewer** — Full-screen photo viewer with keyboard navigation (arrows, Esc) and EXIF metadata panel
- **EXIF Metadata** — Camera, lens, aperture, shutter speed, ISO, focal length, GPS coordinates
- **Albums** — Create albums and organize photos into collections
- **Photo Upload** — Drag-and-drop multi-file upload with automatic thumbnail generation
- **Folder Scanning** — Scan a directory for images, auto-process and import
- **Admin Auth** — Cookie-based login to protect uploads, album creation, and admin features
- **Analytics Dashboard** — Built-in page view tracking with visitor stats, top pages, browsers, devices
- **Dark Mode** — Toggle between light and dark themes
- **Image Optimization** — AVIF/WebP serving, multiple thumbnail sizes, sharpening, 30-day cache
- **Docker Ready** — Multi-stage Dockerfile with Caddy reverse proxy for production

## Tech Stack

- **Next.js 16** (App Router) — SSR, image optimization, API routes
- **shadcn/ui** + **Tailwind CSS v4** — UI components and styling
- **sharp** — Thumbnail generation, sharpening, blur placeholders
- **exifr** — EXIF metadata extraction
- **better-sqlite3** — Embedded database for photos, albums, and analytics
- **Docker** + **Caddy** — Containerization with auto-HTTPS

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open http://localhost:3000. Default login: `admin` / `admin`.

## Configuration

Create a `.env.local` file:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-password
AUTH_SECRET=your-random-secret
```

Optional:

```env
DB_PATH=./data/gallery.db
SCAN_DIR=./photos
```

## Adding Photos

1. **Upload** — Log in, click Upload, drag and drop images
2. **Folder Scan** — Place images in the `photos/` directory, click Upload > Scan Folder

## Docker

```bash
# Development
docker-compose up --build

# Production (with Caddy auto-HTTPS)
cp .env.production .env
# Edit .env with your domain and credentials
docker compose -f docker-compose.prod.yml up -d --build
```

## Deploy to AWS Lightsail

1. Create a Lightsail instance (Ubuntu 22.04, $5/mo)
2. Open ports 80 and 443 in Networking
3. Point your domain to the instance IP
4. SSH in and run:

```bash
git clone https://github.com/vrtec91197/landscape-gallery.git /opt/landscape-gallery
cd /opt/landscape-gallery
cp .env.production .env
nano .env  # Set domain, password, secret
docker compose -f docker-compose.prod.yml up -d --build
```

See `deploy/` for setup, update, and backup scripts.

## Project Structure

```
src/
├── app/
│   ├── admin/          # Analytics dashboard (auth-protected)
│   ├── albums/         # Album listing and detail pages
│   ├── gallery/        # Main gallery with pagination
│   ├── api/            # REST API (photos, albums, upload, auth, analytics)
│   └── page.tsx        # Home page
├── components/         # UI components (grid, lightbox, navbar, dialogs)
└── lib/                # Database, auth, EXIF extraction, scanner
```

## License

MIT
