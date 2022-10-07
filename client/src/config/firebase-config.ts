import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
 
// Initialize Firebase
const app = initializeApp ({
    apiKey: 'AIzaSyDRovhtCXdu6UiljDdZ53_gMG4oOK2FMpI',
    authDomain: 'creme-caramel.firebaseapp.com',
    projectId: 'creme-caramel',
    storageBucket: 'creme-caramel.appspot.com',
    messagingSenderId: '1060362125866',
    appId: '1:1060362125866:web:f53bc96573c2368f5af953',
    measurementId: 'G-EQYPS43V2E',
});
 
// Firebase storage reference
const storage = getStorage(app);
export default storage;



// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyDRovhtCXdu6UiljDdZ53_gMG4oOK2FMpI",
//   authDomain: "creme-caramel.firebaseapp.com",
//   projectId: "creme-caramel",
//   storageBucket: "creme-caramel.appspot.com",
//   messagingSenderId: "1060362125866",
//   appId: "1:1060362125866:web:f53bc96573c2368f5af953",
//   measurementId: "G-EQYPS43V2E"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);