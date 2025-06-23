const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const cors = require("cors");

admin.initializeApp();
const db = admin.firestore();


const corsHandler = cors({ origin: true });
const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: functions.config().openai.key,
  baseURL: "https://openrouter.ai/api/v1", //  required for OpenRouter
});


exports.getAdvice = functions
  .runWith({ runtime: "nodejs18" })
  .https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', 'http://127.0.0.1:5173');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(204).send('');
    }

    try {
      const { budgets, transactions } = req.body;

      const prompt = `
You are an AI assistant helping users manage personal finances in an app called Spendly.

Budgets:
${JSON.stringify(budgets, null, 2)}

Transactions:
${JSON.stringify(transactions, null, 2)}

Provide 2–3 helpful insights or suggestions related to saving money, staying within budget, or spotting trends. Be friendly and specific.
      `;

   const chat = await openai.chat.completions.create({
  model: "gpt-3.5-turbo", 
  messages: [{ role: "user", content: prompt }],
});

      const response = chat.choices[0].message.content;
      return res.status(200).json({ advice: response });
    } catch (err) {
      console.error(" Error:", err);
      return res.status(500).json({ error: "Advice failed" });
    }
  });

exports.createUserDocument = functions
  .runWith({ runtime: 'nodejs18' })
  .auth.user()
  .onCreate(async (userRecord) => {
    const { uid, email, displayName } = userRecord;
    await db.collection("users").doc(uid).set({
      email: email || "",
      displayName: displayName || "",
      sharedWith: [],
    });
    console.log(` Created user doc for ${email}`);
  });
const { getFirestore } = require('firebase-admin/firestore');

/**
 * rrecursively deletes a firestore subcollection
 */
async function deleteSubcollection(docRef, subcollectionName) {
  const subcollectionRef = docRef.collection(subcollectionName);
  const snap = await subcollectionRef.get();

  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));

  if (!snap.empty) {
    await batch.commit();
    console.log(` Deleted ${snap.size} docs from ${docRef.path}/${subcollectionName}`);
  }
}

exports.cleanupUserData = functions
  .runWith({ runtime: 'nodejs18' })
  .auth.user()
  .onDelete(async (userRecord) => {
    const deletedUid = userRecord.uid;
    try {
      const deletedUserRef = db.collection('users').doc(deletedUid);

      // delete main user document
      await deletedUserRef.delete();
      console.log(` Deleted Firestore document for UID: ${deletedUid}`);

      // delete their subcollections
      await Promise.all([
        deleteSubcollection(deletedUserRef, 'incomingInvites'),
        deleteSubcollection(deletedUserRef, 'notifications'),
      ]);

      // remove this UID from others' sharedWith and incomingInvites
      const usersSnap = await db.collection('users').get();
      const batch = db.batch();

      for (const docSnap of usersSnap.docs) {
        const data = docSnap.data();
        const updates = {};
        let hasChanges = false;

        // remove from sharedWith
        if (Array.isArray(data.sharedWith) && data.sharedWith.includes(deletedUid)) {
          updates.sharedWith = data.sharedWith.filter((uid) => uid !== deletedUid);
          hasChanges = true;
        }

        // remove invites sent *to* this deleted user
        const invitesSnap = await docSnap.ref.collection('incomingInvites').get();
        invitesSnap.forEach((invite) => {
          if (invite.data().fromUid === deletedUid) {
            batch.delete(invite.ref);
            console.log(`Deleted invite from ${deletedUid} in ${docSnap.id}`);
          }
        });

        if (hasChanges) {
          batch.update(docSnap.ref, updates);
        }
      }

      await batch.commit();
      console.log(` Fully cleaned up UID: ${deletedUid}`);
    } catch (err) {
      console.error(" Error during cleanupUserData:", err);
    }
  });
