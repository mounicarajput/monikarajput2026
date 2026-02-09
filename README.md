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
