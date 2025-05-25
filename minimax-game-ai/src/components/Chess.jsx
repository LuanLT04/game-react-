import React, { useState, useEffect, useCallback } from 'react';

// Add Tailwind CSS CDN to the document head
if (typeof document !== 'undefined') {
    const tailwindLink = document.createElement('script');
    tailwindLink.src = 'https://cdn.tailwindcss.com';
    document.head.appendChild(tailwindLink);
}

const initialBoard = [
    ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
    ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
    ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
];

const PIECE_VALUES = {
    '♙': 1, '♟': -1,
    '♘': 3, '♞': -3,
    '♗': 3, '♝': -3,
    '♖': 5, '♜': -5,
    '♕': 9, '♛': -9,
    '♔': 100, '♚': -100
};

const Chess = () => {
    const [board, setBoard] = useState(initialBoard);
    const [selectedPiece, setSelectedPiece] = useState(null);
    const [isWhiteTurn, setIsWhiteTurn] = useState(true);
    const [validMoves, setValidMoves] = useState([]);
    const [isAiMode, setIsAiMode] = useState(false);
    const [difficulty, setDifficulty] = useState('medium');
    const [gameHistory, setGameHistory] = useState([]);
    const [isThinking, setIsThinking] = useState(false);
    const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] });

    const isWhitePiece = (piece) => piece && '♔♕♖♗♘♙'.includes(piece);
    const isBlackPiece = (piece) => piece && '♚♛♜♝♞♟'.includes(piece);

    const getValidMoves = useCallback((piece, row, col) => {
        const moves = [];
        if (!piece) return moves;

        const isWhite = isWhitePiece(piece);
        const isPawn = piece === '♙' || piece === '♟';
        const isKnight = piece === '♘' || piece === '♞';
        const isBishop = piece === '♗' || piece === '♝';
        const isRook = piece === '♖' || piece === '♜';
        const isQueen = piece === '♕' || piece === '♛';
        const isKing = piece === '♔' || piece === '♚';

        if (isPawn) {
            const direction = isWhite ? -1 : 1;
            const startRow = isWhite ? 6 : 1;

            if (row + direction >= 0 && row + direction < 8 && !board[row + direction][col]) {
                moves.push([row + direction, col]);
                if (row === startRow && !board[row + 2 * direction][col]) {
                    moves.push([row + 2 * direction, col]);
                }
            }

            for (const colOffset of [-1, 1]) {
                const newCol = col + colOffset;
                if (newCol >= 0 && newCol < 8) {
                    const targetPiece = board[row + direction]?.[newCol];
                    if (targetPiece && isWhitePiece(targetPiece) !== isWhite) {
                        moves.push([row + direction, newCol]);
                    }
                }
            }
        }

        if (isKnight) {
            const knightMoves = [
                [-2, -1], [-2, 1], [-1, -2], [-1, 2],
                [1, -2], [1, 2], [2, -1], [2, 1]
            ];
            for (const [rowOffset, colOffset] of knightMoves) {
                const newRow = row + rowOffset;
                const newCol = col + colOffset;
                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    const targetPiece = board[newRow][newCol];
                    if (!targetPiece || isWhitePiece(targetPiece) !== isWhite) {
                        moves.push([newRow, newCol]);
                    }
                }
            }
        }

        if (isBishop || isQueen) {
            const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
            for (const [dx, dy] of directions) {
                let newRow = row + dx;
                let newCol = col + dy;
                while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    const targetPiece = board[newRow][newCol];
                    if (!targetPiece) {
                        moves.push([newRow, newCol]);
                    } else {
                        if (isWhitePiece(targetPiece) !== isWhite) {
                            moves.push([newRow, newCol]);
                        }
                        break;
                    }
                    newRow += dx;
                    newCol += dy;
                }
            }
        }

        if (isRook || isQueen) {
            const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            for (const [dx, dy] of directions) {
                let newRow = row + dx;
                let newCol = col + dy;
                while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    const targetPiece = board[newRow][newCol];
                    if (!targetPiece) {
                        moves.push([newRow, newCol]);
                    } else {
                        if (isWhitePiece(targetPiece) !== isWhite) {
                            moves.push([newRow, newCol]);
                        }
                        break;
                    }
                    newRow += dx;
                    newCol += dy;
                }
            }
        }

        if (isKing) {
            const directions = [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1], [0, 1],
                [1, -1], [1, 0], [1, 1]
            ];
            for (const [dx, dy] of directions) {
                const newRow = row + dx;
                const newCol = col + dy;
                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    const targetPiece = board[newRow][newCol];
                    if (!targetPiece || isWhitePiece(targetPiece) !== isWhite) {
                        moves.push([newRow, newCol]);
                    }
                }
            }
        }

        return moves;
    }, [board]);

    const evaluateBoard = (board) => {
        let score = 0;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = board[i][j];
                if (piece) {
                    score += PIECE_VALUES[piece];
                }
            }
        }
        return score;
    };

    const minimax = (board, depth, alpha, beta, isMaximizing) => {
        if (depth === 0) {
            return evaluateBoard(board);
        }

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 8; j++) {
                    const piece = board[i][j];
                    if (piece && isWhitePiece(piece)) {
                        const moves = getValidMoves(piece, i, j);
                        for (const [newRow, newCol] of moves) {
                            const newBoard = board.map(row => [...row]);
                            newBoard[newRow][newCol] = piece;
                            newBoard[i][j] = null;
                            const evaluation = minimax(newBoard, depth - 1, alpha, beta, false);
                            maxEval = Math.max(maxEval, evaluation);
                            alpha = Math.max(alpha, evaluation);
                            if (beta <= alpha) break;
                        }
                    }
                }
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 8; j++) {
                    const piece = board[i][j];
                    if (piece && isBlackPiece(piece)) {
                        const moves = getValidMoves(piece, i, j);
                        for (const [newRow, newCol] of moves) {
                            const newBoard = board.map(row => [...row]);
                            newBoard[newRow][newCol] = piece;
                            newBoard[i][j] = null;
                            const evaluation = minimax(newBoard, depth - 1, alpha, beta, true);
                            minEval = Math.min(minEval, evaluation);
                            beta = Math.min(beta, evaluation);
                            if (beta <= alpha) break;
                        }
                    }
                }
            }
            return minEval;
        }
    };

    const findBestMove = useCallback(() => {
        const depth = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;
        let bestScore = Infinity;
        let bestMove = null;

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = board[i][j];
                if (piece && isBlackPiece(piece)) {
                    const moves = getValidMoves(piece, i, j);
                    for (const [newRow, newCol] of moves) {
                        const newBoard = board.map(row => [...row]);
                        newBoard[newRow][newCol] = piece;
                        newBoard[i][j] = null;
                        const score = minimax(newBoard, depth, -Infinity, Infinity, true);
                        if (score < bestScore) {
                            bestScore = score;
                            bestMove = { piece, from: [i, j], to: [newRow, newCol] };
                        }
                    }
                }
            }
        }

        return bestMove;
    }, [board, difficulty, getValidMoves]);

    const makeMove = (from, to, piece) => {
        const newBoard = board.map(row => [...row]);
        const capturedPiece = newBoard[to[0]][to[1]];
        newBoard[to[0]][to[1]] = piece;
        newBoard[from[0]][from[1]] = null;
        
        // Update captured pieces
        if (capturedPiece) {
            setCapturedPieces(prev => ({
                ...prev,
                [isWhitePiece(capturedPiece) ? 'white' : 'black']: [
                    ...prev[isWhitePiece(capturedPiece) ? 'white' : 'black'],
                    capturedPiece
                ]
            }));
        }
        
        setBoard(newBoard);
        setGameHistory(prev => [...prev, {
            from,
            to,
            piece,
            captured: capturedPiece,
            turn: isWhiteTurn ? 'white' : 'black'
        }]);
    };

    const handleCellClick = (row, col) => {
        if (isThinking) return;
        
        const piece = board[row][col];
        const isPieceWhite = isWhitePiece(piece);
        const isPieceBlack = isBlackPiece(piece);

        if (!selectedPiece && ((isWhiteTurn && isPieceWhite) || (!isWhiteTurn && isPieceBlack))) {
            setSelectedPiece({ piece, row, col });
            setValidMoves(getValidMoves(piece, row, col));
            return;
        }

        if (selectedPiece) {
            if (selectedPiece.row === row && selectedPiece.col === col) {
                setSelectedPiece(null);
                setValidMoves([]);
                return;
            }

            const isValidMove = validMoves.some(([r, c]) => r === row && c === col);
            if (isValidMove) {
                makeMove([selectedPiece.row, selectedPiece.col], [row, col], selectedPiece.piece);
                setIsWhiteTurn(!isWhiteTurn);
            }

            setSelectedPiece(null);
            setValidMoves([]);
        }
    };

    useEffect(() => {
        if (isAiMode && !isWhiteTurn && !isThinking) {
            setIsThinking(true);
            setTimeout(() => {
                const bestMove = findBestMove();
                if (bestMove) {
                    const { piece, from, to } = bestMove;
                    makeMove(from, to, piece);
                    setIsWhiteTurn(true);
                }
                setIsThinking(false);
            }, 800);
        }
    }, [isWhiteTurn, isAiMode, findBestMove, isThinking]);

    const resetGame = () => {
        setBoard(initialBoard);
        setSelectedPiece(null);
        setValidMoves([]);
        setIsWhiteTurn(true);
        setGameHistory([]);
        setIsThinking(false);
        setCapturedPieces({ white: [], black: [] });
    };

    const toggleAiMode = () => {
        setIsAiMode(!isAiMode);
        resetGame();
    };

    const changeDifficulty = () => {
        const difficulties = ['easy', 'medium', 'hard'];
        const currentIndex = difficulties.indexOf(difficulty);
        const nextIndex = (currentIndex + 1) % difficulties.length;
        setDifficulty(difficulties[nextIndex]);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                        Professional Chess
                    </h1>
                    <p className="text-gray-400">Master the game of kings</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Sidebar - Game Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Current Turn */}
                        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                            <h3 className="text-lg font-semibold mb-3 flex items-center">
                                <span className="text-2xl mr-2">{isWhiteTurn ? '♔' : '♚'}</span>
                                {isWhiteTurn ? "White's Turn" : "Black's Turn"}
                            </h3>
                            {isThinking && (
                                <div className="flex items-center space-x-2 text-blue-400">
                                    <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                                    <span className="text-sm">AI thinking...</span>
                                </div>
                            )}
                        </div>

                        {/* Game Controls */}
                        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                            <h3 className="text-lg font-semibold mb-3">Controls</h3>
                            <div className="space-y-2">
                                <button
                                    onClick={resetGame}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
                                >
                                    🔄 New Game
                                </button>
                                
                                <button
                                    onClick={toggleAiMode}
                                    className={`w-full py-2 px-4 rounded transition-colors ${
                                        isAiMode
                                            ? 'bg-red-600 hover:bg-red-700 text-white'
                                            : 'bg-green-600 hover:bg-green-700 text-white'
                                    }`}
                                >
                                    {isAiMode ? '🤖 Disable AI' : '🎯 Enable AI'}
                                </button>
                                
                                {isAiMode && (
                                    <button
                                        onClick={changeDifficulty}
                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded transition-colors"
                                    >
                                        ⚡ Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Captured Pieces */}
                        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                            <h3 className="text-lg font-semibold mb-3">🏆 Captured Pieces</h3>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Black captured:</p>
                                    <div className="text-lg">
                                        {capturedPieces.black.length > 0 ? capturedPieces.black.join(' ') : 'None'}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">White captured:</p>
                                    <div className="text-lg">
                                        {capturedPieces.white.length > 0 ? capturedPieces.white.join(' ') : 'None'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chess Board */}
                    <div className="lg:col-span-2 flex justify-center">
                        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                            <div className="grid grid-cols-8 gap-0 border-2 border-gray-600 rounded-lg overflow-hidden">
                                {board.map((row, rowIndex) => (
                                    row.map((cell, colIndex) => {
                                        const isSelected = selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex;
                                        const isValidMove = validMoves.some(([r, c]) => r === rowIndex && c === colIndex);
                                        const isLightSquare = (rowIndex + colIndex) % 2 === 0;
                                        
                                        return (
                                            <button
                                                key={`${rowIndex}-${colIndex}`}
                                                className={`
                                                    w-16 h-16 text-3xl font-bold transition-all duration-200 relative flex items-center justify-center
                                                    ${isLightSquare ? 'bg-amber-100 hover:bg-amber-200' : 'bg-amber-800 hover:bg-amber-700'}
                                                    ${isSelected ? 'ring-4 ring-blue-500' : ''}
                                                    ${isValidMove ? 'ring-4 ring-green-500' : ''}
                                                    ${isThinking && !isWhiteTurn && isAiMode ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
                                                    hover:scale-105 active:scale-95
                                                `}
                                                onClick={() => handleCellClick(rowIndex, colIndex)}
                                                disabled={isThinking && !isWhiteTurn && isAiMode}
                                            >
                                                {cell}
                                                {isValidMove && !cell && (
                                                    <div className="absolute w-6 h-6 bg-green-500 rounded-full opacity-60"></div>
                                                )}
                                            </button>
                                        );
                                    })
                                ))}
                            </div>
                            
                            {/* Board coordinates */}
                            <div className="flex justify-between mt-2 px-2">
                                {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(file => (
                                    <span key={file} className="text-gray-400 text-sm font-medium w-16 text-center">
                                        {file}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar - Move History */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                            <h3 className="text-lg font-semibold mb-3">📝 Move History</h3>
                            <div className="max-h-96 overflow-y-auto space-y-1">
                                {gameHistory.length > 0 ? (
                                    gameHistory.slice(-15).map((move, index) => {
                                        const files = 'abcdefgh';
                                        const ranks = '87654321';
                                        const fromSquare = files[move.from[1]] + ranks[move.from[0]];
                                        const toSquare = files[move.to[1]] + ranks[move.to[0]];
                                        
                                        return (
                                            <div key={index} className="text-sm flex items-center justify-between p-2 bg-gray-700 rounded">
                                                <span className="flex items-center space-x-2">
                                                    <span className="text-lg">{move.piece}</span>
                                                    <span className="text-gray-300">{fromSquare} → {toSquare}</span>
                                                </span>
                                                {move.captured && (
                                                    <span className="text-red-400 text-lg">×{move.captured}</span>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-gray-400 text-sm">No moves yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chess;