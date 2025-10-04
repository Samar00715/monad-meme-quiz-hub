// firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC7vOLrqM3G6JFGica-YbSIj9e3NF6VXFo",
  authDomain: "monad-meme-quizhub.firebaseapp.com",
  databaseURL: "https://monad-meme-quizhub-default-rtdb.firebaseio.com",
  projectId: "monad-meme-quizhub",
  storageBucket: "monad-meme-quizhub.appspot.com",
  messagingSenderId: "233873155237",
  appId: "1:233873155237:web:50dfd7652c9c1a2f59d94c",
  measurementId: "G-R9X8N1T04D"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
