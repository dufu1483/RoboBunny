/**
 * Block Editor Module
 * Visual programming interface for RoboBunny
 */

class BlockEditor {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.program = [];
        this.blockLimit = 20;
        this.currentStep = 0;
        this.draggedBlockIndex = null;

        this.init();
    }

    /**
     * Initialize the block editor
     */
    init() {
        this.bindDragEvents();
        this.bindControlEvents();
        this.updateBlockCount();
    }

    /**
     * Bind drag and drop events
     */
    bindDragEvents() {
        // Palette blocks
        document.querySelectorAll('.block-palette .block-item').forEach(block => {
            block.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('blockType', block.dataset.block);
                e.dataTransfer.setData('isNew', 'true');
                const param = block.querySelector('.block-param');
                if (param) {
                    e.dataTransfer.setData('blockValue', param.value);
                }
            });
        });

        // Program area (only handles drops that don't hit specific blocks)
        const programArea = document.getElementById('program-blocks');
        if (programArea) {
            programArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                programArea.classList.add('drag-over');
            });

            programArea.addEventListener('dragleave', (e) => {
                // Only remove if leaving the program area itself
                if (e.target === programArea) {
                    programArea.classList.remove('drag-over');
                }
            });

            programArea.addEventListener('drop', (e) => {
                e.preventDefault();
                programArea.classList.remove('drag-over');

                // Only add if not handled by a specific block
                if (e.target === programArea || e.target.classList.contains('drop-hint')) {
                    const blockType = e.dataTransfer.getData('blockType');
                    const blockValue = e.dataTransfer.getData('blockValue');
                    const isNew = e.dataTransfer.getData('isNew') === 'true';

                    if (isNew && this.countBlocks() < this.blockLimit) {
                        this.addBlock(blockType, blockValue, -1);
                    }
                }
            });
        }
    }

    /**
     * Get insert index based on Y position
     */
    getInsertIndex(clientY) {
        const blocks = document.querySelectorAll('.program-block');
        if (blocks.length === 0) return 0;

        for (let i = 0; i < blocks.length; i++) {
            const rect = blocks[i].getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            if (clientY < midY) {
                return i;
            }
        }
        return blocks.length;
    }

    /**
     * Count total blocks (including children in loops)
     */
    countBlocks() {
        let count = 0;
        const countRecursive = (blocks) => {
            for (const block of blocks) {
                count++;
                if (block.children && block.children.length > 0) {
                    countRecursive(block.children);
                }
            }
        };
        countRecursive(this.program);
        return count;
    }

    /**
     * Add a block to the program at specified index
     */
    addBlock(type, value, index = -1) {
        const block = {
            type: type,
            value: this.parseValue(type, value)
        };

        // Repeat blocks have children array
        if (type === 'Repeat') {
            block.children = [];
        }

        if (index === -1 || index >= this.program.length) {
            this.program.push(block);
        } else {
            this.program.splice(index, 0, block);
        }

        this.renderProgram();
        this.updateBlockCount();
    }

    /**
     * Parse value based on block type
     */
    parseValue(type, value) {
        switch (type) {
            case 'F_Jump':
            case 'FR_Jump':
            case 'FL_Jump':
            case 'Repeat':
                return parseInt(value) || 2;
            case 'Turn':
                return value || '右';
            default:
                return value;
        }
    }

    /**
     * Remove a block from the program
     */
    removeBlock(index) {
        this.program.splice(index, 1);
        this.renderProgram();
        this.updateBlockCount();
    }

    /**
     * Move block from one position to another
     */
    moveBlock(fromIndex, toIndex) {
        if (fromIndex === toIndex) return;

        const block = this.program.splice(fromIndex, 1)[0];
        if (toIndex > fromIndex) {
            toIndex--;
        }
        this.program.splice(toIndex, 0, block);
        this.renderProgram();
    }

    /**
     * Render the program blocks
     */
    renderProgram() {
        const container = document.getElementById('program-blocks');
        if (!container) return;

        container.innerHTML = '';

        if (this.program.length === 0) {
            container.innerHTML = '<div class="drop-hint">拖曳積木到這裡</div>';
            container.classList.remove('has-blocks');
            return;
        }

        container.classList.add('has-blocks');

        this.program.forEach((block, index) => {
            const el = this.createBlockElement(block, index, 0);
            container.appendChild(el);
        });

        // Add drop zones between blocks
        this.addDropZones(container);
    }

    /**
     * Create block element
     */
    createBlockElement(block, index, nestLevel) {
        const el = document.createElement('div');
        el.className = 'program-block';
        el.dataset.index = index;
        el.draggable = true;

        // Add control class for Repeat
        if (block.type === 'Repeat') {
            el.classList.add('control-block');
        }

        // Nesting style
        if (nestLevel > 0) {
            el.style.marginLeft = `${nestLevel * 20}px`;
        }

        el.innerHTML = this.getBlockHTML(block) +
            `<button class="delete-btn" data-index="${index}">×</button>`;

        // Drag events for reordering
        el.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            this.draggedBlockIndex = index;
            e.dataTransfer.setData('blockType', block.type);
            e.dataTransfer.setData('isNew', 'false');
            e.dataTransfer.setData('fromIndex', index.toString());
            el.classList.add('dragging');
        });

        el.addEventListener('dragend', () => {
            el.classList.remove('dragging');
            this.draggedBlockIndex = null;
        });

        // Delete button handler
        el.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeBlock(index);
        });

        // Value change handler
        const select = el.querySelector('.block-param');
        if (select) {
            select.addEventListener('change', (e) => {
                this.program[index].value = this.parseValue(block.type, e.target.value);
            });
            // Prevent drag start when interacting with input/select
            select.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });
        }

        // Children select for Repeat
        const childrenSelect = el.querySelector('.children-param');
        if (childrenSelect) {
            childrenSelect.addEventListener('change', (e) => {
                this.program[index].childBlockType = e.target.value;
            });
        }

        // If Repeat block, render children container
        if (block.type === 'Repeat') {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'loop-children';
            childrenContainer.dataset.parentIndex = index;

            // Drop zone for loop content
            childrenContainer.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                childrenContainer.classList.add('drag-over');
            });

            childrenContainer.addEventListener('dragleave', (e) => {
                childrenContainer.classList.remove('drag-over');
            });

            childrenContainer.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                childrenContainer.classList.remove('drag-over');

                const blockType = e.dataTransfer.getData('blockType');
                const blockValue = e.dataTransfer.getData('blockValue');
                const isNew = e.dataTransfer.getData('isNew') === 'true';

                if (isNew && this.countBlocks() < this.blockLimit) {
                    // Add to children (including nested Repeat)
                    const childBlock = {
                        type: blockType,
                        value: this.parseValue(blockType, blockValue)
                    };
                    if (blockType === 'Repeat') {
                        childBlock.children = [];
                    }
                    this.program[index].children.push(childBlock);
                    this.renderProgram();
                    this.updateBlockCount();
                }
            });

            // Render children
            if (block.children && block.children.length > 0) {
                block.children.forEach((child, childIdx) => {
                    const childEl = this.createChildBlockElement(child, index, childIdx, block.children);
                    childrenContainer.appendChild(childEl);
                });
            } else {
                const hint = document.createElement('div');
                hint.className = 'loop-hint';
                hint.textContent = '拖曳積木到迴圈內';
                childrenContainer.appendChild(hint);
            }

            el.appendChild(childrenContainer);
        }

        return el;
    }

    /**
     * Create child block element (inside a loop) - supports nested loops
     */
    createChildBlockElement(block, parentIndex, childIndex, parentChildren) {
        const el = document.createElement('div');
        el.className = 'program-block child-block';
        el.dataset.parentIndex = parentIndex;
        el.dataset.childIndex = childIndex;

        // Add control class for nested Repeat
        if (block.type === 'Repeat') {
            el.classList.add('control-block');
        }

        el.innerHTML = this.getBlockHTML(block) +
            `<button class="delete-btn">×</button>`;

        // Delete child
        el.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            parentChildren.splice(childIndex, 1);
            this.renderProgram();
            this.updateBlockCount();
        });

        // Value change
        const select = el.querySelector('.block-param');
        if (select) {
            select.addEventListener('change', (e) => {
                block.value = this.parseValue(block.type, e.target.value);
            });
            // Prevent drag start when interacting with input/select
            select.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });
        }

        // If nested Repeat, add children container
        if (block.type === 'Repeat') {
            if (!block.children) block.children = [];

            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'loop-children nested-loop';

            // Drop zone for nested loop content
            childrenContainer.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                childrenContainer.classList.add('drag-over');
            });

            childrenContainer.addEventListener('dragleave', (e) => {
                childrenContainer.classList.remove('drag-over');
            });

            childrenContainer.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                childrenContainer.classList.remove('drag-over');

                const blockType = e.dataTransfer.getData('blockType');
                const blockValue = e.dataTransfer.getData('blockValue');
                const isNew = e.dataTransfer.getData('isNew') === 'true';

                if (isNew && this.countBlocks() < this.blockLimit) {
                    const newChild = {
                        type: blockType,
                        value: this.parseValue(blockType, blockValue)
                    };
                    if (blockType === 'Repeat') {
                        newChild.children = [];
                    }
                    block.children.push(newChild);
                    this.renderProgram();
                    this.updateBlockCount();
                }
            });

            // Render nested children
            if (block.children.length > 0) {
                block.children.forEach((nestedChild, nestedIdx) => {
                    const nestedEl = this.createChildBlockElement(nestedChild, parentIndex, nestedIdx, block.children);
                    childrenContainer.appendChild(nestedEl);
                });
            } else {
                const hint = document.createElement('div');
                hint.className = 'loop-hint';
                hint.textContent = '拖曳積木到迴圈內';
                childrenContainer.appendChild(hint);
            }

            el.appendChild(childrenContainer);
        }

        return el;
    }

    /**
     * Add drop zones between blocks
     */
    addDropZones(container) {
        const blocks = container.querySelectorAll(':scope > .program-block');

        blocks.forEach((block, index) => {
            block.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const rect = block.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;

                block.classList.remove('drop-above', 'drop-below');
                if (e.clientY < midY) {
                    block.classList.add('drop-above');
                } else {
                    block.classList.add('drop-below');
                }
            });

            block.addEventListener('dragleave', () => {
                block.classList.remove('drop-above', 'drop-below');
            });

            block.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                block.classList.remove('drop-above', 'drop-below');

                const isNew = e.dataTransfer.getData('isNew') === 'true';
                const blockType = e.dataTransfer.getData('blockType');
                const blockValue = e.dataTransfer.getData('blockValue');

                const rect = block.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                let insertIndex = parseInt(block.dataset.index);

                if (e.clientY >= midY) {
                    insertIndex++;
                }

                if (isNew) {
                    if (this.countBlocks() < this.blockLimit) {
                        this.addBlock(blockType, blockValue, insertIndex);
                    }
                } else {
                    const fromIndex = parseInt(e.dataTransfer.getData('fromIndex'));
                    if (fromIndex !== insertIndex) {
                        this.moveBlock(fromIndex, insertIndex);
                    }
                }
            });
        });
    }

    /**
     * Get HTML for a block
     */
    getBlockHTML(block) {
        const colorClass = this.getBlockColorClass(block.type);

        switch (block.type) {
            case 'F_Jump':
                return `<span class="block-color ${colorClass}"></span>
                    F_Jump(<select class="block-param">
                        <option ${block.value === 1 ? 'selected' : ''}>1</option>
                        <option ${block.value === 2 ? 'selected' : ''}>2</option>
                    </select>)`;
            case 'FR_Jump':
                return `<span class="block-color ${colorClass}"></span>
                    FR_Jump(<select class="block-param">
                        <option ${block.value === 1 ? 'selected' : ''}>1</option>
                        <option ${block.value === 2 ? 'selected' : ''}>2</option>
                    </select>)`;
            case 'FL_Jump':
                return `<span class="block-color ${colorClass}"></span>
                    FL_Jump(<select class="block-param">
                        <option ${block.value === 1 ? 'selected' : ''}>1</option>
                        <option ${block.value === 2 ? 'selected' : ''}>2</option>
                    </select>)`;
            case 'Turn':
                return `<span class="block-color ${colorClass}"></span>
                    Turn(<select class="block-param">
                        <option ${block.value === '右' ? 'selected' : ''}>右</option>
                        <option ${block.value === '左' ? 'selected' : ''}>左</option>
                        <option ${block.value === '後' ? 'selected' : ''}>後</option>
                    </select>)`;
            case 'Repeat':
                return `<span class="block-color ${colorClass}"></span>
                    🔁 重複 <input type="number" class="block-param" value="${block.value}" min="1" max="99" style="width: 50px;"> 次`;
            default:
                return block.type;
        }
    }

    /**
     * Get color class for block type
     */
    getBlockColorClass(type) {
        switch (type) {
            case 'F_Jump': return 'jump';
            case 'FR_Jump': return 'jump-r';
            case 'FL_Jump': return 'jump-l';
            case 'Turn': return 'turn';
            case 'Repeat': return 'control';
            default: return '';
        }
    }

    /**
     * Update block count display
     */
    updateBlockCount() {
        const countEl = document.getElementById('block-count');
        const limitEl = document.getElementById('block-limit');
        const total = this.countBlocks();

        if (countEl) {
            countEl.textContent = total;
            countEl.style.color = total >= this.blockLimit ? '#ff6b6b' : 'inherit';
        }
        if (limitEl) {
            limitEl.textContent = this.blockLimit;
        }
    }

    /**
     * Clear the program
     */
    clearProgram() {
        if (this.program.length === 0) return;

        if (confirm('確定要清除所有程式積木嗎？')) {
            this.program = [];
            this.currentStep = 0;
            this.renderProgram();
            this.updateBlockCount();
        }
    }

    /**
     * Bind control button events
     */
    bindControlEvents() {
        document.getElementById('run-btn')?.addEventListener('click', () => this.runProgram());
        document.getElementById('step-btn')?.addEventListener('click', () => this.stepProgram());
        document.getElementById('reset-btn')?.addEventListener('click', () => this.resetGame());
        document.getElementById('clear-program')?.addEventListener('click', () => this.clearProgram());
    }

    /**
     * Flatten program for execution (expand loops)
     */
    flattenProgram() {
        const flat = [];
        const flatten = (blocks) => {
            for (const block of blocks) {
                if (block.type === 'Repeat' && block.children) {
                    for (let i = 0; i < block.value; i++) {
                        flatten(block.children);
                    }
                } else {
                    flat.push({ type: block.type, value: block.value });
                }
            }
        };
        flatten(this.program);
        return flat;
    }

    /**
     * Run the full program
     */
    async runProgram() {
        if (this.program.length === 0) {
            alert('請先建立程式！');
            return;
        }

        if (!this.gameEngine.mapData) {
            alert('請先選擇地圖！');
            return;
        }

        this.resetGame();
        await new Promise(resolve => setTimeout(resolve, 100));

        const flatProgram = this.flattenProgram();
        await this.gameEngine.executeProgram(flatProgram);
    }

    /**
     * Execute one step
     */
    async stepProgram() {
        if (this.program.length === 0) {
            alert('請先建立程式！');
            return;
        }

        if (!this.gameEngine.mapData) {
            alert('請先選擇地圖！');
            return;
        }

        if (this.gameEngine.isGameOver) {
            return;
        }

        const flatProgram = this.flattenProgram();
        const result = await this.gameEngine.executeStep(flatProgram, this.currentStep);

        if (result === -1) {
            this.gameEngine.setStatus(`完成！得分：${this.gameEngine.score}`, 'complete');
        } else {
            this.currentStep = result;
        }
    }

    /**
     * Reset the game
     */
    resetGame() {
        this.currentStep = 0;
        this.gameEngine.reset();
        document.querySelectorAll('.program-block').forEach(block => {
            block.classList.remove('active');
        });
    }

    /**
     * Get the current program
     */
    getProgram() {
        return this.program;
    }

    /**
     * Set the block limit
     */
    setBlockLimit(limit) {
        this.blockLimit = limit;
        this.updateBlockCount();
    }
}

// Export for use in other modules
window.BlockEditor = BlockEditor;
