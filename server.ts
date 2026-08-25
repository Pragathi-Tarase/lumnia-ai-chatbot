import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Enable permissive CORS for iframe compatibility in AI Studio preview environments
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// Lazy-loaded Gemini AI helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not defined. Please add your key via the Secrets panel in Settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// POST /api/chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const ai = getGeminiClient();

    // Map conversation history to the standard Gemini SDK contents structure
    const mappedHistory = Array.isArray(history) ? history.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text || "" }]
    })) : [];

    const contents = [
      ...mappedHistory,
      { role: "user", parts: [{ text: message }] }
    ];

    // Promise chain for parallel execution via Promise.all
    // Call 1: Generate Chat Reply
    const replyPromise = ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: "You are a helpful, extremely conversational, and engaging chatbot. Answer clearly and visually.",
      }
    }).then(response => {
      const text = response.text || "I'm sorry, I couldn't generate a reply.";
      return text;
    });

    // Call 2: Real-time Analysis (depends on the generated reply)
    const analysisPromise = replyPromise.then(async (replyText) => {
      const prompt = `Analyze this chatbot response and return ONLY a valid JSON object with these fields:
{
  "sentiment": "positive" | "neutral" | "negative",
  "intent": "informational" | "emotional" | "transactional",
  "tone": "formal" | "casual" | "empathetic",
  "confidence": 0.0 to 1.0
}

Chatbot Response:
"${replyText}"`;

      const analysisResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sentiment: {
                type: Type.STRING,
                description: "Sentiment of the chatbot response: positive, neutral, or negative",
                enum: ["positive", "neutral", "negative"]
              },
              intent: {
                type: Type.STRING,
                description: "Intent of the response: informational, emotional, or transactional",
                enum: ["informational", "emotional", "transactional"]
              },
              tone: {
                type: Type.STRING,
                description: "Tone of the response: formal, casual, or empathetic",
                enum: ["formal", "casual", "empathetic"]
              },
              confidence: {
                type: Type.NUMBER,
                description: "Confidence score of this analysis between 0.0 and 1.0"
              }
            },
            required: ["sentiment", "intent", "tone", "confidence"]
          }
        }
      });

      try {
        const text = analysisResponse.text || "{}";
        return JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse analysis JSON, fallback returned.", e);
        return {
          sentiment: "neutral",
          intent: "informational",
          tone: "casual",
          confidence: 0.5
        };
      }
    });

    // Run both calls in parallel using Promise.all()
    const [reply, analysis] = await Promise.all([
      replyPromise,
      analysisPromise
    ]);

    return res.json({ reply, analysis });

  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    return res.status(500).json({ error: error.message || "An error occurred with Gemini." });
  }
});

// Host and Serve frontend
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite();
