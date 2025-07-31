import React, { useState, useEffect, useCallback } from 'react';
import { GameComponentProps, WordClassSorterQuestion, PartOfSpeech, WordToSort } from '../../types';
import { generateWordClassSorterQuestions } from '../../services/geminiService';
import { TOTAL_QUESTIONS_PER_GAME } from '../../constants';
import { GameContainer } from '../shared/GameContainer';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ScoreSummary } from '../shared/ScoreSummary';
import { Button } from '../shared/Button';

const CATEGORIES: PartOfSpeech[] = ['Noun', 'Verb', 'Adjective', 'Adverb'];

type WordPlacements = {
    [key in PartOfSpeech]: WordToSort[];
} & { Unsorted: WordToSort[] };


export const WordClassSorter: React.FC<GameComponentProps> = ({ onBack, onGameComplete }) => {
    const [questions, setQuestions] = useState<WordClassSorterQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [answered, setAnswered] = useState(false);
    
    const [placements, setPlacements] = useState<WordPlacements>({
        Unsorted: [], Noun: [], Verb: [], Adjective: [], Adverb: []
    });

    const resetPlacements = (words: WordToSort[] = []) => {
        setPlacements({ Unsorted: words, Noun: [], Verb: [], Adjective: [], Adverb: [] });
    };

    const fetchQuestions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setAnswered(false);
        try {
            const fetched = await generateWordClassSorterQuestions();
            if (fetched.length < TOTAL_QUESTIONS_PER_GAME) {
                 throw new Error("Not enough unique questions generated.");
            }
            setQuestions(fetched);
            setCurrentQuestionIndex(0);
            setScore(0);
            resetPlacements(fetched[0].words);
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
        if (isGameOver && onGameComplete) {
            onGameComplete(score);
        }
    }, [isGameOver, score, onGameComplete]);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetCategory: PartOfSpeech | 'Unsorted') => {
        e.preventDefault();
        const wordData = JSON.parse(e.dataTransfer.getData("word"));
        const sourceCategory = e.dataTransfer.getData("sourceCategory") as keyof WordPlacements;

        if (sourceCategory === targetCategory) return;

        setPlacements(prev => {
            const newPlacements = { ...prev };
            // Remove from source
            newPlacements[sourceCategory] = newPlacements[sourceCategory].filter(w => w.word !== wordData.word);
            // Add to target
            newPlacements[targetCategory] = [...newPlacements[targetCategory], wordData];
            return newPlacements;
        });
    };
    
    const handleSubmit = () => {
        if (placements.Unsorted.length > 0 || answered) return;

        let roundScore = 0;
        let placementsCorrect = true;
        CATEGORIES.forEach(category => {
            placements[category].forEach(word => {
                if (word.partOfSpeech === category) {
                    roundScore++;
                } else {
                    placementsCorrect = false;
                }
            });
        });

        setScore(s => s + roundScore);
        setAnswered(true);

        setTimeout(() => {
            setAnswered(false);
            const nextIndex = currentQuestionIndex + 1;
            if (nextIndex < TOTAL_QUESTIONS_PER_GAME) {
                setCurrentQuestionIndex(nextIndex);
                resetPlacements(questions[nextIndex].words);
            } else {
                setCurrentQuestionIndex(nextIndex); // Go to game over
            }
        }, 3000);
    };

    const getWordStyle = (word: WordToSort, category: PartOfSpeech) => {
        if (!answered) return 'bg-slate-700 hover:bg-slate-600';
        return word.partOfSpeech === category ? 'bg-green-600' : 'bg-red-600';
    };

    if (isLoading) return <LoadingSpinner message="Loading Sorter..." />;
    if (error) return <div className="text-center text-red-400"><p>{error}</p><Button onClick={fetchQuestions} className="mt-4">Retry</Button></div>;
    if (isGameOver) {
        return <ScoreSummary score={score} total={TOTAL_QUESTIONS_PER_GAME * 4} onPlayAgain={fetchQuestions} onBackToMenu={onBack} />;
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <GameContainer
            title="Word Class Sorter"
            description="Drag each word to its correct part-of-speech box."
            score={score}
            questionNumber={currentQuestionIndex}
            totalQuestions={TOTAL_QUESTIONS_PER_GAME}
            onBack={onBack}
        >
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Word Categories */}
                {CATEGORIES.map(category => (
                    <div 
                        key={category}
                        onDrop={(e) => handleDrop(e, category)}
                        onDragOver={(e) => e.preventDefault()}
                        className="flex-1 bg-slate-900/50 p-4 rounded-lg min-h-[200px] border-2 border-dashed border-slate-700"
                    >
                        <h3 className="text-center text-cyan-400 font-bold text-xl mb-4">{category}</h3>
                        <div className="space-y-2">
                             {placements[category].map(word => (
                                <div
                                    key={word.word}
                                    draggable={!answered}
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData("word", JSON.stringify(word));
                                        e.dataTransfer.setData("sourceCategory", category);
                                    }}
                                    className={`p-3 rounded-md text-center text-white font-semibold transition-colors duration-300 ${getWordStyle(word, category)} ${!answered ? 'cursor-grab' : ''}`}
                                >
                                    {word.word}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Unsorted Words & Submit Button */}
            <div className="mt-6 p-4 bg-slate-800 rounded-lg">
                <h3 className="text-center font-semibold text-lg mb-4">Words to Sort</h3>
                <div 
                    onDrop={(e) => handleDrop(e, 'Unsorted')}
                    onDragOver={(e) => e.preventDefault()}
                    className="flex justify-center flex-wrap gap-3 min-h-[60px]"
                >
                     {placements.Unsorted.map(word => (
                        <div
                            key={word.word}
                            draggable={!answered}
                            onDragStart={(e) => {
                                e.dataTransfer.setData("word", JSON.stringify(word));
                                e.dataTransfer.setData("sourceCategory", 'Unsorted');
                            }}
                            className="p-3 px-5 rounded-md text-center text-white font-semibold bg-slate-700 hover:bg-slate-600 cursor-grab"
                        >
                            {word.word}
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-6 text-center">
                <Button onClick={handleSubmit} disabled={placements.Unsorted.length > 0 || answered}>
                    {answered ? 'Checking...' : 'Check Answers'}
                </Button>
            </div>
        </GameContainer>
    );
};
