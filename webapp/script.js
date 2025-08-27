class LogisticsGame {
    constructor() {
        this.board = document.getElementById('game-board');
        this.selectedRobotElement = document.getElementById('selected-robot');
        this.batteryElement = document.getElementById('battery-level');
        this.movesElement = document.getElementById('moves');
        this.winMessage = document.getElementById('win-message');
        this.finalMoves = document.getElementById('final-moves');
        
        this.rows = 20;
        this.cols = 10;
        this.selectedRobot = null;
        this.robots = [];
        this.chargingStations = [];
        this.loadingStations = [];
        this.obstacles = [];
        this.moves = 0;
        this.paths = new Map();
        
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
        // Поле старта (синее)
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 5; col++) {
                const cell = this.getCell(row, col);
                cell.className = 'cell start';
            }
        }

        // Поле финиша (зеленое)
        for (let row = 0; row < 2; row++) {
            for (let col = 5; col < 10; col++) {
                const cell = this.getCell(row, col);
                cell.className = 'cell finish';
                cell.textContent = Math.floor(Math.random() * 10) + 1;
            }
        }

        // Станции зарядки и погрузки
        this.placeStations();
        
        // Препятствия
        this.placeObstacles();
        
        // Роботы
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
        const bottomRow = this.rows - 2; // Предпоследний ряд
        
        // Размещаем 2 препятствия с минимальным расстоянием
        let col1 = Math.floor(Math.random() * 3) + 2;
        let col2 = col1 + 3 + Math.floor(Math.random() * 2);
        
        if (col2 >= this.cols) col2 = this.cols - 1;
        
        this.obstacles = [
            { row: bottomRow, col: col1 },
            { row: bottomRow, col: col2 }
        ];
        
        this.obstacles.forEach(obs => {
            const cell = this.getCell(obs.row, obs.col);
            cell.className = 'cell obstacle';
            cell.textContent = '🚧';
        });
    }

    createRobots() {
        const numbers = Array.from({length: 10}, (_, i) => i + 1);
        this.shuffleArray(numbers);
        
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 5; col++) {
                const number = numbers[row * 5 + col];
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
            }
        }
    }

    updateBatteryDisplay(cell, battery) {
        // Удаляем старую батарейку
        const oldBattery = cell.querySelector('.battery');
        if (oldBattery) oldBattery.remove();
        
        // Создаем новую батарейку
        const batteryDiv = document.createElement('div');
        batteryDiv.className = 'battery';
        
        const batteryLevel = document.createElement('div');
        batteryLevel.className = 'battery-level';
        batteryLevel.style.height = `${battery}%`;
        
        // Цвет в зависимости от уровня заряда
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
            const cell = e.target.closest('.cell');
            if (!cell) return;
            
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            this.handleCellClick(row, col, cell);
        });
    }

    handleCellClick(row, col, cell) {
        // Если кликнули на робота
        if (cell.classList.contains('robot')) {
            this.selectRobot(row, col);
            return;
        }
        
        // Если робот выбран и кликнули на пустую клетку
        if (this.selectedRobot && cell.classList.contains('empty')) {
            this.addToPath(row, col);
        }
    }

    selectRobot(row, col) {
        const robot = this.robots.find(r => r.row === row && r.col === col);
        if (!robot) return;
        
        this.selectedRobot = robot;
        this.selectedRobotElement.textContent = `Выбрано: Робот ${robot.number}`;
        this.batteryElement.textContent = `Заряд: ${robot.battery}%`;
        
        // Подсвечиваем доступные цели
        this.highlightTargets(robot);
    }

    highlightTargets(robot) {
        // Сбрасываем подсветку
        this.resetHighlights();
        
        // Подсвечиваем станцию погрузки
        this.loadingStations.forEach(station => {
            const cell = this.getCell(station.row, station.col);
            cell.style.boxShadow = '0 0 10px purple';
        });
        
        // Если заряд низкий, подсвечиваем зарядку
        if (robot.battery < 25) {
            this.chargingStations.forEach(station => {
                const cell = this.getCell(station.row, station.col);
                cell.style.boxShadow = '0 0 10px orange';
            });
        }
        
        // Подсвечиваем соответствующий гараж
        for (let r = 0; r < 2; r++) {
            for (let c = 5; c < 10; c++) {
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

    addToPath(row, col) {
        if (!this.selectedRobot) return;
        
        const robotId = `${this.selectedRobot.row}-${this.selectedRobot.col}`;
        if (!this.paths.has(robotId)) {
            this.paths.set(robotId, []);
        }
        
        const path = this.paths.get(robotId);
        path.push({ row, col });
        
        // Визуализируем путь
        this.visualizePath(robotId, path);
        
        this.moves++;
        this.movesElement.textContent = `Ходы: ${this.moves}`;
    }

    visualizePath(robotId, path) {
        // Очищаем старый путь
        this.clearPath(robotId);
        
        // Рисуем новый путь
        const [startRow, startCol] = robotId.split('-').map(Number);
        let currentRow = startRow;
        let currentCol = startCol;
        
        for (const point of path) {
            const cell = this.getCell(point.row, point.col);
            cell.classList.add('path');
            
            // Здесь можно добавить линии между точками
            currentRow = point.row;
            currentCol = point.col;
        }
    }

    clearPath(robotId) {
        const cells = this.board.querySelectorAll('.path');
        cells.forEach(cell => {
            cell.classList.remove('path');
        });
    }

    async moveRobots() {
        for (const [robotId, path] of this.paths) {
            const [startRow, startCol] = robotId.split('-').map(Number);
            const robot = this.robots.find(r => r.row === startRow && r.col === startCol);
            
            if (!robot) continue;
            
            for (const point of path) {
                await this.moveRobotTo(robot, point.row, point.col);
                
                // Проверяем условия победы
                if (this.checkWinCondition()) {
                    this.endGame();
                    return;
                }
            }
        }
    }

    async moveRobotTo(robot, targetRow, targetCol) {
        const cell = this.getCell(robot.row, robot.col);
        cell.classList.remove('robot');
        cell.textContent = '';
        
        robot.row = targetRow;
        robot.col = targetCol;
        robot.battery -= 2; // Расход заряда
        
        if (robot.battery < 0) robot.battery = 0;
        
        const newCell = this.getCell(targetRow, targetCol);
        newCell.className = 'cell robot';
        newCell.textContent = robot.number;
        this.updateBatteryDisplay(newCell, robot.battery);
        
        // Проверяем специальные клетки
        this.checkSpecialCells(robot);
        
        // Анимация движения
        newCell.classList.add('moving');
        await this.delay(300);
        newCell.classList.remove('moving');
    }

    checkSpecialCells(robot) {
        // Проверка на станции
        this.chargingStations.forEach(station => {
            if (robot.row === station.row && robot.col === station.col) {
                robot.atCharging = true;
                robot.battery = 100; // Полная зарядка
            }
        });
        
        this.loadingStations.forEach(station => {
            if (robot.row === station.row && robot.col === station.col) {
                robot.atLoading = true;
            }
        });
        
        // Проверка на финиш
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
        this.paths.clear();
        this.moves = 0;
        
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
