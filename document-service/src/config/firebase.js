// config/firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('../path/to/your/serviceAccountKey.json'); // Update this path

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'your-project-id.appspot.com' // Replace with your Firebase Storage bucket
});

const bucket = admin.storage().bucket();

module.exports = { admin, bucket };