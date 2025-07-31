import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameComponentProps, WordScrambleQuestion } from '../../types';
import { generateWordScrambleLevels } from '../../services/geminiService';
import { Button } from '../shared/Button';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ArrowLeftIcon } from '../icons/ArrowLeftIcon';

const TOTAL_LEVELS = 10;
const WORDS_PER_LEVEL = 5;
const SCORE_TO_UNLOCK = 30; // 3 out of 5 correct
const POINTS_PER_WORD = 10;

const LOCAL_STORAGE_KEY = 'wordScramblerProgress';

interface ScramblerProgress {
    unlockedLevel: number;
    totalScore: number;
}

const shuffle = (word: string): string => {
    const a = word.split('');
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    // Ensure the shuffled word is not the same as the original
    if (a.join('') === word) {
        return shuffle(word);
    }
    return a.join('');
};

export const WordScrambler: React.FC<GameComponentProps> = ({ onBack, onGameComplete }) => {
    const [progress, setProgress] = useState<ScramblerProgress>({ unlockedLevel: 1, totalScore: 0 });
    const [allWords, setAllWords] = useState<WordScrambleQuestion[]>([]);
    const [view, setView] = useState<'levels' | 'game' | 'level_summary'>('levels');
    const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
    const [levelWords, setLevelWords] = useState<WordScrambleQuestion[]>([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [levelScore, setLevelScore] = useState(0);
    
    const [scrambledLetters, setScrambledLetters] = useState<{ char: string; id: number }[]>([]);
    const [answerSlots, setAnswerSlots] = useState<{ char: string; id: number }[]>([]);
    const [wrongAttempts, setWrongAttempts] = useState(0);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | ''>('');
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const savedProgress = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedProgress) {
                setProgress(JSON.parse(savedProgress));
            }
        } catch (e) { console.error("Failed to parse progress", e); }
        
        const fetchAllWords = async () => {
            setIsLoading(true);
            try {
                const words = await generateWordScrambleLevels();
                setAllWords(words);
            } catch (err) {
                setError("Could not load words for the game. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllWords();
    }, []);

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(progress));
    }, [progress]);

    const setupLevel = (level: number) => {
        const wordsForLevel = allWords.filter(w => w.level === level).slice(0, WORDS_PER_LEVEL);
        setLevelWords(wordsForLevel);
        setSelectedLevel(level);
        setCurrentWordIndex(0);
        setLevelScore(0);
        setView('game');
    };

    const setupWord = (wordIndex: number) => {
        if (wordIndex >= levelWords.length) {
            // Level complete
            const newTotalScore = progress.totalScore + levelScore;
            let newUnlockedLevel = progress.unlockedLevel;
            if (levelScore >= SCORE_TO_UNLOCK && selectedLevel === progress.unlockedLevel) {
                newUnlockedLevel = Math.min(progress.unlockedLevel + 1, TOTAL_LEVELS);
            }
            setProgress({ totalScore: newTotalScore, unlockedLevel: newUnlockedLevel });
            onGameComplete?.(levelScore);
            setView('level_summary');
            return;
        }

        const currentWord = levelWords[wordIndex].word;
        setScrambledLetters(shuffle(currentWord).split('').map((char, id) => ({ char, id })));
        setAnswerSlots([]);
        setWrongAttempts(0);
        setFeedback('');
    };

    useEffect(() => {
        if (view === 'game' && levelWords.length > 0) {
            setupWord(currentWordIndex);
        }
    }, [view, levelWords, currentWordIndex]);

    const handleLetterClick = (letter: { char: string; id: number }) => {
        setScrambledLetters(prev => prev.filter(l => l.id !== letter.id));
        setAnswerSlots(prev => [...prev, letter]);
    };

    const handleAnswerSlotClick = (letter: { char: string; id: number }) => {
        setAnswerSlots(prev => prev.filter(l => l.id !== letter.id));
        setScrambledLetters(prev => [...prev, letter]);
    };
    
    const handleCheck = () => {
        if (answerSlots.length !== levelWords[currentWordIndex].word.length) return;

        const userAnswer = answerSlots.map(l => l.char).join('');
        if (userAnswer.toLowerCase() === levelWords[currentWordIndex].word.toLowerCase()) {
            setFeedback('correct');
            setLevelScore(s => s + POINTS_PER_WORD);
            setTimeout(() => setCurrentWordIndex(i => i + 1), 1500);
        } else {
            setFeedback('incorrect');
            setWrongAttempts(w => w + 1);
            setTimeout(() => {
                setFeedback('');
                setScrambledLetters(prev => [...prev, ...answerSlots].sort((a, b) => a.id - b.id));
                setAnswerSlots([]);
            }, 1500);
        }
    };

    if (isLoading) return <LoadingSpinner message="Loading Word Scrambler..." />;
    if (error) return <p className="text-center text-red-400 mt-8">{error}</p>;

    if (view === 'levels') {
        return (
            <div className="animate-fade-in">
                <header className="flex justify-between items-center mb-8">
                     <div>
                        <Button onClick={onBack} variant="secondary" className="inline-flex items-center gap-2 mb-2"><ArrowLeftIcon className="w-5 h-5" /> Back to Menu</Button>
                        <h1 className="text-3xl sm:text-4xl font-bold text-cyan-400">Word Scrambler</h1>
                        <p className="text-slate-400">Unscramble letters to form words across 10 levels.</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-slate-400 uppercase">Total Score</p>
                        <p className="text-3xl font-bold text-yellow-400">{progress.totalScore}</p>
                    </div>
                </header>
                <div className="grid grid-cols-5 gap-4">
                    {Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1).map(level => {
                        const isUnlocked = level <= progress.unlockedLevel;
                        let levelClass = 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60';
                        if (isUnlocked) levelClass = 'bg-cyan-600 text-white hover:bg-cyan-700 transition-all duration-200';
                        
                        return (
                            <button key={level} onClick={() => isUnlocked && setupLevel(level)} disabled={!isUnlocked} className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg text-2xl font-bold flex items-center justify-center ${levelClass}`}>
                                {level}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }
    
    if (view === 'level_summary') {
        const unlockedNext = levelScore >= SCORE_TO_UNLOCK && selectedLevel! < TOTAL_LEVELS;
        return (
            <div className="text-center bg-slate-800 p-8 rounded-lg max-w-lg mx-auto animate-fade-in">
                <h2 className="text-3xl font-bold text-cyan-400 mb-2">Level {selectedLevel} Complete!</h2>
                <p className="text-slate-300 text-lg mb-6">You scored {levelScore} out of {WORDS_PER_LEVEL * POINTS_PER_WORD} points.</p>
                {levelScore < SCORE_TO_UNLOCK && <p className="text-amber-400 mb-4">You need {SCORE_TO_UNLOCK} points to unlock the next level.</p>}
                
                <div className="flex justify-center gap-4">
                    <Button onClick={() => setView('levels')} variant="secondary">Back to Levels</Button>
                    <Button onClick={() => setupLevel(selectedLevel!)} variant="secondary">Retry Level</Button>
                    {unlockedNext && <Button onClick={() => setupLevel(selectedLevel! + 1)} variant="primary">Next Level</Button>}
                </div>
            </div>
        );
    }

    // Game View
    const currentWord = levelWords[currentWordIndex];

    if (!currentWord) {
        // This guard prevents a crash when the level is finished and the component is re-rendering before the view changes.
        return (
            <div className="max-w-2xl mx-auto animate-fade-in">
                <div className="bg-slate-800 p-8 rounded-lg border border-slate-700">
                    <LoadingSpinner message="Finishing level..." />
                </div>
            </div>
        );
    }

    const progressPercent = (currentWordIndex / WORDS_PER_LEVEL) * 100;
    
    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="bg-slate-800 p-8 rounded-lg border border-slate-700">
                <header className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-cyan-400">Level {selectedLevel}</h2>
                    <div className="text-lg font-semibold bg-slate-700 px-4 py-1 rounded-full">Score: <span className="text-cyan-300">{levelScore}</span></div>
                </header>
                <div className="w-full bg-slate-700 rounded-full h-2.5 mb-6">
                    <div className="bg-cyan-500 h-2.5 rounded-full transition-all duration-500" style={{width: `${progressPercent}%`}}></div>
                </div>

                {/* Answer Slots */}
                <div className="flex justify-center items-center gap-2 bg-slate-900 p-4 rounded-lg min-h-[80px] mb-4">
                    {currentWord.word.split('').map((_, index) => (
                         <div key={index} className="w-14 h-14 bg-slate-700 rounded-md flex items-center justify-center">
                            {answerSlots[index] && (
                                <button onClick={() => handleAnswerSlotClick(answerSlots[index])} className="w-full h-full text-3xl font-bold text-white flex items-center justify-center">
                                    {answerSlots[index].char.toUpperCase()}
                                </button>
                            )}
                         </div>
                    ))}
                </div>

                 {/* Scrambled Letters */}
                 <div className="flex justify-center items-center gap-2 flex-wrap min-h-[80px] mb-6">
                     {scrambledLetters.map(letter => (
                         <button key={letter.id} onClick={() => handleLetterClick(letter)} className="w-14 h-14 bg-slate-600 hover:bg-slate-500 transition rounded-md text-3xl font-bold text-white flex items-center justify-center">
                            {letter.char.toUpperCase()}
                         </button>
                     ))}
                 </div>
                 
                 {/* Feedback & Hint */}
                 <div className="min-h-[60px] mb-6 text-center">
                     {feedback === 'correct' && <p className="text-green-400 text-2xl font-bold animate-pulse-correct">✅ Correct!</p>}
                     {feedback === 'incorrect' && <p className="text-red-400 text-2xl font-bold animate-shake">❌ Try Again!</p>}
                     {wrongAttempts >= 2 && feedback !== 'correct' && (
                        <div className="text-amber-300 bg-amber-900/50 p-3 rounded-md animate-fade-in">
                            <strong>Hint:</strong> {currentWord.hint}
                        </div>
                     )}
                 </div>

                 <div className="flex justify-center">
                     <Button onClick={handleCheck} disabled={feedback !== '' || answerSlots.length !== currentWord.word.length}>Check Word</Button>
                 </div>
            </div>
        </div>
    );
};