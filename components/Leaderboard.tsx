import React, { useState } from 'react';
import { GameComponentProps, GameType } from '../types';
import { Button } from './shared/Button';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

const mockData = {
  [GameType.GrammarSpotter]: [
    { rank: 1, name: 'TenseTitan', score: 4950 },
    { rank: 2, name: 'VerbViper', score: 4800 },
    { rank: 3, name: 'SyntaxStar', score: 4750 },
  ],
  [GameType.SentenceWeaver]: [
    { rank: 1, name: 'PicPerfect', score: 50 },
    { rank: 2, name: 'WordSmith', score: 40 },
    { rank: 3, name: 'ImageInterpreter', score: 30 },
  ],
   [GameType.LetterMemory]: [
    { rank: 1, name: 'MindMeld', score: 300 },
    { rank: 2, name: 'MemoryMaestro', score: 280 },
    { rank: 3, name: 'LetterHunter', score: 250 },
  ],
  [GameType.GrammarFill]: [
    { rank: 1, name: 'FillMaster', score: 5000 },
    { rank: 2, name: 'BlankBlaster', score: 4900 },
    { rank: 3, name: 'ArticleAce', score: 4850 },
  ],
  [GameType.PrepositionDrop]: [
    { rank: 1, name: 'PrepositionPro', score: 4980 },
    { rank: 2, name: 'OnTheMone', score: 4920 },
    { rank: 3, name: 'InItToWinIt', score: 4880 },
  ],
  [GameType.WordScrambler]: [
    { rank: 1, name: 'LexiconLord', score: 980 },
    { rank: 2, name: 'LetterLasso', score: 950 },
    { rank: 3, name: 'AnagramAce', score: 920 },
  ],
  [GameType.VerbBombDefuse]: [
    { rank: 1, name: 'VerbVanquisher', score: 500 },
    { rank: 2, name: 'TenseTamer', score: 480 },
    { rank: 3, name: 'QuickClick', score: 450 },
  ],
   [GameType.GrammarMaze]: [
    { rank: 1, name: 'MazeRunner', score: 4500 },
    { rank: 2, name: 'DoorDestroyer', score: 4300 },
    { rank: 3, name: 'EscapeArtist', score: 4250 },
  ],
  [GameType.DialogueBuilder]: [
    { rank: 1, name: 'ChatChampion', score: 98 },
    { rank: 2, name: 'OrderlyOracle', score: 95 },
    { rank: 3, name: 'LineLeader', score: 92 },
  ],
};

const gameNames: Record<string, string> = {
    [GameType.GrammarSpotter]: "Grammar Spotter",
    [GameType.SentenceWeaver]: "Sentence Weaver",
    [GameType.LetterMemory]: "Letter Memory",
    [GameType.GrammarFill]: "Grammar Fill",
    [GameType.PrepositionDrop]: "Preposition Drop",
    [GameType.WordScrambler]: "Word Scrambler",
    [GameType.VerbBombDefuse]: "Verb Bomb Defuse",
    [GameType.GrammarMaze]: "Grammar Maze",
    [GameType.DialogueBuilder]: "Dialogue Builder"
}

export const Leaderboard: React.FC<Pick<GameComponentProps, 'onBack'>> = ({ onBack }) => {
    const [activeFilter, setActiveFilter] = useState<GameType>(GameType.GrammarSpotter);

    const LeaderboardTable: React.FC<{ data: Array<{rank: number, name: string, score: number}> }> = ({ data }) => (
        <table className="w-full text-left">
            <thead>
                <tr className="border-b border-slate-600 text-slate-400">
                    <th className="p-4">Rank</th>
                    <th className="p-4">Player</th>
                    <th className="p-4 text-right">Score</th>
                </tr>
            </thead>
            <tbody>
                {data.map(player => (
                    <tr key={player.rank} className="border-b border-slate-700 last:border-b-0">
                        <td className="p-4 text-2xl font-bold">{player.rank}</td>
                        <td className="p-4 text-lg font-semibold">{player.name}</td>
                        <td className="p-4 text-xl font-bold text-cyan-400 text-right">{player.score}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <Button onClick={onBack} variant="secondary" className="mb-6 inline-flex items-center gap-2">
                <ArrowLeftIcon className="w-5 h-5" />
                Back to Menu
            </Button>
            <div className="bg-slate-800 p-6 sm:p-8 rounded-lg border border-slate-700">
                <header className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-cyan-400">Weekly Leaderboard</h2>
                    <p className="text-slate-400">Top players of the week. Resets every Monday!</p>
                </header>

                <div className="flex justify-center flex-wrap gap-2 mb-8">
                    {Object.keys(mockData).map(gameKey => (
                         <Button
                            key={gameKey}
                            variant={activeFilter === gameKey ? 'primary' : 'secondary'}
                            onClick={() => setActiveFilter(gameKey as GameType)}
                        >
                            {gameNames[gameKey]}
                        </Button>
                    ))}
                </div>

                <div className="bg-slate-900/50 rounded-lg overflow-hidden">
                    <LeaderboardTable data={mockData[activeFilter as keyof typeof mockData]} />
                </div>
            </div>
        </div>
    );
};