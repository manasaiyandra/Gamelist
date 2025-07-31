import React, { useState, useEffect, useCallback } from 'react';
import { GameComponentProps, GrammarSpotterQuestion, Feedback } from '../../types';
import { generateGrammarSpotterQuestions } from '../../services/geminiService';
import { TOTAL_QUESTIONS_PER_GAME } from '../../constants';
import { GameContainer } from '../shared/GameContainer';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ScoreSummary } from '../shared/ScoreSummary';
import { Button } from '../shared/Button';

export const GrammarSpotter: React.FC<GameComponentProps> = ({ onBack, onGameComplete }) => {
    const [questions, setQuestions] = useState<GrammarSpotterQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<Feedback>('none');
    const [answered, setAnswered] = useState(false);
    
    const fetchQuestions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedQuestions = await generateGrammarSpotterQuestions();
            if (fetchedQuestions.length < TOTAL_QUESTIONS_PER_GAME) {
                 throw new Error("Not enough unique questions generated.");
            }
            setQuestions(fetchedQuestions);
            setCurrentQuestionIndex(0);
            setScore(0);
            setAnswered(false);
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

    const handleWordClick = (word: string) => {
        if (answered) return;
        setAnswered(true);

        const currentQuestion = questions[currentQuestionIndex];
        const cleanedWord = word.replace(/[.,!?]/g, '');

        if (cleanedWord.toLowerCase() === currentQuestion.incorrectWord.toLowerCase()) {
            setScore(s => s + 1);
            setFeedback('correct');
        } else {
            setFeedback('incorrect');
        }

        setTimeout(() => {
            setFeedback('none');
            if (currentQuestionIndex < TOTAL_QUESTIONS_PER_GAME) {
                setCurrentQuestionIndex(i => i + 1);
                setAnswered(false);
            }
        }, 2500);
    };

    if (isLoading) return <div className="flex justify-center items-center h-96"><LoadingSpinner /></div>;
    if (error) return <div className="text-center text-red-400"><p>{error}</p><Button onClick={fetchQuestions} className="mt-4">Retry</Button></div>;
    if (isGameOver || questions.length === 0) {
        return <ScoreSummary score={score} total={TOTAL_QUESTIONS_PER_GAME} onPlayAgain={fetchQuestions} onBackToMenu={onBack} />;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const words = currentQuestion.sentence.split(' ');

    return (
        <GameContainer 
            title="Grammar Spotter"
            description="Click the word that is grammatically incorrect."
            score={score}
            questionNumber={currentQuestionIndex}
            totalQuestions={TOTAL_QUESTIONS_PER_GAME}
            onBack={onBack}
        >
            <div className="text-center">
                <p className="text-2xl sm:text-3xl font-serif bg-slate-900 p-6 rounded-lg mb-6 leading-relaxed">
                    {words.map((word, index) => {
                        const cleanedWord = word.replace(/[.,!?]/g, '');
                        const isIncorrectWord = cleanedWord.toLowerCase() === currentQuestion.incorrectWord.toLowerCase();
                        
                        // When answered, show the correction inline
                        if (answered && isIncorrectWord) {
                            return (
                                <span key={index} className="p-1 rounded-md bg-slate-800/50">
                                    <del className="text-red-400 opacity-80">{currentQuestion.incorrectWord}</del>
                                    <strong className="text-green-400 ml-2 animate-pulse-correct">{currentQuestion.correctWord}</strong>{' '}
                                </span>
                            );
                        }
                        
                        return (
                            <span 
                                key={index} 
                                onClick={() => handleWordClick(word)}
                                className={`cursor-pointer transition-colors duration-200 p-1 rounded-md hover:bg-cyan-900/50 ${answered ? 'cursor-not-allowed' : ''}`}
                            >
                                {word}{' '}
                            </span>
                        );
                    })}
                </p>
                {answered && (
                    <div className={`p-4 rounded-lg text-lg ${feedback === 'correct' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'}`}>
                        {feedback === 'correct' ? 'Correct! ' : 'Not quite. '}
                        The incorrect word was <strong className="font-bold">{currentQuestion.incorrectWord}</strong>. It should be <strong className="font-bold">{currentQuestion.correctWord}</strong>.
                        <p className="text-sm mt-2 opacity-80">{currentQuestion.explanation}</p>
                    </div>
                )}
            </div>
        </GameContainer>
    );
};