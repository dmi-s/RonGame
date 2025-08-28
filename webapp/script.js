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
        this.movingRobots = new Set();
        this.gameStarted = false;
        this.startTime = 0;
        this.timerInterval = null;
        this.lockedCells = new Set();
        
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
        // Поле старта
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 5; col++) {
                const cell = this.getCell(row, col);
                cell.className = 'cell start';
                cell.dataset.originalClass = 'start';
            }
        }

        // Поле финиша
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
                if (placedStations.length === 0 || 
                    placedStations.every(placed => Math.abs(placed - col) > 1)) {
                    
                    const cell = this.getCell(stationRow, col);
                    
                    if (type === 'charging') {
                        cell.className = 'cell charging';
                        cell.textContent = '⚡';
                        cell.dataset.originalClass = 'charging';
                        this.chargingStations.push({ row: stationRow, col: col });
                    } else {
                        cell.className = 'cell loading';
                        cell.textContent = '📦';
                        cell.dataset.originalClass = 'loading';
                        this.loadingStations.push({ row: stationRow, col: col });
                    }
                    
                    placedStations.push(col);
                    break;
                }
            }
        }
        
        // Столбы только в рядах 4,5,6
        const obstacleRows = [4, 5, 6];
        const allPossibleObstacles = [];
        
        for (const row of obstacleRows) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.getCell(row, col);
                if (!cell.classList.contains('charging') && 
                    !cell.classList.contains('loading') &&
                    !cell.classList.contains('start') &&
                    !cell.classList.contains('finish') &&
                    col > 0 && col < this.cols - 1) {
                    allPossibleObstacles.push({ row, col });
                }
            }
        }
        
        this.shuffleArray(allPossibleObstacles);
        
        for (const obstacle of allPossibleObstacles) {
            if (this.obstacles.length >= 8) break;
            
            const canPlace = this.canPlaceObstacle(obstacle.row, obstacle.col);
            if (canPlace) {
                this.obstacles.push(obstacle);
                const cell = this.getCell(obstacle.row, obstacle.col);
                cell.className = 'cell obstacle';
                cell.textContent = '🚧';
                cell.dataset.originalClass = 'obstacle';
            }
        }
    }

    canPlaceObstacle(row, col) {
        for (const obs of this.obstacles) {
            const rowDistance = Math.abs(obs.row - row);
            const colDistance = Math.abs(obs.col - col);
            if (rowDistance <= 1 && colDistance <= 1) {
                return false;
            }
        }
        return true;
    }

    startTimer() {
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.startTime = Date.now();
            
            this.timerInterval = setInterval(() => {
                this.updateTimer();
            }, 1000);
        }
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimer() {
        if (this.gameStarted) {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            this.timerElement.textContent = `Время: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    generateUniqueNumbers(count, min, max) {
        const numbers = new Set();
        while (numbers.size < count) {
            numbers.add(Math.floor(Math.random() * (max - min + 1)) + min);
        }
        return Array.from(numbers);
    }

    createRobots() {
        const robotNumbers = this.generateUniqueNumbers(10, 1, 10);
        
        for (let i = 0; i < 10; i++) {
            const row = Math.floor(i / 5);
            const col = i % 5;
            const number = robotNumbers[i];
            const battery = i < 3 ? 
                Math.floor(Math.random() * 16) + 25 :
                Math.floor(Math.random() * 61) + 40;
            
            this.createRobot(row, col, number, battery, false);
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
            path: [],
            isMoving: false
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
            
            this.handleCellClick(row, col, cell);
        });
    }

    handleCellClick(row, col, cell) {
        if (cell.classList.contains('robot')) {
            const robot = this.robots.find(r => r.row === row && r.col === col);
            if (robot && !robot.isMoving) {
                this.selectRobot(row, col);
                this.startTimer();
            }
            return;
        }
        
        if (this.selectedRobot && !this.selectedRobot.isMoving) {
            this.addToPath(this.selectedRobot, row, col);
        }
    }

    selectRobot(row, col) {
        const robot = this.robots.find(r => r.row === row && r.col === col);
        if (!robot || robot.isMoving) return;
        
        if (this.selectedRobot) {
            const prevCell = this.getCell(this.selectedRobot.row, this.selectedRobot.col);
            prevCell.classList.remove('selected');
            prevCell.style.background = 'linear-gradient(45deg, #ffeb3b, #ffc107)';
            prevCell.style.color = '#000';
        }
        
        this.selectedRobot = robot;
        this.selectedRobotElement.textContent = `Выбрано: ${robot.number}`;
        this.batteryElement.textContent = `Заряд: ${robot.battery}%`;
        
        this.resetHighlights();
        const robotCell = this.getCell(robot.row, robot.col);
        robotCell.classList.add('selected');
        robotCell.style.background = 'linear-gradient(45deg, #ffeb3b, #000000)';
        robotCell.style.color = '#ffeb3b';
        
        this.highlightAvailableMoves(robot);
    }

    highlightAvailableMoves(robot) {
        // Сначала сбросим все подсветки
        this.resetHighlights();
        
        // Определяем приоритетные цели
        let priorityTargets = [];
        
        if (robot.battery < 25 && !robot.atCharging) {
            // Низкий заряд - подсвечиваем станции зарядки
            priorityTargets = this.chargingStations.filter(station => 
                !this.isCellLocked(station.row, station.col) &&
                this.isPathClear(robot.row, robot.col, station.row, station.col)
            );
        } else if (!robot.hasPackage && !robot.atLoading) {
            // Нет груза - подсвечиваем станции погрузки
            priorityTargets = this.loadingStations.filter(station => 
                !this.isCellLocked(station.row, station.col) &&
                this.isPathClear(robot.row, robot.col, station.row, station.col)
            );
        } else if (robot.hasPackage && !robot.atFinish) {
            // Есть груз - подсвечиваем свой гараж
            const garageCell = this.findGarageForRobot(robot);
            if (garageCell && this.isPathClear(robot.row, robot.col, garageCell.row, garageCell.col)) {
                priorityTargets = [garageCell];
            }
        }
        
        // Подсвечиваем приоритетные цели миганием
        priorityTargets.forEach(target => {
            const cell = this.getCell(target.row, target.col);
            cell.classList.add('priority-blinking');
            
            if (this.chargingStations.some(s => s.row === target.row && s.col === target.col)) {
                cell.classList.add('highlight-charging');
            } else if (this.loadingStations.some(s => s.row === target.row && s.col === target.col)) {
                cell.classList.add('highlight-loading');
            } else if (this.isGarageForRobot(robot, target.row, target.col)) {
                cell.classList.add('highlight-garage');
            }
        });
        
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.getCell(r, c);
                this.removeHighlights(cell);
                
                if (this.canMoveTo(r, c, robot) && 
                    this.isStraightLine(robot.row, robot.col, r, c) &&
                    this.isPathClear(robot.row, robot.col, r, c) &&
                    !this.isCellLocked(r, c)) {
                    
                    if (this.chargingStations.some(s => s.row === r && s.col === c)) {
                        cell.classList.add('highlight-charging');
                    } else if (this.loadingStations.some(s => s.row === r && s.col === c)) {
                        cell.classList.add('highlight-loading');
                    } else if (this.isGarageForRobot(robot, r, c)) {
                        cell.classList.add('highlight-garage');
                    } else {
                        cell.classList.add('highlight-move');
                    }
                }
            }
        }
    }

    findGarageForRobot(robot) {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.getCell(row, col);
                if (this.isGarageForRobot(robot, row, col)) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    removeHighlights(cell) {
        cell.classList.remove('highlight-charging', 'highlight-loading', 'highlight-garage', 'highlight-move', 'priority-blinking');
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
            const cell = this.getCell(currentRow, currentCol);
            if (cell.classList.contains('obstacle') || 
                this.isCellLocked(currentRow, currentCol) ||
                (cell.classList.contains('robot') && !this.isRobotMovingTo(currentRow, currentCol))) {
                return false;
            }
            
            currentRow += rowStep;
            currentCol += colStep;
        }
        
        return !this.getCell(endRow, endCol).classList.contains('obstacle') &&
               !this.isCellLocked(endRow, endCol);
    }

    isRobotMovingTo(row, col) {
        for (const robot of this.robots) {
            if (robot.isMoving && robot.path.some(point => point.row === row && point.col === col)) {
                return true;
            }
        }
        return false;
    }

    resetHighlights() {
        const cells = this.board.querySelectorAll('.cell');
        cells.forEach(cell => {
            this.removeHighlights(cell);
        });
    }

    canMoveTo(row, col, currentRobot) {
        const cell = this.getCell(row, col);
        
        if (cell.classList.contains('robot')) {
            const robotHere = this.robots.find(r => r.row === row && r.col === col);
            return robotHere === currentRobot;
        }
        
        return !cell.classList.contains('obstacle');
    }

    addToPath(robot, targetRow, targetCol) {
        if (robot.isMoving) {
            return;
        }
        
        if (!this.isStraightLine(robot.row, robot.col, targetRow, targetCol)) {
            return;
        }
        
        if (!this.isPathClear(robot.row, robot.col, targetRow, targetCol)) {
            return;
        }

        // Блокируем клетки траектории
        const pathPoints = this.getLinePoints(robot.row, robot.col, targetRow, targetCol);
        for (const point of pathPoints) {
            this.lockCell(point.row, point.col);
        }

        robot.path.push({ row: targetRow, col: targetCol });
        this.visualizePath(robot);
        
        this.moveRobotAlongPath(robot);
    }

    visualizePath(robot) {
        this.clearPathVisualization(robot);
        
        let prevPoint = { row: robot.row, col: robot.col };
        
        for (let i = 0; i < robot.path.length; i++) {
            const point = robot.path[i];
            const cell = this.getCell(point.row, point.col);
            
            cell.classList.add('path');
            cell.textContent = i + 1;
            
            this.drawLine(prevPoint.row, prevPoint.col, point.row, point.col);
            prevPoint = point;
        }
    }

    drawLine(startRow, startCol, endRow, endCol) {
        const points = this.getLinePoints(startRow, startCol, endRow, endCol);
        
        for (const point of points) {
            const cell = this.getCell(point.row, point.col);
            if (!cell.classList.contains('path') && !cell.classList.contains('robot')) {
                cell.classList.add('path-line');
                
                if (startRow === endRow) {
                    cell.classList.add('horizontal-line');
                } else {
                    cell.classList.add('vertical-line');
                }
            }
        }
    }

    getLinePoints(startRow, startCol, endRow, endCol) {
        const points = [];
        const rowStep = endRow > startRow ? 1 : endRow < startRow ? -1 : 0;
        const colStep = endCol > startCol ? 1 : endCol < startCol ? -1 : 0;
        
        let currentRow = startRow;
        let currentCol = startCol;
        
        while (true) {
            points.push({ row: currentRow, col: currentCol });
            if (currentRow === endRow && currentCol === endCol) break;
            currentRow += rowStep;
            currentCol += colStep;
        }
        
        return points;
    }

    clearPathVisualization(robot) {
        const pathCells = this.board.querySelectorAll('.path, .path-line, .horizontal-line, .vertical-line');
        pathCells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            const isInOtherPath = this.robots.some(r => 
                r !== robot && r.path.some(p => p.row === row && p.col === col)
            );
            
            if (!isInOtherPath) {
                cell.classList.remove('path', 'path-line', 'horizontal-line', 'vertical-line');
                this.restoreCellAppearance(cell);
            }
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
        if (robot.isMoving || robot.path.length === 0) return;
        
        robot.isMoving = true;
        this.movingRobots.add(robot);
        
        while (robot.path.length > 0) {
            const point = robot.path[0];
            
            if (!this.isPathClear(robot.row, robot.col, point.row, point.col)) {
                await this.delay(100);
                continue;
            }
            
            const currentPoint = robot.path.shift();
            await this.moveRobotToPoint(robot, currentPoint.row, currentPoint.col);
            
            await this.checkSpecialCells(robot);
            
            if (this.checkWinCondition()) {
                this.endGame();
                break;
            }
            
            // Обновляем блокировку клеток
            this.unlockAllCells();
            for (const pathPoint of robot.path) {
                const points = this.getLinePoints(robot.row, robot.col, pathPoint.row, pathPoint.col);
                for (const point of points) {
                    this.lockCell(point.row, point.col);
                }
            }
            
            if (this.selectedRobot === robot) {
                this.highlightAvailableMoves(robot);
            }
            
            await this.delay(100);
        }
        
        robot.isMoving = false;
        this.movingRobots.delete(robot);
        this.unlockAllCells();
        this.clearPathVisualization(robot);
        
        if (this.selectedRobot === robot) {
            this.highlightAvailableMoves(robot);
        }
    }

    async moveRobotToPoint(robot, targetRow, targetCol) {
        // Проверка низкого заряда
        if (robot.battery < 25 && !robot.atCharging) {
            robot.path = []; // Сбрасываем траекторию
            this.clearPathVisualization(robot);
            this.unlockAllCells();
            robot.isMoving = false;
            this.movingRobots.delete(robot);
            
            // Подсвечиваем станции зарядки
            if (this.selectedRobot === robot) {
                this.highlightAvailableMoves(robot);
            }
            
            return;
        }
        
        const oldCell = this.getCell(robot.row, robot.col);
        
        // Создаем ghost для анимации
        const ghost = document.createElement('div');
        ghost.className = 'robot-ghost';
        ghost.textContent = robot.hasPackage ? '📦' + robot.number : robot.number;
        ghost.style.position = 'absolute';
        ghost.style.width = oldCell.offsetWidth + 'px';
        ghost.style.height = oldCell.offsetHeight + 'px';
        ghost.style.left = oldCell.offsetLeft + 'px';
        ghost.style.top = oldCell.offsetTop + 'px';
        ghost.style.zIndex = '100';
        ghost.style.transition = 'all 4s ease-in-out';
        
        if (this.selectedRobot === robot) {
            ghost.style.background = 'linear-gradient(45deg, #ffeb3b, #000000)';
            ghost.style.color = '#ffeb3b';
        } else {
            ghost.style.background = 'linear-gradient(45deg, #ffeb3b, #ffc107)';
            ghost.style.color = '#000';
        }
        
        this.board.appendChild(ghost);
        
        // Ждем следующего кадра
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        const targetCell = this.getCell(targetRow, targetCol);
        ghost.style.left = targetCell.offsetLeft + 'px';
        ghost.style.top = targetCell.offsetTop + 'px';
        
        // Ждем завершения анимации
        await this.delay(4000);
        ghost.remove();
        
        // Обновляем позицию робота
        this.restoreCellAppearance(oldCell);
        robot.row = targetRow;
        robot.col = targetCol;
        robot.battery = Math.max(0, robot.battery - 5);
        
        if (robot.battery <= 0) {
            this.gameOver();
            return;
        }
        
        const newCell = this.getCell(targetRow, targetCol);
        newCell.className = 'cell robot';
        
        if (this.selectedRobot === robot) {
            newCell.classList.add('selected');
            newCell.style.background = 'linear-gradient(45deg, #ffeb3b, #000000)';
            newCell.style.color = '#ffeb3b';
        } else {
            newCell.style.background = 'linear-gradient(45deg, #ffeb3b, #ffc107)';
            newCell.style.color = '#000';
        }
        
        if (robot.hasPackage) {
            newCell.textContent = '📦' + robot.number;
        } else {
            newCell.textContent = robot.number;
        }
        
        this.updateBatteryDisplay(newCell, robot.battery);
        newCell.dataset.originalClass = this.getCell(targetRow, targetCol).dataset.originalClass || 'empty';
        
        this.moves++;
        this.movesElement.textContent = `Ходы: ${this.moves}`;
        
        if (this.selectedRobot === robot) {
            this.batteryElement.textContent = `Заряд: ${robot.battery}%`;
        }
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
        
        let chargeLevel = robot.battery;
        while (chargeLevel < 100 && robot.atCharging) {
            chargeLevel = Math.min(100, chargeLevel + 10);
            robot.battery = chargeLevel;
            this.updateBatteryDisplay(cell, robot.battery);
            
            if (this.selectedRobot === robot) {
                this.batteryElement.textContent = `Заряд: ${robot.battery}%`;
            }
            
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
        
        if (this.selectedRobot === robot) {
            this.batteryElement.textContent = `Заряд: ${robot.battery}%`;
        }
    }

    checkWinCondition() {
        return this.robots.every(robot => robot.atFinish);
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
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        this.winMessage.style.display = 'block';
        this.finalMoves.textContent = this.moves;
        this.finalTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    resetGame() {
        this.selectedRobot = null;
        this.robots = [];
        this.moves = 0;
        this.movingRobots.clear();
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
}

function shareResults() {
    const moves = document.getElementById('final-moves').textContent;
    const time = document.getElementById('final-time').textContent;
    
    if (window.Telegram && window.Telegram.WebApp) {
        const message = `🎯 Я завершил логистическую миссию за ${moves} ходов и ${time} времени!`;
        window.Telegram.WebApp.sendData(message);
    }
}

// Запуск игры
document.addEventListener('DOMContentLoaded', () => {
    new LogisticsGame();
});
