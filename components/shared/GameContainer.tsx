
import React from 'react';
import { Button } from './Button';
import { ArrowLeftIcon } from '../icons/ArrowLeftIcon';

interface GameContainerProps {
    title: string;
    description: string;
    score: number;
    questionNumber: number;
    totalQuestions: number;
    onBack: () => void;
    children: React.ReactNode;
}

export const GameContainer: React.FC<GameContainerProps> = ({ title, description, score, questionNumber, totalQuestions, onBack, children }) => {
    const progress = totalQuestions > 0 ? ((questionNumber + 1) / totalQuestions) * 100 : 0;
    
    return (
        <div className="max-w-4xl mx-auto">
            <Button onClick={onBack} variant="secondary" className="mb-6 inline-flex items-center gap-2">
                <ArrowLeftIcon className="w-5 h-5" />
                Back to Menu
            </Button>
            <div className="bg-slate-800 p-6 sm:p-8 rounded-lg border border-slate-700">
                <header className="mb-6">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                         <h2 className="text-3xl font-bold text-cyan-400">{title}</h2>
                         <div className="text-lg font-semibold bg-slate-700 px-4 py-1 rounded-full">
                            Score: <span className="text-cyan-300">{score}</span>
                         </div>
                    </div>
                    <p className="text-slate-400">{description}</p>
                </header>
                
                <div className="mb-6">
                    <div className="flex justify-between items-center text-sm text-slate-400 mb-1">
                        <span>Question {questionNumber + 1} of {totalQuestions}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2.5">
                        <div className="bg-cyan-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                <div className="min-h-[250px]">
                    {children}
                </div>
            </div>
        </div>
    );
};
