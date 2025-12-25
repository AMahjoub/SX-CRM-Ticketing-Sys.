
import { GoogleGenAI } from "@google/genai";
import { Ticket, Customer } from "../types";

export const generateTicketSummary = async (ticket: Ticket): Promise<string> => {
  try {
    // Fix: Use process.env.API_KEY directly for initialization as required by coding guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const conversation = ticket.messages.map(m => `${m.senderName}: ${m.text}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Summarize the following support ticket conversation into a single concise paragraph for a support agent:\n\nSubject: ${ticket.subject}\n\n${conversation}`,
    });
    
    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("AI Summary Error:", error);
    return "Error generating AI summary.";
  }
};

export const suggestTicketResponse = async (ticket: Ticket): Promise<string> => {
  try {
    // Fix: Use process.env.API_KEY directly for initialization as required by coding guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const conversation = ticket.messages.map(m => `${m.senderName}: ${m.text}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional support agent for Nexus CRM. Based on this conversation history, suggest a helpful and polite reply to the last message from the client.\n\nSubject: ${ticket.subject}\n\n${conversation}`,
      config: {
        systemInstruction: "Keep responses professional, empathetic, and solution-oriented.",
      }
    });
    
    return response.text || "I'm sorry, I couldn't generate a suggestion.";
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    return "Error generating AI response suggestion.";
  }
};

export const suggestLeadOutreach = async (customer: Customer): Promise<string> => {
  try {
    // Fix: Use process.env.API_KEY directly for initialization as required by coding guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a personalized outreach email for the following lead:\n\nName: ${customer.name}\nCompany: ${customer.company}\nStatus: ${customer.status}\nLifetime Value: $${customer.lifetimeValue}\n\nContext: We are a CRM platform. The goal is to move them to the next stage of the sales pipeline.`,
      config: {
        systemInstruction: "Write short, high-conversion B2B sales emails. Tone: Professional yet approachable.",
      }
    });
    
    return response.text || "Could not generate outreach.";
  } catch (error) {
    console.error("AI Outreach Error:", error);
    return "Error generating outreach suggestion.";
  }
};
