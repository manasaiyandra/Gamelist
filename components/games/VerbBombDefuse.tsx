

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameComponentProps, GrammarFillQuestion, Feedback } from '../../types';
import { generateVerbBombQuestions } from '../../services/geminiService';
import { TOTAL_QUESTIONS_PER_GAME } from '../../constants';
import { GameContainer } from '../shared/GameContainer';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ScoreSummary } from '../shared/ScoreSummary';
import { Button } from '../shared/Button';
import { BombIcon } from '../icons/BombIcon';

const TIMER_SECONDS = 10;

const Explosion: React.FC = () => (
    <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="w-48 h-48 bg-red-500/50 rounded-full animate-explode flex items-center justify-center">
            <span className="text-9xl" role="img" aria-label="Bomb explosion">💣</span>
        </div>
    </div>
);

export const VerbBombDefuse: React.FC<GameComponentProps> = ({ onBack, onGameComplete }) => {
    const [view, setView] = useState<'instructions' | 'game' | 'summary'>('instructions');
    const [questions, setQuestions] = useState<GrammarFillQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<Feedback>('none');
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    
    const [timer, setTimer] = useState(TIMER_SECONDS);
    const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
    const [showExplosion, setShowExplosion] = useState(false);

    const isGameOver = currentQuestionIndex >= TOTAL_QUESTIONS_PER_GAME;

    const fetchQuestions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedQuestions = await generateVerbBombQuestions();
            if (fetchedQuestions.length < TOTAL_QUESTIONS_PER_GAME) {
                 throw new Error("Not enough unique questions generated.");
            }
            setQuestions(fetchedQuestions);
        } catch (err) {
            setError('Failed to load questions. Please try again later.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const resetForNextQuestion = useCallback(() => {
        setFeedback('none');
        setSelectedAnswer(null);
        setShowExplosion(false);
        setTimer(TIMER_SECONDS);
        if (!isGameOver) {
            setCurrentQuestionIndex(i => i + 1);
        }
    }, [isGameOver]);

    const handleAnswerClick = (option: string) => {
        if (selectedAnswer) return;
        if (timerId) clearInterval(timerId);
        
        setSelectedAnswer(option);
        const currentQuestion = questions[currentQuestionIndex];

        if (option === currentQuestion.answer) {
            setScore(s => s + 1);
            setFeedback('correct');
        } else {
            setFeedback('incorrect');
            setShowExplosion(true);
        }

        setTimeout(resetForNextQuestion, 2500);
    };

    useEffect(() => {
        if (view === 'game' && !isLoading) {
            setCurrentQuestionIndex(0);
            setScore(0);
            setSelectedAnswer(null);
            setTimer(TIMER_SECONDS);
        }
    }, [view, isLoading]);

    useEffect(() => {
        if (view === 'game' && !selectedAnswer && !isGameOver && !isLoading) {
            const id = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
            setTimerId(id);
            return () => clearInterval(id);
        }
    }, [view, selectedAnswer, currentQuestionIndex, isGameOver, isLoading]);

    useEffect(() => {
        if (timer <= 0 && !selectedAnswer && view === 'game') {
            handleAnswerClick('timeout');
        }
    }, [timer, selectedAnswer, view]);

    useEffect(() => {
        if (isGameOver) {
            onGameComplete?.(score);
            setView('summary');
            if (timerId) clearInterval(timerId);
        }
    }, [isGameOver, score, onGameComplete, timerId]);
    
    const startGame = () => {
        fetchQuestions();
        setView('game');
    };

    const getButtonClass = (option: string) => {
        if (!selectedAnswer) return 'bg-slate-700 hover:bg-slate-600';
        const currentQuestion = questions[currentQuestionIndex];
        if (option === currentQuestion.answer) return 'bg-green-600 animate-pulse-correct';
        if (option === selectedAnswer && option !== currentQuestion.answer) return 'bg-red-600 animate-shake';
        return 'bg-slate-700 opacity-50';
    };

    if (view === 'instructions') {
        return (
            <div className="max-w-2xl mx-auto text-center bg-slate-800 p-8 rounded-lg animate-fade-in">
                <BombIcon className="w-16 h-16 mx-auto text-red-500 mb-4"/>
                <h2 className="text-3xl font-bold text-cyan-400 mb-4">Verb Bomb Defuse</h2>
                <p className="text-slate-300 mb-2">A sentence with a missing verb will be displayed.</p>
                <p className="text-slate-300 mb-6">Choose the correct verb from 3 options before the timer runs out!</p>
                <div className="bg-slate-900/50 p-4 rounded-lg mb-6 text-left">
                    <p className="font-bold mb-2">Example:</p>
                    <p className="font-serif text-xl mb-4">"He ___ every morning."</p>
                    <div className="flex justify-center gap-2">
                        <span className="px-4 py-2 bg-slate-700 rounded-md">run</span>
                        <span className="px-4 py-2 bg-green-600 rounded-md">runs</span>
                        <span className="px-4 py-2 bg-slate-700 rounded-md">running</span>
                    </div>
                </div>
                <Button onClick={startGame} variant="primary">Start Game</Button>
            </div>
        );
    }
    
    if (isLoading) return <div className="flex justify-center items-center h-96"><LoadingSpinner /></div>;
    if (error) return <div className="text-center text-red-400"><p>{error}</p><Button onClick={fetchQuestions} className="mt-4">Retry</Button></div>;
    if (view === 'summary' || questions.length === 0 || !questions[currentQuestionIndex]) {
        return <ScoreSummary score={score} total={TOTAL_QUESTIONS_PER_GAME} onPlayAgain={startGame} onBackToMenu={onBack} />;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const sentenceParts = currentQuestion.sentence.split('__BLANK__');
    const timerPercentage = (timer / TIMER_SECONDS) * 100;

    return (
        <GameContainer 
            title="Verb Bomb Defuse"
            description="Choose the best verb to complete the sentence."
            score={score}
            questionNumber={currentQuestionIndex}
            totalQuestions={TOTAL_QUESTIONS_PER_GAME}
            onBack={onBack}
        >
            <div className="relative text-center">
                {showExplosion && <Explosion />}
                <div className="mb-6">
                    <div className="h-4 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 linear ${timerPercentage > 50 ? 'bg-green-500' : timerPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${timerPercentage}%`}}
                        ></div>
                    </div>
                    <p className="text-red-400 font-bold text-lg mt-2">{timer}s</p>
                </div>

                <p className="text-2xl sm:text-3xl font-serif bg-slate-900 p-6 rounded-lg mb-8 leading-relaxed">
                    {sentenceParts[0]}
                    <span className="inline-block w-32 h-10 bg-slate-700 border-b-2 border-slate-500 mx-2 text-xl font-bold rounded-md"></span>
                    {sentenceParts[1]}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {currentQuestion.options.map((option) => (
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
                        {feedback === 'incorrect' && selectedAnswer === 'timeout' && `Time's up! `}
                        <span className="text-sm opacity-80">{currentQuestion.explanation}</span>
                    </div>
                )}
            </div>
        </GameContainer>
    );
};