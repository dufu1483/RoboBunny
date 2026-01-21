/**
 * Map Designer Module
 * Handles the map creation interface for RoboBunny game
 */

class MapDesigner {
    constructor() {
        this.gridSize = 21;
        this.currentTool = 'cycle';
        this.strawberryCount = 1;
        this.bunnyDirection = 'up';
        this.mapData = this.createEmptyMap();
        this.bunnyPosition = null;

        this.init();
    }

    /**
     * Initialize the map designer
     */
    init() {
        this.createGrid();
        this.bindEvents();
        this.loadSavedMaps();
        this.updateStrawberryTotal();
    }

    /**
     * Create an empty map data structure
     */
    createEmptyMap() {
        const map = [];
        for (let y = 0; y < this.gridSize; y++) {
            const row = [];
            for (let x = 0; x < this.gridSize; x++) {
                row.push({ type: 'empty', value: 0 });
            }
            map.push(row);
        }
        return map;
    }

    /**
     * Create the grid UI
     */
    createGrid() {
        const grid = document.getElementById('designer-grid');
        if (!grid) return;

        grid.innerHTML = '';

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                grid.appendChild(cell);
            }
        }
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTool = btn.dataset.tool;
                this.updateToolOptions();
            });
        });

        // Strawberry count selection
        document.querySelectorAll('.count-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.strawberryCount = parseInt(btn.dataset.count);
            });
        });

        // Direction selection
        document.querySelectorAll('.dir-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.dir-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.bunnyDirection = btn.dataset.dir;
                if (this.bunnyPosition) {
                    this.renderGrid();
                }
            });
        });

        // Grid cell clicks
        const grid = document.getElementById('designer-grid');
        if (grid) {
            let isMouseDown = false;

            grid.addEventListener('mousedown', (e) => {
                isMouseDown = true;
                this.handleCellClick(e);
            });

            grid.addEventListener('mousemove', (e) => {
                if (isMouseDown) {
                    this.handleCellClick(e);
                }
            });

            document.addEventListener('mouseup', () => {
                isMouseDown = false;
            });
        }

        // Action buttons
        document.getElementById('clear-map')?.addEventListener('click', () => this.clearMap());
        document.getElementById('save-map')?.addEventListener('click', () => this.saveMap());
        document.getElementById('load-map')?.addEventListener('click', () => this.showLoadDialog());
        document.getElementById('export-map')?.addEventListener('click', () => this.exportMap());
    }

    /**
     * Update tool options visibility
     */
    updateToolOptions() {
        const strawberryOptions = document.getElementById('strawberry-options');
        const directionOptions = document.getElementById('direction-options');

        if (strawberryOptions) {
            strawberryOptions.style.display = this.currentTool === 'strawberry' ? 'block' : 'none';
        }
        if (directionOptions) {
            directionOptions.style.display = this.currentTool === 'bunny' ? 'block' : 'none';
        }
    }

    /**
     * Handle cell click for painting
     */
    handleCellClick(e) {
        const cell = e.target.closest('.cell');
        if (!cell) return;

        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);

        // Determine action based on current tool
        switch (this.currentTool) {
            case 'cycle':
                this.cycleCell(x, y);
                break;
            case 'empty':
                this.mapData[y][x] = { type: 'empty', value: 0 };
                if (this.bunnyPosition && this.bunnyPosition.x === x && this.bunnyPosition.y === y) {
                    this.bunnyPosition = null;
                }
                break;
            case 'strawberry':
                this.mapData[y][x] = { type: 'strawberry', value: this.strawberryCount };
                if (this.bunnyPosition && this.bunnyPosition.x === x && this.bunnyPosition.y === y) {
                    this.bunnyPosition = null;
                }
                break;
            case 'stone':
                this.mapData[y][x] = { type: 'stone', value: 0 };
                if (this.bunnyPosition && this.bunnyPosition.x === x && this.bunnyPosition.y === y) {
                    this.bunnyPosition = null;
                }
                break;
            case 'bunny':
                this.bunnyPosition = { x, y, direction: this.bunnyDirection };
                this.mapData[y][x] = { type: 'empty', value: 0 };
                break;
        }

        this.renderGrid();
        this.updateStrawberryTotal();
    }

    /**
     * Cycle cell content: Empty -> Strawberry(1-3) -> Stone -> Empty
     */
    cycleCell(x, y) {
        // If clicking on bunny, remove it and start cycle
        if (this.bunnyPosition && this.bunnyPosition.x === x && this.bunnyPosition.y === y) {
            this.bunnyPosition = null;
            this.mapData[y][x] = { type: 'empty', value: 0 };
            return;
        }

        const current = this.mapData[y][x];

        if (current.type === 'empty') {
            // Empty -> Strawberry 1
            this.mapData[y][x] = { type: 'strawberry', value: 1 };
        } else if (current.type === 'strawberry') {
            if (current.value < 3) {
                // Strawberry N -> Strawberry N+1
                this.mapData[y][x] = { type: 'strawberry', value: current.value + 1 };
            } else {
                // Strawberry >= 3 -> Stone
                this.mapData[y][x] = { type: 'stone', value: 0 };
            }
        } else if (current.type === 'stone') {
            // Stone -> Empty
            this.mapData[y][x] = { type: 'empty', value: 0 };
        } else {
            // Default reset
            this.mapData[y][x] = { type: 'empty', value: 0 };
        }
    }

    /**
     * Render the grid based on mapData
     */
    renderGrid() {
        const grid = document.getElementById('designer-grid');
        if (!grid) return;

        const cells = grid.querySelectorAll('.cell');

        cells.forEach(cell => {
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            const data = this.mapData[y][x];

            cell.className = 'cell';
            cell.innerHTML = '';

            // Check if bunny is here
            if (this.bunnyPosition && this.bunnyPosition.x === x && this.bunnyPosition.y === y) {
                cell.classList.add('bunny');
                const sprite = document.createElement('span');
                sprite.className = `bunny-sprite ${this.bunnyDirection}`;
                sprite.textContent = '🐰';
                cell.appendChild(sprite);
                return;
            }

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
        });
    }

    /**
     * Update the total strawberry count display
     */
    updateStrawberryTotal() {
        let total = 0;
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.mapData[y][x].type === 'strawberry') {
                    total += this.mapData[y][x].value;
                }
            }
        }

        const display = document.getElementById('total-strawberries');
        if (display) {
            display.textContent = `總草莓數：${total}`;
        }
    }

    /**
     * Clear the map
     */
    clearMap() {
        if (confirm('確定要清空地圖嗎？')) {
            this.mapData = this.createEmptyMap();
            this.bunnyPosition = null;
            this.renderGrid();
            this.updateStrawberryTotal();
        }
    }

    /**
     * Save the current map
     */
    saveMap() {
        if (!this.bunnyPosition) {
            alert('請先放置兔子的起始位置！');
            return;
        }

        const name = prompt('請輸入地圖名稱：', `地圖_${Date.now()}`);
        if (!name) return;

        const blockLimitInput = document.getElementById('block-limit-input');
        const blockLimit = blockLimitInput ? parseInt(blockLimitInput.value) || 20 : 20;

        const mapObject = {
            name: name,
            gridSize: this.gridSize,
            mapData: this.mapData,
            bunnyPosition: this.bunnyPosition,
            blockLimit: blockLimit,
            createdAt: new Date().toISOString()
        };

        const maps = this.getSavedMaps();
        maps[name] = mapObject;
        localStorage.setItem('roboBunnyMaps', JSON.stringify(maps));

        this.loadSavedMaps();
        alert('地圖已儲存！');
    }

    /**
     * Get saved maps from localStorage
     */
    getSavedMaps() {
        const data = localStorage.getItem('roboBunnyMaps');
        return data ? JSON.parse(data) : {};
    }

    /**
     * Load saved maps list
     */
    loadSavedMaps() {
        const maps = this.getSavedMaps();
        const listEl = document.getElementById('map-list');
        const selector = document.getElementById('map-selector');

        if (listEl) {
            listEl.innerHTML = '';
            Object.keys(maps).forEach(name => {
                const item = document.createElement('div');
                item.className = 'map-item';
                item.innerHTML = `
                    <span>${name}</span>
                    <button data-name="${name}">🗑️</button>
                `;
                item.querySelector('button').addEventListener('click', () => {
                    this.deleteMap(name);
                });
                item.addEventListener('click', (e) => {
                    if (e.target.tagName !== 'BUTTON') {
                        this.loadMap(name);
                    }
                });
                listEl.appendChild(item);
            });
        }

        // Update game tab selector
        if (selector) {
            selector.innerHTML = '<option value="">-- 選擇地圖 --</option>';
            Object.keys(maps).forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                selector.appendChild(option);
            });
        }
    }

    /**
     * Load a map by name
     */
    loadMap(name) {
        const maps = this.getSavedMaps();
        const map = maps[name];

        if (map) {
            this.mapData = map.mapData;
            this.bunnyPosition = map.bunnyPosition;
            this.bunnyDirection = map.bunnyPosition.direction;

            // Update direction button
            document.querySelectorAll('.dir-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.dir === this.bunnyDirection);
            });

            // Update block limit input
            const blockLimitInput = document.getElementById('block-limit-input');
            if (blockLimitInput && map.blockLimit) {
                blockLimitInput.value = map.blockLimit;
            }

            this.renderGrid();
            this.updateStrawberryTotal();
        }
    }

    /**
     * Delete a map by name
     */
    deleteMap(name) {
        if (confirm(`確定要刪除地圖「${name}」嗎？`)) {
            const maps = this.getSavedMaps();
            delete maps[name];
            localStorage.setItem('roboBunnyMaps', JSON.stringify(maps));
            this.loadSavedMaps();
        }
    }

    /**
     * Export current map data
     */
    exportMap() {
        if (!this.bunnyPosition) {
            alert('請先放置兔子的起始位置！');
            return;
        }

        const blockLimitInput = document.getElementById('block-limit-input');
        const blockLimit = blockLimitInput ? parseInt(blockLimitInput.value) || 20 : 20;

        const mapObject = {
            name: '匯出地圖',
            gridSize: this.gridSize,
            mapData: this.mapData,
            bunnyPosition: this.bunnyPosition,
            blockLimit: blockLimit,
            createdAt: new Date().toISOString()
        };

        const json = JSON.stringify(mapObject, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `robobunny_map_${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);
    }

    /**
     * Show load dialog - trigger file input
     */
    showLoadDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const mapObject = JSON.parse(event.target.result);

                    // Validate map data
                    if (!mapObject.mapData || !mapObject.bunnyPosition) {
                        throw new Error('無效的地圖檔案格式');
                    }

                    this.mapData = mapObject.mapData;
                    this.bunnyPosition = mapObject.bunnyPosition;
                    this.bunnyDirection = mapObject.bunnyPosition.direction;

                    // Update direction button
                    document.querySelectorAll('.dir-btn').forEach(btn => {
                        btn.classList.toggle('active', btn.dataset.dir === this.bunnyDirection);
                    });

                    this.renderGrid();
                    this.updateStrawberryTotal();

                    alert('地圖載入成功！');
                } catch (err) {
                    alert('載入失敗：' + err.message);
                }
            };
            reader.readAsText(file);
        };

        input.click();
    }
}

// Export for use in other modules
window.MapDesigner = MapDesigner;

