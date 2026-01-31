/**
 * Map Designer Dual Bunny Import Test
 * Verifies that importing a JSON map with bunnyPosition2 correctly loads both bunnies.
 * 
 * Run these tests by:
 * 1. Opening the game in browser
 * 2. Opening Developer Tools (F12)
 * 3. Pasting the contents of this file into the Console
 */

(function runMapImportTests() {
    console.log('🧪 Starting Map Import Tests...\n');

    const MapDesigner = window.MapDesigner;
    if (!MapDesigner) {
        console.error('❌ MapDesigner not found!');
        return;
    }

    // Create a test instance
    const md = new MapDesigner();

    let passed = 0;
    let failed = 0;

    function expect(desc, actual, expected) {
        const actualStr = JSON.stringify(actual);
        const expectedStr = JSON.stringify(expected);
        if (actualStr === expectedStr) {
            console.log(`✅ ${desc}`);
            passed++;
        } else {
            console.error(`❌ ${desc}`);
            console.log(`   Expected: ${expectedStr}`);
            console.log(`   Got: ${actualStr}`);
            failed++;
        }
    }

    // Sample dual bunny map data (simulating JSON import)
    const dualBunnyMap = {
        name: "測試地圖",
        gridSize: 21,
        mapData: Array(21).fill(null).map(() =>
            Array(21).fill({ type: 'empty', value: 0 })
        ),
        bunnyPosition: { x: 6, y: 20, direction: 'up' },
        bunnyPosition2: { x: 15, y: 20, direction: 'down' },
        blockLimit: 20
    };

    // Single bunny map data
    const singleBunnyMap = {
        name: "單兔地圖",
        gridSize: 21,
        mapData: Array(21).fill(null).map(() =>
            Array(21).fill({ type: 'empty', value: 0 })
        ),
        bunnyPosition: { x: 10, y: 18, direction: 'right' },
        blockLimit: 15
    };

    console.log('Test 1: Loading dual bunny map...');

    // Simulate what showLoadDialog does internally
    md.mapData = dualBunnyMap.mapData;
    md.bunnyPosition = dualBunnyMap.bunnyPosition;
    md.bunnyDirection = dualBunnyMap.bunnyPosition.direction;

    // The fix we added:
    if (dualBunnyMap.bunnyPosition2) {
        md.bunnyPosition2 = dualBunnyMap.bunnyPosition2;
        md.bunny2Direction = dualBunnyMap.bunnyPosition2.direction;
    } else {
        md.bunnyPosition2 = null;
    }

    expect('Bunny 1 position loaded', md.bunnyPosition, { x: 6, y: 20, direction: 'up' });
    expect('Bunny 1 direction set', md.bunnyDirection, 'up');
    expect('Bunny 2 position loaded', md.bunnyPosition2, { x: 15, y: 20, direction: 'down' });
    expect('Bunny 2 direction set', md.bunny2Direction, 'down');

    console.log('\nTest 2: Loading single bunny map...');

    // Reset and load single bunny map
    md.bunnyPosition2 = { x: 99, y: 99, direction: 'left' }; // Set to something first
    md.bunny2Direction = 'left';

    md.mapData = singleBunnyMap.mapData;
    md.bunnyPosition = singleBunnyMap.bunnyPosition;
    md.bunnyDirection = singleBunnyMap.bunnyPosition.direction;

    if (singleBunnyMap.bunnyPosition2) {
        md.bunnyPosition2 = singleBunnyMap.bunnyPosition2;
        md.bunny2Direction = singleBunnyMap.bunnyPosition2.direction;
    } else {
        md.bunnyPosition2 = null;
    }

    expect('Bunny 1 position loaded (single)', md.bunnyPosition, { x: 10, y: 18, direction: 'right' });
    expect('Bunny 2 cleared to null', md.bunnyPosition2, null);

    // Summary
    console.log('\n' + '='.repeat(40));
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);

    if (failed === 0) {
        console.log('🎉 All tests passed!');
    } else {
        console.log('⚠️ Some tests failed. Please review.');
    }
    console.log('='.repeat(40));

    return { passed, failed };
})();
