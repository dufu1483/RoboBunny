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
        this.isRunInProgress = false;

        // Dual bunny support
        this.currentBunny = 1; // 1 or 2
        this.workspaceStates = [null, null]; // Saved XML for each bunny

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
                        'colour': '#5ba55b',
                        'contents': [
                            {
                                'kind': 'block',
                                'type': 'controls_repeat_ext',
                                'inputs': {
                                    'TIMES': {
                                        'shadow': {
                                            'type': 'math_number',
                                            'fields': { 'NUM': 2 }
                                        }
                                    }
                                }
                            },
                            { 'kind': 'block', 'type': 'controls_whileUntil' },
                            { 'kind': 'block', 'type': 'controls_if' }
                        ]
                    },
                    {
                        'kind': 'category',
                        'name': '邏輯',
                        'colour': '#5b80a5',
                        'contents': [
                            { 'kind': 'block', 'type': 'logic_compare' },
                            { 'kind': 'block', 'type': 'logic_operation' },
                            { 'kind': 'block', 'type': 'logic_negate' },
                            { 'kind': 'block', 'type': 'logic_boolean' }
                        ]
                    },
                    {
                        'kind': 'category',
                        'name': '數學',
                        'colour': '#5b67a5',
                        'contents': [
                            { 'kind': 'block', 'type': 'math_number' },
                            { 'kind': 'block', 'type': 'math_arithmetic' },
                            { 'kind': 'block', 'type': 'math_modulo' }
                        ]
                    },
                    {
                        'kind': 'category',
                        'name': '兔子狀態',
                        'colour': '#a5745b',
                        'contents': [
                            { 'kind': 'block', 'type': 'bunny_x' },
                            { 'kind': 'block', 'type': 'bunny_y' }
                        ]
                    },
                    {
                        'kind': 'category',
                        'name': '變數',
                        'colour': '#a55b80',
                        'custom': 'VARIABLE'
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

            // Tab switching for dual bunny mode
            this.bindBunnyTabs();

            // Initial count update
            this.updateBlockCount();
        }, 100);
    }

    /**
     * Bind bunny tab switching events
     */
    bindBunnyTabs() {
        const tabs = document.querySelectorAll('.bunny-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const bunnyNum = parseInt(tab.dataset.bunny);
                this.switchToBunny(bunnyNum);

                // Update active state
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });
    }

    /**
     * Switch to a different bunny's workspace
     */
    switchToBunny(bunnyNum) {
        if (!this.workspace) return;
        if (bunnyNum === this.currentBunny) return;

        // Hide any open widgets (like dropdowns or input fields)
        if (Blockly.WidgetDiv) Blockly.WidgetDiv.hide();
        if (Blockly.DropDownDiv) Blockly.DropDownDiv.hideWithoutAnimation();

        // Save current workspace state
        this.workspaceStates[this.currentBunny - 1] = Blockly.Xml.workspaceToDom(this.workspace);

        // Clear workspace
        this.workspace.clear();

        // Load target bunny's workspace
        if (this.workspaceStates[bunnyNum - 1]) {
            Blockly.Xml.domToWorkspace(this.workspaceStates[bunnyNum - 1], this.workspace);
        }

        this.currentBunny = bunnyNum;
        this.updateBlockCount();
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

        // Custom block: bunny X position
        Blockly.Blocks['bunny_x'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField("兔子 X 座標");
                this.setOutput(true, 'Number');
                this.setColour(40);
                this.setTooltip("取得兔子當前的 X 座標");
            }
        };

        // Custom block: bunny Y position
        Blockly.Blocks['bunny_y'] = {
            init: function () {
                this.appendDummyInput()
                    .appendField("兔子 Y 座標");
                this.setOutput(true, 'Number');
                this.setColour(40);
                this.setTooltip("取得兔子當前的 Y 座標");
            }
        };
    }

    /**
     * Bind control button events
     */
    bindControlEvents() {
        document.getElementById('run-btn')?.addEventListener('click', () => this.runProgram());
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
    /**
     * Convert Blockly workspace to AST for GameEngine
     */
    getProgramAST() {
        if (!this.workspace) return [];

        const topBlocks = this.workspace.getTopBlocks(true); // Ordered by position
        if (topBlocks.length === 0) return [];

        // We assume the first top block is the start of the program
        const startBlock = topBlocks[0];

        return this.blocksToAST(startBlock);
    }

    /**
     * Recursively convert blocks to AST nodes
     */
    blocksToAST(startBlock) {
        const nodes = [];
        let currentBlock = startBlock;

        while (currentBlock) {
            if (!currentBlock.isEnabled()) {
                currentBlock = currentBlock.getNextBlock();
                continue;
            }

            const node = this.blockToNode(currentBlock);
            if (node) {
                nodes.push(node);
            }

            currentBlock = currentBlock.getNextBlock();
        }
        return nodes;
    }

    /**
     * Convert a single block to an AST node
     */
    blockToNode(block) {
        switch (block.type) {
            case 'variables_set': {
                const varName = block.getField('VAR').getText();
                const value = this.expressionToNode(block.getInputTargetBlock('VALUE')) || 0;
                return { type: 'SetVar', name: varName, value: value };
            }

            case 'math_change': {
                const varName = block.getField('VAR').getText();
                const delta = this.expressionToNode(block.getInputTargetBlock('DELTA')) || 1;
                return { type: 'ChangeVar', name: varName, delta: delta };
            }

            // --- Control Flow ---
            case 'controls_repeat_ext': {
                const timesBlock = block.getInputTargetBlock('TIMES');
                let times = 2;
                if (timesBlock) {
                    times = this.expressionToNode(timesBlock) || 2;
                }
                const bodyBlock = block.getInputTargetBlock('DO');
                return {
                    type: 'Repeat',
                    times: times,
                    body: this.blocksToAST(bodyBlock)
                };
            }
            case 'controls_whileUntil': {
                const conditionBlock = block.getInputTargetBlock('BOOL');
                const bodyBlock = block.getInputTargetBlock('DO');
                // Blockly 'UNTIL' is equivalent to 'While NOT'
                // But for simplicity, we map both to a generic while structure (logic handled in node evaluation)
                const isUntil = block.getFieldValue('MODE') === 'UNTIL';

                let condition = this.expressionToNode(conditionBlock);
                if (isUntil) {
                    condition = { type: 'Not', child: condition };
                }

                return {
                    type: 'While',
                    condition: condition,
                    body: this.blocksToAST(bodyBlock)
                };
            }
            case 'controls_if': {
                const conditionBlock = block.getInputTargetBlock('IF0');
                const bodyBlock = block.getInputTargetBlock('DO0');
                const elseBlock = block.getInputTargetBlock('ELSE');

                return {
                    type: 'If',
                    condition: this.expressionToNode(conditionBlock),
                    then: this.blocksToAST(bodyBlock),
                    else: elseBlock ? this.blocksToAST(elseBlock) : []
                };
            }

            // --- Actions ---
            case 'F_Jump':
            case 'FR_Jump':
            case 'FL_Jump':
            case 'Turn': {
                let val;
                // Check if the input is a field or a connected block (for future extensibility)
                // Currently these blocks use FieldDropdowns for values
                val = block.getFieldValue('VALUE');
                if (block.type.includes('Jump')) val = parseInt(val);
                return { type: block.type, value: val };
            }
        }
        return null; // Ignore unknown blocks
    }

    /**
     * Convert expression blocks to AST nodes
     */
    expressionToNode(block) {
        if (!block) return 0;

        switch (block.type) {
            case 'math_number':
                return parseFloat(block.getFieldValue('NUM'));

            case 'variables_get':
                return { type: 'GetVar', name: block.getField('VAR').getText() };

            case 'logic_boolean':
                return block.getFieldValue('BOOL') === 'TRUE';

            case 'math_arithmetic': {
                const op = block.getFieldValue('OP'); // ADD, MINUS, MULTIPLY, DIVIDE, POWER
                const left = this.expressionToNode(block.getInputTargetBlock('A'));
                const right = this.expressionToNode(block.getInputTargetBlock('B'));
                return { type: 'Binary', op: op, left: left, right: right };
            }

            case 'logic_compare': {
                const op = block.getFieldValue('OP'); // EQ, NEQ, LT, LTE, GT, GTE
                const left = this.expressionToNode(block.getInputTargetBlock('A'));
                const right = this.expressionToNode(block.getInputTargetBlock('B'));
                return { type: 'Compare', op: op, left: left, right: right };
            }

            case 'logic_operation': {
                const op = block.getFieldValue('OP'); // AND, OR
                const left = this.expressionToNode(block.getInputTargetBlock('A'));
                const right = this.expressionToNode(block.getInputTargetBlock('B'));
                return { type: 'Logic', op: op, left: left, right: right };
            }

            case 'logic_negate': {
                return { type: 'Not', child: this.expressionToNode(block.getInputTargetBlock('BOOL')) };
            }

            case 'math_modulo': {
                const left = this.expressionToNode(block.getInputTargetBlock('DIVIDEND'));
                const right = this.expressionToNode(block.getInputTargetBlock('DIVISOR'));
                return { type: 'Binary', op: 'MODULO', left: left, right: right };
            }

            case 'bunny_x':
                return { type: 'Get', name: 'bunny_x' };

            case 'bunny_y':
                return { type: 'Get', name: 'bunny_y' };
        }
        return 0;
    }

    async runProgram() {
        if (this.isRunInProgress || this.gameEngine.isRunning) {
            this.gameEngine.setStatus('\u7a0b\u5f0f\u57f7\u884c\u4e2d\uff0c\u8acb\u7a0d\u5019...', 'warning');
            return;
        }

        this.isRunInProgress = true;
        const runBtn = document.getElementById('run-btn');
        if (runBtn) runBtn.disabled = true;

        try {
            // Save current workspace to avoid losing unswitched edits.
            this.workspaceStates[this.currentBunny - 1] = Blockly.Xml.workspaceToDom(this.workspace);

            const program1 = this.getProgramASTFromState(0);
            let program2 = null;

            // Check if dual bunny mode
            if (this.gameEngine.bunnyCount === 2) {
                program2 = this.getProgramASTFromState(1);
            }

            if (program1.length === 0 && (!program2 || program2.length === 0)) {
                alert('\u8acb\u5148\u5efa\u7acb\u7a0b\u5f0f\uff01');
                return;
            }

            if (!this.gameEngine.mapData) {
                alert('\u8acb\u5148\u9078\u64c7\u5730\u5716\uff01');
                return;
            }

            this.resetGame();
            await new Promise(resolve => setTimeout(resolve, 100));

            await this.gameEngine.executeProgram(program1, program2);
        } finally {
            this.isRunInProgress = false;
            if (runBtn) runBtn.disabled = false;
        }
    }

    /**
     * Get AST from saved workspace state
     */
    getProgramASTFromState(bunnyIndex) {
        const state = this.workspaceStates[bunnyIndex];
        if (!state) return [];

        // Create a temporary hidden workspace to parse the XML
        const tempDiv = document.createElement('div');
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);

        const tempWorkspace = Blockly.inject(tempDiv, { readOnly: true });
        Blockly.Xml.domToWorkspace(state, tempWorkspace);

        const topBlocks = tempWorkspace.getTopBlocks(true);
        let ast = [];
        if (topBlocks.length > 0) {
            ast = this.blocksToASTFromWorkspace(topBlocks[0], tempWorkspace);
        }

        tempWorkspace.dispose();
        document.body.removeChild(tempDiv);

        return ast;
    }

    /**
     * Convert blocks to AST from a specific workspace
     */
    blocksToASTFromWorkspace(startBlock, workspace) {
        const nodes = [];
        let currentBlock = startBlock;

        while (currentBlock) {
            if (!currentBlock.isEnabled()) {
                currentBlock = currentBlock.getNextBlock();
                continue;
            }

            const node = this.blockToNode(currentBlock);
            if (node) {
                nodes.push(node);
            }

            currentBlock = currentBlock.getNextBlock();
        }
        return nodes;
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
            // Hide artifacts when resizing/switching views
            if (Blockly.WidgetDiv) Blockly.WidgetDiv.hide();
            if (Blockly.DropDownDiv) Blockly.DropDownDiv.hideWithoutAnimation();

            Blockly.svgResize(this.workspace);
        }
    }
}

// Export for use in other modules
window.BlockEditor = BlockEditor;
