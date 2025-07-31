
import { GoogleGenAI, Type } from "@google/genai";
import { GrammarSpotterQuestion, GrammarFillQuestion, Dialogue, EmojiQuestion, GrammarValidationResult, WordScrambleQuestion, WordClassSorterQuestion, SentenceWeaverQuestion, LetterMemoryQuestion } from '../types';
import { TOTAL_QUESTIONS_PER_GAME } from "../constants";

export const isApiKeyConfigured = (): boolean => {
    return !!process.env.API_KEY;
};

const ai: GoogleGenAI | null = isApiKeyConfigured()
    ? new GoogleGenAI({ apiKey: process.env.API_KEY as string })
    : null;

if (!isApiKeyConfigured()) {
    console.warn(
        "Gemini API key not found. Please set the API_KEY environment variable. The app will show a warning screen."
    );
}

const model = "gemini-2.5-flash";

const grammarSpotterSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            sentence: { type: Type.STRING },
            incorrectWord: { type: Type.STRING },
            correctWord: { type: Type.STRING },
            explanation: { type: Type.STRING },
        },
        required: ["sentence", "incorrectWord", "correctWord", "explanation"],
    },
};

const grammarFillSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            sentence: { type: Type.STRING, description: "Sentence with '__BLANK__' as a placeholder." },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            answer: { type: Type.STRING },
            explanation: { type: Type.STRING },
        },
        required: ["sentence", "options", "answer", "explanation"],
    },
};

const dialogueSchema = {
    type: Type.OBJECT,
    properties: {
        scenario: { type: Type.STRING },
        lines: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.INTEGER },
                    speaker: { type: Type.STRING },
                    line: { type: Type.STRING },
                },
                required: ["id", "speaker", "line"],
            },
        },
    },
    required: ["scenario", "lines"],
};

const emojiQuestionSchema = {
    type: Type.OBJECT,
    properties: {
        emojis: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of 3-5 emoji strings that can be formed into a grammatically correct sentence. Each string is a single emoji."
        },
    },
    required: ["emojis"],
};

const emojiQuestionsForCategorySchema = {
    type: Type.ARRAY,
    items: emojiQuestionSchema,
};

const grammarValidationSchema = {
    type: Type.OBJECT,
    properties: {
        isCorrect: { type: Type.BOOLEAN, description: "True if the sentence is grammatically correct AND accurately represents the emojis." },
        feedback: { type: Type.STRING, description: "A concise, encouraging explanation for the user. If incorrect, explain the grammar error or how it doesn't match the emojis. If correct, praise the user and explain why it's a good sentence." },
        correctExample: { type: Type.STRING, description: "If the user's sentence is incorrect, provide one example of a correct sentence that fits the emojis. Omit this field if the user's sentence is correct." }
    },
    required: ["isCorrect", "feedback"],
};

const wordScrambleSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            word: { type: Type.STRING, description: "The unscrambled English word." },
            hint: { type: Type.STRING, description: "A simple definition or a sentence using the word." },
            level: { type: Type.INTEGER, description: "The difficulty level from 1 to 10." },
        },
        required: ["word", "hint", "level"],
    },
};

const wordClassSorterSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            words: {
                type: Type.ARRAY,
                description: "An array of 4 words, one for each part of speech: Noun, Verb, Adjective, Adverb.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        word: { type: Type.STRING },
                        partOfSpeech: { type: Type.STRING, enum: ['Noun', 'Verb', 'Adjective', 'Adverb'] },
                    },
                    required: ["word", "partOfSpeech"],
                }
            },
        },
        required: ["words"],
    },
};

const sentenceWeaverSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            imageSearchQuery: { type: Type.STRING, description: "A descriptive search query for a stock photo that matches the sentence (e.g., 'happy dog running in a sunny park', 'family eating dinner together', 'cat sleeping on a colorful rug')." },
            sentence: { type: Type.STRING, description: "A simple, grammatically correct sentence of 5-8 words describing the scene." },
            hint: { type: Type.STRING, description: "A hint for the user, either a definition of the sentence's meaning or a clue about what the sentence describes." },
        },
        required: ["imageSearchQuery", "sentence", "hint"],
    },
};

const letterMemorySchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            level: { type: Type.INTEGER, description: "The difficulty level (1-3)." },
            word: { type: Type.STRING, description: "A single English word. Level 1: 4 letters. Level 2: 6 letters. Level 3: 8 letters." },
            definition: { type: Type.STRING, description: "A simple definition of the word." }
        },
        required: ["level", "word", "definition"]
    }
};


const generateWithSchema = async <T,>(prompt: string, schema: any): Promise<T> => {
    if (!ai) {
        console.error("Gemini API key not configured. Cannot make API calls.");
        throw new Error("Gemini API key is not configured.");
    }

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.9,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as T;
    } catch (error) {
        console.error("Gemini API call failed:", error);
        throw new Error("Failed to generate content from Gemini API.");
    }
};

export const generateGrammarSpotterQuestions = (): Promise<GrammarSpotterQuestion[]> => {
    const prompt = `Generate ${TOTAL_QUESTIONS_PER_GAME} unique sentences for English learners. Each sentence must contain one clear grammatical error (tense, subject-verb agreement, or pluralization). For each, provide the sentence, the incorrect word, the correct word, and a brief explanation.`;
    return generateWithSchema<GrammarSpotterQuestion[]>(prompt, grammarSpotterSchema);
};

export const generateGrammarFillQuestions = (): Promise<GrammarFillQuestion[]> => {
    const prompt = `Generate ${TOTAL_QUESTIONS_PER_GAME} unique fill-in-the-blank questions for English learners, focusing on helping verbs, articles, and tenses. For each, provide a sentence with '__BLANK__', four options (one correct, three plausible distractors), the correct answer, and a brief explanation.`;
    return generateWithSchema<GrammarFillQuestion[]>(prompt, grammarFillSchema);
};

export const generateVerbBombQuestions = (): Promise<GrammarFillQuestion[]> => {
    const prompt = `Generate ${TOTAL_QUESTIONS_PER_GAME} unique fill-in-the-blank questions for English learners, focusing ONLY on verb forms (tenses like past/present/future simple/continuous, and subject-verb agreement). For each, provide a sentence with '__BLANK__', three verb options (one correct, two plausible distractors), the correct answer, and a brief explanation.`;
    return generateWithSchema<GrammarFillQuestion[]>(prompt, grammarFillSchema);
};

export const generateMazeQuestions = (): Promise<GrammarFillQuestion[]> => {
    const prompt = `Generate 15 unique fill-in-the-blank grammar questions for English learners, covering a mix of topics like tenses, prepositions, and articles. For each, provide a sentence with '__BLANK__', four options (one correct, three plausible distractors), the correct answer, and a brief explanation.`;
    return generateWithSchema<GrammarFillQuestion[]>(prompt, grammarFillSchema);
};

export const generateQuizWheelQuestions = (category: string): Promise<GrammarFillQuestion[]> => {
    const prompt = `Generate ${TOTAL_QUESTIONS_PER_GAME} unique fill-in-the-blank grammar questions for English learners, focusing ONLY on the topic of ${category}. For each, provide a sentence with '__BLANK__', four options (one correct, three plausible distractors), the correct answer, and a brief explanation.`;
    return generateWithSchema<GrammarFillQuestion[]>(prompt, grammarFillSchema);
};

export const generatePrepositionQuestions = (): Promise<GrammarFillQuestion[]> => {
    const prompt = `Generate ${TOTAL_QUESTIONS_PER_GAME} unique fill-in-the-blank questions for English learners, focusing ONLY on prepositions (e.g., in, on, at, under, over, with). For each, provide a sentence with '__BLANK__', three preposition options (one correct, two plausible distractors), the correct answer, and a brief explanation.`;
    return generateWithSchema<GrammarFillQuestion[]>(prompt, grammarFillSchema);
};

export const generateDialogue = (scenario: string): Promise<Dialogue> => {
    const prompt = `Generate a short, logical dialogue for a '${scenario}' scenario with 5-7 turns. Assign a unique ID to each line starting from 1. The dialogue should be between two distinct speakers.`;
    return generateWithSchema<Dialogue>(prompt, dialogueSchema);
};

export const generateEmojiQuestionsForCategory = (categoryPrompt: string): Promise<EmojiQuestion[]> => {
    const prompt = `
        Generate ${TOTAL_QUESTIONS_PER_GAME} unique emoji puzzles for an English language learner. The user's goal is to write a complete, grammatically correct sentence based on each emoji puzzle.
        The emoji sequences should visually suggest a simple action or scene.
        
        - Category Hint: "${categoryPrompt}"
        - For lower difficulty, generate a sequence for a simple sentence (e.g., ["🧑‍🍳", "🎂"] or ["🐱", "🏃", "🏠"]).
        - For higher difficulty, generate a sequence that allows for more complex sentences (e.g., ["👩‍🚀", "🚀", "✨", "🪐"] or ["🌧️", "🌱", "🌷"]).
        
        The response must be a JSON array of objects, where each object has an "emojis" property which is an array of emoji strings.
    `;
    return generateWithSchema<EmojiQuestion[]>(prompt, emojiQuestionsForCategorySchema);
};

export const validateSentenceGrammar = (emojis: string, sentence: string): Promise<GrammarValidationResult> => {
    const prompt = `
        An English language learner was shown an emoji sequence and tasked with writing a grammatically correct sentence that creatively describes it.
        - Emoji Sequence: "${emojis}"
        - User's Sentence: "${sentence}"

        Evaluate the user's sentence based on two criteria:
        1. Grammatical Correctness: Is the sentence grammatically valid in English?
        2. Emoji Representation: Does the sentence logically and creatively represent the emojis? Multiple interpretations are allowed and encouraged.

        The goal is to provide helpful, positive feedback.
        
        - If the sentence is both grammatically correct and a good representation of the emojis, respond with 'isCorrect: true'. The feedback should be encouraging, like "Excellent! That's a perfect sentence for these emojis. Great job with the verb tense!".
        - If the sentence is grammatically incorrect, respond with 'isCorrect: false'. The feedback should gently point out the error without being discouraging, like "You're on the right track! It looks like the verb needs a little adjustment. Try checking the subject-verb agreement.". In this case, YOU MUST also provide a 'correctExample' field with one example of a grammatically correct sentence for the emojis.
        - If the sentence is grammatically correct but does not match the emojis, respond with 'isCorrect: false'. The feedback should acknowledge the correct grammar but guide them back to the emojis, like "That's a grammatically perfect sentence! However, it doesn't seem to match the story in the emojis. Give it another look!". In this case, YOU MUST also provide a 'correctExample' field with a sentence that better matches the emojis.

        Provide your evaluation in the specified JSON format.
    `;
    return generateWithSchema<GrammarValidationResult>(prompt, grammarValidationSchema);
};

export const generateWordScrambleLevels = (): Promise<WordScrambleQuestion[]> => {
    const prompt = `
        Generate 50 difficult English words for a word scramble game, organized into 10 levels of increasing difficulty (5 words per level).
        All words MUST be at least 7 letters long. The difficulty should increase with each level, using longer words and more complex or less common vocabulary.
        
        - Levels 1-3: Use 7-8 letter words that are challenging but recognizable (e.g., words with common prefixes/suffixes, or tricky spellings).
        - Levels 4-7: Use 9-11 letter words. Include words with silent letters, unusual letter combinations, or those derived from other languages.
        - Levels 8-10: Use 12-15 letter words that are complex, academic, or uncommon. These should be a significant challenge.

        For each word, provide the unscrambled word, a simple hint (a definition or a sentence using the word), and its difficulty level (1-10).
    `;
    return generateWithSchema<WordScrambleQuestion[]>(prompt, wordScrambleSchema);
};

export const generateWordClassSorterQuestions = (): Promise<WordClassSorterQuestion[]> => {
    const prompt = `Generate ${TOTAL_QUESTIONS_PER_GAME} sets of words for an English learning game. Each set should contain exactly 4 unique words: one Noun, one Verb, one Adjective, and one Adverb. The words should be common and suitable for learners. For each word, provide the word and its part of speech.`;
    return generateWithSchema<WordClassSorterQuestion[]>(prompt, wordClassSorterSchema);
};

export const generateSentenceWeaverQuestions = (): Promise<SentenceWeaverQuestion[]> => {
    const prompt = `Generate ${TOTAL_QUESTIONS_PER_GAME} unique questions for a sentence building game where a user clicks words on an image. For each question, provide a search query for a high-quality stock photo, a corresponding simple sentence (5-8 words), and a hint. The scene should be simple, clear, and easy to describe.`;
    return generateWithSchema<SentenceWeaverQuestion[]>(prompt, sentenceWeaverSchema);
};

export const generateLetterMemoryWords = (): Promise<LetterMemoryQuestion[]> => {
    const prompt = `
        Generate words for a letter memory game with 3 levels of difficulty.
        - Generate 5 unique words for Level 1 (exactly 4 letters each).
        - Generate 5 unique words for Level 2 (exactly 6 letters each).
        - Generate 5 unique words for Level 3 (exactly 8 letters each).
        All words should be common English words suitable for learners.
        For each word, provide the word, its level (1, 2, or 3), and a simple one-sentence definition.
    `;
    return generateWithSchema<LetterMemoryQuestion[]>(prompt, letterMemorySchema);
};
