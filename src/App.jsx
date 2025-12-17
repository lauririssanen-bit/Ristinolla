import React, { useState, useEffect, useCallback } from 'react';

const WINNING_COMBINATIONS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

const X_CLASS = 'x';
const O_CLASS = 'o';

function App() {
    const [board, setBoard] = useState(Array(9).fill(null));
    const [isXNext, setIsXNext] = useState(true); // true = X, false = O
    const [winner, setWinner] = useState(null); // null, 'x', 'o', or 'draw'
    const [scores, setScores] = useState({ x: 0, o: 0 });
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [scoreAnimation, setScoreAnimation] = useState(null); // 'x' or 'o' to trigger animation

    // Check for win/draw
    const checkWinner = useCallback((currentBoard) => {
        for (let combo of WINNING_COMBINATIONS) {
            const [a, b, c] = combo;
            if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
                return currentBoard[a];
            }
        }
        if (currentBoard.every(cell => cell !== null)) return 'draw';
        return null;
    }, []);

    const handleEndGame = (result) => {
        setWinner(result);
        if (result !== 'draw') {
            setScores(prev => ({ ...prev, [result]: prev[result] + 1 }));
            setScoreAnimation(result);
            setTimeout(() => setScoreAnimation(null), 200);
        }
    };

    const handleClick = (index) => {
        // If game ended, AI is thinking, or cell occupied -> ignore
        if (winner || isAiThinking || board[index]) return;

        // Human move (X)
        const newBoard = [...board];
        newBoard[index] = X_CLASS;
        setBoard(newBoard);

        const result = checkWinner(newBoard);
        if (result) {
            handleEndGame(result);
        } else {
            setIsXNext(false); // Pass turn to O
            setIsAiThinking(true);
        }
    };

    // AI Effect
    useEffect(() => {
        if (!isXNext && !winner && isAiThinking) {
            const timer = setTimeout(() => {
                makeAiMove();
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [isXNext, winner, isAiThinking, board]);

    const makeAiMove = () => {
        // Minimax Logic
        const bestMoveIndex = minimax(board, O_CLASS).index;

        const newBoard = [...board];
        newBoard[bestMoveIndex] = O_CLASS;
        setBoard(newBoard);
        setIsAiThinking(false);

        const result = checkWinner(newBoard);
        if (result) {
            handleEndGame(result);
        } else {
            setIsXNext(true); // Back to X
        }
    };

    function minimax(newBoard, player) {
        // Available spots (indices of nulls)
        const availSpots = newBoard.map((val, idx) => val === null ? idx : null).filter(val => val !== null);

        // Terminal states
        const winResult = checkWinner(newBoard);
        if (winResult === X_CLASS) return { score: -10 };
        if (winResult === O_CLASS) return { score: 10 };
        if (availSpots.length === 0) return { score: 0 };

        const moves = [];

        for (let i = 0; i < availSpots.length; i++) {
            const move = {};
            move.index = availSpots[i];

            // Mutate for recursion
            newBoard[availSpots[i]] = player;

            if (player === O_CLASS) {
                const result = minimax(newBoard, X_CLASS);
                move.score = result.score;
            } else {
                const result = minimax(newBoard, O_CLASS);
                move.score = result.score;
            }

            // Reset
            newBoard[availSpots[i]] = null;
            moves.push(move);
        }

        let bestMove;
        if (player === O_CLASS) {
            let bestScore = -10000;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score > bestScore) {
                    bestScore = moves[i].score;
                    bestMove = i;
                }
            }
        } else {
            let bestScore = 10000;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score < bestScore) {
                    bestScore = moves[i].score;
                    bestMove = i;
                }
            }
        }
        return moves[bestMove];
    }

    const restartGame = () => {
        setBoard(Array(9).fill(null));
        setIsXNext(true);
        setWinner(null);
        setIsAiThinking(false);
    };

    return (
        <>
            <div className="background-globes">
                <div className="globe globe-1"></div>
                <div className="globe globe-2"></div>
            </div>

            <main className="container">
                <header>
                    <h1>Ristinolla</h1>
                    <div className="status-bar">
                        {winner
                            ? (winner === 'draw' ? 'Peli päättyi!' : 'Peli päättyi!')
                            : (isAiThinking ? <span>Vuoro: <span className="player-o">Tekoäly miettii...</span></span>
                                : <span>Vuoro: <span className="player-x">Sinä (X)</span></span>)
                        }
                    </div>
                </header>

                <div className={`game-board ${!isXNext ? O_CLASS : X_CLASS}`}>
                    {board.map((cell, index) => (
                        <div
                            key={index}
                            className={`cell ${cell || ''}`}
                            onClick={() => handleClick(index)}
                        ></div>
                    ))}
                </div>

                <div className="controls">
                    <button onClick={restartGame} className="btn reset-btn">Uusi Peli</button>
                </div>

                <div className="scoreboard">
                    <div className={`score-box x-score ${scoreAnimation === 'x' ? 'pop' : ''}`}>
                        <span className="score-label">Pelaaja X</span>
                        <span className="score-value">{scores.x}</span>
                    </div>
                    <div className={`score-box o-score ${scoreAnimation === 'o' ? 'pop' : ''}`}>
                        <span className="score-label">Tekoäly O</span>
                        <span className="score-value">{scores.o}</span>
                    </div>
                </div>
            </main>

            {/* Winning Modal */}
            {winner && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>
                            {winner === 'draw'
                                ? 'Tasapeli!'
                                : (winner === 'o' ? 'Tekoäly (O) Voittaa!' : 'Sinä (X) Voittaa!')}
                        </h2>
                        <button onClick={restartGame} className="btn modal-btn">Pelaa Uudelleen</button>
                    </div>
                </div>
            )}
        </>
    );
}

export default App;
