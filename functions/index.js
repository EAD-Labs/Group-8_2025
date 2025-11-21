const functions = require("firebase-functions");
const admin = require("firebase-admin");
const OpenAI = require("openai");

admin.initializeApp();

// Create OpenAI client using your key from Firebase config
const openai = new OpenAI({
  apiKey: functions.config().openai.key,
});

// 🧠 Cloud Function to generate quiz questions using OpenAI
exports.generateQuizQuestions = functions.https.onCall(async (data, context) => {
  try {
    const { topic, numQuestions } = data;

    if (!topic || !numQuestions) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Topic and number of questions are required."
      );
    }

    const prompt = `
      Generate ${numQuestions} multiple-choice questions about "${topic}".
      Each question should have 4 options and specify the correct answer clearly in this JSON format:
      [
        {
          "question": "...",
          "options": ["A", "B", "C", "D"],
          "correct": "A"
        }
      ]
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const text = completion.choices[0].message.content;

    // Parse JSON safely
    let questions;
    try {
      questions = JSON.parse(text);
    } catch (err) {
      console.warn("AI returned non-JSON data:", text);
      throw new functions.https.HttpsError(
        "internal",
        "AI response could not be parsed as JSON."
      );
    }

    return { questions };
  } catch (error) {
    console.error("AI Quiz Generation Error:", error);
    throw new functions.https.HttpsError(
      "internal",
      error.message || "Failed to generate quiz."
    );
  }
});
