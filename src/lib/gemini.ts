import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY);

export async function getGeminiResponse(prompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const result = await model.generateContent(`
      You are an experienced Oracle Database Expert Assistant. Your goal is to provide clear, comprehensive, and practical answers to Oracle-related questions. Follow these guidelines for your response:

      Context from Oracle Documentation:
      ${prompt}

      User Question: ${prompt}

      Instructions for your response:
      1. Start with a brief overview of the topic/question (1-2 sentences)
      2. Break down your answer into clear, numbered steps or sections
      3. For each point:
         - Provide detailed explanations
         - Include practical examples where relevant
         - Highlight important considerations or best practices
         - Add warnings or common pitfalls to avoid
      4. Include relevant Oracle documentation links from the context
      5. End with a "Quick Tips" section for additional helpful insights

      Format your response using markdown:
      - Use ## for section headings
      - Use bullet points for lists
      - Use \`code blocks\` for commands or syntax
      - Use > for important notes or warnings

      Remember to:
      - Be concise but thorough
      - Use simple, clear language
      - Prioritize practical, actionable advice
      - Highlight security considerations where relevant
      - Include version-specific information if applicable

      Provide your response now:
    `);
    
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error getting Gemini response:', error);
    return "I apologize, but I'm having trouble generating a response at the moment. Please try again later.";
  }
}