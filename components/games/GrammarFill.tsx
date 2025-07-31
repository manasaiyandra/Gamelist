import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameComponentProps, GrammarFillQuestion, Feedback } from '../../types';
import { generateGrammarFillQuestions } from '../../services/geminiService';
import { TOTAL_QUESTIONS_PER_GAME } from '../../constants';
import { GameContainer } from '../shared/GameContainer';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ScoreSummary } from '../shared/ScoreSummary';
import { Button } from '../shared/Button';

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
    let currentIndex = array.length, randomIndex;
    const newArray = [...array];
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [newArray[currentIndex], newArray[randomIndex]] = [
            newArray[randomIndex], newArray[currentIndex]];
    }
    return newArray;
};

export const GrammarFill: React.FC<GameComponentProps> = ({ onBack, onGameComplete }) => {
    const [questions, setQuestions] = useState<GrammarFillQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<Feedback>('none');
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

    const fetchQuestions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedQuestions = await generateGrammarFillQuestions();
            if (fetchedQuestions.length < TOTAL_QUESTIONS_PER_GAME) {
                 throw new Error("Not enough unique questions generated.");
            }
            setQuestions(fetchedQuestions);
            setCurrentQuestionIndex(0);
            setScore(0);
            setSelectedAnswer(null);
        } catch (err) {
            setError('Failed to load questions. Please try again later.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    const isGameOver = currentQuestionIndex >= TOTAL_QUESTIONS_PER_GAME;

    useEffect(() => {
        if (isGameOver) {
            onGameComplete?.(score);
        }
    }, [isGameOver, score, onGameComplete]);

    useEffect(() => {
        if (questions.length > 0 && currentQuestionIndex < questions.length) {
            setShuffledOptions(shuffleArray(questions[currentQuestionIndex].options));
        }
    }, [questions, currentQuestionIndex]);

    const handleAnswerClick = (option: string) => {
        if (selectedAnswer) return;
        
        setSelectedAnswer(option);
        const currentQuestion = questions[currentQuestionIndex];

        if (option === currentQuestion.answer) {
            setScore(s => s + 1);
            setFeedback('correct');
        } else {
            setFeedback('incorrect');
        }

        setTimeout(() => {
            setFeedback('none');
            setSelectedAnswer(null);
            if (currentQuestionIndex < TOTAL_QUESTIONS_PER_GAME) {
                setCurrentQuestionIndex(i => i + 1);
            }
        }, 2500);
    };
    
    const getButtonClass = (option: string) => {
        if (!selectedAnswer) return 'bg-slate-700 hover:bg-slate-600';
        const currentQuestion = questions[currentQuestionIndex];
        if (option === currentQuestion.answer) return 'bg-green-600 animate-pulse-correct';
        if (option === selectedAnswer && option !== currentQuestion.answer) return 'bg-red-600 animate-shake';
        return 'bg-slate-700 opacity-50';
    };

    if (isLoading) return <div className="flex justify-center items-center h-96"><LoadingSpinner /></div>;
    if (error) return <div className="text-center text-red-400"><p>{error}</p><Button onClick={fetchQuestions} className="mt-4">Retry</Button></div>;
    if (isGameOver || questions.length === 0) {
        return <ScoreSummary score={score} total={TOTAL_QUESTIONS_PER_GAME} onPlayAgain={fetchQuestions} onBackToMenu={onBack} />;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const sentenceParts = currentQuestion.sentence.split('__BLANK__');

    return (
        <GameContainer 
            title="Grammar Fill"
            description="Choose the best word to complete the sentence."
            score={score}
            questionNumber={currentQuestionIndex}
            totalQuestions={TOTAL_QUESTIONS_PER_GAME}
            onBack={onBack}
        >
            <div className="text-center">
                <p className="text-2xl sm:text-3xl font-serif bg-slate-900 p-6 rounded-lg mb-8 leading-relaxed flex items-center justify-center flex-wrap">
                    <span>{sentenceParts[0]}</span>
                    <span className="inline-flex items-center justify-center w-32 h-10 bg-slate-700 border-b-2 border-slate-500 mx-2 text-xl font-bold rounded-md">
                      {selectedAnswer && (
                        <span className="text-green-300 animate-pulse-correct">
                            {currentQuestion.answer}
                        </span>
                      )}
                    </span>
                    <span>{sentenceParts[1]}</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {shuffledOptions.map((option) => (
                        <button
                            key={option}
                            onClick={() => handleAnswerClick(option)}
                            disabled={!!selectedAnswer}
                            className={`w-full p-4 rounded-lg text-lg font-semibold transition-all duration-300 disabled:cursor-not-allowed ${getButtonClass(option)}`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
                 {selectedAnswer && (
                    <div className={`mt-6 p-4 rounded-lg text-lg ${feedback === 'correct' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'}`}>
                        {feedback === 'correct' ? 'Correct! ' : `The correct answer is "${currentQuestion.answer}". `}
                        <span className="text-sm opacity-80">{currentQuestion.explanation}</span>
                    </div>
                )}
            </div>
        </GameContainer>
    );
};