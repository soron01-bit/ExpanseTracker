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
