# Logistics Platform

A modern logistics and ride-hailing platform built with **Next.js**, **Node.js**, **Prisma**, **PostgreSQL**, and **PostGIS**. This project enables real-time ride management, driver tracking, and spatial queries for finding nearby drivers using geolocation.

## Features

- User and driver authentication
- Real-time ride requests and status updates
- Driver location tracking with PostGIS
- Spatial queries to find nearby drivers
- RESTful API and WebSocket support
- Supabase integration for managed PostgreSQL/PostGIS
- Modern frontend with Next.js

## Tech Stack

- **Frontend:** Next.js (React)
- **Backend:** Node.js, Express
- **Database:** PostgreSQL with PostGIS extension
- **ORM:** Prisma
- **Real-time:** WebSockets
- **Hosting:** Vercel (frontend), Supabase (database)

3. Set up environment variables

4. Set up the database:

Ensure PostgreSQL is running and PostGIS is enabled.
Run Prisma migrations:
cd backend
npx prisma migrate deploy

5. Start the development servers:
Backend:
cd backend
nodemon server.js

Frontend:
cd logistics
npm run dev


6. Open the app:
Visit http://localhost:3000 in your browser.
