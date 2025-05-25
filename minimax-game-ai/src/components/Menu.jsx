import React, { useState } from 'react';

const Menu = ({ onSelectGame }) => {
  const [hoveredGame, setHoveredGame] = useState(null);

  const games = [
    {
      id: 'tictactoe',
      title: 'Tic Tac Toe',
      subtitle: 'Classic 3×3 Strategy',
      description: 'Master the timeless game of X\'s and O\'s',
      difficulty: 'Beginner Friendly',
      features: ['AI Levels', 'Score Tracking', 'Quick Matches']
    },
    {
      id: 'chess',
      title: 'Chess',
      subtitle: 'Ultimate Strategy Game',
      description: 'Challenge yourself with strategic board game',
      difficulty: 'Advanced Strategy',
      features: ['Smart AI', 'Move History', 'Multiple Levels']
    }
  ];

  const handleGameSelect = (gameId) => {
    if (onSelectGame) {
      onSelectGame(gameId);
    } else {
      alert(`Starting ${gameId}...`);
    }
  };

  return (
    <div className="game-menu">
      {/* Header */}
      <div className="header">
        <div className="icon-box">🎮</div>
        <h1 className="main-title">AI Board Games</h1>
        <p className="subtitle">✨ Premium Gaming Collection ✨</p>
        <div className="features">
          <span>🧠 Advanced AI</span>
          <span>⚡ Instant Play</span>
          <span>🏆 Competitive</span>
        </div>
      </div>

      {/* Games Grid */}
      <div className="games-grid">
        {games.map((game) => (
          <div
            key={game.id}
            className={`game-card ${game.id} ${hoveredGame === game.id ? 'hovered' : ''}`}
            onMouseEnter={() => setHoveredGame(game.id)}
            onMouseLeave={() => setHoveredGame(null)}
            onClick={() => handleGameSelect(game.id)}
          >
            <div className="card-content">
              <div className="card-header">
                <div className="game-icon">
                  {game.id === 'tictactoe' ? '⭕' : '♛'}
                </div>
                <div className="arrow">→</div>
              </div>

              <div className="title-section">
                <h2 className="game-title">{game.title}</h2>
                <p className="game-subtitle">{game.subtitle}</p>
              </div>

              <p className="game-description">{game.description}</p>

              <div className="game-info">
                <span>👥 1-2 Players</span>
                <span>🤖 {game.difficulty}</span>
              </div>

              <div className="features-section">
                <h4>Key Features:</h4>
                <ul className="features-list">
                  {game.features.map((feature, index) => (
                    <li key={index}>• {feature}</li>
                  ))}
                </ul>
              </div>

              <button className="play-button">
                Play Now →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="footer">
        <p>Powered by Advanced AI • Made with ❤️ for Board Game Enthusiasts</p>
      </div>

      <style jsx>{`
        .game-menu {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 2rem;
        }

        .header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .icon-box {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .main-title {
          font-size: 3rem;
          font-weight: bold;
          margin: 1rem 0;
          background: linear-gradient(135deg, #fff, #64b5f6, #ba68c8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          font-size: 1.2rem;
          color: #ccc;
          margin-bottom: 1.5rem;
        }

        .features {
          display: flex;
          justify-content: center;
          gap: 2rem;
          font-size: 0.9rem;
          color: #aaa;
        }

        .games-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          max-width: 1000px;
          margin: 0 auto;
        }

        .game-card {
          cursor: pointer;
          transition: transform 0.3s ease;
          height: 100%;
        }

        .game-card:hover {
          transform: scale(1.03) translateY(-5px);
        }

        .game-card .card-content {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 1rem;
          padding: 2rem;
          height: 100%;
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .game-card.tictactoe .card-content {
          border-color: rgba(33, 150, 243, 0.3);
        }

        .game-card.chess .card-content {
          border-color: rgba(255, 193, 7, 0.3);
        }

        .game-card.hovered .card-content {
          background: rgba(255, 255, 255, 0.15);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .game-icon {
          font-size: 2rem;
          padding: 0.5rem;
          border-radius: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
        }

        .tictactoe .game-icon {
          background: rgba(33, 150, 243, 0.2);
        }

        .chess .game-icon {
          background: rgba(255, 193, 7, 0.2);
        }

        .arrow {
          font-size: 1.5rem;
          opacity: 0;
          transition: all 0.3s ease;
        }

        .game-card.hovered .arrow {
          opacity: 1;
          transform: translateX(5px);
        }

        .title-section {
          margin-bottom: 1rem;
        }

        .game-title {
          font-size: 1.8rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }

        .tictactoe .game-title {
          color: #2196f3;
        }

        .chess .game-title {
          color: #ffc107;
        }

        .game-subtitle {
          color: #ddd;
          font-size: 1.1rem;
        }

        .game-description {
          color: #aaa;
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }

        .game-info {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
          color: #ccc;
        }

        .features-section {
          flex: 1;
          margin-bottom: 1.5rem;
        }

        .features-section h4 {
          font-size: 0.9rem;
          color: #ddd;
          margin-bottom: 0.8rem;
        }

        .features-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .features-list li {
          color: #aaa;
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
          transition: transform 0.2s ease;
        }

        .game-card.hovered .features-list li {
          transform: translateX(5px);
        }

        .play-button {
          width: 100%;
          padding: 1rem;
          border-radius: 0.8rem;
          font-weight: 600;
          color: white;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s ease;
          opacity: 0.8;
        }

        .tictactoe .play-button {
          background: linear-gradient(135deg, #2196f3, #03a9f4);
        }

        .chess .play-button {
          background: linear-gradient(135deg, #ffc107, #ff9800);
        }

        .game-card.hovered .play-button {
          opacity: 1;
          transform: scale(1.02);
        }

        .play-button:hover {
          transform: scale(1.05);
        }

        .footer {
          text-align: center;
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid #555;
          color: #aaa;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .game-menu {
            padding: 1rem;
          }
          
          .main-title {
            font-size: 2rem;
          }
          
          .features {
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .games-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Menu;