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
                cell.dataset.originalClass = 'start';
            }
        }

        // Поле финиша (зеленое) - верхний правый угол 2x5
        const garageNumbers = this.generateUniqueNumbers(10, 1, 10);
        let numberIndex = 0;
        
        for (let row = 0; row < 2; row++) {
            for (let col = 5; col < 10; col++) {
                const cell = this.getCell(row, col);
                cell.className = 'cell finish';
                cell.textContent = garageNumbers[numberIndex++];
                cell.dataset.garageNumber = cell.textContent;
                cell.dataset.originalClass = 'finish';
            }
        }

        // Станции зарядки и погрузки
        this.placeStations();
        
        // Препятствия (5 столбов)
        this.placeObstacles();
        
        // Роботы (10 штук)
        this.createRobots();
    }

    generateUniqueNumbers(count, min, max) {
        const numbers = new Set();
        while (numbers.size < count) {
            numbers.add(Math.floor(Math.random() * (max - min + 1)) + min);
        }
        return Array.from(numbers);
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
            cell.dataset.originalClass = 'charging';
        });
        
        this.loadingStations.forEach(station => {
            const cell = this.getCell(station.row, station.col);
            cell.className = 'cell loading';
            cell.textContent = '📦';
            cell.dataset.originalClass = 'loading';
        });
    }

    placeObstacles() {
        const availableRows = [4, 5, 6, 7]; // Только ряды 4-7
        const availableCells = [];
        
        for (let row of availableRows) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.getCell(row, col);
                if (!cell.classList.contains('charging') && 
                    !cell.classList.contains('loading')) {
                    availableCells.push({ row, col });
                }
            }
        }
        
        this.shuffleArray(availableCells);
        this.obstacles = [];
        
        // Добавляем 5 препятствий с минимальным расстоянием
        for (let i = 0; i < 5 && availableCells.length > 0; i++) {
            const obstacle = availableCells.shift();
            
            // Проверяем расстояние до других препятствий
            const tooClose = this.obstacles.some(obs => 
                Math.abs(obs.row - obstacle.row) <= 2 && 
                Math.abs(obs.col - obstacle.col) <= 2
            );
            
            if (!tooClose) {
                this.obstacles.push(obstacle);
                const cell = this.getCell(obstacle.row, obstacle.col);
                cell.className = 'cell obstacle';
                cell.textContent = '🚧';
                cell.dataset.originalClass = 'obstacle';
            }
        }
    }

    createRobots() {
        const robotNumbers = this.generateUniqueNumbers(10, 1, 10);
        let robotIndex = 0;
        
        // 3 робота с зарядом 25-40%
        for (let i = 0; i < 3; i++) {
            if (robotIndex >= robotNumbers.length) break;
            
            const row = Math.floor(i / 5);
            const col = i % 5;
            const number = robotNumbers[robotIndex];
            const battery = Math.floor(Math.random() * 16) + 25; // 25-40%
            
            this.createRobot(row, col, number, battery, false);
            robotIndex++;
        }
        
        // 7 роботов с зарядом 40-100%
        for (let i = 3; i < 10; i++) {
            if (robotIndex >= robotNumbers.length) break;
            
            const row = Math.floor(i / 5);
            const col = i % 5;
            const number = robotNumbers[robotIndex];
            const battery = Math.floor(Math.random() * 61) + 40; // 40-100%
            
            this.createRobot(row, col, number, battery, false);
            robotIndex++;
        }
    }

    createRobot(row, col, number, battery, hasPackage) {
        const robot = {
            number: number,
            row: row,
            col: col,
            battery: battery,
            hasPackage: hasPackage,
            atCharging: false,
            atLoading: false,
            atFinish: false,
            path: []
        };
        
        this.robots.push(robot);
        
        const cell = this.getCell(row, col);
        cell.className = 'cell robot';
        cell.textContent = number;
        this.updateBatteryDisplay(cell, battery);
        cell.dataset.originalClass = 'start';
        
        return robot;
    }

    updateBatteryDisplay(cell, battery) {
        const oldBattery = cell.querySelector('.battery');
        if (oldBattery) oldBattery.remove();
        
        if (battery > 0) {
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
        if (cell.classList.contains('robot')) {
            this.selectRobot(row, col);
            return;
        }
        
        if (this.selectedRobot) {
            this.addToPath(this.selectedRobot, row, col);
        }
    }

    selectRobot(row, col) {
        const robot = this.robots.find(r => r.row === row && r.col === col);
        if (!robot) return;
        
        this.selectedRobot = robot;
        this.selectedRobotElement.textContent = `Выбрано: Робот ${robot.number}`;
        this.batteryElement.textContent = `Заряд: ${robot.battery}%`;
        
        // Подсветка выбранного робота
        this.resetHighlights();
        const robotCell = this.getCell(robot.row, robot.col);
        robotCell.style.boxShadow = '0 0 15px yellow';
        robotCell.style.border = '2px solid black';
        
        this.highlightAvailableMoves(robot);
    }

    highlightAvailableMoves(robot) {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.canMoveTo(r, c) && 
                    this.isStraightLine(robot.row, robot.col, r, c) &&
                    this.isPathClear(robot.row, robot.col, r, c)) {
                    
                    const cell = this.getCell(r, c);
                    const isChargingStation = this.chargingStations.some(s => s.row === r && s.col === c);
                    const isLoadingStation = this.loadingStations.some(s => s.row === r && s.col === c);
                    const isGarageTarget = this.isGarageForRobot(robot, r, c);
                    
                    if (isChargingStation) {
                        cell.style.boxShadow = '0 0 15px orange';
                    } else if (isLoadingStation) {
                        cell.style.boxShadow = '0 0 15px purple';
                    } else if (isGarageTarget) {
                        cell.style.boxShadow = '0 0 15px green';
                    } else {
                        cell.style.boxShadow = '0 0 10px blue';
                    }
                }
            }
        }
    }

    isGarageForRobot(robot, row, col) {
        const cell = this.getCell(row, col);
        return cell.classList.contains('finish') && 
               parseInt(cell.dataset.garageNumber) === robot.number;
    }

    isStraightLine(startRow, startCol, endRow, endCol) {
        return startRow === endRow || startCol === endCol;
    }

    isPathClear(startRow, startCol, endRow, endCol) {
        const rowStep = endRow > startRow ? 1 : endRow < startRow ? -1 : 0;
        const colStep = endCol > startCol ? 1 : endCol < startCol ? -1 : 0;
        
        let currentRow = startRow + rowStep;
        let currentCol = startCol + colStep;
        
        while (currentRow !== endRow || currentCol !== endCol) {
            if (!this.canMoveTo(currentRow, currentCol)) {
                return false;
            }
            
            currentRow += rowStep;
            currentCol += colStep;
        }
        
        return this.canMoveTo(endRow, endCol);
    }

    resetHighlights() {
        const cells = this.board.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.style.boxShadow = '';
            cell.style.border = '';
        });
    }

    canMoveTo(row, col) {
        const cell = this.getCell(row, col);
        
        if (cell.classList.contains('obstacle') || 
            cell.classList.contains('robot')) {
            return false;
        }
        
        return true;
    }

    addToPath(robot, targetRow, targetCol) {
        if (!this.isStraightLine(robot.row, robot.col, targetRow, targetCol) ||
            !this.isPathClear(robot.row, robot.col, targetRow, targetCol)) {
            return;
        }

        robot.path.push({ row: targetRow, col: targetCol });
        this.visualizePath(robot);
        
        // Автоматически начинаем движение
        this.moveRobotAlongPath(robot);
    }

    visualizePath(robot) {
        this.clearPathVisualization();
        
        robot.path.forEach((point, index) => {
            const cell = this.getCell(point.row, point.col);
            cell.classList.add('path');
            cell.textContent = index + 1;
        });
    }

    clearPathVisualization() {
        const pathCells = this.board.querySelectorAll('.path');
        pathCells.forEach(cell => {
            cell.classList.remove('path');
            this.restoreCellAppearance(cell);
        });
    }

    restoreCellAppearance(cell) {
        const originalClass = cell.dataset.originalClass;
        if (originalClass) {
            cell.className = `cell ${originalClass}`;
            if (originalClass === 'finish') {
                cell.textContent = cell.dataset.garageNumber;
            } else if (originalClass === 'charging') {
                cell.textContent = '⚡';
            } else if (originalClass === 'loading') {
                cell.textContent = '📦';
            } else if (originalClass === 'obstacle') {
                cell.textContent = '🚧';
            } else if (originalClass === 'start') {
                cell.textContent = '';
            } else {
                cell.textContent = '';
            }
        } else {
            cell.className = 'cell empty';
            cell.textContent = '';
        }
    }

    async moveRobotAlongPath(robot) {
        if (this.isMoving || robot.path.length === 0) return;
        this.isMoving = true;
        
        while (robot.path.length > 0) {
            const point = robot.path.shift();
            await this.moveRobotToPoint(robot, point.row, point.col);
            
            this.checkSpecialCells(robot);
            
            if (this.checkWinCondition()) {
                this.endGame();
                break;
            }
            
            await this.delay(800); // Медленное движение
        }
        
        this.isMoving = false;
        this.clearPathVisualization();
        this.highlightAvailableMoves(robot);
    }

    async moveRobotToPoint(robot, targetRow, targetCol) {
        // Восстанавливаем старую клетку
        const oldCell = this.getCell(robot.row, robot.col);
        this.restoreCellAppearance(oldCell);
        
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
        
        // Создаем анимацию перемещения
        const ghost = document.createElement('div');
        ghost.className = 'ghost-robot';
        ghost.textContent = robot.number;
        ghost.style.position = 'absolute';
        ghost.style.left = `${startCell.offsetLeft}px`;
        ghost.style.top = `${startCell.offsetTop}px`;
        this.board.appendChild(ghost);
        
        // Анимация
        ghost.style.transition = 'all 0.8s ease';
        ghost.style.left = `${targetCell.offsetLeft}px`;
        ghost.style.top = `${targetCell.offsetTop}px`;
        
        await this.delay(800);
        ghost.remove();
    }

    updateRobotPosition(robot, targetRow, targetCol) {
        // Обновляем позицию робота
        robot.row = targetRow;
        robot.col = targetCol;
        
        // Уменьшаем заряд на 2% за клетку
        robot.battery = Math.max(0, robot.battery - 2);
        
        // Обновляем новую клетку
        const newCell = this.getCell(targetRow, targetCol);
        newCell.className = 'cell robot';
        
        // Отображаем иконку ящика если есть груз
        if (robot.hasPackage) {
            newCell.textContent = '📦' + robot.number;
        } else {
            newCell.textContent = robot.number;
        }
        
        this.updateBatteryDisplay(newCell, robot.battery);
        newCell.dataset.originalClass = this.getCell(targetRow, targetCol).dataset.originalClass || 'empty';
    }

    checkSpecialCells(robot) {
        const cell = this.getCell(robot.row, robot.col);
        
        // Проверка на станцию зарядки
        if (cell.classList.contains('charging')) {
            robot.atCharging = true;
            this.chargeRobot(robot);
        }
        
        // Проверка на станцию погрузки
        if (cell.classList.contains('loading')) {
            robot.atLoading = true;
            robot.hasPackage = true;
            const robotCell = this.getCell(robot.row, robot.col);
            robotCell.textContent = '📦' + robot.number;
        }
        
        // Проверка на финиш
        if (this.isGarageForRobot(robot, robot.row, robot.col)) {
            robot.atFinish = true;
        }
    }

    async chargeRobot(robot) {
        const cell = this.getCell(robot.row, robot.col);
        
        // Анимация зарядки
        for (let charge = robot.battery; charge <= 100; charge += 10) {
            robot.battery = Math.min(100, charge);
            this.updateBatteryDisplay(cell, robot.battery);
            await this.delay(1000); // 10% в секунду
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
