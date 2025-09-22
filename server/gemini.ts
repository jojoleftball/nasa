import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateChatResponse(
  userMessage: string,
  context: string = "",
  chatHistory: Array<{ role: string; content: string }> = []
): Promise<string> {
  try {
    const systemPrompt = `You are Ria, a NASA space biology research assistant. You help researchers and students understand space biology concepts, NASA research data, and scientific studies.

Key capabilities:
- Explain space biology concepts in clear, accessible language
- Provide information about NASA's space biology research
- Help interpret scientific data and research findings
- Suggest relevant studies and research areas
- Answer questions about microgravity effects, radiation biology, plant biology in space, human health in space, etc.

Context from current research session: ${context}

Guidelines:
- Be professional, accurate, and helpful
- Cite NASA research when relevant
- Explain complex concepts clearly
- If you don't know something, say so and suggest how to find the answer
- Keep responses focused on space biology and NASA research`;

    const conversationHistory = chatHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        ...conversationHistory,
        {
          role: "user",
          parts: [{ text: userMessage }]
        }
      ],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    });

    return response.text || "I'm sorry, I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Error generating chat response:", error);
    return "I'm experiencing technical difficulties. Please try again later.";
  }
}

export async function summarizeStudy(studyText: string): Promise<string> {
  try {
    const prompt = `As a space biology research assistant, please provide a concise 3-4 sentence summary of the following NASA research study, highlighting the key findings and implications:

${studyText}

Focus on:
- Main research objective
- Key findings
- Implications for space biology/missions
- Significance of the work`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.5,
        maxOutputTokens: 500,
      }
    });

    return response.text || "Unable to generate summary.";
  } catch (error) {
    console.error("Error summarizing study:", error);
    return "Summary unavailable.";
  }
}

export async function generateSearchSuggestions(query: string): Promise<string[]> {
  try {
    const prompt = `Based on the search query "${query}" related to space biology research, suggest 5 alternative or related search terms that might help find relevant NASA studies. Return only the search terms, one per line.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.6,
        maxOutputTokens: 200,
      }
    });

    const suggestions = response.text?.split('\n').filter(s => s.trim()).slice(0, 5) || [];
    return suggestions;
  } catch (error) {
    console.error("Error generating search suggestions:", error);
    return [];
  }
}
