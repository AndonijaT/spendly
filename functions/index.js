const functions = require("firebase-functions/v1"); // Note: v1
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

//  Force Node.js 18 using { runtime: 'nodejs18' }
exports.createUserDocument = functions
  .runWith({ runtime: 'nodejs18' })
  .auth.user()
  .onCreate(async (userRecord) => {
    const { uid, email, displayName } = userRecord;

    const userDocRef = db.collection("users").doc(uid);

    await userDocRef.set({
      email: email || "",
      displayName: displayName || "",
      sharedWith: [],
    });

    console.log(` Created user doc for ${email}`);
});
