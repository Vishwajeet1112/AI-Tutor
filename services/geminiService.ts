
import { GoogleGenAI, Chat, GenerateContentResponse, Content } from "@google/genai";

let chat: Chat | null = null;
let ai: GoogleGenAI | null = null;

const SYSTEM_INSTRUCTION = "You are 'Echo', a friendly and encouraging AI English tutor. Your primary goal is to help the user practice and improve their English speaking skills. Keep your responses concise, conversational, and clear. If the user makes a grammatical error, gently correct it and briefly explain the rule. For example, say 'That's close! A more natural way to say it is...' and then provide the correction. End your responses with a question to keep the conversation flowing and encourage the user to speak more. Do not use markdown or complex formatting.";

const getAI = (): GoogleGenAI => {
    if (!ai) {
        // This check is designed for environments where `process.env` is populated,
        // typically in Node.js or via a build tool like Vite/Webpack.
        const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY)
            ? process.env.API_KEY
            : undefined;

        if (!apiKey) {
            const detailedError = `Gemini API Key not found.

This application requires a Gemini API key to function. It's designed to be read from an environment variable named 'API_KEY'.

If you are running this locally, you need to ensure this variable is available to the process serving the application. For example, by using a development server that supports .env files.`;
            throw new Error(detailedError);
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

export const startChatSession = (history: Content[]): Chat => {
    const aiInstance = getAI(); // This will throw if the key is missing
    chat = aiInstance.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
        },
        history,
    });
    return chat;
};

export const sendMessageToAI = async (message: string, history: Content[]): Promise<string> => {
    try {
        if (!chat) {
            // This will initialize the chat and implicitly check for the API key via getAI()
            startChatSession(history);
        }
        
        const chatSession = chat!;

        const response: GenerateContentResponse = await chatSession.sendMessage({ message });
        return response.text;
    } catch (error) {
        console.error("Error sending message to Gemini:", error);
        // Re-throw the error to be handled by the calling hook
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("An unknown error occurred while communicating with the AI.");
    }
};
