import React, { useState, useCallback, useMemo } from 'react';
import { GameType } from './types';
import { GAME_CARDS } from './constants';
import { GameCard } from './components/GameCard';
import { GrammarSpotter } from './components/games/GrammarSpotter';
import { GrammarFill } from './components/games/GrammarFill';
import { PrepositionDrop } from './components/games/PrepositionDrop';
import { GrammarMaze } from './components/games/GrammarMaze';
import { DialogueBuilder } from './components/games/DialogueBuilder';
import { EmojiGuessChallenge } from './components/games/EmojiGuessChallenge';
import { WordScrambler } from './components/games/WordScrambler';
import { VerbBombDefuse } from './components/games/VerbBombDefuse';
import { Leaderboard } from './components/Leaderboard';
import { StarIcon } from './components/icons/StarIcon';
import { isApiKeyConfigured } from './services/geminiService';
import { ApiKeyWarning } from './components/ApiKeyWarning';
import { SentenceWeaver } from './components/games/SentenceWeaver';
import { LetterMemory } from './components/games/LetterMemory';

const App: React.FC = () => {
    const [apiKeyIsSet] = useState(isApiKeyConfigured);
    const [activeGame, setActiveGame] = useState<GameType | null>(null);
    const [overallScore, setOverallScore] = useState(0);

    const handleSelectGame = useCallback((game: GameType) => {
        setActiveGame(game);
    }, []);

    const handleBackToMenu = useCallback(() => {
        setActiveGame(null);
    }, []);

    const handleGameComplete = useCallback((score: number) => {
        setOverallScore(prev => prev + score);
    }, []);

    const gameCards = useMemo(() => GAME_CARDS.filter(c => c.id !== GameType.Leaderboard), []);
    const leaderboardCard = useMemo(() => GAME_CARDS.find(c => c.id === GameType.Leaderboard), []);

    const ActiveGameComponent = useMemo(() => {
        if (!activeGame) return null;

        const gameProps = { onBack: handleBackToMenu, onGameComplete: handleGameComplete };

        switch (activeGame) {
            case GameType.GrammarSpotter:
                return <GrammarSpotter {...gameProps} />;
            case GameType.GrammarFill:
                return <GrammarFill {...gameProps} />;
            case GameType.PrepositionDrop:
                return <PrepositionDrop {...gameProps} />;
            case GameType.GrammarMaze:
                return <GrammarMaze {...gameProps} />;
            case GameType.DialogueBuilder:
                return <DialogueBuilder {...gameProps} />;
            case GameType.EmojiGuessChallenge:
                return <EmojiGuessChallenge {...gameProps} />;
            case GameType.WordScrambler:
                return <WordScrambler {...gameProps} />;
            case GameType.VerbBombDefuse:
                return <VerbBombDefuse {...gameProps} />;
            case GameType.SentenceWeaver:
                return <SentenceWeaver {...gameProps} />;
            case GameType.LetterMemory:
                return <LetterMemory {...gameProps} />;
            case GameType.Leaderboard:
                return <Leaderboard onBack={handleBackToMenu} />;
            default:
                return null;
        }
    }, [activeGame, handleBackToMenu, handleGameComplete]);

    if (!apiKeyIsSet) {
        return <ApiKeyWarning />;
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 lg:p-8">
            <header className="mb-8 sm:mb-12">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
                    <div className="text-center sm:text-left">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center sm:justify-start gap-3">
                            <StarIcon className="w-8 h-8 sm:w-10 sm:h-10" />
                            Grammar Galaxy
                        </h1>
                        <p className="text-slate-400 mt-2 text-lg">Your universe of English learning games.</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-center w-full max-w-[200px] mx-auto sm:mx-0 shrink-0">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Overall Score</p>
                        <p className="text-4xl font-bold text-cyan-300">{overallScore}</p>
                    </div>
                </div>
            </header>

            <main>
                {activeGame ? (
                    ActiveGameComponent
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {gameCards.map((card) => (
                                <GameCard key={card.id} card={card} onSelect={handleSelectGame} />
                            ))}
                        </div>
                        {leaderboardCard && (
                             <section className="mt-12 pt-8 border-t-2 border-slate-800">
                                <div className="max-w-3xl mx-auto">
                                    <GameCard card={leaderboardCard} onSelect={handleSelectGame} />
                                </div>
                            </section>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default App;