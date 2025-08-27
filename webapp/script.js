class LogisticsGame {
    constructor() {
        this.board = document.getElementById('game-board');
        this.selectedRobotElement = document.getElementById('selected-robot');
        this.batteryElement = document.getElementById('battery-level');
        this.movesElement = document.getElementById('moves');
        this.winMessage = document.getElementById('win-message');
        this.finalMoves = document.getElementById('final-moves');
        
        this.rows = 10; // Уменьшили до 10
        this.cols = 10; // Уменьшили до 10
        this.selectedRobot = null;
        this.robots = [];
        this.chargingStations = [];
        this.loadingStations = [];
        this.obstacles = [];
        this.moves = 0;
        this.isMoving = false;
        
        this.init();
    }

    init() {
        this.createBoard();
        this.setupGame();
        this.setupEventListeners();
    }

    createBoard() {
        this.board.innerHTML = '';
        this.board.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        this.board.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell empty';
                cell.dataset.row = row;
                cell.dataset.col = col;
                this.board.appendChild(cell);
            }
        }
    }

    setupGame() {
        // Поле старта (синее) - верхний левый угол 2x2
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 2; col++) {
                const cell = this.getCell(row, col);
                cell.className = 'cell start';
            }
        }

        // Поле финиша (зеленое) - верхний правый угол 2x2
        for (let row = 0; row < 2; row++) {
            for (let col = 8; col < 10; col++) {
                const cell = this.getCell(row, col);
                cell.className = 'cell finish';
                cell.textContent = Math.floor(Math.random() * 4) + 1; // 4 робота
            }
        }

        // Станции зарядки и погрузки
        this.placeStations();
        
        // Препятствия (5 столбов)
        this.placeObstacles();
        
        // Роботы (4 робота для 2x2 старта)
        this.createRobots();
    }

    placeStations() {
        const bottomRow = this.rows - 1;
        
        // 2 станции зарядки
        this.chargingStations = [
            { row: bottomRow, col: 2 },
            { row: bottomRow, col: 7 }
        ];
        
        // 2 станции погрузки
        this.loadingStations = [
            { row: bottomRow, col: 4 },
            { row: bottomRow, col: 5 }
        ];
        
        this.chargingStations.forEach(station => {
            const cell = this.getCell(station.row, station.col);
            cell.className = 'cell charging';
            cell.textContent = '⚡';
        });
        
        this.loadingStations.forEach(station => {
            const cell = this.getCell(station.row, station.col);
            cell.className = 'cell loading';
            cell.textContent = '📦';
        });
    }

    placeObstacles() {
        const obstacleRow = this.rows - 2; // Предпоследний ряд
        
        // Запрещенные колонки (где станции)
        const forbiddenCols = new Set();
        this.chargingStations.forEach(station => forbiddenCols.add(station.col));
        this.loadingStations.forEach(station => forbiddenCols.add(station.col));
        
        // Доступные колонки для препятствий
        const availableCols = [];
        for (let col = 0; col < this.cols; col++) {
            if (!forbiddenCols.has(col)) {
                availableCols.push(col);
            }
        }
        
        // Выбираем 5 случайных колонок из доступных
        this.shuffleArray(availableCols);
        this.obstacles = availableCols.slice(0, 5).map(col => ({
            row: obstacleRow,
            col: col
        }));
        
        // Размещаем препятствия
        this.obstacles.forEach(obs => {
            const cell = this.getCell(obs.row, obs.col);
            cell.className = 'cell obstacle';
            cell.textContent = '🚧';
        });
    }

    createRobots() {
        const numbers = [1, 2, 3, 4]; // 4 робота
        this.shuffleArray(numbers);
        
        let robotIndex = 0;
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 2; col++) {
                if (robotIndex >= numbers.length) break;
                
                const number = numbers[robotIndex];
                const battery = Math.floor(Math.random() * 101);
                
                const robot = {
                    number: number,
                    row: row,
                    col: col,
                    battery: battery,
                    atCharging: false,
                    atLoading: false,
                    atFinish: false
                };
                
                this.robots.push(robot);
                
                const cell = this.getCell(row, col);
                cell.className = 'cell robot';
                cell.textContent = number;
                this.updateBatteryDisplay(cell, battery);
                
                robotIndex++;
            }
        }
    }

    updateBatteryDisplay(cell, battery) {
        const oldBattery = cell.querySelector('.battery');
        if (oldBattery) oldBattery.remove();
        
        const batteryDiv = document.createElement('div');
        batteryDiv.className = 'battery';
        
        const batteryLevel = document.createElement('div');
        batteryLevel.className = 'battery-level';
        batteryLevel.style.height = `${battery}%`;
        
        if (battery <= 10) batteryLevel.className += ' battery-red';
        else if (battery <= 25) batteryLevel.className += ' battery-pink';
        else if (battery <= 50) batteryLevel.className += ' battery-orange';
        else if (battery <= 75) batteryLevel.className += ' battery-yellow';
        else batteryLevel.className += ' battery-green';
        
        batteryDiv.appendChild(batteryLevel);
        cell.appendChild(batteryDiv);
    }

    getCell(row, col) {
        return this.board.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    setupEventListeners() {
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        
        this.board.addEventListener('click', (e) => {
            if (this.isMoving) return;
            
            const cell = e.target.closest('.cell');
            if (!cell) return;
            
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            this.handleCellClick(row, col, cell);
        });
    }

    handleCellClick(row, col, cell) {
        console.log('Click on:', row, col, cell.className);
        
        // Если кликнули на робота - выбираем его
        if (cell.classList.contains('robot')) {
            this.selectRobot(row, col);
            return;
        }
        
        // Если робот выбран и кликнули на доступную клетку - двигаем
        if (this.selectedRobot && this.canMoveTo(row, col)) {
            this.moveRobotTo(this.selectedRobot, row, col);
        }
    }

    selectRobot(row, col) {
        const robot = this.robots.find(r => r.row === row && r.col === col);
        if (!robot) return;
        
        this.selectedRobot = robot;
        this.selectedRobotElement.textContent = `Выбрано: Робот ${robot.number}`;
        this.batteryElement.textContent = `Заряд: ${robot.battery}%`;
        
        this.highlightTargets(robot);
    }

    highlightTargets(robot) {
        this.resetHighlights();
        
        // Подсвечиваем все доступные для движения клетки
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.canMoveTo(r, c)) {
                    const cell = this.getCell(r, c);
                    cell.style.boxShadow = '0 0 5px blue';
                }
            }
        }
        
        // Особое подсвечивание целей
        this.loadingStations.forEach(station => {
            const cell = this.getCell(station.row, station.col);
            cell.style.boxShadow = '0 0 10px purple';
        });
        
        if (robot.battery < 25) {
            this.chargingStations.forEach(station => {
                const cell = this.getCell(station.row, station.col);
                cell.style.boxShadow = '0 0 10px orange';
            });
        }
        
        // Подсвечиваем соответствующий гараж
        for (let r = 0; r < 2; r++) {
            for (let c = 8; c < 10; c++) {
                const cell = this.getCell(r, c);
                if (parseInt(cell.textContent) === robot.number) {
                    cell.style.boxShadow = '0 0 10px green';
                    break;
                }
            }
        }
    }

    resetHighlights() {
        const cells = this.board.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.style.boxShadow = '';
        });
    }

    canMoveTo(row, col) {
        const cell = this.getCell(row, col);
        
        // Нельзя двигаться на препятствие или другого робота
        if (cell.classList.contains('obstacle') || 
            cell.classList.contains('robot')) {
            return false;
        }
        
        return true;
    }

    async moveRobotTo(robot, targetRow, targetCol) {
        if (this.isMoving) return;
        this.isMoving = true;
        
        console.log('Moving robot', robot.number, 'to', targetRow, targetCol);

        // Анимация перемещения
        await this.animateMovement(robot, targetRow, targetCol);
        
        // Обновляем позицию робота
        this.updateRobotPosition(robot, targetRow, targetCol);
        
        this.moves++;
        this.movesElement.textContent = `Ходы: ${this.moves}`;
        
        // Проверяем условия победы
        if (this.checkWinCondition()) {
            this.endGame();
        }
        
        this.isMoving = false;
        this.selectedRobot = null;
        this.selectedRobotElement.textContent = 'Выбрано: нет';
        this.resetHighlights();
    }

    async animateMovement(robot, targetRow, targetCol) {
        const startCell = this.getCell(robot.row, robot.col);
        const targetCell = this.getCell(targetRow, targetCol);
        
        // Добавляем анимацию
        startCell.classList.add('moving');
        targetCell.classList.add('path');
        
        // Ждем немного для анимации
        await this.delay(300);
        
        // Убираем анимацию
        startCell.classList.remove('moving');
        targetCell.classList.remove('path');
    }

    updateRobotPosition(robot, targetRow, targetCol) {
        // Очищаем старую клетку
        const oldCell = this.getCell(robot.row, robot.col);
        oldCell.className = 'cell empty';
        oldCell.textContent = '';
        
        // Обновляем позицию робота
        const oldRow = robot.row;
        const oldCol = robot.col;
        robot.row = targetRow;
        robot.col = targetCol;
        robot.battery = Math.max(0, robot.battery - 2);
        
        console.log('Robot moved from', oldRow, oldCol, 'to', targetRow, targetCol);
        console.log('Battery now:', robot.battery);
        
        // Обновляем новую клетку
        const newCell = this.getCell(targetRow, targetCol);
        newCell.className = 'cell robot';
        newCell.textContent = robot.number;
        this.updateBatteryDisplay(newCell, robot.battery);
        
        // Проверяем специальные клетки
        this.checkSpecialCells(robot);
    }

    checkSpecialCells(robot) {
        // Проверка на станции зарядки
        this.chargingStations.forEach(station => {
            if (robot.row === station.row && robot.col === station.col) {
                console.log('Robot', robot.number, 'at charging station');
                robot.atCharging = true;
                robot.battery = 100;
                this.updateBatteryDisplay(this.getCell(robot.row, robot.col), robot.battery);
            }
        });
        
        // Проверка на станции погрузки
        this.loadingStations.forEach(station => {
            if (robot.row === station.row && robot.col === station.col) {
                console.log('Robot', robot.number, 'at loading station');
                robot.atLoading = true;
            }
        });
        
        // Проверка на финиш
        for (let r = 0; r < 2; r++) {
            for (let c = 8; c < 10; c++) {
                const cell = this.getCell(r, c);
                if (parseInt(cell.textContent) === robot.number && 
                    robot.row === r && robot.col === c) {
                    console.log('Robot', robot.number, 'at finish');
                    robot.atFinish = true;
                }
            }
        }
    }

    checkWinCondition() {
        const allFinished = this.robots.every(robot => robot.atFinish);
        console.log('Win condition check:', allFinished);
        return allFinished;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    endGame() {
        console.log('Game finished!');
        this.winMessage.style.display = 'block';
        this.finalMoves.textContent = this.moves;
        
        if (window.Telegram && window.Telegram.WebApp) {
            const results = {
                moves: this.moves,
                game: 'logistics-robots',
                win: true
            };
            window.Telegram.WebApp.sendData(JSON.stringify(results));
        }
    }

    resetGame() {
        this.selectedRobot = null;
        this.robots = [];
        this.moves = 0;
        this.isMoving = false;
        
        this.selectedRobotElement.textContent = 'Выбрано: нет';
        this.batteryElement.textContent = 'Заряд: -';
        this.movesElement.textContent = 'Ходы: 0';
        this.winMessage.style.display = 'none';
        
        this.createBoard();
        this.setupGame();
        this.resetHighlights();
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

function shareResults() {
    const moves = document.getElementById('final-moves').textContent;
    
    if (window.Telegram && window.Telegram.WebApp) {
        const message = `🎯 Я завершил логистическую миссию за ${moves} ходов!`;
        window.Telegram.WebApp.sendData(message);
    }
}

// Запуск игры
document.addEventListener('DOMContentLoaded', () => {
    new LogisticsGame();
});
