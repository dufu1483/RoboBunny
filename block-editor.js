/**
 * Block Editor Module
 * Visual programming interface for RoboBunny using Blockly
 */

class BlockEditor {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.workspace = null;
        this.currentStep = 0;
        this.blockLimit = 20;

        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * Initialize the block editor
     */
    init() {
        this.defineBlocks();

        // Wait a tick to ensure container needs are met
        setTimeout(() => {
            if (!document.getElementById('blocklyDiv')) return;

            // Define toolbox using JSON format with categories
            const toolbox = {
                'kind': 'categoryToolbox',
                'contents': [
                    {
                        'kind': 'category',
                        'name': '移動指令',
                        'colour': '#5b80a5',
                        'contents': [
                            { 'kind': 'block', 'type': 'F_Jump' },
                            { 'kind': 'block', 'type': 'FR_Jump' },
                            { 'kind': 'block', 'type': 'FL_Jump' }
                        ]
                    },
                    {
                        'kind': 'category',
                        'name': '轉向指令',
                        'colour': '#5ba55b',
                        'contents': [
                            { 'kind': 'block', 'type': 'Turn' }
                        ]
                    },
                    {
                        'kind': 'category',
                        'name': '控制',
                        'colour': '#a55b80',
                        'contents': [
                            {
                                'kind': 'block',
                                'type': 'controls_repeat_ext',
                                'inputs': {
                                    'TIMES': {
                                        'shadow': {
                                            'type': 'math_number',
                                            'fields': {
                                                'NUM': 2
                                            }
                                        }
                                    }
                                }
                            }
                        ]
                    }
                ]
            };

            this.workspace = Blockly.inject('blocklyDiv', {
                toolbox: toolbox,
                scrollbars: true,
                trashcan: true,
            });

            // Set darker background manually for container
            const div = document.getElementById('blocklyDiv');
            if (div) div.style.backgroundColor = '#1e1e2f';

            this.bindControlEvents();
            this.workspace.addChangeListener(() => this.updateBlockCount());

            // Initial count update
            this.updateBlockCount();
        }, 100);
    }

    /**
     * Define custom blocks
     */
    /**
     * Define custom blocks
     */
    defineBlocks() {
        Blockly.Blocks['F_Jump'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField("向前跳")
                    .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"]]), "VALUE")
                    .appendField("格");
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(210);
                this.setTooltip("向前跳躍");
                this.setHelpUrl("");
            }
        };

        Blockly.Blocks['FR_Jump'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField("右前跳")
                    .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"]]), "VALUE")
                    .appendField("格");
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(260);
                this.setTooltip("向右前方跳躍");
                this.setHelpUrl("");
            }
        };

        Blockly.Blocks['FL_Jump'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField("左前跳")
                    .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"]]), "VALUE")
                    .appendField("格");
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(330);
                this.setTooltip("向左前方跳躍");
                this.setHelpUrl("");
            }
        };

        Blockly.Blocks['Turn'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField("轉向")
                    .appendField(new Blockly.FieldDropdown([["右", "右"], ["左", "左"], ["後", "後"]]), "VALUE");
                this.setPreviousStatement(true, null);
                this.setNextStatement(true, null);
                this.setColour(40);
                this.setTooltip("改變方向");
                this.setHelpUrl("");
            }
        };
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
     * Update block count display
     */
    updateBlockCount() {
        if (!this.workspace) return;

        const countEl = document.getElementById('block-count');
        const limitEl = document.getElementById('block-limit');
        const total = this.workspace.getAllBlocks(false).length;

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
        if (!this.workspace) return;
        if (this.workspace.getAllBlocks().length === 0) return;

        if (confirm('確定要清除所有程式積木嗎？')) {
            this.workspace.clear();
            this.resetGame();
        }
    }

    /**
     * Convert Blockly workspace to flat command array for GameEngine
     */
    getFlattenedProgram() {
        if (!this.workspace) return [];

        const topBlocks = this.workspace.getTopBlocks(true); // Ordered by position
        if (topBlocks.length === 0) return [];

        // We assume the first top block is the start of the program
        const startBlock = topBlocks[0];

        const traverse = (block) => {
            const cmds = [];
            let currentBlock = block;

            while (currentBlock) {
                if (!currentBlock.isEnabled()) {
                    currentBlock = currentBlock.getNextBlock();
                    continue;
                }

                if (currentBlock.type === 'controls_repeat_ext') {
                    // Handle Repeat Loop
                    const timesBlock = currentBlock.getInputTargetBlock('TIMES');
                    let repeatCount = 2; // Default
                    if (timesBlock && timesBlock.type === 'math_number') {
                        repeatCount = parseInt(timesBlock.getFieldValue('NUM')) || 2;
                    }

                    const branchBlock = currentBlock.getInputTargetBlock('DO');
                    const childCmds = traverse(branchBlock); // Recursively get children

                    // Flatten loop: repeat the commands N times
                    for (let i = 0; i < repeatCount; i++) {
                        cmds.push(...childCmds.map(cmd => ({ ...cmd }))); // Clone objects to avoid reference issues
                    }

                } else if (['F_Jump', 'FR_Jump', 'FL_Jump', 'Turn'].includes(currentBlock.type)) {
                    // Handle Action Blocks
                    let val = currentBlock.getFieldValue('VALUE');

                    // Parse numbers for jumps
                    if (currentBlock.type.includes('Jump')) {
                        val = parseInt(val);
                    }

                    cmds.push({
                        type: currentBlock.type,
                        value: val
                    });
                }

                currentBlock = currentBlock.getNextBlock();
            }
            return cmds;
        };

        return traverse(startBlock);
    }

    /**
     * Run the full program
     */
    async runProgram() {
        const program = this.getFlattenedProgram();
        if (program.length === 0) {
            alert('請先建立程式！');
            return;
        }

        if (!this.gameEngine.mapData) {
            alert('請先選擇地圖！');
            return;
        }

        this.resetGame();
        // Small delay to allow reset to visually clear
        await new Promise(resolve => setTimeout(resolve, 100));

        await this.gameEngine.executeProgram(program);
    }

    /**
     * Execute one step
     */
    async stepProgram() {
        const program = this.getFlattenedProgram();
        if (program.length === 0) {
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

        const result = await this.gameEngine.executeStep(program, this.currentStep);

        if (result === -1) {
            this.gameEngine.setStatus(`完成！得分：${this.gameEngine.score}`, 'complete');
        } else {
            this.currentStep = result;
        }
    }

    /**
     * Reset the game state
     */
    resetGame() {
        this.currentStep = 0;
        this.gameEngine.reset();
        if (this.workspace) {
            this.workspace.highlightBlock(null);
        }
    }

    setBlockLimit(limit) {
        this.blockLimit = limit;
        if (this.workspace) {
            this.updateBlockCount();
        }
    }

    /**
     * Resize workspace - call when container becomes visible
     */
    resize() {
        if (this.workspace) {
            Blockly.svgResize(this.workspace);
        }
    }
}

// Export for use in other modules
window.BlockEditor = BlockEditor;
