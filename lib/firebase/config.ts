import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

export { app, auth, db, storage }

// Add a comment with the recommended Firestore security rules

/**
 * Recommended Firestore Security Rules:
 *
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     // Allow public read access to jobs collection
 *     match /jobs/{jobId} {
 *       allow read: if true;
 *       allow create, update: if request.auth != null &&
 *         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "employer";
 *       allow delete: if request.auth != null &&
 *         resource.data.companyId == request.auth.uid;
 *     }
 *
 *     // Users can read and write their own data
 *     match /users/{userId} {
 *       allow read: if request.auth != null && request.auth.uid == userId;
 *       allow create: if request.auth != null;
 *       allow update: if request.auth != null && request.auth.uid == userId;
 *     }
 *
 *     // Applications can be read by the applicant or the job poster
 *     match /applications/{applicationId} {
 *       allow read: if request.auth != null &&
 *         (request.auth.uid == resource.data.userId ||
 *          request.auth.uid == get(/databases/$(database)/documents/jobs/$(resource.data.jobId)).data.companyId);
 *       allow create: if request.auth != null;
 *       allow update: if request.auth != null &&
 *         (request.auth.uid == resource.data.userId ||
 *          request.auth.uid == get(/databases/$(database)/documents/jobs/$(resource.data.jobId)).data.companyId);
 *     }
 *   }
 * }
 */

