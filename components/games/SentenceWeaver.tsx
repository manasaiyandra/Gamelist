
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameComponentProps, SentenceWeaverQuestion, Feedback } from '../../types';
import { generateSentenceWeaverQuestions } from '../../services/geminiService';
import { TOTAL_QUESTIONS_PER_GAME } from '../../constants';
import { GameContainer } from '../shared/GameContainer';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ScoreSummary } from '../shared/ScoreSummary';
import { Button } from '../shared/Button';
import { SentenceWeaverIcon } from '../icons/SentenceWeaverIcon';

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

interface WordElement {
    word: string;
    id: number;
    top: string;
    left: string;
    clicked: boolean;
}

export const SentenceWeaver: React.FC<GameComponentProps> = ({ onBack, onGameComplete }) => {
    const [view, setView] = useState<'instructions' | 'game' | 'summary'>('instructions');
    const [questions, setQuestions] = useState<SentenceWeaverQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [wordElements, setWordElements] = useState<WordElement[]>([]);
    const [selectedWords, setSelectedWords] = useState<string[]>([]);
    const [correctWords, setCorrectWords] = useState<string[]>([]);
    
    const [feedback, setFeedback] = useState<Feedback>('none');
    const [attempts, setAttempts] = useState(0);
    const [showHint, setShowHint] = useState(false);
    
    const isGameOver = currentQuestionIndex >= TOTAL_QUESTIONS_PER_GAME;

    const fetchQuestions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedQuestions = await generateSentenceWeaverQuestions();
            if (fetchedQuestions.length < TOTAL_QUESTIONS_PER_GAME) {
                 throw new Error("Not enough unique questions generated.");
            }
            setQuestions(fetchedQuestions);
            setView('game');
        } catch (err) {
            setError('Failed to load questions. Please try again later.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const setupQuestion = useCallback((qIndex: number) => {
        if (!questions[qIndex]) return;

        const question = questions[qIndex];
        const words = question.sentence.replace(/[.,!?]/g, '').split(' ');
        const shuffledWords = shuffleArray(words);
        
        setCorrectWords(words);
        setSelectedWords([]);
        setAttempts(0);
        setShowHint(false);
        setFeedback('none');

        setWordElements(shuffledWords.map((word, index) => ({
            word,
            id: index,
            top: `${Math.random() * 80 + 10}%`,
            left: `${Math.random() * 80 + 10}%`,
            clicked: false
        })));
    }, [questions]);
    
    useEffect(() => {
        if (view === 'game' && questions.length > 0) {
            setupQuestion(currentQuestionIndex);
        }
    }, [view, questions, currentQuestionIndex, setupQuestion]);

    useEffect(() => {
        if (isGameOver) {
            onGameComplete?.(score);
            setView('summary');
        }
    }, [isGameOver, score, onGameComplete]);

    const handleWordClick = (clickedElement: WordElement) => {
        if (clickedElement.clicked || feedback !== 'none') return;

        const newSelectedWords = [...selectedWords, clickedElement.word];
        setSelectedWords(newSelectedWords);

        setWordElements(prev => prev.map(el => 
            el.id === clickedElement.id ? { ...el, clicked: true } : el
        ));

        if (newSelectedWords.length === correctWords.length) {
            checkSentence(newSelectedWords);
        }
    };
    
    const checkSentence = (userWords: string[]) => {
        const isCorrect = userWords.join(' ') === correctWords.join(' ');

        if (isCorrect) {
            setFeedback('correct');
            setScore(s => s + 10);
            setTimeout(() => {
                setCurrentQuestionIndex(prev => prev + 1);
            }, 2000);
        } else {
            setFeedback('incorrect');
            setAttempts(prev => prev + 1);
            if (attempts === 0) {
                 setShowHint(true);
            } else {
                 // Second failure, show correct answer and move on
                 setTimeout(() => {
                    setCurrentQuestionIndex(prev => prev + 1);
                }, 3000);
            }
        }
    };
    
    const handleRetry = () => {
        setSelectedWords([]);
        setWordElements(prev => prev.map(el => ({ ...el, clicked: false })));
        setFeedback('none');
    };

    if (view === 'instructions') {
        return (
            <div className="max-w-2xl mx-auto text-center bg-slate-800 p-8 rounded-lg animate-fade-in">
                <SentenceWeaverIcon className="w-16 h-16 mx-auto text-cyan-400 mb-4"/>
                <h2 className="text-3xl font-bold text-cyan-400 mb-4">Sentence Weaver</h2>
                <p className="text-slate-300 mb-6">An image will appear with words scattered over it. Click the words in the correct order to build the sentence that describes the picture!</p>
                <div className="bg-slate-900/50 p-4 rounded-lg mb-6 text-left">
                    <p className="font-bold mb-2">Rules:</p>
                    <ul className="list-disc list-inside text-slate-300 space-y-1">
                        <li>Click words in sequence to form a sentence.</li>
                        <li>You get +10 points for each correct sentence.</li>
                        <li>You have one retry if you make a mistake. A hint will appear!</li>
                    </ul>
                </div>
                <Button onClick={fetchQuestions} variant="primary">Start Game</Button>
            </div>
        );
    }
    
    if (isLoading) return <LoadingSpinner message="Weaving sentences..." />;
    if (error) return <div className="text-center text-red-400"><p>{error}</p><Button onClick={fetchQuestions} className="mt-4">Retry</Button></div>;
    if (view === 'summary') return <ScoreSummary score={score} total={TOTAL_QUESTIONS_PER_GAME * 10} onPlayAgain={fetchQuestions} onBackToMenu={onBack} />;
    
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return <LoadingSpinner message="Loading..." />;
    
    const imageUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(currentQuestion.imageSearchQuery)}`;

    return (
        <GameContainer
            title="Sentence Weaver"
            description="Find the words in the image to form a sentence."
            score={score}
            questionNumber={currentQuestionIndex}
            totalQuestions={TOTAL_QUESTIONS_PER_GAME}
            onBack={onBack}
        >
            <div 
                className="relative w-full aspect-video bg-cover bg-center rounded-lg mb-4 border-2 border-slate-700"
                style={{ backgroundImage: `url(${imageUrl})` }}
            >
                {wordElements.map((el) => (
                    <button
                        key={el.id}
                        onClick={() => handleWordClick(el)}
                        disabled={el.clicked}
                        style={{ top: el.top, left: el.left, position: 'absolute' }}
                        className={`px-3 py-1 rounded-md text-white font-bold text-lg shadow-lg transition-all duration-300 transform
                            ${el.clicked ? 'bg-cyan-500/50 text-cyan-200 scale-95 opacity-50 cursor-not-allowed' : 'bg-slate-900/70 hover:bg-cyan-600 hover:scale-110'}`}
                    >
                        {el.word}
                    </button>
                ))}
            </div>

            {/* Sentence Strip */}
            <div className="bg-slate-900/50 p-4 rounded-lg min-h-[70px] flex items-center justify-center gap-2 flex-wrap">
                {correctWords.map((word, index) => (
                    <div key={index} className={`h-12 flex-1 min-w-[80px] rounded-md flex items-center justify-center font-bold text-lg transition-colors duration-300
                        ${selectedWords[index] ? 'bg-slate-700 text-white' : 'bg-slate-800'}`}>
                        {selectedWords[index] || ''}
                    </div>
                ))}
            </div>

            {/* Feedback & Hint Section */}
            <div className="min-h-[90px] mt-4 text-center flex flex-col justify-center items-center">
                {feedback === 'correct' && <p className="text-green-400 text-2xl font-bold animate-pulse-correct">✅ Correct Sentence!</p>}
                {feedback === 'incorrect' && (
                    <div className="animate-shake">
                        <p className="text-red-400 text-2xl font-bold">❌ Wrong Order</p>
                        {attempts < 2 ? (
                             <Button onClick={handleRetry} className="mt-2" variant="secondary">Try Again</Button>
                        ) : (
                            <p className="text-slate-300 mt-1">The correct sentence was: "{correctWords.join(' ')}"</p>
                        )}
                    </div>
                )}
                {showHint && (
                     <div className="mt-2 p-3 bg-amber-900/50 text-amber-300 rounded-md animate-fade-in">
                        <strong>Hint:</strong> {currentQuestion.hint}
                    </div>
                )}
            </div>
        </GameContainer>
    );
};
