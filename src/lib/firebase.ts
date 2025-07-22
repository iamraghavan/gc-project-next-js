// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "gitdrive-9r0s5",
  "appId": "1:998663477654:web:35d7680a3d6068a3fea5b7",
  "storageBucket": "gitdrive-9r0s5.firebasestorage.app",
  "apiKey": "AIzaSyCoDvwjLJxt-u-ETIRhDX5Op_zc4Fk67k8",
  "authDomain": "gitdrive-9r0s5.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "998663477654"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
