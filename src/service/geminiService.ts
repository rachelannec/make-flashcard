// npm install @google/generative-ai
import { GoogleGenerativeAI } from "@google/generative-ai";

// get api key from env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("⚠️ VITE_GEMINI_API_KEY not found - using mock data");
}

const genAI =new GoogleGenerativeAI(API_KEY);

interface Flashcard {
    id: string;
    question: string;
    answer: string;
}

export async function generateFlashcards(text: string): Promise<Flashcard[]> {
    if (!API_KEY) {
        // Return mock data for testing
        console.log('🔧 Using mock data - please set up your API key');
        return getMockFlashcards(text);
    }
    try{
        const model =genAI.getGenerativeModel({ model: 'gemini-2.0-flash'});

        const prompt = `Based on the following text, generate 8-12 flashcards for active recall learning. Return the flashcards as a JSON array, where each item is an object with a "question" and an "answer". The questions should be thought-provoking but not overly complex. Answers must be short, clear, and use simple language. Use identification (provide the definition as question and the terminology as answer), true/false, and multiple-choice questions where appropriate.


        Format your response as a valid JSON array with this exact structure:
        [
            {
                "question": "Your question here?",
                "answer": "Your answer here."
            }
        ]

        Text content: ${text.substring(0, 2000)}

        Respond with only the JSON array, no additional text or explanation.
        `;

        const result = await model.generateContent(prompt);
        const  response = await result.response;
        const generatedText=response.text();

        // clean markdown formatting
        const cleanedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        

        // parse the json response
        const flashcards= JSON.parse(cleanedText);

        // add uniqe IDs to each flashcard
        return flashcards.map((card: any, index: number) => ({
            id: `card-${Date.now()}-${index}`,
            question: card.question,
            answer: card.answer
        }))
    } catch (error) {
        console.error('Error generating flashcards:', error);
        throw new Error('Failed to generate flashcards');
    }
}

// Mock data for testing without API key
function getMockFlashcards(text: string): Flashcard[] {
    const preview = text.substring(0, 100);
    
    return [
        {
            id: 'mock-1',
            question: 'What is the main topic discussed in this document?',
            answer: `Based on the content: "${preview}..."`
        },
        {
            id: 'mock-2',
            question: 'What are the key concepts mentioned?',
            answer: 'This is a mock flashcard. Set up your Gemini API key in .env file for AI-generated cards.'
        },
        {
            id: 'mock-3',
            question: 'How would you summarize the first paragraph?',
            answer: `The document begins with: "${preview}..."`
        },
        {
            id: 'mock-4',
            question: 'What type of document is this?',
            answer: 'This appears to be an educational or informational document based on the extracted content.'
        }
    ];
}