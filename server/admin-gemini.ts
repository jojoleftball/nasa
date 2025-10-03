import { GoogleGenAI } from "@google/genai";
import { nasaOSDRService } from "./nasa-osdr";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface AdminContext {
  currentResearch?: any;
  allResearch?: any[];
}

function generateAdminSystemPrompt(context: AdminContext): string {
  const baseIdentity = `You are an advanced AI assistant specifically designed to help administrators manage and curate space biology research content. You have deep expertise in NASA OSDR research and can help with content creation, research analysis, and data curation.`;
  
  const capabilities = `
CORE CAPABILITIES:
• Research Content Analysis: Analyze and summarize space biology research papers
• Content Curation: Help create compelling titles, descriptions, and tags for research entries
• NASA OSDR Integration: Provide relevant NASA OSDR links and research connections
• Research Recommendations: Suggest related studies and research pathways
• Quality Assurance: Review research entries for completeness and accuracy
• Search Optimization: Recommend effective tags and keywords for discoverability
• Data Validation: Help verify research data and sources

ADMIN-SPECIFIC FEATURES:
• Suggest appropriate NASA OSDR links for research topics
• Generate comprehensive research descriptions
• Recommend relevant tags based on research content
• Identify gaps in research coverage
• Suggest custom fields for specialized research data
• Help organize and categorize research entries
• Provide insights on research trends and popular topics`;

  let contextInfo = "";
  if (context.currentResearch) {
    contextInfo = `\n\nCURRENT RESEARCH CONTEXT:\nTitle: ${context.currentResearch.title}\nDescription: ${context.currentResearch.description}\nTags: ${context.currentResearch.tags?.join(", ") || "None"}`;
  }

  if (context.allResearch && context.allResearch.length > 0) {
    contextInfo += `\n\nTOTAL RESEARCH ENTRIES: ${context.allResearch.length}`;
  }

  return `${baseIdentity}\n\n${capabilities}${contextInfo}\n\nYou should provide practical, actionable assistance to help administrators create high-quality research entries. When suggesting content, be specific and reference actual NASA OSDR research when relevant. Format your responses clearly and professionally.`;
}

export async function generateAdminAssistantResponse(
  message: string,
  context?: AdminContext
): Promise<string> {
  try {
    const systemPrompt = generateAdminSystemPrompt(context || {});
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [{ text: message }]
      }],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        maxOutputTokens: 2000,
      }
    });

    return response.text || "I'm here to help you manage research content. How can I assist you?";
  } catch (error) {
    console.error("Error generating admin assistant response:", error);
    return "I apologize, but I encountered an error. Please try again.";
  }
}

export async function suggestResearchTags(title: string, description: string): Promise<string[]> {
  try {
    const prompt = `Based on this research title and description, suggest 5-10 relevant tags that would help users find this content:

Title: ${title}
Description: ${description}

Return ONLY a comma-separated list of tags, nothing else.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.5, maxOutputTokens: 200 }
    });
    
    const tagsText = response.text || "";
    return tagsText.split(",").map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
  } catch (error) {
    console.error("Error suggesting tags:", error);
    return [];
  }
}

export async function suggestNasaOSDRLinks(topic: string): Promise<string[]> {
  try {
    const studies = await nasaOSDRService.searchStudies(topic, 5);
    return studies.map(study => study.url);
  } catch (error) {
    console.error("Error suggesting NASA OSDR links:", error);
    return [];
  }
}

export async function enhanceDescription(shortDescription: string): Promise<string> {
  try {
    const prompt = `Enhance this research description to be more detailed and informative while maintaining scientific accuracy:

${shortDescription}

Provide a comprehensive description that would help users understand the research better. Keep it factual and professional.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.6, maxOutputTokens: 1000 }
    });
    
    return response.text || shortDescription;
  } catch (error) {
    console.error("Error enhancing description:", error);
    return shortDescription;
  }
}
