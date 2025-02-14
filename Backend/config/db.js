const admin = require("firebase-admin");
const {getFirestore} = require("firebase-admin/firestore");
const cleAcces = require("../db-config.json");

admin.initializeApp({
  credential: admin.credential.cert(cleAcces),
});

const db = getFirestore();

module.exports = db;