const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require("../../path/to/serviceAccountKey.json")),
  });
}

module.exports = admin; 