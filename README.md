# Alife

Alife is the digital home for Abundant Life Church. It is a modern, full-stack Next.js web application designed to manage church members, life groups, event registrations, and synchronize Sunday sermons directly from YouTube.

## ✨ Features

- **Authentication & User Management**: Secure session management using Firebase Authentication and custom session cookies.
- **Sermon Synchronization**: Automated background cron jobs that fetch the latest sermons from a YouTube playlist and sync them directly to Firestore.
- **Groups & Members**: Hierarchical group management (e.g., cell groups, ministries) with role-based access control (Leaders, Members).
- **Event Registrations**: Built-in event sign-ups with integrated Stripe checkout flows for handling paid events.
- **Rich Text Editing**: Incorporates `novel` Notion-style WYSIWYG editor for church content creation.
- **Modern UI/UX**: Built with Tailwind CSS v4, Framer Motion, and Lucide icons for a responsive, accessible, and elegant user interface, complete with native dark mode support.

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend Server**: Custom [Express](https://expressjs.com/) and `tsx` running alongside Next.js for robust webhook and cron processing
- **Database & Auth**: [Firebase](https://firebase.google.com/) (Firestore, Firebase Admin Auth)
- **Payments**: [Stripe](https://stripe.com/) API
- **State & Validation**: React Hook Form, Zod
- **APIs**: YouTube Data API v3

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm or your preferred package manager

### Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env` file in the project root directory. You will need API keys from Firebase, Stripe, and Google Cloud (YouTube Data API).

   ```env
   # Application URL
   APP_URL=http://localhost:3000

   # Firebase Setup (Client-side)
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   
   # Firebase Admin (Server-side)
   # Define default application credentials for Firebase Admin
   GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccountKey.json

   # Stripe Configuration
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

   # YouTube API Configuration for Sermon Sync
   YOUTUBE_API_KEY=your_youtube_api_key
   YOUTUBE_PLAYLIST_ID=your_youtube_playlist_id
   ```

3. **Run the development server**:
   The app uses a custom Express server wrapper (`server.ts`) to manage session cookies, fire off background jobs, and listen to Stripe hooks securely.

   ```bash
   npm run dev
   ```

4. **Visit the app**:
   Navigate your browser to `http://localhost:3000`.

## 📁 Project Structure

- `server.ts` - Custom Express server setup serving API routes, background jobs (`node-cron`), and webhook ingestion.
- `src/app/` - The Next.js 14/15 App Router pages and frontend layouts.
- `src/components/` - Highly reusable components covering the UI design system and state providers (`AuthProvider`, `ThemeProvider`).
- `src/hooks/` - Client-side state and effect hooks.
- `src/lib/` - Shared types, utility scripts, and validation schemas.
- `firebase.ts` - Client-side Firebase configuration.

## 📜 License

This project was built built for Abundant Life Church.
