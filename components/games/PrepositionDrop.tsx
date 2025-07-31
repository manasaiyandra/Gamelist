import React, { useState, useEffect, useCallback } from 'react';
import { GameComponentProps, GrammarFillQuestion, Feedback } from '../../types';
import { generatePrepositionQuestions } from '../../services/geminiService';
import { TOTAL_QUESTIONS_PER_GAME } from '../../constants';
import { GameContainer } from '../shared/GameContainer';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ScoreSummary } from '../shared/ScoreSummary';
import { Button } from '../shared/Button';

export const PrepositionDrop: React.FC<GameComponentProps> = ({ onBack, onGameComplete }) => {
    const [questions, setQuestions] = useState<GrammarFillQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<Feedback>('none');
    const [answered, setAnswered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [filledAnswer, setFilledAnswer] = useState<string | null>(null);

    const fetchQuestions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedQuestions = await generatePrepositionQuestions();
            if (fetchedQuestions.length < TOTAL_QUESTIONS_PER_GAME) {
                 throw new Error("Not enough unique questions generated.");
            }
            setQuestions(fetchedQuestions);
            setCurrentQuestionIndex(0);
            setScore(0);
            setAnswered(false);
            setFilledAnswer(null);
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

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (answered) return;
        
        const droppedOption = e.dataTransfer.getData("text/plain");
        setIsDragging(false);

        const currentQuestion = questions[currentQuestionIndex];
        setAnswered(true);

        if (droppedOption === currentQuestion.answer) {
            setScore(s => s + 1);
            setFeedback('correct');
        } else {
            setFeedback('incorrect');
        }
        setFilledAnswer(currentQuestion.answer);
        
        setTimeout(() => {
            setFeedback('none');
            setAnswered(false);
            setFilledAnswer(null);
            if (currentQuestionIndex < TOTAL_QUESTIONS_PER_GAME) {
                setCurrentQuestionIndex(i => i + 1);
            }
        }, 2500);
    };
    
    if (isLoading) return <div className="flex justify-center items-center h-96"><LoadingSpinner /></div>;
    if (error) return <div className="text-center text-red-400"><p>{error}</p><Button onClick={fetchQuestions} className="mt-4">Retry</Button></div>;
    if (isGameOver || questions.length === 0) {
        return <ScoreSummary score={score} total={TOTAL_QUESTIONS_PER_GAME} onPlayAgain={fetchQuestions} onBackToMenu={onBack} />;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const sentenceParts = currentQuestion.sentence.split('__BLANK__');

    let dropzoneClass = 'bg-slate-700 border-slate-500';
    if(isDragging) dropzoneClass = 'bg-cyan-900/50 border-cyan-500 scale-105';
    if(feedback === 'correct') dropzoneClass = 'bg-green-600 border-green-400 animate-pulse-correct';
    if(feedback === 'incorrect') dropzoneClass = 'bg-red-600 border-red-400 animate-shake';

    return (
        <GameContainer 
            title="Preposition Drop"
            description="Drag the correct preposition into the blank space."
            score={score}
            questionNumber={currentQuestionIndex}
            totalQuestions={TOTAL_QUESTIONS_PER_GAME}
            onBack={onBack}
        >
            <div className="text-center">
                <div className="text-2xl sm:text-3xl font-serif bg-slate-900 p-6 rounded-lg mb-8 flex items-center justify-center flex-wrap gap-2">
                    <span>{sentenceParts[0]}</span>
                    <div 
                        onDrop={handleDrop} 
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnter={() => setIsDragging(true)}
                        onDragLeave={() => setIsDragging(false)}
                        className={`inline-flex items-center justify-center w-28 h-12 border-2 border-dashed rounded-lg transition-all duration-300 ${dropzoneClass}`}
                    >
                        {filledAnswer && <span className="text-xl font-bold text-white">{filledAnswer}</span>}
                    </div>
                    <span>{sentenceParts[1]}</span>
                </div>
                
                <div className="flex justify-center gap-4 flex-wrap">
                    {currentQuestion.options.map((option) => (
                        <div
                            key={option}
                            draggable={!answered}
                            onDragStart={(e) => e.dataTransfer.setData("text/plain", option)}
                            className={`px-6 py-3 rounded-lg text-lg font-semibold transition-all duration-300 ${answered ? 'bg-slate-600 opacity-50 cursor-not-allowed' : 'bg-slate-700 cursor-grab hover:bg-slate-600'}`}
                        >
                            {option}
                        </div>
                    ))}
                </div>
                {answered && (
                    <div className={`mt-6 p-4 rounded-lg text-lg ${feedback === 'correct' ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'}`}>
                        {feedback === 'correct' ? 'Correct! ' : `The correct answer is "${currentQuestion.answer}". `}
                        <span className="text-sm opacity-80">{currentQuestion.explanation}</span>
                    </div>
                )}
            </div>
        </GameContainer>
    );
};