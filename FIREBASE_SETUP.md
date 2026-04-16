Firebase setup checklist for this project

1) Enable Authentication
- In Firebase Console, open Authentication -> Sign-in method.
- Enable Email/Password.
- Enable Google provider and add a support email.

2) Create Firestore database
- In Firebase Console, open Firestore Database.
- Create database in production or test mode.

3) Set Firestore Rules
- Go to Firestore Database -> Rules.
- Replace with the rules below and publish.

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}

4) Run app over HTTP
- Do not open HTML directly with file://.
- Use VS Code Live Server or any local static server.

5) Data model used by app
- users/{uid}/meta/budget: { amount: number }
- users/{uid}/expenses/{expenseId}: expense documents

6) Notes
- Existing localStorage data is not auto-migrated.
- New data is saved in Firestore per user account.
- Password reset requires a valid email in the email input field.
- For local testing, ensure your host (for example localhost) is listed in Authentication -> Settings -> Authorized domains.

7) API key and domain restrictions (important for production)
- Your Firebase web API key is public by design, so security comes from strict domain rules, Firestore rules, and provider settings.
- Firebase Console -> Authentication -> Settings -> Authorized domains:
  Add only trusted domains:
  - localhost (for local testing)
  - 127.0.0.1 (optional local testing)
  - your-vercel-domain.vercel.app
  - your-custom-domain.com (if used)
- Remove unknown or unused domains from Authorized domains.

8) Restrict Firebase API key in Google Cloud
- Open Google Cloud Console -> APIs & Services -> Credentials -> select your Firebase Web API key.
- Under Application restrictions:
  - Choose HTTP referrers (web sites).
  - Add referrers:
    - http://localhost:*
    - http://127.0.0.1:*
    - https://your-vercel-domain.vercel.app/*
    - https://your-custom-domain.com/*
- Under API restrictions:
  - Restrict key.
  - Allow only required APIs for this app:
    - Identity Toolkit API
    - Firebase Authentication API
    - Cloud Firestore API
    - (Optional) Firebase Installations API

9) Firestore and auth hardening reminders
- Keep Firestore rules user-scoped (already shown above): users can only read/write their own path.
- In Authentication -> Sign-in method:
  - Enable only providers you use (Email/Password, Google).
  - Disable providers you do not use.

10) Optional extra protection
- Enable Firebase App Check for web to reduce abuse from non-trusted app instances.
- If you enable App Check enforcement, test auth and Firestore flows on localhost and Vercel before enforcing in production.

11) Runtime Firebase config (to avoid committing keys)
- This project now reads Firebase config from one of these sources:
  - Local file: firebase-runtime-config.js (ignored by git)
  - Vercel API route: /api/firebase-config (built from Vercel env vars)
- For local development:
  - Copy firebase-runtime-config.example.js to firebase-runtime-config.js
  - Fill in your Firebase values.

12) Vercel environment variables required
- In Vercel Project Settings -> Environment Variables, add:
  - FIREBASE_API_KEY
  - FIREBASE_AUTH_DOMAIN
  - FIREBASE_PROJECT_ID
  - FIREBASE_STORAGE_BUCKET
  - FIREBASE_MESSAGING_SENDER_ID
  - FIREBASE_APP_ID
- Redeploy after saving env vars.

13) Resolve GitHub secret alert fully
- Rotate/restrict the old Firebase API key in Google Cloud Console.
- Push this code change (no key in tracked files).
- In GitHub secret alert UI, mark the alert as resolved after rotation/restriction.
- If GitHub still flags old commits, either:
  - leave alert closed with evidence key was rotated/restricted, or
  - rewrite git history to remove old key from past commits.
