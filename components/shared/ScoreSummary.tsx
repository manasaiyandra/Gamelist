
import React from 'react';
import { Button } from './Button';

interface ScoreSummaryProps {
    score: number;
    total: number;
    onPlayAgain: () => void;
    onBackToMenu: () => void;
}

export const ScoreSummary: React.FC<ScoreSummaryProps> = ({ score, total, onPlayAgain, onBackToMenu }) => {
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    
    let message = "Good effort! Keep practicing.";
    if (percentage > 90) {
        message = "Excellent work! You're a grammar master!";
    } else if (percentage > 70) {
        message = "Great job! You're getting really good.";
    }

    return (
        <div className="text-center bg-slate-800 p-8 rounded-lg max-w-lg mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold text-cyan-400 mb-2">Game Over!</h2>
            <p className="text-slate-300 text-lg mb-6">{message}</p>
            <div className="bg-slate-900 rounded-lg p-6 mb-8">
                <p className="text-slate-400 text-sm uppercase">Your Score</p>
                <p className="text-6xl font-bold my-2">{score} / {total}</p>
                <div className="w-full bg-slate-700 rounded-full h-4">
                    <div 
                        className="bg-gradient-to-r from-cyan-400 to-purple-500 h-4 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
                <p className="text-2xl font-semibold mt-2">{percentage}%</p>
            </div>
            <div className="flex justify-center gap-4">
                <Button onClick={onPlayAgain} variant="primary">Play Again</Button>
                <Button onClick={onBackToMenu} variant="secondary">Back to Menu</Button>
            </div>
        </div>
    );
};
