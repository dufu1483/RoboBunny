/**
 * Game Engine Module
 * Core game logic for RoboBunny strawberry collection game
 */

class GameEngine {
    constructor() {
        this.gridSize = 21;
        this.mapData = null;
        this.bunny = null;
        this.originalMap = null;
        this.originalBunny = null;
        this.score = 0;
        this.moveCount = 0;
        this.isRunning = false;
        this.isGameOver = false;
        this.stepDelay = 400;

        this.directionVectors = {
            up: { dx: 0, dy: -1 },
            right: { dx: 1, dy: 0 },
            down: { dx: 0, dy: 1 },
            left: { dx: -1, dy: 0 }
        };

        this.directionOrder = ['up', 'right', 'down', 'left'];
    }

    /**
     * Load a map into the game engine
     */
    loadMap(mapObject) {
        // Deep copy map data
        this.originalMap = JSON.parse(JSON.stringify(mapObject.mapData));
        this.originalBunny = JSON.parse(JSON.stringify(mapObject.bunnyPosition));

        this.reset();
    }

    /**
     * Reset the game to initial state
     */
    reset() {
        this.mapData = JSON.parse(JSON.stringify(this.originalMap));
        this.bunny = JSON.parse(JSON.stringify(this.originalBunny));
        this.score = 0;
        this.moveCount = 0;
        this.isRunning = false;
        this.isGameOver = false;

        this.updateUI();
        this.renderGrid();
        this.setStatus('準備開始', '');
    }

    /**
     * Create and render the game grid
     */
    renderGrid() {
        const grid = document.getElementById('game-grid');
        if (!grid || !this.mapData) return;

        grid.innerHTML = '';

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;

                const data = this.mapData[y][x];

                // Check if bunny is here
                if (this.bunny && this.bunny.x === x && this.bunny.y === y) {
                    cell.classList.add('bunny');
                    const sprite = document.createElement('span');
                    sprite.className = `bunny-sprite ${this.bunny.direction}`;
                    sprite.textContent = '🐰';
                    cell.appendChild(sprite);
                } else {
                    switch (data.type) {
                        case 'strawberry':
                            cell.classList.add('strawberry');
                            const wrapper = document.createElement('span');
                            wrapper.className = 'strawberry-icon';
                            wrapper.textContent = '🍓';
                            if (data.value > 1) {
                                const count = document.createElement('span');
                                count.className = 'count';
                                count.textContent = data.value;
                                wrapper.appendChild(count);
                            }
                            cell.appendChild(wrapper);
                            break;
                        case 'stone':
                            cell.classList.add('stone');
                            cell.textContent = '🪨';
                            break;
                    }
                }

                grid.appendChild(cell);
            }
        }
    }

    /**
     * Update the score display
     */
    updateUI() {
        const scoreEl = document.getElementById('score');
        if (scoreEl) {
            scoreEl.textContent = this.score;
        }
        const moveEl = document.getElementById('move-count');
        if (moveEl) {
            moveEl.textContent = this.moveCount;
        }
    }

    /**
     * Set the game status display
     */
    setStatus(text, className) {
        const statusEl = document.getElementById('game-status');
        if (statusEl) {
            statusEl.textContent = text;
            statusEl.className = 'game-status ' + className;
        }
    }

    /**
     * Execute F_Jump command - jump forward N cells
     */
    async F_Jump(n) {
        if (this.isGameOver) return false;

        const dir = this.directionVectors[this.bunny.direction];
        const newX = this.bunny.x + dir.dx * n;
        const newY = this.bunny.y + dir.dy * n;

        return await this.moveBunny(newX, newY);
    }

    /**
     * Execute FR_Jump command - diagonal right jump
     * Forward 1 cell, right N cells
     */
    async FR_Jump(n) {
        if (this.isGameOver) return false;

        const dir = this.directionVectors[this.bunny.direction];
        const rightDir = this.getRightDirection();
        const rightVec = this.directionVectors[rightDir];

        const newX = this.bunny.x + dir.dx + rightVec.dx * n;
        const newY = this.bunny.y + dir.dy + rightVec.dy * n;

        return await this.moveBunny(newX, newY);
    }

    /**
     * Execute FL_Jump command - diagonal left jump
     * Forward 1 cell, left N cells
     */
    async FL_Jump(n) {
        if (this.isGameOver) return false;

        const dir = this.directionVectors[this.bunny.direction];
        const leftDir = this.getLeftDirection();
        const leftVec = this.directionVectors[leftDir];

        const newX = this.bunny.x + dir.dx + leftVec.dx * n;
        const newY = this.bunny.y + dir.dy + leftVec.dy * n;

        return await this.moveBunny(newX, newY);
    }

    /**
     * Execute Turn command
     */
    async Turn(direction) {
        if (this.isGameOver) return false;

        const currentIdx = this.directionOrder.indexOf(this.bunny.direction);

        switch (direction) {
            case '右':
                this.bunny.direction = this.directionOrder[(currentIdx + 1) % 4];
                break;
            case '左':
                this.bunny.direction = this.directionOrder[(currentIdx + 3) % 4];
                break;
            case '後':
                this.bunny.direction = this.directionOrder[(currentIdx + 2) % 4];
                break;
        }

        this.renderGrid();
        await this.delay(this.stepDelay / 2);
        return true;
    }

    /**
     * Get the direction to the right of current
     */
    getRightDirection() {
        const currentIdx = this.directionOrder.indexOf(this.bunny.direction);
        return this.directionOrder[(currentIdx + 1) % 4];
    }

    /**
     * Get the direction to the left of current
     */
    getLeftDirection() {
        const currentIdx = this.directionOrder.indexOf(this.bunny.direction);
        return this.directionOrder[(currentIdx + 3) % 4];
    }

    /**
     * Move the bunny to a new position
     */
    async moveBunny(newX, newY) {
        // Check boundary
        if (newX < 0 || newX >= this.gridSize || newY < 0 || newY >= this.gridSize) {
            this.isGameOver = true;
            this.setStatus('跳出邊界！遊戲結束', 'gameover');
            return false;
        }

        // Animate jump
        const bunnyCell = document.querySelector('.cell.bunny');
        if (bunnyCell) {
            bunnyCell.classList.add('jumping');
        }

        await this.delay(this.stepDelay);

        // Update position
        this.bunny.x = newX;
        this.bunny.y = newY;
        this.moveCount++;

        // Check what's on this cell
        const cell = this.mapData[newY][newX];

        if (cell.type === 'strawberry') {
            this.score += cell.value;
            this.mapData[newY][newX] = { type: 'empty', value: 0 };
        } else if (cell.type === 'stone') {
            this.score = Math.max(0, this.score - 10);
            this.setStatus('撞到石頭！-10 草莓', 'gameover');
            await this.delay(300);
        }

        this.updateUI();
        this.renderGrid();

        return true;
    }

    /**
     * Execute a program (array of commands)
     */
    async executeProgram(program) {
        this.isRunning = true;
        this.setStatus('執行中...', 'running');

        const result = await this.executeCommands(program, 0);

        this.isRunning = false;

        if (!this.isGameOver) {
            this.setStatus(`完成！得分：${this.score}`, 'complete');
        }

        return result;
    }

    /**
     * Execute commands recursively, handling control structures
     */
    async executeCommands(commands, startIndex) {
        let i = startIndex;

        while (i < commands.length) {
            if (this.isGameOver) return i;

            const cmd = commands[i];

            // Highlight current block
            this.highlightBlock(i);

            if (cmd.type === 'Repeat') {
                // Find matching EndRepeat
                let depth = 1;
                let endIndex = i + 1;
                while (endIndex < commands.length && depth > 0) {
                    if (commands[endIndex].type === 'Repeat') depth++;
                    if (commands[endIndex].type === 'EndRepeat') depth--;
                    endIndex++;
                }
                endIndex--;

                // Execute loop body
                const loopBody = commands.slice(i + 1, endIndex);
                for (let rep = 0; rep < cmd.value; rep++) {
                    if (this.isGameOver) return i;
                    await this.executeCommands(loopBody, 0);
                }

                i = endIndex + 1;
            } else if (cmd.type === 'EndRepeat') {
                i++;
            } else {
                await this.executeCommand(cmd);
                i++;
            }
        }

        return i;
    }

    /**
     * Execute a single command
     */
    async executeCommand(cmd) {
        switch (cmd.type) {
            case 'F_Jump':
                await this.F_Jump(cmd.value);
                break;
            case 'FR_Jump':
                await this.FR_Jump(cmd.value);
                break;
            case 'FL_Jump':
                await this.FL_Jump(cmd.value);
                break;
            case 'Turn':
                await this.Turn(cmd.value);
                break;
        }
    }

    /**
     * Execute a single step
     */
    async executeStep(program, stepIndex) {
        if (stepIndex >= program.length || this.isGameOver) {
            return -1;
        }

        const cmd = program[stepIndex];
        this.highlightBlock(stepIndex);

        if (cmd.type === 'Repeat' || cmd.type === 'EndRepeat') {
            // Skip control blocks in step mode (simplified)
            return stepIndex + 1;
        }

        await this.executeCommand(cmd);
        return stepIndex + 1;
    }

    /**
     * Highlight the current executing block
     */
    highlightBlock(index) {
        document.querySelectorAll('.program-block').forEach((block, i) => {
            block.classList.toggle('active', i === index);
        });
    }

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for use in other modules
window.GameEngine = GameEngine;
