// Configuración pública del proyecto de Firebase.
// Se separa de `firebase.ts` para que páginas que solo necesitan Firestore
// (por ejemplo la landing /lp/friganta) no carguen también Auth y Storage.
export const firebaseConfig = {
  apiKey: 'AIzaSyDohZW50fMnkcvMWCyPhoeUjMGNY5CeNIc',
  authDomain: 'ideasmkt-53500.firebaseapp.com',
  projectId: 'ideasmkt-53500',
  storageBucket: 'ideasmkt-53500.firebasestorage.app',
  messagingSenderId: '163056663420',
  appId: '1:163056663420:web:536a237e65f795f2bc82f9',
  measurementId: 'G-Y562LQCCZJ'
};
