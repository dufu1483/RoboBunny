/**
 * Main Application Module
 * Initializes and coordinates all game modules
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize modules
    const mapDesigner = new MapDesigner();
    const gameEngine = new GameEngine();
    const blockEditor = new BlockEditor(gameEngine);

    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;

            // Update buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update content
            tabContents.forEach(content => {
                content.classList.toggle('active', content.id === `${tabId}-tab`);
            });

            // Refresh map selector when switching to game tab
            if (tabId === 'game') {
                mapDesigner.loadSavedMaps();
                blockEditor.resize();
            }
        });
    });

    // Map selector in game tab
    const mapSelector = document.getElementById('map-selector');
    if (mapSelector) {
        mapSelector.addEventListener('change', (e) => {
            const mapName = e.target.value;
            if (mapName) {
                const maps = mapDesigner.getSavedMaps();
                const mapData = maps[mapName];
                if (mapData) {
                    gameEngine.loadMap(mapData);
                    // Apply block limit from map
                    const blockLimit = mapData.blockLimit || 20;
                    blockEditor.setBlockLimit(blockLimit);
                }
            }
        });
    }

    // Create a sample map for demo purposes
    createSampleMap(mapDesigner);
});

/**
 * Create a sample map with some strawberries and stones
 */
function createSampleMap(mapDesigner) {
    const maps = mapDesigner.getSavedMaps();

    // Only create if no maps exist
    if (Object.keys(maps).length > 0) return;

    // Create sample map data
    const sampleMap = {
        name: '範例地圖',
        gridSize: 21,
        mapData: createEmptyMapData(21),
        bunnyPosition: { x: 10, y: 18, direction: 'up' },
        createdAt: new Date().toISOString()
    };

    // Add some strawberries in a pattern
    const strawberryPositions = [
        { x: 10, y: 16, value: 3 },
        { x: 10, y: 14, value: 2 },
        { x: 10, y: 12, value: 5 },
        { x: 8, y: 14, value: 2 },
        { x: 12, y: 14, value: 2 },
        { x: 8, y: 10, value: 4 },
        { x: 12, y: 10, value: 4 },
        { x: 10, y: 8, value: 6 },
        { x: 6, y: 12, value: 3 },
        { x: 14, y: 12, value: 3 },
    ];

    strawberryPositions.forEach(pos => {
        sampleMap.mapData[pos.y][pos.x] = { type: 'strawberry', value: pos.value };
    });

    // Add some stones
    const stonePositions = [
        { x: 9, y: 13 },
        { x: 11, y: 13 },
        { x: 7, y: 11 },
        { x: 13, y: 11 },
    ];

    stonePositions.forEach(pos => {
        sampleMap.mapData[pos.y][pos.x] = { type: 'stone', value: 0 };
    });

    // Save sample map
    const allMaps = { '範例地圖': sampleMap };
    localStorage.setItem('roboBunnyMaps', JSON.stringify(allMaps));

    // Refresh the map list
    mapDesigner.loadSavedMaps();
}

/**
 * Create empty map data
 */
function createEmptyMapData(size) {
    const map = [];
    for (let y = 0; y < size; y++) {
        const row = [];
        for (let x = 0; x < size; x++) {
            row.push({ type: 'empty', value: 0 });
        }
        map.push(row);
    }
    return map;
}
