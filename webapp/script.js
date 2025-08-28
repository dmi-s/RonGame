class LogisticsGame {
    constructor() {
        this.board = document.getElementById('game-board');
        this.selectedRobotElement = document.getElementById('selected-robot');
        this.batteryElement = document.getElementById('battery-level');
        this.movesElement = document.getElementById('moves');
        this.timerElement = document.getElementById('timer');
        this.winMessage = document.getElementById('win-message');
        this.finalMoves = document.getElementById('final-moves');
        this.finalTime = document.getElementById('final-time');
        this.rows = 10;
        this.cols = 10;
        this.selectedRobot = null;
        this.robots = [];
        this.chargingStations = [];
        this.loadingStations = [];
        this.obstacles = [];
        this.moves = 0;
        this.gameStarted = false;
        this.startTime = 0;
        this.timerInterval = null;
        this.lockedCells = new Set(); // Занятые траектории
        this.init();
    }

    init() {
        this.createBoard();
        this.setupGame();
        this.setupEventListeners();
        this.updateScreenSize();
        window.addEventListener('resize', () => this.updateScreenSize());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.updateScreenSize(), 100);
        });
    }

    updateScreenSize() {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const board = this.board;
        if (isMobile) {
            const size = Math.min(window.innerWidth * 0.95, 320);
            board.style.width = `${size}px`;
            board.style.height = `${size}px`;
        } else {
            board.style.width = '320px';
            board.style.height = '320px';
        }
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
        // Стартовая зона 2x5
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 5; col++) {
                const cell = this.getCell(row, col);
                cell.className = 'cell start';
                cell.dataset.originalClass = 'start';
            }
        }
        // Зона выгрузки 2x5
        const garageNumbers = this.generateUniqueNumbers(10, 1, 10);
        let idx = 0;
        for (let row = 0; row < 2; row++) {
            for (let col = 5; col < 10; col++) {
                const cell = this.getCell(row, col);
                cell.className = 'cell finish';
                cell.textContent = garageNumbers[idx++];
                cell.dataset.garageNumber = cell.textContent;
                cell.dataset.originalClass = 'finish';
            }
        }
        // Станции и препятствия
        this.placeStationsAndObstacles();
        // Роботы
        this.createRobots();
        this.updateTimer();
    }

    placeStationsAndObstacles() {
        const stationRow = this.rows - 1;
        const stationTypes = ['charging', 'charging', 'loading', 'loading'];
        this.shuffleArray(stationTypes);
        this.chargingStations = [];
        this.loadingStations = [];
        this.obstacles = [];

        const availableCols = [1, 2, 3, 4, 5, 6, 7, 8];
        this.shuffleArray(availableCols);

        const placedStations = [];
        for (const type of stationTypes) {
            for (const col of availableCols) {
                if (placedStations.length === 0 || placedStations.every(p => Math.abs(p - col) > 1)) {
                    const cell = this.getCell(stationRow, col);
                    cell.className = `cell ${type}`;
                    cell.textContent = type === 'charging' ? '⚡' : '📦';
                    cell.dataset.originalClass = type;
                    if (type === 'charging') this.chargingStations.push({ row: stationRow, col });
                    else this.loadingStations.push({ row: stationRow, col });
                    placedStations.push(col);
                    break;
                }
            }
        }

        // Столбы в рядах 4, 5, 6
        const obstacleRows = [4, 5, 6];
        const allPossible = [];
        for (const row of obstacleRows) {
            for (let col = 1; col < this.cols - 1; col++) {
                const cell = this.getCell(row, col);
                if (!cell.classList.contains('charging') && !cell.classList.contains('loading')) {
                    allPossible.push({ row, col });
                }
            }
        }
        this.shuffleArray(allPossible);
        for (const obs of allPossible) {
            if (this.obstacles.length >= 8) break;
            if (this.canPlaceObstacle(obs.row, obs.col)) {
                this.obstacles.push(obs);
                const cell = this.getCell(obs.row, obs.col);
                cell.className = 'cell obstacle';
                cell.textContent = '🚧';
                cell.dataset.originalClass = 'obstacle';
            }
        }
    }

    canPlaceObstacle(row, col) {
        for (const obs of this.obstacles) {
            const dr = Math.abs(obs.row - row);
            const dc = Math.abs(obs.col - col);
            if (dr <= 1 && dc <= 1) return false;
        }
        return true;
    }

    createRobots() {
        const nums = this.generateUniqueNumbers(10, 1, 10);
        for (let i = 0; i < 10; i++) {
            const row = Math.floor(i / 5);
            const col = i % 5;
            const num = nums[i];
            const battery = i < 3 ? 20 + Math.random() * 15 : 40 + Math.random() * 60;
            this.createRobot(row, col, num, Math.floor(battery), false);
        }
    }

    createRobot(row, col, num, battery, hasPackage) {
        const robot = {
            number: num,
            row, col,
            battery,
            hasPackage,
            atCharging: false,
            atLoading: false,
            atFinish: false,
            path: [],
            isMoving: false
        };
        this.robots.push(robot);
        const cell = this.getCell(row, col);
        cell.className = 'cell robot';
        cell.textContent = hasPackage ? '📦' + num : num;
        this.updateBatteryDisplay(cell, battery);
        cell.dataset.originalClass = 'start';
        return robot;
    }

    updateBatteryDisplay(cell, battery) {
        const old = cell.querySelector('.battery');
        if (old) old.remove();
        if (battery <= 0) return;
        const b = document.createElement('div');
        b.className = 'battery';
        const level = document.createElement('div');
        level.className = 'battery-level';
        level.style.height = `${battery}%`;
        if (battery <= 10) level.classList.add('battery-red');
        else if (battery <= 25) level.classList.add('battery-pink');
        else if (battery <= 50) level.classList.add('battery-orange');
        else if (battery <= 75) level.classList.add('battery-yellow');
        else level.classList.add('battery-green');
        b.appendChild(level);
        cell.appendChild(b);
    }

    getCell(row, col) {
        return this.board.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    getCellKey(row, col) {
        return `${row}-${col}`;
    }

    isCellLocked(row, col) {
        return this.lockedCells.has(this.getCellKey(row, col));
    }

    lockCell(row, col) {
        this.lockedCells.add(this.getCellKey(row, col));
    }

    unlockCell(row, col) {
        this.lockedCells.delete(this.getCellKey(row, col));
    }

    unlockAllCells() {
        this.lockedCells.clear();
    }

    setupEventListeners() {
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        this.board.addEventListener('click', (e) => {
            const cell = e.target.closest('.cell');
            if (!cell) return;
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            this.handleCellClick(row, col);
        });
    }

    handleCellClick(row, col) {
        const cell = this.getCell(row, col);
        if (cell.classList.contains('robot')) {
            const robot = this.robots.find(r => r.row === row && r.col === col);
            if (robot) {
                if (this.selectedRobot !== robot) {
                    this.selectRobot(robot);
                    this.startTimer();
                } else {
                    this.continueRoute(robot);
                }
            }
            return;
        }

        if (this.selectedRobot && !this.selectedRobot.isMoving) {
            this.addToPath(this.selectedRobot, row, col);
        }
    }

    selectRobot(robot) {
        if (this.selectedRobot) {
            const prev = this.getCell(this.selectedRobot.row, this.selectedRobot.col);
            prev.classList.remove('selected');
            prev.style.background = 'linear-gradient(45deg, #ffeb3b, #ffc107)';
            prev.style.color = '#000';
        }
        this.selectedRobot = robot;
        const cell = this.getCell(robot.row, robot.col);
        cell.classList.add('selected');
        cell.style.background = 'linear-gradient(45deg, #ffeb3b, #000000)';
        cell.style.color = '#ffeb3b';
        this.selectedRobotElement.textContent = `Выбрано: ${robot.number}`;
        this.batteryElement.textContent = `Заряд: ${robot.battery}%`;
        this.resetHighlights();
        this.highlightAvailableMoves(robot);
    }

    continueRoute(robot) {
        if (robot.isMoving) return;
        this.selectRobot(robot);
        this.highlightAvailableMoves(robot);
    }

    highlightAvailableMoves(robot) {
        this.resetHighlights();
        let priorityTargets = [];
        if (robot.battery < 25) {
            priorityTargets = this.chargingStations.filter(s => !this.isCellLocked(s.row, s.col));
        } else if (!robot.hasPackage) {
            priorityTargets = this.loadingStations.filter(s => !this.isCellLocked(s.row, s.col));
        } else {
            const garage = this.findGarage(robot);
            if (garage) priorityTargets = [garage];
        }

        priorityTargets.forEach(t => {
            const cell = this.getCell(t.row, t.col);
            cell.classList.add('priority-blinking');
            if (this.chargingStations.some(s => s.row === t.row && s.col === t.col)) cell.classList.add('highlight-charging');
            else if (this.loadingStations.some(s => s.row === t.row && s.col === t.col)) cell.classList.add('highlight-loading');
            else if (this.isGarageForRobot(robot, t.row, t.col)) cell.classList.add('highlight-garage');
        });

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.canMoveTo(r, c, robot) && this.isStraightLine(robot.row, robot.col, r, c) && this.isPathClear(robot.row, robot.col, r, c)) {
                    const cell = this.getCell(r, c);
                    if (this.chargingStations.some(s => s.row === r && s.col === c)) cell.classList.add('highlight-charging');
                    else if (this.loadingStations.some(s => s.row === r && s.col === c)) cell.classList.add('highlight-loading');
                    else if (this.isGarageForRobot(robot, r, c)) cell.classList.add('highlight-garage');
                    else cell.classList.add('highlight-move');
                }
            }
        }
    }

    addToPath(robot, targetRow, targetCol) {
        if (robot.isMoving || !this.isStraightLine(robot.row, robot.col, targetRow, targetCol) || !this.isPathClear(robot.row, robot.col, targetRow, targetCol)) return;

        const points = this.getLinePoints(robot.row, robot.col, targetRow, targetCol);
        points.forEach(p => this.lockCell(p.row, p.col));
        robot.path.push({ row: targetRow, col: targetCol });
        this.visualizePath(robot);
        if (!robot.isMoving) this.moveRobotAlongPath(robot);
    }

    visualizePath(robot) {
        this.clearPathVisualization(robot);
        let prev = { row: robot.row, col: robot.col };
        for (let i = 0; i < robot.path.length; i++) {
            const p = robot.path[i];
            const cell = this.getCell(p.row, p.col);
            cell.classList.add('path');
            cell.textContent = i + 1;
            this.drawLine(prev.row, prev.col, p.row, p.col);
            prev = p;
        }
    }

    drawLine(r1, c1, r2, c2) {
        const points = this.getLinePoints(r1, c1, r2, c2);
        for (const p of points) {
            const cell = this.getCell(p.row, p.col);
            if (!cell.classList.contains('path') && !this.getCell(robot.row, robot.col).contains(cell)) {
                cell.classList.add('path-line');
                if (r1 === r2) cell.classList.add('horizontal-line');
                else cell.classList.add('vertical-line');
            }
        }
    }

    async moveRobotAlongPath(robot) {
        robot.isMoving = true;
        while (robot.path.length > 0) {
            const point = robot.path[0];
            if (!this.isPathClear(robot.row, robot.col, point.row, point.col)) {
                await this.delay(100);
                continue;
            }
            const next = robot.path.shift();
            await this.moveRobotToPoint(robot, next.row, next.col);
            await this.checkSpecialCells(robot);
            if (this.checkWinCondition()) {
                this.endGame();
                break;
            }
            this.unlockAllCells();
            for (const p of robot.path) {
                const points = this.getLinePoints(robot.row, robot.col, p.row, p.col);
                points.forEach(pt => this.lockCell(pt.row, pt.col));
            }
            if (this.selectedRobot === robot) this.highlightAvailableMoves(robot);
            await this.delay(100);
        }
        robot.isMoving = false;
        this.clearPathVisualization(robot);
        if (this.selectedRobot === robot) this.highlightAvailableMoves(robot);
    }

    async moveRobotToPoint(robot, r, c) {
        if (robot.battery < 25 && !robot.atCharging) {
            robot.path = [];
            this.clearPathVisualization(robot);
            this.unlockAllCells();
            robot.isMoving = false;
            return;
        }

        const oldCell = this.getCell(robot.row, robot.col);
        const newCell = this.getCell(r, c);

        // Анимация
        oldCell.classList.remove('robot', 'selected');
        this.restoreCellAppearance(oldCell);

        robot.row = r;
        robot.col = c;
        robot.battery = Math.max(0, robot.battery - 5);
        if (robot.battery <= 0) {
            this.gameOver();
            return;
        }

        newCell.className = 'cell robot';
        if (this.selectedRobot === robot) newCell.classList.add('selected');
        newCell.textContent = robot.hasPackage ? '📦' + robot.number : robot.number;
        this.updateBatteryDisplay(newCell, robot.battery);
        newCell.dataset.originalClass = this.getCell(r, c).dataset.originalClass || 'empty';

        this.moves++;
        this.movesElement.textContent = `Ходы: ${this.moves}`;
        if (this.selectedRobot === robot) this.batteryElement.textContent = `Заряд: ${robot.battery}%`;

        await this.delay(4000); // 4 секунды на клетку
    }

    async checkSpecialCells(robot) {
        const cell = this.getCell(robot.row, robot.col);
        if (cell.classList.contains('charging') && !robot.atCharging) {
            robot.atCharging = true;
            await this.chargeRobot(robot);
            robot.atCharging = false;
        }
        if (cell.classList.contains('loading') && !robot.atLoading && !robot.hasPackage) {
            robot.atLoading = true;
            await this.loadRobot(robot);
            robot.atLoading = false;
        }
        if (this.isGarageForRobot(robot, robot.row, robot.col) && !robot.atFinish && robot.hasPackage) {
            robot.atFinish = true;
        }
    }

    async chargeRobot(robot) {
        const cell = this.getCell(robot.row, robot.col);
        cell.classList.add('charging-animation');
        while (robot.battery < 100 && robot.atCharging) {
            robot.battery = Math.min(100, robot.battery + 10);
            this.updateBatteryDisplay(cell, robot.battery);
            if (this.selectedRobot === robot) this.batteryElement.textContent = `Заряд: ${robot.battery}%`;
            await this.delay(1000);
        }
        cell.classList.remove('charging-animation');
    }

    async loadRobot(robot) {
        const cell = this.getCell(robot.row, robot.col);
        cell.textContent = '⏳';
        cell.classList.add('loading-animation');
        await this.delay(5000);
        robot.hasPackage = true;
        cell.textContent = '📦' + robot.number;
        cell.classList.remove('loading-animation');
        if (this.selectedRobot === robot) this.batteryElement.textContent = `Заряд: ${robot.battery}%`;
    }

    checkWinCondition() {
        return this.robots.every(r => r.atFinish);
    }

    gameOver() {
        this.stopTimer();
        alert('Game Over! У робота закончился заряд!');
        this.resetGame();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    endGame() {
        this.stopTimer();
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const min = Math.floor(elapsed / 60);
        const sec = elapsed % 60;
        this.winMessage.style.display = 'block';
        this.finalMoves.textContent = this.moves;
        this.finalTime.textContent = `${min}:${sec.toString().padStart(2, '0')}`;
    }

    resetGame() {
        this.selectedRobot = null;
        this.robots = [];
        this.moves = 0;
        this.gameStarted = false;
        this.stopTimer();
        this.unlockAllCells();
        this.selectedRobotElement.textContent = 'Выбрано: нет';
        this.batteryElement.textContent = 'Заряд: -';
        this.movesElement.textContent = 'Ходы: 0';
        this.timerElement.textContent = 'Время: 0:00';
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

    findGarage(robot) {
        for (let r = 0; r < 2; r++) {
            for (let c = 5; c < 10; c++) {
                const cell = this.getCell(r, c);
                if (cell.classList.contains('finish') && parseInt(cell.dataset.garageNumber) === robot.number) {
                    return { row: r, col: c };
                }
            }
        }
        return null;
    }

    isGarageForRobot(robot, r, c) {
        const cell = this.getCell(r, c);
        return cell.classList.contains('finish') && parseInt(cell.dataset.garageNumber) === robot.number;
    }

    isStraightLine(r1, c1, r2, c2) {
        return r1 === r2 || c1 === c2;
    }

    isPathClear(r1, c1, r2, c2) {
        const dr = r2 > r1 ? 1 : r2 < r1 ? -1 : 0;
        const dc = c2 > c1 ? 1 : c2 < c1 ? -1 : 0;
        let r = r1 + dr, c = c1 + dc;
        while (r !== r2 || c !== c2) {
            if (this.getCell(r, c).classList.contains('obstacle') || this.isCellLocked(r, c)) return false;
            r += dr;
            c += dc;
        }
        return !this.getCell(r2, c2).classList.contains('obstacle') && !this.isCellLocked(r2, c2);
    }

    getLinePoints(r1, c1, r2, c2) {
        const points = [];
        const dr = r2 > r1 ? 1 : r2 < r1 ? -1 : 0;
        const dc = c2 > c1 ? 1 : c2 < c1 ? -1 : 0;
        let r = r1, c = c1;
        while (true) {
            points.push({ row: r, col: c });
            if (r === r2 && c === c2) break;
            r += dr;
            c += dc;
        }
        return points;
    }

    clearPathVisualization(robot) {
        const cells = this.board.querySelectorAll('.path, .path-line');
        cells.forEach(cell => {
            const r = parseInt(cell.dataset.row);
            const c = parseInt(cell.dataset.col);
            const inOtherPath = this.robots.some(ro => ro !== robot && ro.path.some(p => p.row === r && p.col === c));
            if (!inOtherPath) {
                cell.classList.remove('path', 'path-line', 'horizontal-line', 'vertical-line');
                this.restoreCellAppearance(cell);
            }
        });
    }

    restoreCellAppearance(cell) {
        const cls = cell.dataset.originalClass;
        if (cls) {
            cell.className = `cell ${cls}`;
            if (cls === 'finish') cell.textContent = cell.dataset.garageNumber;
            else if (cls === 'charging') cell.textContent = '⚡';
            else if (cls === 'loading') cell.textContent = '📦';
            else if (cls === 'obstacle') cell.textContent = '🚧';
            else if (cls === 'start') cell.textContent = '';
            else cell.textContent = '';
        } else {
            cell.className = 'cell empty';
            cell.textContent = '';
        }
    }

    resetHighlights() {
        this.board.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('highlight-charging', 'highlight-loading', 'highlight-garage', 'highlight-move', 'priority-blinking');
        });
    }

    canMoveTo(r, c, robot) {
        const cell = this.getCell(r, c);
        return !cell.classList.contains('obstacle') && !this.isCellLocked(r, c);
    }

    startTimer() {
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.startTime = Date.now();
            this.timerInterval = setInterval(() => this.updateTimer(), 1000);
        }
    }

    stopTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = null;
    }

    updateTimer() {
        if (this.gameStarted) {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const min = Math.floor(elapsed / 60);
            const sec = elapsed % 60;
            this.timerElement.textContent = `Время: ${min}:${sec.toString().padStart(2, '0')}`;
        }
    }

    generateUniqueNumbers(count, min, max) {
        const nums = new Set();
        while (nums.size < count) {
            nums.add(Math.floor(Math.random() * (max - min + 1)) + min);
        }
        return Array.from(nums);
    }
}

function shareResults() {
    const moves = document.getElementById('final-moves').textContent;
    const time = document.getElementById('final-time').textContent;
    if (window.Telegram && window.Telegram.WebApp) {
        const message = `🎯 Я завершил логистическую миссию за ${moves} ходов и ${time} времени!`;
        window.Telegram.WebApp.sendData(message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LogisticsGame();
});
