# Firebase Setup Guide for The Margin Round 24 Beta

This document outlines the shared Firebase setup for **The Margin - Round 24 Beta**.

## 1. Environment Variables Configuration

The application reads Firebase parameters from `firebase-applet-config.json` or standard Vite environment variables (`.env`).

Required environment variables (`.env`):
```env
VITE_FIREBASE_API_KEY=AIzaSyCmelr-HV60agS8b78CyjqqY4MnVaY7VKo
VITE_FIREBASE_AUTH_DOMAIN=sunlit-citron-gt8c4.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sunlit-citron-gt8c4
VITE_FIREBASE_STORAGE_BUCKET=sunlit-citron-gt8c4.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=479476508508
VITE_FIREBASE_APP_ID=1:479476508508:web:0f42c90d967808125ac399
```

## 2. Firebase Database & Auth Features

- **Database ID**: `ai-studio-themargin-1d7b3b79-b870-42dd-9935-f045cc08d1cb`
- **Authentication**: Firebase Authentication with Email & Password.
- **Firestore Collections**:
  - `users`: Registered tippers & stats
  - `fixtures`: Official Round 24 fixtures
  - `predictions`: User submitted tips
  - `leagues`: Shared Overall & Head-to-Head leagues
  - `matchResults`: Official game scores entered by Admin
  - `headToHeadMatchups`: Shared Head-to-Head matches
  - `headToHeadStandings`: H2H League tables
  - `leagueInvitations`: Pending and accepted invitations
  - `appSettings`: Schedule confirmation status
  - `admins`: Authorized admin accounts
  - `feedback`: Beta feedback submissions

## 3. Granting Admin Role

To grant a user administrator access:
1. Register the account in the app.
2. In Firestore Console, create a document in the `admins` collection with document ID matching the user's Auth `uid`.
3. Alternatively, set `isAdmin: true` on the user's document in the `users` collection.
