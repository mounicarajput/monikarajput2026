# Portfolio Website with Newsletter

A modern portfolio website with newsletter subscription functionality.

## Features

- Beautiful, responsive portfolio homepage
- Newsletter subscription page
- Backend API for handling subscriptions
- Email validation and duplicate checking
- JSON-based storage for subscribers

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser:
- Homepage: http://localhost:3000
- Newsletter page: http://localhost:3000/newsletter

## API Endpoints

- `POST /api/subscribe` - Subscribe to newsletter
  - Body: `{ "email": "user@example.com" }`
  - Returns: Success or error message

- `GET /api/subscribers` - Get all subscribers (for admin)
  - Returns: List of all subscribers

- `GET /api/health` - Health check endpoint

## Data Storage

Subscriptions are stored in `data/subscribers.json`. The file is automatically created when the server starts.

## Development

The server runs on port 3000 by default. You can change this by setting the `PORT` environment variable:

```bash
PORT=8080 npm start
```

## Portfolio front end

- Pages are small shells. Each loads one module from `js/` that renders content from `data/`.
- `css/base.css` (tokens, header, footer), `css/parts.css` (sections and rows), `css/globe.css` (talks page).
- `js/lib.js` helpers, `js/layout.js` header, footer and fade in, `js/rows.js` list renderers, `js/markers.js` and `js/globe.js` for the talks globe (loaded only on large screens).
- Content: `data/profile.json` (stats, experience, skills, projects, story), `data/talks.json` (date as DD/MM/YYYY, location as "City, Country", optional `featured`), `data/podcasts.json`, `data/articles.json`. New cities for the globe need coordinates in `js/markers.js`.
- Images: use the sized copies in `images/web/`. The originals in `images/` are several MB.
- Preview without Node: `python -m http.server 3000`.
