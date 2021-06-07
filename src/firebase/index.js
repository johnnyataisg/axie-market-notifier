const firebase = require("firebase/app")
require("firebase/firestore")

const firebaseConfig = {
    apiKey: "AIzaSyBPlI8-wItHj7TyVXAJurSr53uDlgnYRTc",
    authDomain: "axie-market-notifier.firebaseapp.com",
    projectId: "axie-market-notifier",
    storageBucket: "axie-market-notifier.appspot.com",
    messagingSenderId: "1002224309057",
    appId: "1:1002224309057:web:c0ac19fcbc28f4655a87c0"
}

firebase.initializeApp(firebaseConfig)

module.exports.database = firebase.firestore()