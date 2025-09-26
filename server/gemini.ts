import { GoogleGenAI } from "@google/genai";
import { nasaOSDRService } from "./nasa-osdr";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export enum ConversationMode {
  RESEARCH_ASSISTANT = "research_assistant",
  STUDY_ANALYZER = "study_analyzer", 
  DATA_EXPLORER = "data_explorer",
  METHODOLOGY_EXPERT = "methodology_expert"
}

export interface ChatContext {
  currentStudy?: any;
  userInterests?: string[];
  recentSearches?: string[];
  currentPage?: string;
  favoriteStudies?: any[];
  researchGoals?: string[];
}

function generateAdvancedSystemPrompt(mode: ConversationMode, context: ChatContext): string {
  const baseIdentity = `You are Ria, an advanced NASA space biology research AI assistant with deep expertise in space life sciences, microgravity research, and astrobiology.`;
  
  const capabilities = `
CORE EXPERTISE:
• Space biology research methodologies and experimental design
• Microgravity effects on biological systems (cellular, molecular, physiological levels)
• Radiation biology and space environment impacts
• Plant biology in space environments and space agriculture
• Human health and performance in space (cardiovascular, musculoskeletal, neurological)
• Astrobiology and extremophile research
• Space life support systems and closed-loop ecosystems
• NASA OSDR database knowledge and research trends

ADVANCED CAPABILITIES:
• Real-time access to NASA OSDR research database
• Study comparison and analysis across multiple datasets
• Research pathway recommendations based on user interests
• Methodology critique and experimental design suggestions
• Data interpretation and statistical analysis guidance
• Citation and reference management for scientific accuracy`;

  let modeSpecificPrompt = "";
  switch (mode) {
    case ConversationMode.RESEARCH_ASSISTANT:
      modeSpecificPrompt = `
MODE: Research Assistant
• Help users discover and understand relevant studies
• Provide research guidance and methodology advice
• Suggest new research directions and collaborations
• Explain complex concepts in accessible language`;
      break;
    case ConversationMode.STUDY_ANALYZER:
      modeSpecificPrompt = `
MODE: Study Analyzer
• Provide detailed analysis of research papers and datasets
• Compare methodologies across studies
• Identify strengths, limitations, and areas for improvement
• Suggest follow-up research questions`;
      break;
    case ConversationMode.DATA_EXPLORER:
      modeSpecificPrompt = `
MODE: Data Explorer
• Help users navigate and query NASA OSDR datasets
• Perform real-time data searches and filtering
• Identify patterns and trends across research areas
• Generate data visualizations and insights`;
      break;
    case ConversationMode.METHODOLOGY_EXPERT:
      modeSpecificPrompt = `
MODE: Methodology Expert
• Provide expert guidance on experimental design
• Suggest appropriate controls and statistical approaches
• Help troubleshoot methodological challenges
• Recommend best practices for space biology research`;
      break;
  }

  const contextualInfo = buildContextualPrompt(context);

  return `${baseIdentity}

${capabilities}

${modeSpecificPrompt}

${contextualInfo}

INTERACTION GUIDELINES:
• Provide scientifically accurate, evidence-based responses
• Always cite relevant NASA studies and OSDR data when available
• Use clear, professional language appropriate for researchers
• Acknowledge limitations and suggest resources for further information
• Proactively suggest related studies, methodologies, or research areas
• Integrate user's research interests and context into recommendations
• Use proper scientific terminology while ensuring clarity`;
}

function buildContextualPrompt(context: ChatContext): string {
  let contextPrompt = "\nCURRENT RESEARCH CONTEXT:\n";
  
  if (context.currentStudy) {
    contextPrompt += `• Currently viewing study: "${context.currentStudy.title}" (${context.currentStudy.id})\n`;
    contextPrompt += `• Study focus: ${context.currentStudy.abstract?.substring(0, 200)}...\n`;
  }
  
  if (context.userInterests && context.userInterests.length > 0) {
    contextPrompt += `• User research interests: ${context.userInterests.join(", ")}\n`;
  }
  
  if (context.recentSearches && context.recentSearches.length > 0) {
    contextPrompt += `• Recent searches: ${context.recentSearches.slice(0, 3).join(", ")}\n`;
  }
  
  if (context.currentPage) {
    contextPrompt += `• Current page: ${context.currentPage}\n`;
  }
  
  if (context.favoriteStudies && context.favoriteStudies.length > 0) {
    contextPrompt += `• User has ${context.favoriteStudies.length} favorited studies in areas: ${context.favoriteStudies.map(s => s.studyTitle).slice(0, 3).join(", ")}\n`;
  }

  return contextPrompt;
}

function getTemperatureForMode(mode: ConversationMode): number {
  switch (mode) {
    case ConversationMode.RESEARCH_ASSISTANT:
      return 0.7;
    case ConversationMode.STUDY_ANALYZER:
      return 0.5;
    case ConversationMode.DATA_EXPLORER:
      return 0.6;
    case ConversationMode.METHODOLOGY_EXPERT:
      return 0.4;
    default:
      return 0.7;
  }
}

async function enhanceMessageWithNASAData(message: string, context: ChatContext): Promise<string> {
  const dataQueryPatterns = [
    /find studies about|search for studies|what studies|research on|papers about/i,
    /recent research|latest studies|new findings/i,
    /compare studies|similar research|related work/i,
    /data on|dataset|experimental data/i
  ];

  const isDataQuery = dataQueryPatterns.some(pattern => pattern.test(message));
  
  if (isDataQuery) {
    try {
      const searchTerms = extractSearchTerms(message);
      if (searchTerms) {
        const relevantStudies = await nasaOSDRService.searchStudies(searchTerms, 5);
        if (relevantStudies.length > 0) {
          const studyContext = relevantStudies.map(study => 
            `• ${study.title} (${study.id}): ${study.abstract?.substring(0, 150)}...`
          ).join('\n');
          
          return `${message}\n\nRELEVANT NASA OSDR STUDIES:\n${studyContext}`;
        }
      }
    } catch (error) {
      console.log('Could not fetch NASA data for enhancement:', error);
    }
  }
  
  return message;
}

function extractSearchTerms(message: string): string | null {
  const terms = message
    .toLowerCase()
    .replace(/find studies about|search for studies|what studies|research on|papers about|recent research|latest studies|new findings|data on/gi, '')
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(term => term.length > 2 && !['the', 'and', 'for', 'with', 'are', 'have', 'that', 'this'].includes(term))
    .slice(0, 3)
    .join(' ');
    
  return terms.trim() || null;
}

async function enhanceResponseWithCitations(response: string, context: ChatContext): Promise<string> {
  if (context.currentStudy) {
    const currentStudyRef = `\n\n📖 **Current Study Reference:**\n[${context.currentStudy.title}](${context.currentStudy.url})`;
    response += currentStudyRef;
  }
  
  if (context.userInterests && context.userInterests.length > 0) {
    try {
      const recommendations = await generatePersonalizedRecommendations(context.userInterests);
      if (recommendations.length > 0) {
        response += `\n\n🎯 **Personalized Study Recommendations:**\n${recommendations.slice(0, 2).map(r => `• [${r.title}](${r.url})`).join('\n')}`;
      }
    } catch (error) {
      console.log('Could not generate recommendations:', error);
    }
  }
  
  return response;
}

async function generatePersonalizedRecommendations(interests: string[]): Promise<any[]> {
  const recommendations: any[] = [];
  
  for (const interest of interests.slice(0, 2)) {
    try {
      const studies = await nasaOSDRService.getStudiesByInterest(interest);
      recommendations.push(...studies.slice(0, 1));
    } catch (error) {
      console.log(`Could not fetch recommendations for ${interest}:`, error);
    }
  }
  
  return recommendations;
}

export async function generateChatResponse(
  userMessage: string,
  context: ChatContext = {},
  chatHistory: Array<{ role: string; content: string }> = [],
  mode: ConversationMode = ConversationMode.RESEARCH_ASSISTANT
): Promise<string> {
  try {
    const systemPrompt = generateAdvancedSystemPrompt(mode, context);

    const conversationHistory = chatHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const enhancedMessage = await enhanceMessageWithNASAData(userMessage, context);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        ...conversationHistory,
        {
          role: "user",
          parts: [{ text: enhancedMessage }]
        }
      ],
      config: {
        systemInstruction: systemPrompt,
        temperature: getTemperatureForMode(mode),
        maxOutputTokens: 1500,
      }
    });

    let responseText = response.text || "I'm sorry, I couldn't generate a response. Please try again.";
    
    responseText = await enhanceResponseWithCitations(responseText, context);
    
    return responseText;
  } catch (error) {
    console.error("Error generating chat response:", error);
    return "I'm experiencing technical difficulties. Please try again later.";
  }
}

export async function summarizeStudy(studyText: string): Promise<string> {
  try {
    const prompt = `As an advanced space biology research AI, provide a comprehensive yet concise summary of this NASA research study. Structure your response with:

1. **Research Objective**: What was the primary goal?
2. **Methodology**: How was the study conducted?
3. **Key Findings**: What were the main discoveries?
4. **Implications**: Why is this important for space biology/missions?
5. **Future Directions**: What research should follow?

Study to analyze:
${studyText}

Keep each section to 1-2 sentences for clarity.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.5,
        maxOutputTokens: 800,
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
    const prompt = `As a NASA space biology research expert, suggest 5 highly relevant search terms for the query "${query}". Focus on:
- Specific research methodologies
- Related biological systems or processes  
- Space-specific conditions (microgravity, radiation, etc.)
- Model organisms commonly used
- Complementary research areas

Return only the search terms, one per line, without numbers or bullets.`;

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

export async function analyzeStudyComparison(studies: any[]): Promise<string> {
  try {
    const studyData = studies.map(study => 
      `Title: ${study.title}\nAbstract: ${study.abstract?.substring(0, 300)}...\nMethodology: ${study.assayType || 'Not specified'}`
    ).join('\n\n---\n\n');

    const prompt = `As a space biology methodology expert, compare these NASA studies and provide:

1. **Common Themes**: What research areas do they share?
2. **Methodological Differences**: How do their approaches differ?
3. **Complementary Insights**: How do their findings complement each other?
4. **Research Gaps**: What areas need further investigation?
5. **Synthesis**: What broader conclusions can be drawn?

Studies to compare:
${studyData}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.6,
        maxOutputTokens: 1200,
      }
    });

    return response.text || "Unable to generate comparison analysis.";
  } catch (error) {
    console.error("Error analyzing study comparison:", error);
    return "Analysis unavailable.";
  }
}

export async function generateResearchPathway(interests: string[], currentKnowledge: string): Promise<string> {
  try {
    const prompt = `As a NASA space biology research strategist, create a personalized research learning pathway for someone interested in: ${interests.join(', ')}.

Current knowledge level: ${currentKnowledge}

Provide:
1. **Foundation Studies**: 3-4 essential papers to start with
2. **Progressive Learning**: Next level topics to explore
3. **Advanced Research**: Cutting-edge areas to eventually pursue
4. **Practical Experience**: Suggested methodologies to learn
5. **Career Development**: How this knowledge applies to space biology careers

Structure as a clear, actionable learning plan.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    });

    return response.text || "Unable to generate research pathway.";
  } catch (error) {
    console.error("Error generating research pathway:", error);
    return "Pathway unavailable.";
  }
}