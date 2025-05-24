import { useState, useEffect } from "react";
import { checkWinner, checkEndTheGame } from "../utils/gameLogic";
import { getAIMoveFromOpenAI } from "../utils/openaiApi";

export const useTicTacToe = () => {
    const [squares, setSquares] = useState(Array(9).fill(""));
    const [turn, setTurn] = useState("x");
    const [winner, setWinner] = useState(null);
    const [isAiMode, setIsAiMode] = useState(false);
    const [difficulty, setDifficulty] = useState("easy");
    const [isLoading, setIsLoading] = useState(false);
    const [aiSide, setAiSide] = useState("o"); // "x", "o", hoặc "both"

    const updateSquares = (ind) => {
        if (squares[ind] || winner || isLoading || (isAiMode && turn === aiSide)) {
            return;
        }
        
        const s = [...squares];
        s[ind] = turn;
        setSquares(s);
        setTurn(turn === "x" ? "o" : "x");
        
        const W = checkWinner(s);
        if (W) {
            setWinner(W);
        } else if (checkEndTheGame(s)) {
            setWinner("x | o");
        }
    };

    // AI move logic
    useEffect(() => {
        const makeAiMove = async () => {
            try {
                console.log("AI thinking...", {
                    isAiMode,
                    turn,
                    aiSide,
                    winner,
                    isLoading
                });
                
                setIsLoading(true);
                const bestMove = await getAIMoveFromOpenAI([...squares], turn, difficulty);
                console.log("AI chose move:", bestMove);
                
                if (bestMove !== -1 && !winner) {
                    const s = [...squares];
                    s[bestMove] = turn;
                    setSquares(s);
                    setTurn(turn === "x" ? "o" : "x");
                    
                    const W = checkWinner(s);
                    if (W) {
                        setWinner(W);
                    } else if (checkEndTheGame(s)) {
                        setWinner("x | o");
                    }
                }
                setIsLoading(false);
            } catch (error) {
                console.error("AI move error:", error);
                setIsLoading(false);
            }
        };

        if (isAiMode && !winner && !isLoading && turn === aiSide) {
            console.log("Starting AI move...");
            makeAiMove();
        }
    }, [squares, turn, isAiMode, winner, difficulty, aiSide]);

    const resetGame = () => {
        setSquares(Array(9).fill(""));
        setTurn("x");
        setWinner(null);
        setIsLoading(false);
    };

    const toggleAiMode = () => {
        setIsAiMode(!isAiMode);
        resetGame();
    };

    const changeDifficulty = () => {
        const difficulties = ["easy", "medium", "hard"];
        const currentIndex = difficulties.indexOf(difficulty);
        const nextDifficulty = difficulties[(currentIndex + 1) % difficulties.length];
        setDifficulty(nextDifficulty);
        resetGame();
    };

    const changeAiSide = () => {
        const sides = ["o", "x", "both"];
        const currentIndex = sides.indexOf(aiSide);
        const nextSide = sides[(currentIndex + 1) % sides.length];
        setAiSide(nextSide);
        resetGame();
    };

    return {
        squares,
        turn,
        winner,
        isAiMode,
        difficulty,
        updateSquares,
        resetGame,
        toggleAiMode,
        changeDifficulty,
        isLoading,
        aiSide,
        changeAiSide,
    };
};
