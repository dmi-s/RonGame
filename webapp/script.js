class Game15 {
    constructor() {
        this.board = document.getElementById('game-board');
        this.movesElement = document.getElementById('moves');
        this.timerElement = document.getElementById('timer');
        this.winMessage = document.getElementById('win-message');
        this.finalMoves = document.getElementById('final-moves');
        this.finalTime = document.getElementById('final-time');

        this.moves = 0;
        this.seconds = 0;
        this.timer = null;
        this.isGameStarted = false;

        this.init();
    }

    init() {
        this.createBoard();
        this.setupEventListeners();
        this.shuffle();
    }

    createBoard() {
        this.board.innerHTML = '';
        for (let i = 0; i < 16; i++) {
            const tile = document.createElement('div');
            tile.className = i === 15 ? 'tile empty' : 'tile';
            tile.textContent = i === 15 ? '' : i + 1;
            tile.dataset.index = i;
            this.board.appendChild(tile);
        }
    }

    setupEventListeners() {
        document.getElementById('shuffle-btn').addEventListener('click', () => this.shuffle());
        document.getElementById('new-game-btn').addEventListener('click', () => this.resetGame());

        this.board.addEventListener('click', (e) => {
            if (e.target.classList.contains('tile') && !e.target.classList.contains('empty')) {
                this.moveTile(e.target);
            }
        });
    }

    moveTile(tile) {
        if (!this.isGameStarted) {
            this.startGame();
        }

        const tileIndex = parseInt(tile.dataset.index);
        const emptyIndex = this.findEmptyIndex();

        if (this.isAdjacent(tileIndex, emptyIndex)) {
            this.swapTiles(tileIndex, emptyIndex);
            this.moves++;
            this.movesElement.textContent = `Ходы: ${this.moves}`;

            if (this.isSolved()) {
                this.endGame();
            }
        }
    }

    findEmptyIndex() {
        const tiles = this.board.children;
        for (let i = 0; i < tiles.length; i++) {
            if (tiles[i].classList.contains('empty')) {
                return i;
            }
        }
        return -1;
    }

    isAdjacent(index1, index2) {
        const row1 = Math.floor(index1 / 4);
        const col1 = index1 % 4;
        const row2 = Math.floor(index2 / 4);
        const col2 = index2 % 4;

        return (Math.abs(row1 - row2) === 1 && col1 === col2) ||
               (Math.abs(col1 - col2) === 1 && row1 === row2);
    }

    swapTiles(index1, index2) {
        const tiles = this.board.children;
        const temp = tiles[index1].textContent;
        const tempClass = tiles[index1].className;

        tiles[index1].textContent = tiles[index2].textContent;
        tiles[index1].className = tiles[index2].className;
        tiles[index1].dataset.index = index2;

        tiles[index2].textContent = temp;
        tiles[index2].className = tempClass;
        tiles[index2].dataset.index = index1;
    }

    shuffle() {
        this.resetGame();
        let shuffleMoves = 1000;

        const shuffleInterval = setInterval(() => {
            if (shuffleMoves <= 0) {
                clearInterval(shuffleInterval);
                return;
            }

            const emptyIndex = this.findEmptyIndex();
            const possibleMoves = [];
            const row = Math.floor(emptyIndex / 4);
            const col = emptyIndex % 4;

            // Проверяем возможные ходы
            if (row > 0) possibleMoves.push(emptyIndex - 4);
            if (row < 3) possibleMoves.push(emptyIndex + 4);
            if (col > 0) possibleMoves.push(emptyIndex - 1);
            if (col < 3) possibleMoves.push(emptyIndex + 1);

            // Случайный ход
            const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            this.swapTiles(emptyIndex, randomMove);

            shuffleMoves--;
        }, 10);
    }

    isSolved() {
        const tiles = this.board.children;
        for (let i = 0; i < 15; i++) {
            if (parseInt(tiles[i].textContent) !== i + 1) {
                return false;
            }
        }
        return true;
    }

    startGame() {
        this.isGameStarted = true;
        this.startTimer();
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.seconds++;
            const minutes = Math.floor(this.seconds / 60);
            const secs = this.seconds % 60;
            this.timerElement.textContent = `Время: ${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }, 1000);
    }

    endGame() {
        clearInterval(this.timer);
        this.isGameStarted = false;

        this.finalMoves.textContent = this.moves;
        this.finalTime.textContent = this.timerElement.textContent.replace('Время: ', '');
        this.winMessage.style.display = 'block';

        // Отправляем результаты в Telegram
        this.sendResultsToBot();
    }

    resetGame() {
        clearInterval(this.timer);
        this.moves = 0;
        this.seconds = 0;
        this.isGameStarted = false;

        this.movesElement.textContent = 'Ходы: 0';
        this.timerElement.textContent = 'Время: 00:00';
        this.winMessage.style.display = 'none';

        this.createBoard();
    }

    sendResultsToBot() {
        if (window.Telegram && window.Telegram.WebApp) {
            const results = {
                moves: this.moves,
                time: this.seconds,
                game: '15-puzzle'
            };

            window.Telegram.WebApp.sendData(JSON.stringify(results));
        }
    }
}

function shareResults() {
    const moves = document.getElementById('final-moves').textContent;
    const time = document.getElementById('final-time').textContent;

    if (window.Telegram && window.Telegram.WebApp) {
        const message = `🎉 Я собрал головоломку "Пятнашки" за ${moves} ходов и ${time} времени!`;
        window.Telegram.WebApp.sendData(message);
    }
}

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new Game15();
});