import React, { useState, useEffect, useCallback } from 'react';
import { GameComponentProps, GrammarFillQuestion, Feedback } from '../../types';
import { generateMazeQuestions } from '../../services/geminiService';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { Button } from '../shared/Button';
import { GameContainer } from '../shared/GameContainer';
import { ScoreSummary } from '../shared/ScoreSummary';
import { KeyIcon } from '../icons/KeyIcon';

const MAZE_SIZE = 5;
const WALL = 'W', PATH = 'P', DOOR = 'D', START = 'S', END = 'E';

const MAZE_CONFIGS = [
    {
        layout: [
            ['S', 'P', 'P', 'D', 'P'],
            ['W', 'W', 'W', 'W', 'P'],
            ['P', 'D', 'P', 'P', 'P'],
            ['P', 'W', 'W', 'W', 'W'],
            ['P', 'P', 'P', 'D', 'E'],
        ],
        doors: { '0_3': true, '2_1': true, '4_3': true }
    },
    {
        layout: [
            ['S', 'W', 'P', 'P', 'P'],
            ['P', 'W', 'P', 'W', 'P'],
            ['P', 'D', 'P', 'D', 'P'],
            ['P', 'W', 'W', 'W', 'W'],
            ['P', 'P', 'P', 'D', 'E'],
        ],
        doors: { '2_1': true, '2_3': true, '4_3': true }
    },
    {
        layout: [
            ['S', 'P', 'P', 'P', 'P'],
            ['W', 'W', 'D', 'W', 'P'],
            ['P', 'P', 'P', 'W', 'P'],
            ['P', 'W', 'D', 'W', 'D'],
            ['P', 'P', 'P', 'P', 'E'],
        ],
        doors: { '1_2': true, '3_2': true, '3_4': true }
    },
    {
        layout: [
            ['S', 'D', 'P', 'W', 'W'],
            ['W', 'W', 'P', 'W', 'W'],
            ['P', 'P', 'P', 'D', 'P'],
            ['P', 'W', 'W', 'W', 'P'],
            ['P', 'D', 'P', 'P', 'E'],
        ],
        doors: { '0_1': true, '2_3': true, '4_1': true }
    },
    {
        layout: [
            ['S', 'P', 'W', 'P', 'P'],
            ['W', 'P', 'W', 'P', 'W'],
            ['W', 'P', 'D', 'P', 'D'],
            ['P', 'P', 'W', 'W', 'W'],
            ['D', 'P', 'P', 'P', 'E'],
        ],
        doors: { '2_2': true, '2_4': true, '4_0': true }
    }
];

const QuestionModal: React.FC<{
    question: GrammarFillQuestion;
    onAnswer: (isCorrect: boolean) => void;
    feedbackMessage: string;
}> = ({ question, onAnswer, feedbackMessage }) => {
    const [selected, setSelected] = useState<string|null>(null);
    const [feedback, setFeedback] = useState<Feedback>('none');
    
    const handleSelect = (option: string) => {
        if (selected) return;
        setSelected(option);
        const correct = option === question.answer;
        setFeedback(correct ? 'correct' : 'incorrect');
        setTimeout(() => {
            onAnswer(correct);
            setSelected(null);
            setFeedback('none');
        }, 1500);
    }
    
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 p-8 rounded-lg max-w-lg w-full border border-cyan-500 transition-all">
                <h3 className="text-xl font-bold mb-4 text-cyan-400">Unlock the Door!</h3>
                {feedback === 'incorrect' && feedbackMessage ? (
                     <p className="mb-4 text-lg text-amber-300">{feedbackMessage}</p>
                ) : (
                    <>
                        <p className="mb-6 text-slate-300">{question.sentence.replace('__BLANK__', '_____')}</p>
                        <div className="grid grid-cols-2 gap-3">
                            {question.options.map(opt => (
                                <Button 
                                    key={opt}
                                    onClick={() => handleSelect(opt)}
                                    disabled={!!selected}
                                    className={`
                                        ${selected && opt === question.answer ? 'bg-green-600' : ''}
                                        ${selected && opt !== question.answer && selected === opt ? 'bg-red-600 animate-shake' : ''}
                                    `}
                                >
                                    {opt}
                                </Button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export const GrammarMaze: React.FC<GameComponentProps> = ({ onBack, onGameComplete }) => {
    const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
    const [mazeConfig, setMazeConfig] = useState(MAZE_CONFIGS[0]);
    const [questionPool, setQuestionPool] = useState<GrammarFillQuestion[]>([]);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState<GrammarFillQuestion | null>(null);
    const [attemptingDoor, setAttemptingDoor] = useState<string | null>(null);
    const [doors, setDoors] = useState<{ [key: string]: boolean }>(mazeConfig.doors);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string|null>(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [modalFeedback, setModalFeedback] = useState("");

    const handleReset = useCallback(() => {
        const newMazeConfig = MAZE_CONFIGS[Math.floor(Math.random() * MAZE_CONFIGS.length)];
        setMazeConfig(newMazeConfig);
        setDoors(newMazeConfig.doors);
        setPlayerPos({ x: 0, y: 0 });
        setScore(0);
        setGameOver(false);
        setCurrentQuestion(null);
        setAttemptingDoor(null);
        setQuestionIndex(0);
        // Re-fetch questions for a new game
        fetchQuestions();
    }, []);
    
    const fetchQuestions = useCallback(async () => {
        setIsLoading(true); setError(null);
        try {
            const fetchedQuestions = await generateMazeQuestions();
            if(fetchedQuestions.length < 10) {
                throw new Error("Not enough questions generated for the maze.");
            }
            setQuestionPool(fetchedQuestions);
        } catch (err) {
            setError('Could not start the maze. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        handleReset(); // Initialize first game
    }, [handleReset]);

    useEffect(() => {
        if (gameOver) {
            onGameComplete?.(score);
        }
    }, [gameOver, score, onGameComplete]);

    const handleMove = (dx: number, dy: number) => {
        if (gameOver || currentQuestion) return;
        const newX = playerPos.x + dx;
        const newY = playerPos.y + dy;

        if (newX < 0 || newX >= MAZE_SIZE || newY < 0 || newY >= MAZE_SIZE) return;

        const targetCell = mazeConfig.layout[newY][newX];
        if (targetCell === WALL) return;

        if (targetCell === DOOR) {
            const doorId = `${newY}_${newX}`;
            if (doors[doorId]) {
                setCurrentQuestion(questionPool[questionIndex % questionPool.length]);
                setAttemptingDoor(doorId);
                return;
            }
        }
        
        setPlayerPos({ x: newX, y: newY });
        
        if (targetCell === END) {
            setGameOver(true);
        }
    };

    const handleQuestionAnswer = (isCorrect: boolean) => {
        if (isCorrect) {
            setScore(s => s + 1);
            if (attemptingDoor) {
                setDoors(prev => ({ ...prev, [attemptingDoor]: false }));
            }
            setCurrentQuestion(null);
            setAttemptingDoor(null);
            setQuestionIndex(prev => prev + 1); // Fix: consume the question
        } else {
            // Give another question
            setModalFeedback("Incorrect! Let's try another question.");
            setTimeout(() => {
                const nextIndex = questionIndex + 1;
                setQuestionIndex(nextIndex);
                setCurrentQuestion(questionPool[nextIndex % questionPool.length]);
                setModalFeedback("");
            }, 1500);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-96"><LoadingSpinner message="Building maze..."/></div>;
    if (error) return <div className="text-center text-red-400"><p>{error}</p><Button onClick={fetchQuestions} className="mt-4">Retry</Button></div>;

    if (gameOver) {
        return <ScoreSummary score={score} total={Object.keys(mazeConfig.doors).length} onPlayAgain={handleReset} onBackToMenu={onBack} />;
    }

    const getCellContent = (x: number, y: number) => {
        if (playerPos.x === x && playerPos.y === y) return '😀';
        const cell = mazeConfig.layout[y][x];
        switch(cell) {
            case WALL: return <div className="wall-brick w-full h-full"></div>;
            case DOOR: return doors[`${y}_${x}`] ? <KeyIcon className="w-6 h-6 text-yellow-400"/> : '🚪';
            case START: return '🏁';
            case END: return '🏆';
            default: return '';
        }
    };
    
    return (
        <GameContainer
            title="Grammar Maze"
            description="Answer questions to unlock doors and reach the trophy!"
            score={score}
            questionNumber={Object.values(doors).filter(d => !d).length}
            totalQuestions={Object.keys(mazeConfig.doors).length}
            onBack={onBack}
        >
            {currentQuestion && <QuestionModal question={currentQuestion} onAnswer={handleQuestionAnswer} feedbackMessage={modalFeedback}/>}
            <div className="flex flex-col items-center">
                <div className="grid grid-cols-5 gap-1 bg-slate-900 p-2 rounded-md mb-6">
                    {mazeConfig.layout.flat().map((_, index) => {
                        const x = index % MAZE_SIZE;
                        const y = Math.floor(index / MAZE_SIZE);
                        return (
                            <div key={`${x}-${y}`} className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-800 flex items-center justify-center text-3xl">
                                {getCellContent(x, y)}
                            </div>
                        );
                    })}
                </div>
                <div className="grid grid-cols-3 grid-rows-3 w-48 h-48">
                    <div className="col-start-2 row-start-1 flex justify-center items-center"><Button onClick={() => handleMove(0, -1)}>▲</Button></div>
                    <div className="col-start-1 row-start-2 flex justify-center items-center"><Button onClick={() => handleMove(-1, 0)}>◀</Button></div>
                    <div className="col-start-3 row-start-2 flex justify-center items-center"><Button onClick={() => handleMove(1, 0)}>▶</Button></div>
                    <div className="col-start-2 row-start-3 flex justify-center items-center"><Button onClick={() => handleMove(0, 1)}>▼</Button></div>
                </div>
            </div>
        </GameContainer>
    );
};