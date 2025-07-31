
import React from 'react';
import { GameCardData, GameType } from '../types';

interface GameCardProps {
    card: GameCardData;
    onSelect: (game: GameType) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ card, onSelect }) => {
    const { id, title, description, Icon } = card;

    return (
        <div 
            className="bg-slate-800 rounded-lg p-6 flex flex-col items-start cursor-pointer transition-all duration-300 hover:bg-slate-700 hover:shadow-lg hover:shadow-cyan-500/20 transform hover:-translate-y-1 border border-slate-700"
            onClick={() => onSelect(id)}
        >
            <div className="bg-slate-900 p-3 rounded-lg mb-4 border border-slate-600">
                <Icon className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
            <p className="text-slate-400 text-base flex-grow">{description}</p>
        </div>
    );
};
