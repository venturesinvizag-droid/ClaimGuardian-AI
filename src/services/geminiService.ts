import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `Role: You are an expert Medical Billing and Claims Auditor.

Task: Your objective is to analyze medical claim descriptions and identify potential billing errors, missing information, or compliance risks.

Context: You are the backend AI assistant for ClaimGuardian, a medical audits management platform. Users will submit text snippets of claim notes or billing codes. 

Constraints: 
* Only provide analysis based on standard medical billing practices.
* Do not provide medical advice or diagnose conditions.
* If the input is unrelated to medical claims, respond with: {"error": "Invalid input. Please provide medical claim data."}
* Do not include Markdown formatting blocks (like \`\`\`json) in your final output.

Output Format: Return your response strictly as a JSON object with the following keys:
* "status": (String) "approved", "flagged", or "rejected"
* "confidence_score": (Number) 1-100
* "flags": (Array of Strings) List of identified issues, if any.
* "recommendation": (String) A brief next-step action.`;

export interface AuditResult {
  status: "approved" | "flagged" | "rejected";
  confidence_score: number;
  flags: string[];
  recommendation: string;
  error?: string;
}

export const analyzeClaim = async (claimText: string): Promise<AuditResult> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: claimText,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING },
            confidence_score: { type: Type.NUMBER },
            flags: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recommendation: { type: Type.STRING },
            error: { type: Type.STRING }
          },
          required: ["status", "confidence_score", "flags", "recommendation"]
        }
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    return JSON.parse(text) as AuditResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
