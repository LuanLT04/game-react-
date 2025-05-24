export async function getAIMoveFromOpenAI(board, turn, difficulty) {
  try {
    const boardStr = board.map((cell) => (cell === "" ? "-" : cell)).join("");
    console.log("Current board:", boardStr);

    // Tạo mô tả bàn cờ dễ hiểu hơn cho AI
    const boardDescription = board
      .map((cell, index) => {
        return `Ô ${index}: ${cell || "trống"}`;
      })
      .join(", ");

    // Phân tích tình huống hiện tại
    const analysis = analyzeBoard(board, turn);

    // Ở chế độ easy, không cần gọi API, chọn nước đi kém nhất
    if (difficulty === "easy") {
      // 1. Nếu AI sắp thắng, cố tình bỏ lỡ cơ hội
      const winningMove = findWinningMove(board, turn);
      if (winningMove !== -1) {
        // Tìm một nước đi khác không phải winning move
        const otherMoves = board
          .map((cell, idx) => (cell === "" && idx !== winningMove ? idx : -1))
          .filter((idx) => idx !== -1);
        if (otherMoves.length > 0) {
          return otherMoves[Math.floor(Math.random() * otherMoves.length)];
        }
      }

      // 2. Nếu người chơi sắp thắng, không chặn
      const blockingMove = findWinningMove(board, turn === "x" ? "o" : "x");
      if (blockingMove !== -1) {
        // Tìm một nước đi khác không phải blocking move
        const otherMoves = board
          .map((cell, idx) => (cell === "" && idx !== blockingMove ? idx : -1))
          .filter((idx) => idx !== -1);
        if (otherMoves.length > 0) {
          return otherMoves[Math.floor(Math.random() * otherMoves.length)];
        }
      }

      // 3. Ưu tiên đánh vào cạnh thay vì góc hoặc trung tâm
      const edges = [1, 3, 5, 7];
      const emptyEdges = edges.filter((i) => board[i] === "");
      if (emptyEdges.length > 0) {
        return emptyEdges[Math.floor(Math.random() * emptyEdges.length)];
      }

      // 4. Nếu không còn cạnh, chọn ngẫu nhiên
      const emptySquares = board
        .map((cell, idx) => (cell === "" ? idx : -1))
        .filter((idx) => idx !== -1);
      return emptySquares[Math.floor(Math.random() * emptySquares.length)];
    }

    // Ở chế độ medium, chỉ thỉnh thoảng chọn nước tốt
    if (difficulty === "medium") {
      // Tăng cơ hội chơi thông minh lên 70%
      if (Math.random() < 0.7) {
        // 1. Nếu có nước thắng, 40% sẽ bỏ qua (giảm từ 70%)
        const winningMove = findWinningMove(board, turn);
        if (winningMove !== -1) {
          if (Math.random() < 0.4) {
            // Bỏ qua nước thắng, tìm nước khác tốt
            const otherMoves = board
              .map((cell, idx) =>
                cell === "" && idx !== winningMove ? idx : -1
              )
              .filter((idx) => idx !== -1);
            if (otherMoves.length > 0) {
              return otherMoves[Math.floor(Math.random() * otherMoves.length)];
            }
          }
          return winningMove; // 60% sẽ chọn nước thắng
        }

        // 2. Nếu cần chặn, 70% sẽ chặn (tăng từ 50%)
        const blockingMove = findWinningMove(board, turn === "x" ? "o" : "x");
        if (blockingMove !== -1) {
          if (Math.random() < 0.7) {
            return blockingMove;
          }
        }

        // 3. Chiến lược tấn công
        // Ưu tiên trung tâm với tỉ lệ cao hơn
        if (board[4] === "" && Math.random() < 0.6) {
          return 4;
        }

        // Ưu tiên góc với tỉ lệ cao hơn
        const corners = [0, 2, 6, 8];
        const emptyCorners = corners.filter((i) => board[i] === "");
        if (emptyCorners.length > 0 && Math.random() < 0.5) {
          return emptyCorners[Math.floor(Math.random() * emptyCorners.length)];
        }

        // 4. Tìm nước tạo cơ hội thắng
        const edges = [1, 3, 5, 7];
        const emptyEdges = edges.filter((i) => board[i] === "");
        if (emptyEdges.length > 0 && Math.random() < 0.4) {
          return emptyEdges[Math.floor(Math.random() * emptyEdges.length)];
        }
      }

      // 30% còn lại sẽ chọn ngẫu nhiên, nhưng vẫn ưu tiên vị trí tốt
      const moveOrder = [4, 0, 2, 6, 8, 1, 3, 5, 7];
      const availableMoves = moveOrder.filter((i) => board[i] === "");
      if (availableMoves.length > 0) {
        // Chọn một trong 3 vị trí đầu tiên có sẵn
        const topMoves = availableMoves.slice(
          0,
          Math.min(3, availableMoves.length)
        );
        return topMoves[Math.floor(Math.random() * topMoves.length)];
      }

      // Nếu không còn vị trí ưu tiên, chọn ngẫu nhiên
      const emptySquares = board
        .map((cell, idx) => (cell === "" ? idx : -1))
        .filter((idx) => idx !== -1);
      return emptySquares[Math.floor(Math.random() * emptySquares.length)];
    }

    // Chế độ hard giữ nguyên logic cũ
    let prompt = `Bạn là AI chơi cờ caro 3x3 ở chế độ KHÓ.
Bàn cờ hiện tại: ${boardDescription}
Lượt của: ${turn}
Phân tích: ${analysis}

Quy tắc cho chế độ KHÓ (phải tuân thủ theo thứ tự):
1. Nếu có nước thắng ngay, PHẢI chọn nước đó
2. Nếu đối thủ sắp thắng, PHẢI chặn ngay
3. Nếu có thể tạo 2 đường thắng cùng lúc, PHẢI chọn nước đó
4. Ưu tiên chiếm trung tâm (ô 4) nếu còn trống
5. Ưu tiên góc (ô 0, 2, 6, 8) hơn cạnh (ô 1, 3, 5, 7)
6. Chọn nước tạo cơ hội thắng nhiều nhất

Phải chọn nước đi TỐI ƯU NHẤT theo các quy tắc trên.
Hãy chọn một số từ 0-8 tương ứng với ô trống bạn muốn đánh.`;

    console.log("Sending prompt to AI:", prompt);

    const response = await fetch("https://api.aiproxy.io/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 10,
        temperature: 0.0, // Hard mode luôn dùng temperature = 0
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", data);

    const content = data.choices?.[0]?.message?.content;
    console.log("AI content:", content);

    const match = content?.match(/\d/);
    const move = match ? parseInt(match[0], 10) : -1;

    // Kiểm tra và điều chỉnh nước đi nếu cần
    if (move >= 0 && move < 9 && board[move] === "") {
      // Ở chế độ hard, kiểm tra xem có nước thắng ngay không
      if (difficulty === "hard") {
        const winningMove = findWinningMove(board, turn);
        if (winningMove !== -1 && winningMove !== move) {
          console.log(
            "AI missed winning move, correcting from",
            move,
            "to",
            winningMove
          );
          return winningMove;
        }

        // Kiểm tra nước chặn thắng
        const blockingMove = findWinningMove(board, turn === "x" ? "o" : "x");
        if (blockingMove !== -1 && blockingMove !== move) {
          console.log(
            "AI missed blocking move, correcting from",
            move,
            "to",
            blockingMove
          );
          return blockingMove;
        }
      }

      console.log("Valid move:", move);
      return move;
    }

    // Nếu nước đi không hợp lệ hoặc API fail
    return findBestMove(board, turn, difficulty);
  } catch (error) {
    console.error("Error in getAIMoveFromOpenAI:", error);
    return findBestMove(board, turn, difficulty);
  }
}

// Hàm phân tích bàn cờ
function analyzeBoard(board, turn) {
  const analysis = [];

  // Kiểm tra cơ hội thắng
  const winningMove = findWinningMove(board, turn);
  if (winningMove !== -1) {
    analysis.push(`${turn} có thể thắng ngay tại ô ${winningMove}`);
  }

  // Kiểm tra nguy cơ thua
  const opponent = turn === "x" ? "o" : "x";
  const blockingMove = findWinningMove(board, opponent);
  if (blockingMove !== -1) {
    analysis.push(`Cần chặn ${opponent} tại ô ${blockingMove}`);
  }

  // Phân tích vị trí chiến lược
  if (board[4] === "") {
    analysis.push("Trung tâm (ô 4) đang trống");
  }

  const corners = [0, 2, 6, 8];
  const emptyCorners = corners.filter((i) => board[i] === "");
  if (emptyCorners.length > 0) {
    analysis.push(
      `Có ${emptyCorners.length} góc trống: ${emptyCorners.join(", ")}`
    );
  }

  return analysis.join(". ") || "Chưa có tình huống đặc biệt";
}

// Hàm tìm nước đi thắng
function findWinningMove(board, player) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // Hàng ngang
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // Hàng dọc
    [0, 4, 8],
    [2, 4, 6], // Đường chéo
  ];

  for (let line of lines) {
    const [a, b, c] = line;
    // Kiểm tra nếu có 2 quân cùng loại và 1 ô trống
    if (board[a] === player && board[b] === player && board[c] === "") return c;
    if (board[a] === player && board[c] === player && board[b] === "") return b;
    if (board[b] === player && board[c] === player && board[a] === "") return a;
  }
  return -1;
}

// Điều chỉnh hàm findBestMove để phù hợp với từng độ khó
function findBestMove(board, player, difficulty) {
  if (difficulty === "easy") {
    // Chọn ngẫu nhiên ưu tiên cạnh
    const edges = [1, 3, 5, 7];
    const emptyEdges = edges.filter((i) => board[i] === "");
    if (emptyEdges.length > 0) {
      return emptyEdges[Math.floor(Math.random() * emptyEdges.length)];
    }
  } else if (difficulty === "medium") {
    // 50% cơ hội chọn nước tốt
    if (Math.random() < 0.5) {
      const winMove = findWinningMove(board, player);
      if (winMove !== -1) return winMove;

      const blockMove = findWinningMove(board, player === "x" ? "o" : "x");
      if (blockMove !== -1 && Math.random() < 0.5) return blockMove;
    }
  } else {
    // Hard mode: luôn chọn nước tốt nhất
    const winMove = findWinningMove(board, player);
    if (winMove !== -1) return winMove;

    const blockMove = findWinningMove(board, player === "x" ? "o" : "x");
    if (blockMove !== -1) return blockMove;

    // Ưu tiên: Trung tâm > Góc > Cạnh
    const moveOrder = [4, 0, 2, 6, 8, 1, 3, 5, 7];
    for (let move of moveOrder) {
      if (board[move] === "") return move;
    }
  }

  // Fallback: chọn ô trống đầu tiên
  return board.findIndex((cell) => cell === "");
}
