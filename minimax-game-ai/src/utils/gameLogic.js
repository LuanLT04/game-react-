// Kiểm tra người thắng (x/o) hoặc null nếu chưa ai thắng
export function checkWinner(board) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (let line of lines) {
        const [a, b, c] = line;
        if (
            board[a] &&
            board[a] === board[b] &&
            board[a] === board[c]
        ) {
            return board[a];
        }
    }
    return null;
}

// Kiểm tra hết bàn cờ (hòa)
export function checkEndTheGame(board) {
    return board.every((cell) => cell !== "");
}
