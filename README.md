# Confession Wall (BCA Final Year Project)

An AI-Moderated Anonymous Text Confession Platform built with the MERN stack (MongoDB, Express, React, Node.js).

## Features
- **Total Anonymity**: Auto-generated usernames and avatars
- **AI Moderation**: Content is screened for bullying and hate speech before posting
- **Post & Comment System**: Upvotes, downvotes, and threaded discussions
- **Automated Moderation System**: Posts are auto-hidden after 5 reports. Users are auto-banned after 3 confirmed violations.
- **Admin Dashboard**: Manage users, review reports, and oversee platform safety
- **Secure Authentication**: JWT-based auth with bcrypt password hashing

## Prerequisites
- Node.js installed on your machine
- MongoDB Atlas account (free tier)

## Setup Instructions

### 1. Database Setup
1. Create a free cluster on MongoDB Atlas.
2. Get your connection string (URI).
3. Create a cluster with a username and password.

### 2. Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` folder and add your environment variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string_here
   JWT_SECRET=super_secret_key_for_json_web_tokens
   NODE_ENV=development
   ```
4. Start the backend server:
   ```bash
   npm run dev
   # OR
   node server.js
   ```

### 3. Frontend Setup
1. Open a **new terminal window** and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```

The application will now be running. The frontend runs on `http://localhost:5173` and automatically proxies API requests to the backend running on `http://localhost:5000`.

## Deployment Guide (Render & Vercel)

### Backend (Render)
1. Push your code to GitHub.
2. Go to [Render.com](https://render.com) and create a new "Web Service".
3. Connect your GitHub repository.
4. Set the Root Directory to `backend`.
5. Set the Build Command to `npm install`.
6. Set the Start Command to `node server.js`.
7. Add your Environment Variables (`MONGO_URI`, `JWT_SECRET`).

### Frontend (Vercel)
1. Go to [Vercel.com](https://vercel.com) and create a new Project.
2. Connect your GitHub repository.
3. Edit the Root Directory and select the `frontend` folder.
4. For "Framework Preset", verify it detects **Vite**.
5. Vercel requires the API URL to be absolute in production. You will need to update `frontend/src/services/api.js` to point to your live Render backend URL before deploying, or set up environment variables in Vite.

## Built By
- [Your Name]
- BCA Final Year Project
