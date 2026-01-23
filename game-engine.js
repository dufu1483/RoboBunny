/**
 * Game Engine Module
 * Core game logic for RoboBunny strawberry collection game
 */

class GameEngine {
    constructor() {
        this.gridSize = 21;
        this.mapData = null;

        // Multi-bunny support
        this.bunnies = [null, null];
        this.originalBunnies = [null, null];
        this.scores = [0, 0];
        this.moveCounts = [0, 0];
        this.bunnyActive = [true, true];
        this.bunnyCount = 1; // 1 or 2 based on map

        this.originalMap = null;
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
        this.executionLimit = 1000;

        // Backward compatibility
        this.bunny = null;
        this.score = 0;
        this.moveCount = 0;
    }

    /**
     * Load a map into the game engine
     */
    loadMap(mapObject) {
        this.originalMap = JSON.parse(JSON.stringify(mapObject.mapData));

        // Handle bunny 1 (required)
        this.originalBunnies[0] = JSON.parse(JSON.stringify(mapObject.bunnyPosition));

        // Handle bunny 2 (optional)
        if (mapObject.bunnyPosition2) {
            this.originalBunnies[1] = JSON.parse(JSON.stringify(mapObject.bunnyPosition2));
            this.bunnyCount = 2;
        } else {
            this.originalBunnies[1] = null;
            this.bunnyCount = 1;
        }

        this.updateDualBunnyUI();
        this.reset();
    }

    /**
     * Show/hide dual bunny UI elements
     */
    updateDualBunnyUI() {
        const bunny2Stats = document.getElementById('bunny2-stats');
        const bunnyTabs = document.getElementById('bunny-tabs');

        if (this.bunnyCount === 2) {
            if (bunny2Stats) bunny2Stats.style.display = 'flex';
            if (bunnyTabs) bunnyTabs.style.display = 'flex';
        } else {
            if (bunny2Stats) bunny2Stats.style.display = 'none';
            if (bunnyTabs) bunnyTabs.style.display = 'none';
        }
    }

    /**
     * Reset the game to initial state
     */
    reset() {
        this.mapData = JSON.parse(JSON.stringify(this.originalMap));

        // Reset bunny 1
        this.bunnies[0] = JSON.parse(JSON.stringify(this.originalBunnies[0]));
        this.scores[0] = 0;
        this.moveCounts[0] = 0;
        this.bunnyActive[0] = true;

        // Reset bunny 2 if exists
        if (this.bunnyCount === 2) {
            this.bunnies[1] = JSON.parse(JSON.stringify(this.originalBunnies[1]));
            this.scores[1] = 0;
            this.moveCounts[1] = 0;
            this.bunnyActive[1] = true;
        } else {
            this.bunnies[1] = null;
            this.bunnyActive[1] = false;
        }

        // Backward compatibility
        this.bunny = this.bunnies[0];
        this.score = this.scores[0];
        this.moveCount = this.moveCounts[0];

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

                // Check if bunny 1 is here
                const bunny1 = this.bunnies[0];
                const bunny2 = this.bunnies[1];

                if (bunny1 && this.bunnyActive[0] && bunny1.x === x && bunny1.y === y) {
                    cell.classList.add('bunny', 'bunny1');
                    const sprite = document.createElement('span');
                    sprite.className = `bunny-sprite ${bunny1.direction}`;
                    sprite.textContent = '🐰';

                    const badge = document.createElement('span');
                    badge.className = 'bunny-badge';
                    badge.textContent = '1';
                    sprite.appendChild(badge);

                    cell.appendChild(sprite);
                } else if (bunny2 && this.bunnyActive[1] && bunny2.x === x && bunny2.y === y) {
                    cell.classList.add('bunny', 'bunny2');
                    const sprite = document.createElement('span');
                    sprite.className = `bunny-sprite ${bunny2.direction}`;
                    sprite.textContent = '🐰';

                    const badge = document.createElement('span');
                    badge.className = 'bunny-badge';
                    badge.textContent = '2';
                    sprite.appendChild(badge);

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
                        case 'puddle':
                            cell.classList.add('puddle');
                            cell.textContent = '💧';
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
        // Update bunny 1 stats
        const score1El = document.getElementById('score1');
        if (score1El) score1El.textContent = this.scores[0];
        const move1El = document.getElementById('move-count1');
        if (move1El) move1El.textContent = this.moveCounts[0];

        // Update bunny 2 stats
        if (this.bunnyCount === 2) {
            const score2El = document.getElementById('score2');
            if (score2El) score2El.textContent = this.scores[1];
            const move2El = document.getElementById('move-count2');
            if (move2El) move2El.textContent = this.moveCounts[1];
        }

        // Backward compatibility
        this.score = this.scores[0];
        this.moveCount = this.moveCounts[0];
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
    async F_Jump(n, bunnyIdx = 0) {
        const bunny = this.bunnies[bunnyIdx];
        if (!bunny || !this.bunnyActive[bunnyIdx]) return false;

        const dir = this.directionVectors[bunny.direction];
        const newX = bunny.x + dir.dx * n;
        const newY = bunny.y + dir.dy * n;

        return await this.moveBunny(newX, newY, bunnyIdx);
    }

    /**
     * Execute FR_Jump command - diagonal right jump
     * Forward 1 cell, right N cells
     */
    async FR_Jump(n, bunnyIdx = 0) {
        const bunny = this.bunnies[bunnyIdx];
        if (!bunny || !this.bunnyActive[bunnyIdx]) return false;

        const dir = this.directionVectors[bunny.direction];
        const rightDir = this.getRightDirection(bunnyIdx);
        const rightVec = this.directionVectors[rightDir];

        const newX = bunny.x + dir.dx + rightVec.dx * n;
        const newY = bunny.y + dir.dy + rightVec.dy * n;

        return await this.moveBunny(newX, newY, bunnyIdx);
    }

    /**
     * Execute FL_Jump command - diagonal left jump
     * Forward 1 cell, left N cells
     */
    async FL_Jump(n, bunnyIdx = 0) {
        const bunny = this.bunnies[bunnyIdx];
        if (!bunny || !this.bunnyActive[bunnyIdx]) return false;

        const dir = this.directionVectors[bunny.direction];
        const leftDir = this.getLeftDirection(bunnyIdx);
        const leftVec = this.directionVectors[leftDir];

        const newX = bunny.x + dir.dx + leftVec.dx * n;
        const newY = bunny.y + dir.dy + leftVec.dy * n;

        return await this.moveBunny(newX, newY, bunnyIdx);
    }

    /**
     * Execute Turn command
     */
    async Turn(direction, bunnyIdx = 0) {
        const bunny = this.bunnies[bunnyIdx];
        if (!bunny || !this.bunnyActive[bunnyIdx]) return false;

        const currentIdx = this.directionOrder.indexOf(bunny.direction);

        switch (direction) {
            case '右':
                bunny.direction = this.directionOrder[(currentIdx + 1) % 4];
                break;
            case '左':
                bunny.direction = this.directionOrder[(currentIdx + 3) % 4];
                break;
            case '後':
                bunny.direction = this.directionOrder[(currentIdx + 2) % 4];
                break;
        }

        this.renderGrid();
        await this.delay(this.stepDelay / 2);
        return true;
    }

    /**
     * Get the direction to the right of current
     */
    getRightDirection(bunnyIdx = 0) {
        const bunny = this.bunnies[bunnyIdx];
        if (!bunny) return 'right';
        const currentIdx = this.directionOrder.indexOf(bunny.direction);
        return this.directionOrder[(currentIdx + 1) % 4];
    }

    getLeftDirection(bunnyIdx = 0) {
        const bunny = this.bunnies[bunnyIdx];
        if (!bunny) return 'left';
        const currentIdx = this.directionOrder.indexOf(bunny.direction);
        return this.directionOrder[(currentIdx + 3) % 4];
    }

    /**
     * Move the bunny to a new position
     */
    async moveBunny(newX, newY, bunnyIdx = 0) {
        const bunny = this.bunnies[bunnyIdx];
        if (!bunny || !this.bunnyActive[bunnyIdx]) return false;

        // Check boundary - bunny leaves map but game continues for other
        // Check boundary - bunny leaves map but game continues for other
        if (newX < 0 || newX >= this.gridSize || newY < 0 || newY >= this.gridSize) {
            // Animate jump out of bounds
            const bunnyCell = document.querySelector(`.cell.bunny${bunnyIdx + 1}`);
            if (bunnyCell) {
                // Determine direction for jump animation
                const jumpClass = `jumping-${bunny.direction}`; // You might need new CSS for direction-specific jumps if default 'jumping' isn't enough, but 'jumping' is vertical.
                // For now, reuse existing jumping class which goes up and down.
                bunnyCell.classList.add('jumping');
            }

            await this.delay(this.stepDelay);

            this.bunnyActive[bunnyIdx] = false;
            this.setStatus(`兔子 ${bunnyIdx + 1} 跳出邊界！`, 'warning');
            this.renderGrid();

            // Check if all bunnies are done
            if (!this.bunnyActive.some((active, idx) => active && idx < this.bunnyCount)) {
                this.isGameOver = true;
            }
            return false;
        }

        // Animate jump
        const bunnyCell = document.querySelector(`.cell.bunny${bunnyIdx + 1}`);
        if (bunnyCell) {
            bunnyCell.classList.add('jumping');
        }

        await this.delay(this.stepDelay);

        // Update position
        bunny.x = newX;
        bunny.y = newY;
        this.moveCounts[bunnyIdx]++;

        // Check what's on this cell
        const cell = this.mapData[newY][newX];

        if (cell.type === 'strawberry') {
            this.scores[bunnyIdx] += cell.value;
            this.mapData[newY][newX] = { type: 'empty', value: 0 };
        } else if (cell.type === 'stone') {
            this.scores[bunnyIdx] = Math.max(0, this.scores[bunnyIdx] - 10);
            this.setStatus(`兔子 ${bunnyIdx + 1} 撞到石頭！-10 草莓`, 'warning');
            await this.delay(300);
        } else if (cell.type === 'puddle') {
            this.moveCounts[bunnyIdx] += 5;
            this.setStatus(`兔子 ${bunnyIdx + 1} 踩到水坑！+5 步`, 'warning');
            await this.delay(300);
        }

        this.updateUI();
        this.renderGrid();

        return true;
    }

    /**
     * Execute programs for all bunnies (alternating execution)
     */
    async executeProgram(program, program2 = null) {
        this.isRunning = true;
        this.setStatus('執行中...', 'running');
        this.executionCounter = 0;
        this.currentBunnyIndex = 0;

        if (this.bunnyCount === 1 || !program2) {
            // Single bunny mode
            await this.executeCommandsForBunny(program, 0);
        } else {
            // Dual bunny mode - execute both programs in parallel
            await this.executeDualPrograms(program, program2);
        }

        this.isRunning = false;

        if (!this.isGameOver) {
            const totalScore = this.scores[0] + (this.bunnyCount === 2 ? this.scores[1] : 0);
            this.setStatus(`完成！總得分：${totalScore}`, 'complete');
        }
    }

    /**
     * Execute two programs simultaneously (step by step alternating)
     */
    async executeDualPrograms(program1, program2) {
        let gen1 = this.createProgramGenerator(program1, 0);
        let gen2 = this.createProgramGenerator(program2, 1);

        let done1 = false, done2 = false;

        while (!done1 || !done2) {
            if (this.isGameOver) return;

            this.executionCounter++;
            if (this.executionCounter > this.executionLimit) {
                this.setStatus('程式執行過久', 'error');
                this.isGameOver = true;
                return;
            }

            // Execute one step for bunny 1
            if (!done1 && this.bunnyActive[0]) {
                let result = await gen1.next();
                done1 = result.done;
            } else {
                done1 = true;
            }

            // Execute one step for bunny 2
            if (!done2 && this.bunnyActive[1]) {
                let result = await gen2.next();
                done2 = result.done;
            } else {
                done2 = true;
            }
        }
    }

    /**
     * Create an async generator for step-by-step program execution
     */
    async *createProgramGenerator(nodes, bunnyIdx) {
        if (!nodes || !Array.isArray(nodes)) return;

        for (const node of nodes) {
            if (this.isGameOver || !this.bunnyActive[bunnyIdx]) return;
            yield await this.executeNodeForBunny(node, bunnyIdx);
        }
    }

    /**
     * Execute commands for a specific bunny
     */
    async executeCommandsForBunny(nodes, bunnyIdx) {
        if (!nodes || !Array.isArray(nodes)) return;

        for (const node of nodes) {
            this.executionCounter++;
            if (this.executionCounter > this.executionLimit) {
                this.setStatus('程式執行過久 (可能有無窮迴圈)', 'error');
                this.isGameOver = true;
                return;
            }

            if (this.isGameOver || !this.bunnyActive[bunnyIdx]) return;

            await this.executeNodeForBunny(node, bunnyIdx);
        }
    }

    /**
     * Execute a single AST node for specific bunny
     */
    async executeNodeForBunny(node, bunnyIdx) {
        if (!this.bunnyActive[bunnyIdx]) return;

        switch (node.type) {
            case 'If':
                const condition = this.evaluateForBunny(node.condition, bunnyIdx);
                if (condition) {
                    await this.executeCommandsForBunny(node.then, bunnyIdx);
                } else if (node.else) {
                    await this.executeCommandsForBunny(node.else, bunnyIdx);
                }
                break;

            case 'While':
                while (this.evaluateForBunny(node.condition, bunnyIdx)) {
                    if (this.isGameOver || !this.bunnyActive[bunnyIdx]) return;

                    if (this.executionCounter > this.executionLimit) {
                        this.setStatus('無窮迴圈偵測！', 'error');
                        this.isGameOver = true;
                        return;
                    }
                    this.executionCounter++;

                    await this.executeCommandsForBunny(node.body, bunnyIdx);
                }
                break;

            case 'Repeat':
                let times = node.times;
                if (typeof times === 'object') {
                    times = this.evaluateForBunny(times, bunnyIdx);
                }

                for (let i = 0; i < times; i++) {
                    if (this.isGameOver || !this.bunnyActive[bunnyIdx]) return;
                    await this.executeCommandsForBunny(node.body, bunnyIdx);
                }
                break;

            case 'F_Jump':
            case 'FR_Jump':
            case 'FL_Jump':
            case 'Turn':
                let val = node.value;
                if (typeof val === 'object') {
                    val = this.evaluateForBunny(val, bunnyIdx);
                }
                await this.executeCommandForBunny({ type: node.type, value: val }, bunnyIdx);
                break;
        }
    }

    /**
     * Execute a single command for specific bunny
     */
    async executeCommandForBunny(cmd, bunnyIdx) {
        switch (cmd.type) {
            case 'F_Jump':
                await this.F_Jump(cmd.value, bunnyIdx);
                break;
            case 'FR_Jump':
                await this.FR_Jump(cmd.value, bunnyIdx);
                break;
            case 'FL_Jump':
                await this.FL_Jump(cmd.value, bunnyIdx);
                break;
            case 'Turn':
                await this.Turn(cmd.value, bunnyIdx);
                break;
        }
    }

    /**
     * Evaluate an expression node for specific bunny
     */
    evaluateForBunny(node, bunnyIdx) {
        if (!node) return 0;
        if (typeof node === 'number' || typeof node === 'string' || typeof node === 'boolean') {
            return node;
        }

        const bunny = this.bunnies[bunnyIdx];

        switch (node.type) {
            case 'Number':
            case 'Boolean':
            case 'String':
                return node.value;

            case 'Get':
                if (node.name === 'bunny_x') return bunny ? bunny.x : 0;
                if (node.name === 'bunny_y') return bunny ? bunny.y : 0;
                return 0;

            case 'Binary':
                const left = this.evaluateForBunny(node.left, bunnyIdx);
                const right = this.evaluateForBunny(node.right, bunnyIdx);
                switch (node.op) {
                    case 'ADD': return left + right;
                    case 'MINUS': return left - right;
                    case 'MULTIPLY': return left * right;
                    case 'DIVIDE': return left / right;
                    case 'POWER': return Math.pow(left, right);
                    case 'MODULO': return left % right;
                    default: return 0;
                }

            case 'Compare':
                const cLeft = this.evaluateForBunny(node.left, bunnyIdx);
                const cRight = this.evaluateForBunny(node.right, bunnyIdx);
                switch (node.op) {
                    case 'EQ': return cLeft == cRight;
                    case 'NEQ': return cLeft != cRight;
                    case 'LT': return cLeft < cRight;
                    case 'LTE': return cLeft <= cRight;
                    case 'GT': return cLeft > cRight;
                    case 'GTE': return cLeft >= cRight;
                    default: return false;
                }

            case 'Logic':
                switch (node.op) {
                    case 'AND': return this.evaluateForBunny(node.left, bunnyIdx) && this.evaluateForBunny(node.right, bunnyIdx);
                    case 'OR': return this.evaluateForBunny(node.left, bunnyIdx) || this.evaluateForBunny(node.right, bunnyIdx);
                    default: return false;
                }

            case 'Not':
                return !this.evaluateForBunny(node.child, bunnyIdx);

            default:
                return 0;
        }
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
