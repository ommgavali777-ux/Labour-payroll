import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyBU8XJ5DtJ4EiMzMgXD7iOfMSnTFeelfiA",
  authDomain: "labour-payment-roll.firebaseapp.com",
  projectId: "labour-payment-roll",
  storageBucket: "labour-payment-roll.firebasestorage.app",
  messagingSenderId: "163696797926",
  appId: "1:163696797926:web:b1e884a322f3ec44a3f327"
};
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
