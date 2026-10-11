# Bookkeeping With Jake Demi — Firebase Integration & Admin Panel

Production Next.js application integrated with Cloud Firestore, Firebase Authentication, Firebase Storage, and Firebase Admin SDK.

- **Firebase Project ID**: `geetha-coaching`
- **Project Name**: Geetha coaching
- **Public Website**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Admin Panel**: `/admin` (Protected with strict RBAC)

---

## Architecture Overview

1. **Client-Side SDK** (`src/lib/firebase/client.ts`):
   - Firebase Authentication for email/password sign-in.
   - Cloud Firestore read operations for public website content & product catalog.
   - Firebase Storage uploads for media, product images, and downloadable book files.
2. **Server-Side Admin SDK** (`src/lib/firebase/admin.ts`):
   - Secure server operations using `firebase-admin`.
   - ID Token verification in `src/lib/firebase/admin-verify.ts`.
   - Stripe webhook verification & database updates in `/api/webhooks/stripe`.
   - Admin management APIs in `/api/admin/*`.
3. **Role-Based Authorization**:
   - Authentication alone does **not** grant admin rights.
   - Only users with an active record in Firestore `admins/{uid}` (`role: "admin"`, `active: true`) can access `/admin`.
   - Unauthenticated users are redirected to `/admin/login`.
   - Authenticated non-admin users receive a strict **Access Denied** response.

---

## 9-Step Firebase Setup & Console Configuration

Follow these steps in the [Firebase Console](https://console.firebase.google.com/) for project `geetha-coaching`:

### Step 1: Create Firebase Web App
1. Navigate to Project Settings > General > **Your apps**.
2. Click **Add App** > Select **Web (`</>`)**.
3. Register app with nickname `Bookkeeping Web`.
4. Copy the config object credentials into `.env.local` (`NEXT_PUBLIC_FIREBASE_*`).

### Step 2: Enable Email/Password Authentication
1. Go to **Build** > **Authentication** > **Sign-in method**.
2. Click **Email/Password** and enable the provider.
3. (Optional) Create your first user account under the **Users** tab, or use the init API below.

### Step 3: Create Cloud Firestore Database
1. Go to **Build** > **Firestore Database**.
2. Click **Create database** (choose Production mode, standard location e.g. `nam5` or `us-east1`).

### Step 4: Enable Firebase Storage
1. Go to **Build** > **Storage**.
2. Click **Get Started** and create the default bucket.

### Step 5: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in the credentials from Firebase Console:
- Public web keys: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, etc.
- Server-side admin credentials:
  - Generate a new private key from **Project Settings > Service accounts > Firebase Admin SDK > Generate new private key**.
  - Set `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` in `.env.local`.

### Step 6: Create the First Administrator
Admins are **never** created automatically via public signup. Use either:
1. **API Initialization**:
   Send a POST request to `/api/admin/init-first-admin`:
   ```bash
   curl -X POST http://localhost:3000/api/admin/init-first-admin \
     -H "Content-Type: application/json" \
     -d '{
       "email": "jake@jakedemicoaching.com",
       "password": "SecurePassword123!",
       "name": "Jake Demi",
       "secret": "geetha-coaching-setup-token-2026"
     }'
   ```
2. Or create the user in Firebase Auth Console, then add a document to `admins/{uid}` in Firestore:
   ```json
   {
     "uid": "<USER_UID>",
     "email": "jake@jakedemicoaching.com",
     "name": "Jake Demi",
     "role": "admin",
     "active": true,
     "createdAt": "2026-10-07T00:00:00.000Z"
   }
   ```

### Step 7: Deploy Firestore Security Rules
Deploy the included [`firestore.rules`](./firestore.rules) file:
```bash
npx firebase-tools deploy --only firestore:rules --project geetha-coaching
```

### Step 8: Deploy Storage Security Rules
Deploy the included [`storage.rules`](./storage.rules) file:
```bash
npx firebase-tools deploy --only storage --project geetha-coaching
```

### Step 9: Seed Initial Website & Product Data
Populate default products ($150 Community, $29 Book, $40 Cheat Sheets, $25 Workflow), site copy, and settings:
- Via CLI:
  ```bash
  npm run seed
  ```
- Or click the **Seed Initial Firestore Data** button on the `/admin` Dashboard.

---

## Firestore Collections

- **`admins/{uid}`**: Authorized administrators (`role: "admin"`, `active: true`).
- **`users/{uid}`**: Registered customer records & profiles.
- **`products/{productId}`**: Digital products catalog with active flags, prices, download paths.
- **`orders/{orderId}`**: Order records created upon successful Stripe checkout webhooks.
- **`community_members/{userId}`**: Monthly membership subscriptions & renewal statuses.
- **`messages/{messageId}`**: Inbound submissions from `/contact` (`status: "unread"`).
- **`site_content/{section}`**: CMS content for `hero`, `stats`, `community`, `book`, `about`, `finalCta`.
- **`settings/{section}`**: Platform settings (`general`, `contact`, `social`, `payments`).

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start Next.js development server
npm run dev

# 3. Lint codebase
npm run lint

# 4. Production build test
npm run build
```

Admin Panel routes are protected under `/admin/*` and include `<meta name="robots" content="noindex, nofollow" />`.
