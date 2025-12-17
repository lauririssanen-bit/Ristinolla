const X_CLASS = 'x';
const O_CLASS = 'o';
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

const cellElements = document.querySelectorAll('[data-cell]');
const board = document.getElementById('board');
const winningMessageElement = document.getElementById('winningModal');
const winningMessageTextElement = document.getElementById('winningMessageText');
const restartButton = document.getElementById('restartButton');
const newGameButton = document.getElementById('newGameButton');
const statusElement = document.getElementById('status');
const scoreXElement = document.getElementById('scoreX');
const scoreOElement = document.getElementById('scoreO');

let circleTurn; // false = X (Human), true = O (AI)
let scores = { x: 0, o: 0 };
let isAiThinking = false;

startGame();

restartButton.addEventListener('click', startGame);
newGameButton.addEventListener('click', startGame);

function startGame() {
    circleTurn = false;
    isAiThinking = false;
    cellElements.forEach(cell => {
        cell.classList.remove(X_CLASS);
        cell.classList.remove(O_CLASS);
        cell.removeEventListener('click', handleClick);
        cell.addEventListener('click', handleClick, { once: true });
    });
    setBoardHoverClass();
    winningMessageElement.classList.remove('show');
    updateStatus();
}

function handleClick(e) {
    // Estetään klikkaukset jos AI miettii tai on AI:n vuoro
    if (isAiThinking || circleTurn) return;

    const cell = e.target;
    // Turvatarkistus: jos solu on jo pelattu
    if (cell.classList.contains(X_CLASS) || cell.classList.contains(O_CLASS)) {
        return;
    }

    // Pelaajan (X) siirto
    placeMark(cell, X_CLASS);

    if (checkWin(X_CLASS)) {
        endGame(false);
    } else if (isDraw()) {
        endGame(true);
    } else {
        swapTurns();
        setBoardHoverClass();
        updateStatus();

        // Käynnistä AI:n vuoro viiveellä
        isAiThinking = true;
        setTimeout(makeAiMove, 600);
    }
}

function makeAiMove() {
    if (!circleTurn) return; // Varmistus

    const bestMoveIndex = minimax(getBoardState(), O_CLASS).index;
    const cell = cellElements[bestMoveIndex];

    placeMark(cell, O_CLASS);
    // Koska handleClickissä listener on {once: true}, meidän täytyy poistaa se manuaalisesti
    // jos AI täyttää ruudun, jotta ihminen ei voi klikata sitä myöhemmin (vaikka logiikka estääkin sen).
    cell.removeEventListener('click', handleClick);

    if (checkWin(O_CLASS)) {
        endGame(false);
    } else if (isDraw()) {
        endGame(true);
    } else {
        swapTurns();
        setBoardHoverClass();
        updateStatus();
    }
    isAiThinking = false;
}

// --- Minimax AI Logic ---

function getBoardState() {
    return Array.from(cellElements).map(cell => {
        if (cell.classList.contains(X_CLASS)) return X_CLASS;
        if (cell.classList.contains(O_CLASS)) return O_CLASS;
        return null; // Tyhjä
    });
}

function minimax(newBoard, player) {
    // Vapaat ruudut indekseinä
    const availSpots = newBoard.map((val, idx) => val === null ? idx : null).filter(val => val !== null);

    // Tarkista terminaalitilat (voitto/häviö/tasapeli)
    if (checkWinState(newBoard, X_CLASS)) {
        return { score: -10 };
    } else if (checkWinState(newBoard, O_CLASS)) {
        return { score: 10 };
    } else if (availSpots.length === 0) {
        return { score: 0 };
    }

    const moves = [];

    for (let i = 0; i < availSpots.length; i++) {
        const move = {};
        move.index = availSpots[i];

        // Aseta tilapäinen siirto lautaan
        newBoard[availSpots[i]] = player;

        if (player === O_CLASS) {
            const result = minimax(newBoard, X_CLASS);
            move.score = result.score;
        } else {
            const result = minimax(newBoard, O_CLASS);
            move.score = result.score;
        }

        // Peruuta siirto
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

// Apufunktio minimaxille joka tarkistaa voiton taulukkomuotoisesta laudasta
function checkWinState(board, player) {
    return WINNING_COMBINATIONS.some(combination => {
        return combination.every(index => {
            return board[index] === player;
        });
    });
}

// --- End AI Logic ---

function endGame(draw) {
    isAiThinking = false;
    if (draw) {
        winningMessageTextElement.innerText = 'Tasapeli!';
    } else {
        const winner = circleTurn ? "O" : "X";
        const winnerText = circleTurn ? "Tekoäly (O)" : "Sinä (X)";
        winningMessageTextElement.innerText = `${winnerText} Voittaa!`;
        updateScore(circleTurn ? 'o' : 'x');
    }
    winningMessageElement.classList.add('show');
}

function isDraw() {
    return [...cellElements].every(cell => {
        return cell.classList.contains(X_CLASS) || cell.classList.contains(O_CLASS);
    });
}

function placeMark(cell, currentClass) {
    cell.classList.add(currentClass);
}

function swapTurns() {
    circleTurn = !circleTurn;
}

function setBoardHoverClass() {
    board.classList.remove(X_CLASS);
    board.classList.remove(O_CLASS);
    // Näytetään hover-efekti vain ihmisen vuorolla
    if (!circleTurn && !isAiThinking) {
        board.classList.add(X_CLASS);
    }
}

function updateStatus() {
    if (isAiThinking || circleTurn) {
        statusElement.innerHTML = `Vuoro: <span class="player-o">Tekoäly miettii...</span>`;
    } else {
        statusElement.innerHTML = `Vuoro: <span class="player-x">Sinä (X)</span>`;
    }
}

function updateScore(winner) {
    scores[winner]++;
    scoreXElement.innerText = scores.x;
    scoreOElement.innerText = scores.o;

    // Animaatioefekti pisteiden päivitykselle
    const scoreEl = winner === 'x' ? scoreXElement : scoreOElement;
    scoreEl.style.transform = "scale(1.5)";
    setTimeout(() => {
        scoreEl.style.transform = "scale(1)";
    }, 200);
}

function checkWin(currentClass) {
    return WINNING_COMBINATIONS.some(combination => {
        return combination.every(index => {
            return cellElements[index].classList.contains(currentClass);
        });
    });
}
