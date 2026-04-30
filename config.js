const firebaseConfig = {
  apiKey: "AIzaSyAFfzdiaiNhDLilNUVG_o3LnX2U0ZQmrys",
  authDomain: "pdvcaixa-8c17e.firebaseapp.com",
  databaseURL: "https://pdvcaixa-8c17e-default-rtdb.firebaseio.com",
  projectId: "pdvcaixa-8c17e",
  storageBucket: "pdvcaixa-8c17e.firebasestorage.app",
  messagingSenderId: "394102472085",
  appId: "1:394102472085:web:3462ffc38d4b94723aca9c"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();