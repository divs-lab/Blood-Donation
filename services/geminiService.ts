
import { GoogleGenAI, Type } from "@google/genai";
import { BloodStock, RequestItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getInventoryAnalysis = async (stock: BloodStock[], requests: RequestItem[]) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze current blood stock levels: ${JSON.stringify(stock)}. 
                Pending requests: ${JSON.stringify(requests)}. 
                Identify critical shortages and provide 3 tactical recommendations for procurement.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            criticalShortages: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["summary", "criticalShortages", "recommendations"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Analysis Failed:", error);
    return null;
  }
};
