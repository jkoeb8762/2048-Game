console.log("The script is connected and running");

const gridSize = 4;
let gameState = {
    board: [],
    score: 0,
    gameOver: false,
    history: [], // This will store previous states
    maxHistoryLength: 1
};


// Initializes an empty board
function initializeBoard(size) {
    return new Array(size).fill(null).map(() => new Array(size).fill(0));
}

// Adds a new tile to a random empty spot on the board
function addRandomTile(board) {
    let emptyTiles = [];
    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
            if (board[row][col] === 0) {
                emptyTiles.push({ row, col });
            }
        }
    }
    if (emptyTiles.length > 0) {
        let { row, col } = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
        board[row][col] = Math.random() > 0.9 ? 4 : 2;
    }
}

// Transposes the board (swap rows and columns)
function transposeBoard(board) {
    return board[0].map((col, i) => board.map(row => row[i]));
}

// Reverses rows of the board
function reverseRows(board) {
    return board.map(row => row.slice().reverse());
}

// Processes a single row to the left direction
function processRow(row) {
    let compactedRow = row.filter(val => val !== 0);
    let newRow = [];
    let score = 0;
    for (let i = 0; i < compactedRow.length; i++) {
        if (compactedRow[i] === compactedRow[i + 1]) {
            let mergedValue = compactedRow[i] * 2;
            newRow.push(mergedValue);
            score += mergedValue;
            i++;
        } else {
            newRow.push(compactedRow[i]);
        }
    }
    while (newRow.length < gridSize) {
        newRow.push(0);
    }
    return { newRow, score };
}

// Generic move function for all directions
function move(direction) {
    saveCurrentState();
    let newBoard = [];
    let boardChanged = false;
    let totalScore = 0;

    if (direction === 'UP' || direction === 'DOWN') {
        gameState.board = transposeBoard(gameState.board);
    }
    if (direction === 'RIGHT' || direction === 'DOWN') {
        gameState.board = reverseRows(gameState.board);
    }

    gameState.board.forEach(row => {
        let result = processRow(row);
        newBoard.push(result.newRow);
        if (!row.every((value, index) => value === result.newRow[index])) {
            boardChanged = true;
        }
        totalScore += result.score;
    });

    if (direction === 'RIGHT' || direction === 'DOWN') {
        newBoard = reverseRows(newBoard);
    }
    if (direction === 'UP' || direction === 'DOWN') {
        newBoard = transposeBoard(newBoard);
    }

    gameState.board = newBoard;
    return { moved: boardChanged, score: totalScore };
}

function handleInput(event) {
    let result = null;
    if (gameState.gameOver) {
        console.log('Game is already over. Restart to play again.');
        return;
    }

    switch (event.key) {
        case 'ArrowLeft':
            result = move('LEFT');
            break;
        case 'ArrowRight':
            result = move('RIGHT');
            break;
        case 'ArrowUp':
            result = move('UP');
            break;
        case 'ArrowDown':
            result = move('DOWN');
            break;
    }

    if (result && result.moved) {
        addRandomTile(gameState.board);
        gameState.score += result.score;
        drawBoard();

        if (isGameOver()) {
            gameState.gameOver = true;
            console.log('Game Over!');
            let playerName = prompt("Game Over! Enter your name to record your score:", "Player");
            if (playerName) {
                sendScore(playerName, gameState.score)
                    .then(() => {
                        return updateLeaderboard();
                    })
                    .then(() => {
                        setupNewGame(); // Reset the game once the leaderboard is updated
                    })
                    .catch(error => {
                        console.error('Failed to update leaderboard:', error);
                        alert('Failed to update leaderboard. Starting new game.');
                        setupNewGame(); // Reset the game even if leaderboard update fails
                    });
            } else {
                setupNewGame(); // If player cancels the prompt, reset the game immediately
            }
        }
    }
}

let playerName = 'DefaultPlayer'; // Static definition

// Or dynamically ask for player name
if (!playerName) {
    playerName = prompt("Please enter your name", "DefaultPlayer");
}


document.addEventListener('DOMContentLoaded', () => {
    setupNewGame();
    updateLeaderboard();
    document.addEventListener('keydown', handleInput);
});

function setupNewGame() {
    gameState.board = initializeBoard(gridSize);
    gameState.score = 0;
    gameState.gameOver = false;
    gameState.history = [];
    addRandomTile(gameState.board);
    addRandomTile(gameState.board);
    drawBoard();
}

function drawBoard() {
    const container = document.getElementById('gameContainer');
    const scoreDisplay = document.getElementById('score');
    container.innerHTML = '';
    scoreDisplay.textContent = gameState.score;
    gameState.board.forEach((row, i) => {
        row.forEach((value, j) => {
            let tile = document.createElement('div');
            tile.className = 'tile';
            tile.textContent = value === 0 ? '' : value;
            tile.style.backgroundColor = getBackgroundColor(value);
            container.appendChild(tile);
        });
    });
}

function getBackgroundColor(value) {
    const colorMap = {
        0: "#cdc1b4",    // empty tile
        2: "#eee4da",    // lightest color for the starting tile
        4: "#ede0c8",
        8: "#f2b179",    // light orange
        16: "#f59563",   // orange
        32: "#f67c5f",   // darker orange
        64: "#f65e3b",   // deep orange
        128: "#edcf72",  // light yellow
        256: "#edcc61",  // yellow
        512: "#edc850",  // golden
        1024: "#edc53f", // gold
        2048: "#edc22e"  // deep gold
        // You can add more colors if needed for higher values
    };
    return colorMap[value] || "#cdc1b4"; // Default color for new and high values not specified
}


function isGameOver() {
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            if (gameState.board[i][j] === 0) return false; // There's an empty spot
            if (i < gridSize - 1 && gameState.board[i][j] === gameState.board[i + 1][j]) return false; // Vertical move possible
            if (j < gridSize - 1 && gameState.board[i][j] === gameState.board[i][j + 1]) return false; // Horizontal move possible
        }
    }
    return true; // No moves left
}

function saveCurrentState() {
    if (gameState.history.length >= gameState.maxHistoryLength) {
        gameState.history.shift(); // Remove the oldest state if we exceed the history length
    }
    gameState.history.push({
        board: gameState.board.map(row => row.slice()), // Deep copy of the board
        score: gameState.score
    });
}

function undoMove() {
    if (gameState.history.length > 0) {
        const prevState = gameState.history.pop();
        gameState.board = prevState.board;
        gameState.score = prevState.score;
        gameState.gameOver = false; // Optionally reset game over status
        drawBoard(); // Redraw the board with the restored state
    } else {
        console.log("No moves to undo!");
    }
}
document.getElementById('undoButton').addEventListener('click', undoMove);

async function sendScore(name, score) {
    const response = await fetch('https://jkoeb8762-project1-da9dde41d410.herokuapp.com/scores', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, score })
    });
    if (!response.ok) {
        throw new Error('Failed to post score');
    }
    return response.json();  // Ensure the server responds with JSON
}

async function updateLeaderboard() {
    try {
        const response = await fetch('https://jkoeb8762-project1-da9dde41d410.herokuapp.com/scores');
        if (!response.ok) {
            throw new Error('Failed to fetch leaderboard');
        }
        const scores = await response.json();
        const leaderboard = document.getElementById('leaderboard');
        leaderboard.innerHTML = '';  // Clear previous entries
        scores.forEach((score, index) => {
            const entry = document.createElement('div');
            entry.textContent = `${index + 1}. ${score.name} - ${score.score}`;
            leaderboard.appendChild(entry);
        });
    } catch (error) {
        console.error('Error updating leaderboard:', error);
        const leaderboard = document.getElementById('leaderboard');
        leaderboard.innerHTML = 'Leaderboard is currently unavailable.';
    }
}

document.getElementById('restartButton').addEventListener('click', setupNewGame);

//Adding Mobile Support
let touchStartPos = null;
let touchEndPos = null;

function handleTouchStart(event) {
    touchStartPos = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY
    };
}

function handleTouchMove(event) {
    // Prevent scrolling when touching the game area
    event.preventDefault();
}

function handleTouchEnd(event) {
    if (!touchStartPos) {
        return;
    }

    touchEndPos = {
        x: event.changedTouches[0].clientX,
        y: event.changedTouches[0].clientY
    };

    const dx = touchEndPos.x - touchStartPos.x;
    const dy = touchEndPos.y - touchStartPos.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 10) { // threshold in pixels for swipe vs tap
        if (absDx > absDy) {
            if (dx > 0) {
                handleInput({ key: 'ArrowRight' });
            } else {
                handleInput({ key: 'ArrowLeft' });
            }
        } else {
            if (dy > 0) {
                handleInput({ key: 'ArrowDown' });
            } else {
                handleInput({ key: 'ArrowUp' });
            }
        }
    }

    touchStartPos = null;
}

document.addEventListener('touchstart', handleTouchStart, { passive: false });
document.addEventListener('touchmove', handleTouchMove, { passive: false });
document.addEventListener('touchend', handleTouchEnd, { passive: false });
