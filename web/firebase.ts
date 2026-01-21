import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAfdIO8x6PXPm6J5dyx6S3o2zEebq0Du8E",
  authDomain: "x5-marketing-app.firebaseapp.com",
  projectId: "x5-marketing-app",
  storageBucket: "x5-marketing-app.firebasestorage.app",
  messagingSenderId: "931639129066",
  appId: "1:931639129066:web:78c5a193a4bca5915eb893"
};

const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();

export const db = app.firestore();
export const auth = app.auth();
export const googleProvider = new firebase.auth.GoogleAuthProvider();
export const appleProvider: any = new firebase.auth.OAuthProvider('apple.com');