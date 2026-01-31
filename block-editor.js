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
            this.bindProgramEvents();
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
        // Get program for bunny 1
        // First, make sure we have the current workspace saved
        this.workspaceStates[this.currentBunny - 1] = Blockly.Xml.workspaceToDom(this.workspace);

        const program1 = this.getProgramASTFromState(0);
        let program2 = null;

        // Check if dual bunny mode
        if (this.gameEngine.bunnyCount === 2) {
            program2 = this.getProgramASTFromState(1);
        }

        if (program1.length === 0 && (!program2 || program2.length === 0)) {
            alert('請先建立程式！');
            return;
        }

        if (!this.gameEngine.mapData) {
            alert('請先選擇地圖！');
            return;
        }

        this.resetGame();
        await new Promise(resolve => setTimeout(resolve, 100));

        await this.gameEngine.executeProgram(program1, program2);
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

    /**
     * Bind program save/load events
     */
    bindProgramEvents() {
        document.getElementById('save-program')?.addEventListener('click', () => this.saveProgram());
        document.getElementById('load-program')?.addEventListener('click', () => this.showProgramList());
        document.getElementById('export-program')?.addEventListener('click', () => this.exportProgram());
        document.getElementById('import-program')?.addEventListener('click', () => {
            document.getElementById('program-file-input')?.click();
        });
        document.getElementById('program-file-input')?.addEventListener('change', (e) => this.importProgram(e));
        document.getElementById('close-program-panel')?.addEventListener('click', () => {
            document.getElementById('saved-programs-panel').style.display = 'none';
        });
    }

    /**
     * Get the storage key for saved programs
     */
    getProgramStorageKey() {
        return 'roboBunny_savedPrograms';
    }

    /**
     * Get all saved programs from localStorage
     */
    getSavedPrograms() {
        const data = localStorage.getItem(this.getProgramStorageKey());
        return data ? JSON.parse(data) : [];
    }

    /**
     * Save program to localStorage
     */
    saveProgram() {
        if (!this.workspace) {
            alert('積木編輯器尚未準備好！');
            return;
        }

        // Get current workspace state
        this.workspaceStates[this.currentBunny - 1] = Blockly.Xml.workspaceToDom(this.workspace);

        const name = prompt('請輸入程式名稱：', `程式 ${new Date().toLocaleString('zh-TW')}`);
        if (!name) return;

        // Serialize all workspace states
        const programData = {
            name: name,
            timestamp: Date.now(),
            bunny1: this.workspaceStates[0] ? Blockly.Xml.domToText(this.workspaceStates[0]) : null,
            bunny2: this.workspaceStates[1] ? Blockly.Xml.domToText(this.workspaceStates[1]) : null
        };

        const savedPrograms = this.getSavedPrograms();
        savedPrograms.push(programData);
        localStorage.setItem(this.getProgramStorageKey(), JSON.stringify(savedPrograms));

        alert(`程式「${name}」已儲存！`);
        this.updateProgramList();
    }

    /**
     * Show the list of saved programs
     */
    showProgramList() {
        const panel = document.getElementById('saved-programs-panel');
        if (panel) {
            panel.style.display = 'block';
            this.updateProgramList();
        }
    }

    /**
     * Update the program list UI
     */
    updateProgramList() {
        const listEl = document.getElementById('program-list');
        if (!listEl) return;

        const savedPrograms = this.getSavedPrograms();

        if (savedPrograms.length === 0) {
            listEl.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">尚無儲存的程式</p>';
            return;
        }

        listEl.innerHTML = savedPrograms.map((prog, index) => `
            <div class="program-item" data-index="${index}">
                <span class="program-name">${prog.name}</span>
                <span class="program-date">${new Date(prog.timestamp).toLocaleDateString('zh-TW')}</span>
                <div class="program-actions-btns">
                    <button class="load-prog-btn" data-index="${index}">載入</button>
                    <button class="delete-prog-btn" data-index="${index}">刪除</button>
                </div>
            </div>
        `).join('');

        // Bind click events
        listEl.querySelectorAll('.load-prog-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.loadProgramByIndex(parseInt(btn.dataset.index));
            });
        });

        listEl.querySelectorAll('.delete-prog-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.deleteProgramByIndex(parseInt(btn.dataset.index));
            });
        });
    }

    /**
     * Load a program by its index in the saved list
     */
    loadProgramByIndex(index) {
        const savedPrograms = this.getSavedPrograms();
        if (index < 0 || index >= savedPrograms.length) return;

        const programData = savedPrograms[index];
        this.loadProgramData(programData);
    }

    /**
     * Load program data into the workspace
     */
    loadProgramData(programData) {
        if (!this.workspace) {
            alert('積木編輯器尚未準備好！');
            return;
        }

        // Clear current workspace
        this.workspace.clear();
        this.workspaceStates = [null, null];

        // Load bunny 1 program
        if (programData.bunny1) {
            try {
                const xml = Blockly.utils.xml.textToDom(programData.bunny1);
                this.workspaceStates[0] = xml;
            } catch (e) {
                console.error('Error parsing bunny1 program:', e);
            }
        }

        // Load bunny 2 program
        if (programData.bunny2) {
            try {
                const xml = Blockly.utils.xml.textToDom(programData.bunny2);
                this.workspaceStates[1] = xml;
            } catch (e) {
                console.error('Error parsing bunny2 program:', e);
            }
        }

        // Load current bunny's workspace
        const currentState = this.workspaceStates[this.currentBunny - 1];
        if (currentState) {
            Blockly.Xml.domToWorkspace(currentState, this.workspace);
        }

        this.updateBlockCount();
        document.getElementById('saved-programs-panel').style.display = 'none';
        alert(`程式「${programData.name}」已載入！`);
    }

    /**
     * Delete a program by its index
     */
    deleteProgramByIndex(index) {
        const savedPrograms = this.getSavedPrograms();
        if (index < 0 || index >= savedPrograms.length) return;

        const programName = savedPrograms[index].name;
        if (!confirm(`確定要刪除程式「${programName}」嗎？`)) return;

        savedPrograms.splice(index, 1);
        localStorage.setItem(this.getProgramStorageKey(), JSON.stringify(savedPrograms));
        this.updateProgramList();
    }

    /**
     * Export program to a JSON file
     */
    exportProgram() {
        if (!this.workspace) {
            alert('積木編輯器尚未準備好！');
            return;
        }

        // Get current workspace state
        this.workspaceStates[this.currentBunny - 1] = Blockly.Xml.workspaceToDom(this.workspace);

        const name = prompt('請輸入匯出檔案名稱：', `程式_${new Date().toLocaleDateString('zh-TW').replace(/\//g, '-')}`);
        if (!name) return;

        const programData = {
            name: name,
            timestamp: Date.now(),
            bunny1: this.workspaceStates[0] ? Blockly.Xml.domToText(this.workspaceStates[0]) : null,
            bunny2: this.workspaceStates[1] ? Blockly.Xml.domToText(this.workspaceStates[1]) : null
        };

        const json = JSON.stringify(programData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Import program from a file
     */
    importProgram(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const programData = JSON.parse(e.target.result);

                // Validate the data
                if (!programData.name || (!programData.bunny1 && !programData.bunny2)) {
                    throw new Error('無效的程式檔案格式');
                }

                this.loadProgramData(programData);
            } catch (error) {
                alert('匯入失敗：' + error.message);
            }
        };
        reader.readAsText(file);

        // Reset file input
        event.target.value = '';
    }
}

// Export for use in other modules
window.BlockEditor = BlockEditor;

