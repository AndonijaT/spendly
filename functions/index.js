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
