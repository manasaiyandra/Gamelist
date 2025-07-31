import React from 'react';

// Enum for all game types
export enum GameType {
    GrammarSpotter = 'GrammarSpotter',
    GrammarFill = 'GrammarFill',
    PrepositionDrop = 'PrepositionDrop',
    GrammarMaze = 'GrammarMaze',
    DialogueBuilder = 'DialogueBuilder',
    EmojiGuessChallenge = 'EmojiGuessChallenge',
    WordScrambler = 'WordScrambler',
    VerbBombDefuse = 'VerbBombDefuse',
    SentenceWeaver = 'SentenceWeaver',
    LetterMemory = 'LetterMemory', // New Game
    Leaderboard = 'Leaderboard',
}

// Data structure for the main menu game cards
export interface GameCardData {
    id: GameType;
    title: string;
    description: string;
    Icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

// Props for all game components
export interface GameComponentProps {
    onBack: () => void;
    onGameComplete?: (score: number) => void;
}

// Shared types for feedback
export type Feedback = 'none' | 'correct' | 'incorrect';

// Types for existing games
export interface GrammarSpotterQuestion {
    sentence: string;
    incorrectWord: string;
    correctWord: string;
    explanation: string;
}

export interface GrammarFillQuestion {
    sentence: string;
    options: string[];
    answer: string;
    explanation: string;
}

export interface DialogueLine {
    id: number;
    speaker: string;
    line: string;
}

export interface Dialogue {
    scenario: string;
    lines: DialogueLine[];
}

// --- Types for Emoji Guess Challenge ---

export enum GameCategory {
    Tenses = 'Tenses',
    PartsOfSpeech = 'PartsOfSpeech',
    Punctuation = 'Punctuation',
    IdiomsAndPhrases = 'IdiomsAndPhrases',
    SentenceStructures = 'SentenceStructures',
}

export interface CategoryInfo {
    id: GameCategory;
    title: string;
    emoji: string;
    description: string;
    prompt: string;
}

export interface EmojiQuestion {
    emojis: string[];
}

export interface GrammarValidationResult {
    isCorrect: boolean;
    feedback: string;
    correctExample?: string;
}

// --- Types for Word Scrambler ---
export interface WordScrambleQuestion {
    word: string;
    hint: string;
    level: number;
}

// --- Types for Word Class Sorter ---
export type PartOfSpeech = 'Noun' | 'Verb' | 'Adjective' | 'Adverb';

export interface WordToSort {
    word: string;
    partOfSpeech: PartOfSpeech;
}

export interface WordClassSorterQuestion {
    words: WordToSort[];
}

// --- Types for Sentence Weaver ---
export interface SentenceWeaverQuestion {
    imageSearchQuery: string;
    sentence: string;
    hint: string;
}

// --- Types for Letter Memory ---
export interface LetterMemoryQuestion {
    level: number;
    word: string;
    definition: string;
}