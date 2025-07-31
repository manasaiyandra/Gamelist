

import React, { useState, useEffect, useCallback } from 'react';
import { GameComponentProps, CategoryInfo, EmojiQuestion, GrammarValidationResult } from '../../types';
import { EMOJI_CATEGORIES, TOTAL_QUESTIONS_PER_GAME } from '../../constants';
import { generateEmojiQuestionsForCategory, validateSentenceGrammar } from '../../services/geminiService';
import { Button } from '../shared/Button';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ArrowLeftIcon } from '../icons/ArrowLeftIcon';
import { ScoreSummary } from '../shared/ScoreSummary';

const FeedbackModal: React.FC<{
    isCorrect: boolean;
    feedbackText: string;
    correctExample?: string;
    onNext: () => void;
}> = ({ isCorrect, feedbackText, correctExample, onNext }) => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in">
        <div className={`bg-slate-800 p-8 rounded-lg max-w-lg w-full border-t-4 ${isCorrect ? 'border-green-500' : 'border-red-500'} text-center`}>
            <h2 className={`text-3xl font-bold mb-4 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {isCorrect ? '✅ Excellent!' : '🤔 Let\'s Review!'}
            </h2>
             <div className="bg-slate-900/50 p-4 rounded-md mb-6 text-left">
                <p className="font-semibold text-cyan-300 mb-1">Feedback</p>
                <p className="text-slate-300">{feedbackText}</p>
                 {!isCorrect && correctExample && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                        <p className="font-semibold text-amber-300 mb-1">Here's one possible answer:</p>
                        <p className="text-slate-300 italic">"{correctExample}"</p>
                    </div>
                )}
            </div>
            <div className="flex justify-center gap-4">
                <Button onClick={onNext} variant="primary">
                    {isCorrect ? 'Next Question' : 'Try Again'}
                </Button>
            </div>
        </div>
    </div>
);


export const EmojiGuessChallenge: React.FC<GameComponentProps> = ({ onBack, onGameComplete }) => {
    const [view, setView] = useState<'categories' | 'game' | 'summary'>('categories');
    const [selectedCategory, setSelectedCategory] = useState<CategoryInfo | null>(null);
    const [questions, setQuestions] = useState<EmojiQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isValidaing, setIsValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [userAnswer, setUserAnswer] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [correctExample, setCorrectExample] = useState('');
    
    const fetchQuestions = useCallback(async (category: CategoryInfo) => {
        setIsLoading(true);
        setError(null);
        setQuestions([]);
        try {
            const questionData = await generateEmojiQuestionsForCategory(category.prompt);
             if (questionData.length < TOTAL_QUESTIONS_PER_GAME) {
                 throw new Error("Not enough unique questions generated.");
            }
            setQuestions(questionData);
            setCurrentQuestionIndex(0);
            setScore(0);
            setView('game');
        } catch (err) {
            setError("Oops! Couldn't generate questions. Please try again.");
            console.error(err);
            setView('categories'); // Go back to categories on error
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleSelectCategory = (category: CategoryInfo) => {
        setSelectedCategory(category);
        fetchQuestions(category);
    };
    
    const handleSubmit = async () => {
        if (!userAnswer || !questions[currentQuestionIndex] || isValidaing) return;
        
        setIsValidating(true);
        setError(null);

        try {
            const validationResult = await validateSentenceGrammar(questions[currentQuestionIndex].emojis.join(''), userAnswer);
            
            setIsCorrect(validationResult.isCorrect);
            setFeedbackText(validationResult.feedback);
            setCorrectExample(validationResult.correctExample || '');
            setShowFeedback(true);

            if (validationResult.isCorrect) {
                setScore(s => s + 1);
            }
        } catch (err) {
            console.error("Validation API call failed:", err);
            setError("Sorry, we couldn't check your answer right now. Please try again.");
            setFeedbackText("An error occurred while validating your answer.");
            setShowFeedback(true);
            setIsCorrect(false);
        } finally {
            setIsValidating(false);
        }
    };
    
    const handleNext = () => {
        setShowFeedback(false);
        setUserAnswer('');
        setFeedbackText('');
        setCorrectExample('');

        if (isCorrect) {
            const nextIndex = currentQuestionIndex + 1;
            if (nextIndex >= questions.length) {
                // Game over for this category
                onGameComplete?.(score + 1); // +1 because score state hasn't updated yet for the last correct answer
                setView('summary');
            } else {
                setCurrentQuestionIndex(nextIndex);
            }
        }
    };

    const handlePlayAgain = () => {
        setView('categories');
        setSelectedCategory(null);
        setQuestions([]);
        setCurrentQuestionIndex(0);
        setScore(0);
    };

    const backToCategories = () => {
        setView('categories');
        setSelectedCategory(null);
    };

    // Category View
    if (view === 'categories') {
        return (
            <div className="animate-fade-in">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <Button onClick={onBack} variant="secondary" className="inline-flex items-center gap-2 mb-2">
                           <ArrowLeftIcon className="w-5 h-5" /> Back to Menu
                        </Button>
                        <h1 className="text-3xl sm:text-4xl font-bold text-cyan-400">Emoji Guess Challenge</h1>
                        <p className="text-slate-400">Select a category to start.</p>
                    </div>
                </header>
                 {error && <p className="text-red-400 text-center mb-4">{error}</p>}
                 {isLoading ? <LoadingSpinner message="Loading Category..."/> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {EMOJI_CATEGORIES.map(cat => (
                            <div key={cat.id} onClick={() => handleSelectCategory(cat)} className="category-card p-6 rounded-lg border border-slate-700 cursor-pointer transition-all duration-300 flex flex-col">
                                <div className="flex justify-between items-start">
                                    <h2 className="text-2xl font-bold mb-1 text-white">{cat.title}</h2>
                                    <p className="text-5xl">{cat.emoji}</p>
                                </div>
                                <p className="text-slate-400 mb-4 flex-grow">{cat.description}</p>
                            </div>
                        ))}
                    </div>
                 )}
            </div>
        );
    }
    
    if (view === 'summary') {
        return <ScoreSummary score={score} total={TOTAL_QUESTIONS_PER_GAME} onPlayAgain={handlePlayAgain} onBackToMenu={onBack} />;
    }

    // Game View
    if (view === 'game' && selectedCategory && questions.length > 0) {
        const currentQuestion = questions[currentQuestionIndex];
        const progressPercent = ((currentQuestionIndex) / TOTAL_QUESTIONS_PER_GAME) * 100;
        
        return (
            <div className="animate-fade-in max-w-2xl mx-auto">
                 {showFeedback && (
                    <FeedbackModal 
                        isCorrect={isCorrect} 
                        feedbackText={feedbackText} 
                        correctExample={correctExample}
                        onNext={handleNext}
                    />
                )}
                <Button onClick={backToCategories} variant="secondary" className="inline-flex items-center gap-2 mb-4">
                    <ArrowLeftIcon className="w-5 h-5" /> Back to Categories
                </Button>
                <div className="bg-slate-800 p-8 rounded-lg border border-slate-700">
                    <header className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-cyan-400">{selectedCategory.title}</h2>
                         <div className="text-lg font-semibold bg-slate-700 px-4 py-1 rounded-full">
                            Score: <span className="text-cyan-300">{score}</span>
                         </div>
                    </header>
                    <div className="w-full bg-slate-700 rounded-full h-2.5 mb-6">
                        <div className="bg-cyan-500 h-2.5 rounded-full" style={{width: `${progressPercent}%`}}></div>
                    </div>
                    {currentQuestion && (
                        <div className="text-center">
                            <div className="bg-slate-900 p-6 rounded-lg mb-6">
                                <p className="text-4xl md:text-5xl tracking-widest">{currentQuestion.emojis.join(' + ')}</p>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                                <input
                                    type="text"
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    placeholder="Type your creative sentence here..."
                                    disabled={showFeedback || isValidaing}
                                    className={`w-full p-4 bg-slate-700 text-white text-lg rounded-md border-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all border-slate-600`}
                                />
                                <div className="flex gap-4 mt-6 justify-center">
                                    <Button type="submit" variant="primary" disabled={showFeedback || !userAnswer || isValidaing} className="min-w-[160px]">
                                        {isValidaing ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Checking...</span>
                                            </span>
                                        ) : (
                                            'Check Sentence'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    
    return <div className="flex justify-center items-center h-96"><LoadingSpinner /></div>;
};