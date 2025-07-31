import React, { useState, useEffect, useCallback } from 'react';
import { GameComponentProps, DialogueLine, Dialogue } from '../../types';
import { generateDialogue } from '../../services/geminiService';
import { GameContainer } from '../shared/GameContainer';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ScoreSummary } from '../shared/ScoreSummary';
import { Button } from '../shared/Button';
import { ArrowLeftIcon } from '../icons/ArrowLeftIcon';

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
    let currentIndex = array.length, randomIndex;
    const newArray = [...array];
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
    }
    return newArray;
};

const scenarios = [
    "Job Interview", 
    "Ordering Food", 
    "Doctor Appointment", 
    "Making a Complaint", 
    "Hotel Booking", 
    "Asking for Directions", 
    "Shopping for Clothes", 
    "Returning a faulty item",
    "Planning a weekend trip",
    "Discussing a movie"
];

const DialogueItem: React.FC<{
    line: DialogueLine,
    isDraggable: boolean,
    onDragStart: (e: React.DragEvent, id: number) => void;
    feedbackStatus?: 'correct' | 'incorrect' | 'none';
}> = ({ line, isDraggable, onDragStart, feedbackStatus = 'none' }) => (
    <div
        draggable={isDraggable}
        onDragStart={(e) => onDragStart(e, line.id)}
        aria-roledescription={feedbackStatus}
        className={`dialogue-item p-4 rounded-lg border-2 bg-slate-800 mb-2 transition-all duration-300 
            ${isDraggable ? 'cursor-grab hover:bg-slate-700' : 'cursor-not-allowed opacity-70'}
            ${feedbackStatus === 'correct' ? 'border-green-500' : 'border-slate-600'}
            ${feedbackStatus === 'incorrect' ? 'border-red-500 animate-shake' : 'border-slate-600'}`}
    >
        <p className="font-bold text-cyan-400">{line.speaker}:</p>
        <p className="text-slate-200">{line.line}</p>
    </div>
);

export const DialogueBuilder: React.FC<GameComponentProps> = ({ onBack, onGameComplete }) => {
    const [dialogue, setDialogue] = useState<Dialogue | null>(null);
    const [userOrder, setUserOrder] = useState<DialogueLine[]>([]);
    const [correctOrder, setCorrectOrder] = useState<DialogueLine[]>([]);
    const [feedback, setFeedback] = useState<Array<'correct' | 'incorrect' | 'none'>>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    const [score, setScore] = useState(0);
    const [retries, setRetries] = useState(0);

    const fetchDialogue = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setIsComplete(false);
        setRetries(0);
        setScore(0);
        try {
            const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
            const fetchedDialogue = await generateDialogue(randomScenario);
            setDialogue(fetchedDialogue);
            const sortedLines = [...fetchedDialogue.lines].sort((a, b) => a.id - b.id);
            setCorrectOrder(sortedLines);
            setUserOrder(shuffleArray(fetchedDialogue.lines));
            setFeedback(Array(fetchedDialogue.lines.length).fill('none'));
        } catch (err) {
            setError('Failed to load dialogue. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDialogue();
    }, [fetchDialogue]);

    useEffect(() => {
        if (isComplete) {
            onGameComplete?.(score);
        }
    }, [isComplete, score, onGameComplete]);
    
    const handleDragStart = (e: React.DragEvent, id: number) => {
        e.dataTransfer.setData("dialogueLineId", id.toString());
    };
    
    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        const draggedId = parseInt(e.dataTransfer.getData("dialogueLineId"));
        const draggedItem = userOrder.find(item => item.id === draggedId);
        if (!draggedItem) return;

        const items = userOrder.filter(item => item.id !== draggedId);
        items.splice(dropIndex, 0, draggedItem);
        setUserOrder(items);
        setFeedback(Array(items.length).fill('none'));
    };

    const checkOrder = () => {
        setRetries(r => r + 1);
        let correctCount = 0;
        const newFeedback = userOrder.map((item, index) => {
            if (item.id === correctOrder[index].id) {
                correctCount++;
                return 'correct';
            }
            return 'incorrect';
        });
        setFeedback(newFeedback);

        if (correctCount === correctOrder.length) {
            const finalScore = Math.max(0, 100 - (retries * 10));
            setScore(finalScore);
            setIsComplete(true);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-96"><LoadingSpinner message="Building conversation..."/></div>;
    if (error) return <div className="text-center text-red-400"><p>{error}</p><Button onClick={fetchDialogue} className="mt-4">Retry</Button></div>;
    
    if (isComplete) {
         return (
             <div className="text-center bg-slate-800 p-8 rounded-lg max-w-lg mx-auto animate-fade-in">
                 <h2 className="text-3xl font-bold text-cyan-400 mb-4">Conversation Complete!</h2>
                 <p className="text-lg text-slate-300 mb-6">You solved the puzzle in {retries} {retries === 1 ? 'try' : 'tries'}.</p>
                 <div className="bg-slate-900 rounded-lg p-6 mb-8">
                    <p className="text-slate-400 text-sm uppercase">Your Score</p>
                    <p className="text-6xl font-bold my-2">{score}</p>
                </div>
                 <div className="flex justify-center gap-4">
                     <Button onClick={fetchDialogue} variant="primary">Play Again</Button>
                     <Button onClick={onBack} variant="secondary">Back to Menu</Button>
                 </div>
             </div>
         );
    }

    return (
        <div className="max-w-4xl mx-auto">
             <Button onClick={onBack} variant="secondary" className="mb-6 inline-flex items-center gap-2">
                 <ArrowLeftIcon className="w-5 h-5" />
                 Back to Menu
             </Button>
            <div className="bg-slate-800 p-6 sm:p-8 rounded-lg border border-slate-700">
                <header className="mb-6 text-center">
                    <h2 className="text-3xl font-bold text-cyan-400">Dialogue Builder</h2>
                    <p className="text-slate-400 mt-1">Scenario: <span className="font-semibold text-slate-300">{dialogue?.scenario}</span></p>
                    <p className="text-slate-400">Drag and drop the lines to form a logical conversation.</p>
                </header>

                <div>
                    {userOrder.map((line, index) => (
                        <div key={line.id} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, index)}>
                            <DialogueItem line={line} isDraggable={!isComplete} onDragStart={handleDragStart} feedbackStatus={feedback[index]} />
                        </div>
                    ))}
                </div>
                
                <div className="mt-8 text-center">
                    <Button onClick={checkOrder} disabled={isComplete} variant="primary">
                        Check Order
                    </Button>
                </div>
            </div>
        </div>
    );
};