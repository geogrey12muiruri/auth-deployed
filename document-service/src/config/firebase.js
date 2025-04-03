const admin = require('firebase-admin');
const serviceAccount = require('../../services/my-project-2aa48-firebase-adminsdk-51468-760c5e62e6.json'); // Correct path to the file

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'my-project-2aa48.firebasestorage.app', // Replace with your Firebase Storage bucket
});

const bucket = admin.storage().bucket();

module.exports = { admin, bucket };