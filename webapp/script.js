class LogisticsGame {
    constructor() {
        this.board = document.getElementById('game-board');
        this.selectedRobotElement = document.getElementById('selected-robot');
        this.batteryElement = document.getElementById('battery-level');
        this.movesElement = document.getElementById('moves');
        this.winMessage = document.getElementById('win-message');
        this.finalMoves = document.getElementById('final-moves');
        
        this.rows = 10;
        this.cols = 10;
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
        // Поле старта (синее) - верхний левый угол 2x5
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 5; col++) {
                const cell = this.getCell(row, col);
                cell.className = 'cell start';
            }
        }

        // Поле финиша (зеленое) - верхний правый угол 2x5
        for (let row = 0; row < 2; row++) {
            for (let col = 5; col < 10; col++) {
                const cell = this.getCell(row, col);
                cell.className = 'cell finish';
                cell.textContent = Math.floor(Math.random() * 10) + 1;
            }
        }

        // Станции зарядки и погрузки
        this.placeStations();
        
        // Препятствия (5 столбов по всему полю)
        this.placeObstacles();
        
        // Роботы (10 штук)
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
        // Создаем список всех возможных клеток
        const allCells = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                // Исключаем старт, финиш и станции
                const cell = this.getCell(row, col);
                if (!cell.classList.contains('start') && 
                    !cell.classList.contains('finish') &&
                    !cell.classList.contains('charging') &&
                    !cell.classList.contains('loading')) {
                    allCells.push({ row, col });
                }
            }
        }
        
        // Выбираем 5 случайных клеток для препятствий
        this.shuffleArray(allCells);
        this.obstacles = allCells.slice(0, 5);
        
        // Размещаем препятствия
        this.obstacles.forEach(obs => {
            const cell = this.getCell(obs.row, obs.col);
            cell.className = 'cell obstacle';
            cell.textContent = '🚧';
        });
    }

    createRobots() {
        const numbers = Array.from({length: 10}, (_, i) => i + 1);
        this.shuffleArray(numbers);
        
        let robotIndex = 0;
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 5; col++) {
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
                    atFinish: false,
                    path: [] // Маршрут движения
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
        // Если кликнули на робота - выбираем его
        if (cell.classList.contains('robot')) {
            this.selectRobot(row, col);
            return;
        }
        
        // Если робот выбран и кликнули на доступную клетку - строим маршрут
        if (this.selectedRobot && this.canMoveTo(row, col)) {
            this.buildPath(this.selectedRobot, row, col);
        }
    }

    selectRobot(row, col) {
        const robot = this.robots.find(r => r.row === row && r.col === col);
        if (!robot) return;
        
        this.selectedRobot = robot;
        this.selectedRobotElement.textContent = `Выбрано: Робот ${robot.number}`;
        this.batteryElement.textContent = `Заряд: ${robot.battery}%`;
        
        this.highlightAvailableMoves(robot);
    }

    highlightAvailableMoves(robot) {
        this.resetHighlights();
        
        // Подсвечиваем все доступные для движения клетки
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.canMoveTo(r, c) && this.isStraightLine(robot.row, robot.col, r, c)) {
                    const cell = this.getCell(r, c);
                    cell.style.boxShadow = '0 0 8px blue';
                }
            }
        }
        
        // Особое подсвечивание целей
        this.loadingStations.forEach(station => {
            const cell = this.getCell(station.row, station.col);
            cell.style.boxShadow = '0 0 12px purple';
        });
        
        if (robot.battery < 25) {
            this.chargingStations.forEach(station => {
                const cell = this.getCell(station.row, station.col);
                cell.style.boxShadow = '0 0 12px orange';
            });
        }
        
        // Подсвечиваем соответствующий гараж
        for (let r = 0; r < 2; r++) {
            for (let c = 5; c < 10; c++) {
                const cell = this.getCell(r, c);
                if (parseInt(cell.textContent) === robot.number) {
                    cell.style.boxShadow = '0 0 12px green';
                    break;
                }
            }
        }
    }

    isStraightLine(startRow, startCol, endRow, endCol) {
        return startRow === endRow || startCol === endCol;
    }

    resetHighlights() {
        const cells = this.board.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.style.boxShadow = '';
        });
    }

    canMoveTo(row, col) {
        const cell = this.getCell(row, col);
        
        // Нельзя двигаться на препятствие, другого робота или станции
        if (cell.classList.contains('obstacle') || 
            cell.classList.contains('robot') ||
            cell.classList.contains('charging') ||
            cell.classList.contains('loading')) {
            return false;
        }
        
        return true;
    }

    buildPath(robot, targetRow, targetCol) {
        if (!this.isStraightLine(robot.row, robot.col, targetRow, targetCol)) {
            return; // Только прямые линии
        }

        // Очищаем старый маршрут
        robot.path = [];
        
        // Строим прямую линию
        const rowStep = targetRow > robot.row ? 1 : targetRow < robot.row ? -1 : 0;
        const colStep = targetCol > robot.col ? 1 : targetCol < robot.col ? -1 : 0;
        
        let currentRow = robot.row + rowStep;
        let currentCol = robot.col + colStep;
        
        while (currentRow !== targetRow || currentCol !== targetCol) {
            if (!this.canMoveTo(currentRow, currentCol)) {
                return; // Путь заблокирован
            }
            
            robot.path.push({ row: currentRow, col: currentCol });
            
            currentRow += rowStep;
            currentCol += colStep;
        }
        
        // Добавляем конечную точку
        robot.path.push({ row: targetRow, col: targetCol });
        
        // Запускаем движение
        this.moveRobotAlongPath(robot);
    }

    async moveRobotAlongPath(robot) {
        if (this.isMoving || robot.path.length === 0) return;
        this.isMoving = true;
        
        for (const point of robot.path) {
            await this.moveRobotToPoint(robot, point.row, point.col);
            
            // Проверяем условия после каждого шага
            this.checkSpecialCells(robot);
            
            if (this.checkWinCondition()) {
                this.endGame();
                break;
            }
        }
        
        this.isMoving = false;
        this.selectedRobot = null;
        this.selectedRobotElement.textContent = 'Выбрано: нет';
        this.resetHighlights();
        robot.path = []; // Очищаем маршрут
    }

    async moveRobotToPoint(robot, targetRow, targetCol) {
        // Анимация перемещения
        await this.animateMovement(robot, targetRow, targetCol);
        
        // Обновляем позицию робота
        this.updateRobotPosition(robot, targetRow, targetCol);
        
        this.moves++;
        this.movesElement.textContent = `Ходы: ${this.moves}`;
    }

    async animateMovement(robot, targetRow, targetCol) {
        const startCell = this.getCell(robot.row, robot.col);
        const targetCell = this.getCell(targetRow, targetCol);
        
        // Плавная анимация
        startCell.classList.add('moving');
        
        // Ждем для анимации
        await this.delay(200);
        
        startCell.classList.remove('moving');
    }

    updateRobotPosition(robot, targetRow, targetCol) {
        // Очищаем старую клетку
        const oldCell = this.getCell(robot.row, robot.col);
        oldCell.className = 'cell empty';
        oldCell.textContent = '';
        
        // Обновляем позицию робота
        robot.row = targetRow;
        robot.col = targetCol;
        robot.battery = Math.max(0, robot.battery - 2);
        
        // Обновляем новую клетку
        const newCell = this.getCell(targetRow, targetCol);
        newCell.className = 'cell robot';
        newCell.textContent = robot.number;
        this.updateBatteryDisplay(newCell, robot.battery);
    }

    checkSpecialCells(robot) {
        // Проверка на станции зарядки (стоит перед станцией)
        this.chargingStations.forEach(station => {
            const inFront = (robot.row === station.row - 1 && robot.col === station.col);
            if (inFront) {
                robot.atCharging = true;
                robot.battery = 100;
                this.updateBatteryDisplay(this.getCell(robot.row, robot.col), robot.battery);
            }
        });
        
        // Проверка на станции погрузки (стоит перед станцией)
        this.loadingStations.forEach(station => {
            const inFront = (robot.row === station.row - 1 && robot.col === station.col);
            if (inFront) {
                robot.atLoading = true;
            }
        });
        
        // Проверка на финиш (стоит в гараже)
        for (let r = 0; r < 2; r++) {
            for (let c = 5; c < 10; c++) {
                const cell = this.getCell(r, c);
                if (parseInt(cell.textContent) === robot.number && 
                    robot.row === r && robot.col === c) {
                    robot.atFinish = true;
                }
            }
        }
    }

    checkWinCondition() {
        return this.robots.every(robot => robot.atFinish);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    endGame() {
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
