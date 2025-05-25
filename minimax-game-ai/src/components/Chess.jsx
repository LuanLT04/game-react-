import React, { useState, useEffect, useCallback } from 'react';

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
    const [gameState, setGameState] = useState('playing'); // 'playing', 'check', 'checkmate', 'stalemate'
    const [castlingRights, setCastlingRights] = useState({
        whiteKingside: true,
        whiteQueenside: true,
        blackKingside: true,
        blackQueenside: true
    });
    const [enPassantTarget, setEnPassantTarget] = useState(null);
    const [showPromotion, setShowPromotion] = useState(null);
    const [kingPositions, setKingPositions] = useState({ white: [7, 4], black: [0, 4] });

    const isWhitePiece = (piece) => piece && '♔♕♖♗♘♙'.includes(piece);
    const isBlackPiece = (piece) => piece && '♚♛♜♝♞♟'.includes(piece);

    const findKing = useCallback((board, isWhite) => {
        const king = isWhite ? '♔' : '♚';
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (board[i][j] === king) {
                    return [i, j];
                }
            }
        }
        return null;
    }, []);

    const isSquareAttacked = useCallback((board, row, col, byWhite) => {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = board[i][j];
                if (piece && isWhitePiece(piece) === byWhite) {
                    const moves = getValidMovesBasic(piece, i, j, board);
                    if (moves.some(([r, c]) => r === row && c === col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }, []);

    const getValidMovesBasic = (piece, row, col, boardState = board) => {
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

            // Forward moves
            if (row + direction >= 0 && row + direction < 8 && !boardState[row + direction][col]) {
                moves.push([row + direction, col]);
                if (row === startRow && !boardState[row + 2 * direction][col]) {
                    moves.push([row + 2 * direction, col]);
                }
            }

            // Captures
            for (const colOffset of [-1, 1]) {
                const newCol = col + colOffset;
                if (newCol >= 0 && newCol < 8 && row + direction >= 0 && row + direction < 8) {
                    const targetPiece = boardState[row + direction][newCol];
                    if (targetPiece && isWhitePiece(targetPiece) !== isWhite) {
                        moves.push([row + direction, newCol]);
                    }
                    // En passant
                    if (enPassantTarget && enPassantTarget[0] === row + direction && enPassantTarget[1] === newCol) {
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
                    const targetPiece = boardState[newRow][newCol];
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
                    const targetPiece = boardState[newRow][newCol];
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
                    const targetPiece = boardState[newRow][newCol];
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
                    const targetPiece = boardState[newRow][newCol];
                    if (!targetPiece || isWhitePiece(targetPiece) !== isWhite) {
                        moves.push([newRow, newCol]);
                    }
                }
            }
        }

        return moves;
    };

    const getValidMoves = useCallback((piece, row, col) => {
        const basicMoves = getValidMovesBasic(piece, row, col);
        const validMoves = [];
        const isWhite = isWhitePiece(piece);
        const isKing = piece === '♔' || piece === '♚';

        // Check each move to see if it leaves the king in check
        for (const [newRow, newCol] of basicMoves) {
            const newBoard = board.map(r => [...r]);
            newBoard[newRow][newCol] = piece;
            newBoard[row][col] = null;

            const kingPos = isKing ? [newRow, newCol] : findKing(newBoard, isWhite);
            if (kingPos && !isSquareAttacked(newBoard, kingPos[0], kingPos[1], !isWhite)) {
                validMoves.push([newRow, newCol]);
            }
        }

        // Add castling moves for king
        if (isKing && !isSquareAttacked(board, row, col, !isWhite)) {
            const baseRow = isWhite ? 7 : 0;
            
            // Kingside castling
            if ((isWhite ? castlingRights.whiteKingside : castlingRights.blackKingside) &&
                !board[baseRow][5] && !board[baseRow][6] &&
                !isSquareAttacked(board, baseRow, 5, !isWhite) &&
                !isSquareAttacked(board, baseRow, 6, !isWhite)) {
                validMoves.push([baseRow, 6]);
            }
            
            // Queenside castling
            if ((isWhite ? castlingRights.whiteQueenside : castlingRights.blackQueenside) &&
                !board[baseRow][1] && !board[baseRow][2] && !board[baseRow][3] &&
                !isSquareAttacked(board, baseRow, 2, !isWhite) &&
                !isSquareAttacked(board, baseRow, 3, !isWhite)) {
                validMoves.push([baseRow, 2]);
            }
        }

        return validMoves;
    }, [board, castlingRights, enPassantTarget, findKing, isSquareAttacked]);

    const isInCheck = useCallback((board, isWhite) => {
        const kingPos = findKing(board, isWhite);
        return kingPos ? isSquareAttacked(board, kingPos[0], kingPos[1], !isWhite) : false;
    }, [findKing, isSquareAttacked]);

    const hasValidMoves = useCallback((board, isWhite) => {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const piece = board[i][j];
                if (piece && isWhitePiece(piece) === isWhite) {
                    const moves = getValidMoves(piece, i, j);
                    if (moves.length > 0) return true;
                }
            }
        }
        return false;
    }, [getValidMoves]);

    const checkGameState = useCallback((newBoard) => {
        const inCheck = isInCheck(newBoard, isWhiteTurn);
        const hasValidMovesLeft = hasValidMoves(newBoard, isWhiteTurn);

        if (inCheck && !hasValidMovesLeft) {
            setGameState('checkmate');
        } else if (!inCheck && !hasValidMovesLeft) {
            setGameState('stalemate');
        } else if (inCheck) {
            setGameState('check');
        } else {
            setGameState('playing');
        }
    }, [isWhiteTurn, isInCheck, hasValidMoves]);

    const makeMove = (from, to, piece, promotionPiece = null) => {
        const newBoard = board.map(row => [...row]);
        const capturedPiece = newBoard[to[0]][to[1]];
        const isWhite = isWhitePiece(piece);
        const isPawn = piece === '♙' || piece === '♟';
        const isKing = piece === '♔' || piece === '♚';
        const isRook = piece === '♖' || piece === '♜';

        // Handle en passant capture
        if (isPawn && enPassantTarget && to[0] === enPassantTarget[0] && to[1] === enPassantTarget[1]) {
            const capturedPawnRow = isWhite ? to[0] + 1 : to[0] - 1;
            const capturedPawn = newBoard[capturedPawnRow][to[1]];
            newBoard[capturedPawnRow][to[1]] = null;
            setCapturedPieces(prev => ({
                ...prev,
                [isWhitePiece(capturedPawn) ? 'white' : 'black']: [
                    ...prev[isWhitePiece(capturedPawn) ? 'white' : 'black'],
                    capturedPawn
                ]
            }));
        }

        // Handle castling
        if (isKing && Math.abs(to[1] - from[1]) === 2) {
            const rookFromCol = to[1] > from[1] ? 7 : 0;
            const rookToCol = to[1] > from[1] ? 5 : 3;
            const rook = newBoard[from[0]][rookFromCol];
            newBoard[from[0]][rookToCol] = rook;
            newBoard[from[0]][rookFromCol] = null;
        }

        // Handle pawn promotion
        if (isPawn && (to[0] === 0 || to[0] === 7)) {
            if (promotionPiece) {
                newBoard[to[0]][to[1]] = promotionPiece;
            } else {
                setShowPromotion({ to, piece, from, capturedPiece });
                return;
            }
        } else {
            newBoard[to[0]][to[1]] = piece;
        }

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

        // Update castling rights
        const newCastlingRights = { ...castlingRights };
        if (isKing) {
            if (isWhite) {
                newCastlingRights.whiteKingside = false;
                newCastlingRights.whiteQueenside = false;
            } else {
                newCastlingRights.blackKingside = false;
                newCastlingRights.blackQueenside = false;
            }
        }
        if (isRook) {
            if (from[0] === 7 && from[1] === 0) newCastlingRights.whiteQueenside = false;
            if (from[0] === 7 && from[1] === 7) newCastlingRights.whiteKingside = false;
            if (from[0] === 0 && from[1] === 0) newCastlingRights.blackQueenside = false;
            if (from[0] === 0 && from[1] === 7) newCastlingRights.blackKingside = false;
        }
        setCastlingRights(newCastlingRights);

        // Update en passant target
        if (isPawn && Math.abs(to[0] - from[0]) === 2) {
            setEnPassantTarget([from[0] + (to[0] - from[0]) / 2, from[1]]);
        } else {
            setEnPassantTarget(null);
        }

        // Update king positions
        if (isKing) {
            setKingPositions(prev => ({
                ...prev,
                [isWhite ? 'white' : 'black']: [to[0], to[1]]
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

        checkGameState(newBoard);
    };

    const handlePromotion = (promotionPiece) => {
        const { to, from, capturedPiece } = showPromotion;
        const newBoard = board.map(row => [...row]);
        
        newBoard[to[0]][to[1]] = promotionPiece;
        newBoard[from[0]][from[1]] = null;
        
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
        setShowPromotion(null);
        setIsWhiteTurn(!isWhiteTurn);
        checkGameState(newBoard);
    };

    const handleCellClick = (row, col) => {
        if (isThinking || gameState === 'checkmate' || gameState === 'stalemate' || showPromotion) return;
        
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
                if (!showPromotion) {
                    setIsWhiteTurn(!isWhiteTurn);
                }
            }

            setSelectedPiece(null);
            setValidMoves([]);
        }
    };

    const resetGame = () => {
        setBoard(initialBoard);
        setSelectedPiece(null);
        setValidMoves([]);
        setIsWhiteTurn(true);
        setGameHistory([]);
        setIsThinking(false);
        setCapturedPieces({ white: [], black: [] });
        setGameState('playing');
        setCastlingRights({
            whiteKingside: true,
            whiteQueenside: true,
            blackKingside: true,
            blackQueenside: true
        });
        setEnPassantTarget(null);
        setShowPromotion(null);
        setKingPositions({ white: [7, 4], black: [0, 4] });
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

    const getGameStatusMessage = () => {
        switch (gameState) {
            case 'check':
                return `${isWhiteTurn ? 'White' : 'Black'} is in check!`;
            case 'checkmate':
                return `Checkmate! ${isWhiteTurn ? 'Black' : 'White'} wins!`;
            case 'stalemate':
                return 'Stalemate! Game is a draw.';
            default:
                return '';
        }
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
                    {getGameStatusMessage() && (
                        <div className={`mt-2 p-2 rounded text-lg font-bold ${
                            gameState === 'checkmate' ? 'bg-red-600' : 
                            gameState === 'check' ? 'bg-yellow-600' : 'bg-blue-600'
                        }`}>
                            {getGameStatusMessage()}
                        </div>
                    )}
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
                        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 relative">
                            <div className="grid grid-cols-8 gap-0 border-2 border-gray-600 rounded-lg overflow-hidden">
                                {board.map((row, rowIndex) => (
                                    row.map((cell, colIndex) => {
                                        const isSelected = selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex;
                                        const isValidMove = validMoves.some(([r, c]) => r === rowIndex && c === colIndex);
                                        const isLightSquare = (rowIndex + colIndex) % 2 === 0;
                                        const isKingInCheck = gameState === 'check' && 
                                            ((cell === '♔' && isWhiteTurn) || (cell === '♚' && !isWhiteTurn));
                                        
                                        return (
                                            <button
                                                key={`${rowIndex}-${colIndex}`}
                                                className={`
                                                    w-16 h-16 text-3xl font-bold transition-all duration-200 relative flex items-center justify-center
                                                    ${isLightSquare ? 'bg-amber-100 hover:bg-amber-200' : 'bg-amber-800 hover:bg-amber-700'}
                                                    ${isSelected ? 'ring-4 ring-blue-500' : ''}
                                                    ${isValidMove ? 'ring-4 ring-green-500' : ''}
                                                    ${isKingInCheck ? 'ring-4 ring-red-500 bg-red-200' : ''}
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

                            {/* Promotion Modal */}
                            {showPromotion && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                                    <div className="bg-gray-800 p-6 rounded-lg border border-gray-600">
                                        <h3 className="text-lg font-semibold mb-4 text-center">Choose Promotion</h3>
                                        <div className="grid grid-cols-4 gap-2">
                                            {(isWhiteTurn ? ['♕', '♖', '♗', '♘'] : ['♛', '♜', '♝', '♞']).map(piece => (
                                                <button
                                                    key={piece}
                                                    onClick={() => handlePromotion(piece)}
                                                    className="w-16 h-16 text-4xl bg-gray-700 hover:bg-gray-600 rounded border border-gray-500 transition-colors"
                                                >
                                                    {piece}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
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

                        {/* Game Rules Info */}
                        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mt-6">
                            <h3 className="text-lg font-semibold mb-3">🎯 Special Moves</h3>
                            <div className="text-sm space-y-2 text-gray-300">
                                <div>
                                    <strong className="text-blue-400">Castling:</strong> Move king 2 squares toward rook
                                </div>
                                <div>
                                    <strong className="text-green-400">En Passant:</strong> Capture pawn that moved 2 squares
                                </div>
                                <div>
                                    <strong className="text-purple-400">Promotion:</strong> Pawn reaches end of board
                                </div>
                                <div>
                                    <strong className="text-red-400">Check:</strong> King is under attack
                                </div>
                                <div>
                                    <strong className="text-yellow-400">Checkmate:</strong> King cannot escape check
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chess;