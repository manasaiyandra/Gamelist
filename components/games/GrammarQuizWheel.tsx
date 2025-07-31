import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameComponentProps, GrammarFillQuestion, Feedback } from '../../types';
import { generateQuizWheelQuestions } from '../../services/geminiService';
import { TOTAL_QUESTIONS_PER_GAME } from '../../constants';
import { GameContainer } from '../shared/GameContainer';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ScoreSummary } from '../shared/ScoreSummary';
import { Button } from '../shared/Button';
import { QuizWheelIcon } from '../icons/QuizWheelIcon';
import { ArrowLeftIcon } from '../icons/ArrowLeftIcon';

const CATEGORIES = ['Verbs', 'Nouns', 'Articles', 'Prepositions', 'Tenses'];
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];
const TEXT_COLORS = ['text-white', 'text-white', 'text-slate-900', 'text-white', 'text-white'];

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


export const GrammarQuizWheel: React.FC<GameComponentProps> = ({ onBack, onGameComplete }) => {
    const [view, setView] = useState<'instructions' | 'game' | 'summary'>('instructions');
    const [questions, setQuestions] = useState<GrammarFillQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<Feedback>('none');
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

    const [isSpinning, setIsSpinning] = useState(false);
    const [spinRotation, setSpinRotation] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const isGameOver = currentQuestionIndex >= TOTAL_QUESTIONS_PER_GAME;

    const fetchQuestions = useCallback(async (category: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedQuestions = await generateQuizWheelQuestions(category);
            if (fetchedQuestions.length < TOTAL_QUESTIONS_PER_GAME) {
                 throw new Error("Not enough unique questions generated.");
            }
            setQuestions(fetchedQuestions);
            setCurrentQuestionIndex(0);
            setScore(0);
            setSelectedAnswer(null);
            setView('game');
        } catch (err) {
            setError('Failed to load questions. Please try again later.');
            console.error(err);
            setView('instructions'); // Go back on error
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleSpin = () => {
        if (isSpinning) return;
        setIsSpinning(true);
        setError(null);
        
        const randomSpins = Math.floor(Math.random() * 4) + 8; // 8 to 11 full spins
        const randomSegment = Math.floor(Math.random() * CATEGORIES.length);
        const segmentAngle = 360 / CATEGORIES.length;
        const targetAngle = (randomSpins * 360) + (randomSegment * segmentAngle) - (segmentAngle / 2);

        setSpinRotation(targetAngle);
        
        const category = CATEGORIES[randomSegment];
        setSelectedCategory(category);
        
        setTimeout(() => {
            fetchQuestions(category);
            setIsSpinning(false);
        }, 4000); // Must match CSS transition duration
    };

    const handlePlayAgain = () => {
        setView('instructions');
        setSelectedCategory(null);
        setQuestions([]);
    };
    
    useEffect(() => {
        if (isGameOver && view === 'game') {
            onGameComplete?.(score);
            setView('summary');
        }
    }, [isGameOver, score, onGameComplete, view]);

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
            if (!isGameOver) {
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

    const wheelStyle = {
        '--spin-end-angle': `${spinRotation}deg`,
        background: `conic-gradient(
            ${COLORS.map((color, i) => `${color} ${i * (100/CATEGORIES.length)}%, ${color} ${(i+1) * (100/CATEGORIES.length)}%`).join(', ')}
        )`,
        transform: `rotate(${spinRotation}deg)`,
    };
    
    if (view === 'instructions') {
        return (
             <div className="max-w-2xl mx-auto animate-fade-in">
                <Button onClick={onBack} variant="secondary" className="mb-6 inline-flex items-center gap-2">
                    <ArrowLeftIcon className="w-5 h-5" />
                    Back to Menu
                </Button>
                <div className="text-center bg-slate-800 p-8 rounded-lg">
                    <QuizWheelIcon className="w-16 h-16 mx-auto text-cyan-400 mb-4"/>
                    <h2 className="text-3xl font-bold text-cyan-400 mb-4">Grammar Quiz Wheel</h2>
                    <p className="text-slate-300 mb-6">Spin the wheel to test your knowledge on a random grammar topic!</p>
                    {error && <p className="text-red-400 mb-4">{error}</p>}
                    <div className="relative w-72 h-72 mx-auto mb-8 quiz-wheel-container">
                        <div className="absolute w-full h-full rounded-full overflow-hidden flex items-center justify-center border-4 border-slate-700">
                            <div className="quiz-wheel w-full h-full" style={wheelStyle}>
                                {CATEGORIES.map((cat, i) => (
                                    <div 
                                        key={cat} 
                                        className={`absolute w-1/2 h-1/2 font-extrabold flex items-center justify-center text-2xl ${TEXT_COLORS[i]}`}
                                        style={{
                                            transform: `rotate(${i * (360/CATEGORIES.length)}deg) translate(50%, 0) rotate(${ (360/CATEGORIES.length) / 2}deg)`,
                                            transformOrigin: '0% 50%',
                                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                                        }}
                                    >
                                        <span>{cat}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {isSpinning && selectedCategory ? (
                        <div className="min-h-[56px]">
                            <p className="text-2xl font-bold text-amber-400 animate-pulse">Category: {selectedCategory}!</p>
                        </div>
                    ) : (
                        <Button onClick={handleSpin} disabled={isSpinning} variant="primary" className="h-[56px] text-xl">
                            {isSpinning ? 'Spinning...' : 'Spin the Wheel!'}
                        </Button>
                    )}
                </div>
            </div>
        );
    }
    
    if (isLoading) return <div className="flex justify-center items-center h-96"><LoadingSpinner message={`Loading ${selectedCategory} questions...`}/></div>;
    
    if (view === 'summary') {
        return <ScoreSummary score={score} total={TOTAL_QUESTIONS_PER_GAME} onPlayAgain={handlePlayAgain} onBackToMenu={onBack} />;
    }
    
    if (view === 'game' && questions.length > 0) {
        const currentQuestion = questions[currentQuestionIndex];
        const sentenceParts = currentQuestion.sentence.split('__BLANK__');
        return (
            <GameContainer 
                title={`Quiz Wheel: ${selectedCategory}`}
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
    }

    return (
        <div className="text-center">
             <Button onClick={onBack}>Back to Menu</Button>
        </div>
    );
};