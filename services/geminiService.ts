import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, AIAdvice } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using Flash for quick responses
const MODEL_ID = "gemini-2.5-flash";

export const getHealthInsights = async (
  profile: UserProfile
): Promise<AIAdvice> => {
  const systemInstruction = "You are a supportive, knowledgeable, and friendly fitness coach. You provide scientific, balanced advice focused on longevity and wellness.";

  const prompt = `
    Analyze this user profile:
    Name: ${profile.name}
    Age: ${profile.age}
    BMI: ${profile.bmi.toFixed(1)}
    Activity Level: ${profile.activityLevel}
    Goal: Maintenance and General Health.

    Provide:
    1. 3 specific nutrition tips.
    2. 3 specific workout suggestions suitable for their activity level.
    3. A short, punchy motivational quote.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nutrition: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            workout: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            motivation: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["General", "Recovery"] }
          },
          required: ["nutrition", "workout", "motivation", "type"]
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AIAdvice;
    }
    throw new Error("No response text");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      nutrition: ["Drink more water", "Eat whole foods", "Avoid processed sugar"],
      workout: ["30 min walk", "Pushups", "Stretching"],
      motivation: "Keep pushing forward.",
      type: "General"
    };
  }
};

export const getChatResponse = async (
  message: string,
  history: string[]
): Promise<string> => {
  const instruction = "You are a helpful health assistant. Keep answers concise and encouraging.";

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: `History: ${history.join('\n')}\nUser: ${message}`,
      config: {
        systemInstruction: instruction,
      }
    });
    return response.text || "I'm ready to train when you are.";
  } catch (error) {
    return "Connection issue. Stay focused.";
  }
};