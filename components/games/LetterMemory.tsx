import React, { useState, useEffect, useCallback } from 'react';
import { GameComponentProps, LetterMemoryQuestion } from '../../types';
import { generateLetterMemoryWords } from '../../services/geminiService';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ScoreSummary } from '../shared/ScoreSummary';
import { Button } from '../shared/Button';
import { LetterMemoryIcon } from '../icons/LetterMemoryIcon';
import { StarIcon } from '../icons/StarIcon';

interface Card {
    id: number;
    letter: string;
    isFlipped: boolean;
    isMatched: boolean;
}

const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

const LEVEL_CONFIG = {
    1: { gridSize: 'grid-cols-4', wordLength: 4, totalPoints: 10 },
    2: { gridSize: 'grid-cols-4', wordLength: 6, totalPoints: 20 },
    3: { gridSize: 'grid-cols-4', wordLength: 8, totalPoints: 30 },
};

export const LetterMemory: React.FC<GameComponentProps> = ({ onBack, onGameComplete }) => {
    const [view, setView] = useState<'instructions' | 'game' | 'level_summary' | 'game_summary'>('instructions');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [wordPool, setWordPool] = useState<LetterMemoryQuestion[]>([]);
    
    const [currentLevel, setCurrentLevel] = useState(1);
    const [currentWord, setCurrentWord] = useState<LetterMemoryQuestion | null>(null);
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<Card[]>([]);
    const [moves, setMoves] = useState(0);
    const [totalScore, setTotalScore] = useState(0);

    const fetchWords = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedWords = await generateLetterMemoryWords();
            if (fetchedWords.length === 0) throw new Error("No words were generated.");
            setWordPool(fetchedWords);
        } catch (err) {
            setError('Failed to load words for the game. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWords();
    }, [fetchWords]);
    
    const setupLevel = useCallback((level: number) => {
        const levelWordLength = LEVEL_CONFIG[level as keyof typeof LEVEL_CONFIG].wordLength;
        const wordForLevel = wordPool.find(w => w.level === level && w.word.length === levelWordLength);
        
        if (!wordForLevel) {
            setError(`No word found for level ${level}. Please try refreshing.`);
            return;
        }

        setCurrentWord(wordForLevel);
        const letters = wordForLevel.word.toUpperCase().split('');
        const pairedLetters = [...letters, ...letters];
        const shuffledCards = shuffleArray(pairedLetters).map((letter, index) => ({
            id: index,
            letter,
            isFlipped: false,
            isMatched: false,
        }));

        setCards(shuffledCards);
        setMoves(0);
        setFlippedCards([]);
        setView('game');
    }, [wordPool]);


    const handleCardClick = (clickedCard: Card) => {
        if (clickedCard.isFlipped || flippedCards.length === 2) {
            return;
        }

        const newFlippedCards = [...flippedCards, clickedCard];
        setCards(cards.map(card => card.id === clickedCard.id ? { ...card, isFlipped: true } : card));
        setFlippedCards(newFlippedCards);
    };

    useEffect(() => {
        if (flippedCards.length === 2) {
            setMoves(m => m + 1);
            const [firstCard, secondCard] = flippedCards;
            if (firstCard.letter === secondCard.letter) {
                // It's a match
                setCards(prevCards => prevCards.map(card => 
                    card.letter === firstCard.letter ? { ...card, isMatched: true } : card
                ));
                setFlippedCards([]);
            } else {
                // Not a match
                setTimeout(() => {
                    setCards(prevCards => prevCards.map(card => 
                        !card.isMatched ? { ...card, isFlipped: false } : card
                    ));
                    setFlippedCards([]);
                }, 1200);
            }
        }
    }, [flippedCards]);

    useEffect(() => {
        if (cards.length > 0 && cards.every(card => card.isMatched)) {
            // Level complete
            const levelPoints = LEVEL_CONFIG[currentLevel as keyof typeof LEVEL_CONFIG].totalPoints;
            setTotalScore(s => s + levelPoints);
            setView('level_summary');
        }
    }, [cards, currentLevel]);
    
    const handleNextLevel = () => {
        const nextLevel = currentLevel + 1;
        if (LEVEL_CONFIG[nextLevel as keyof typeof LEVEL_CONFIG]) {
            setCurrentLevel(nextLevel);
            setupLevel(nextLevel);
        } else {
            // Game finished
            onGameComplete?.(totalScore);
            setView('game_summary');
        }
    };
    
    const handlePlayAgain = () => {
        setCurrentLevel(1);
        setTotalScore(0);
        setupLevel(1);
    };

    if (isLoading) return <LoadingSpinner message="Forging letters..." />;
    if (error) return <div className="text-center text-red-400"><p>{error}</p><Button onClick={fetchWords} className="mt-4">Retry</Button></div>;

    if (view === 'instructions') {
        return (
            <div className="max-w-2xl mx-auto text-center bg-slate-800 p-8 rounded-lg animate-fade-in">
                <LetterMemoryIcon className="w-16 h-16 mx-auto text-cyan-400 mb-4"/>
                <h2 className="text-3xl font-bold text-cyan-400 mb-4">Letter Memory</h2>
                <p className="text-slate-300 mb-6">Flip the cards to find matching pairs of letters. Uncover all the pairs to reveal a secret word!</p>
                <div className="flex justify-center gap-4">
                    <Button onClick={onBack} variant="secondary" size="lg">Back to Menu</Button>
                    <Button onClick={() => setupLevel(currentLevel)} variant="primary" size="lg">Start Game</Button>
                </div>
            </div>
        );
    }
    
    if (view === 'level_summary' && currentWord) {
        return (
            <div className="text-center bg-slate-800 p-8 rounded-lg max-w-lg mx-auto animate-fade-in">
                <h2 className="text-3xl font-bold text-cyan-400 mb-2">Level {currentLevel} Complete!</h2>
                <div className="bg-slate-900/50 p-6 my-6 rounded-lg">
                    <p className="text-slate-400 text-sm uppercase">Secret Word</p>
                    <p className="text-4xl font-bold my-2 text-yellow-400 tracking-widest">{currentWord.word.toUpperCase()}</p>
                    <p className="text-slate-300">{currentWord.definition}</p>
                </div>
                <p className="text-slate-300 text-lg mb-6">You found all pairs in <span className="font-bold text-white">{moves}</span> moves.</p>
                <div className="flex justify-center gap-4">
                    <Button onClick={onBack} variant="secondary">Back to Menu</Button>
                    <Button onClick={handleNextLevel} variant="primary">
                        {LEVEL_CONFIG[(currentLevel + 1) as keyof typeof LEVEL_CONFIG] ? 'Next Level' : 'Finish Game'}
                    </Button>
                </div>
            </div>
        );
    }

    if (view === 'game_summary') {
        return <ScoreSummary score={totalScore} total={Object.values(LEVEL_CONFIG).reduce((acc, val) => acc + val.totalPoints, 0)} onPlayAgain={handlePlayAgain} onBackToMenu={onBack} />;
    }

    const gridLayout = LEVEL_CONFIG[currentLevel as keyof typeof LEVEL_CONFIG]?.gridSize || 'grid-cols-4';

    return (
        <div className="max-w-4xl mx-auto">
             <div className="flex justify-between items-center mb-6">
                <Button onClick={onBack} variant="secondary">Back to Menu</Button>
                <div className="text-right">
                    <p className="font-bold text-xl">Level: <span className="text-cyan-400">{currentLevel}</span></p>
                    <p className="font-bold text-xl">Moves: <span className="text-cyan-400">{moves}</span></p>
                </div>
            </div>
            <div className={`grid ${gridLayout} gap-2 sm:gap-4`}>
                {cards.map(card => (
                    <div key={card.id} className={`flip-card aspect-square ${card.isFlipped ? 'flipped' : ''}`} onClick={() => handleCardClick(card)}>
                        <div className="flip-card-inner">
                            <div className="flip-card-front bg-slate-700 hover:bg-slate-600 transition-colors duration-200 cursor-pointer flex items-center justify-center">
                                <StarIcon className="w-1/2 h-1/2 text-slate-500"/>
                            </div>
                            <div className={`flip-card-back ${card.isMatched ? 'bg-cyan-600' : 'bg-slate-500'}`}>
                                <span className="text-4xl sm:text-5xl font-bold">{card.letter}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};