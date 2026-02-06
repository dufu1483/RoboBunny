/**
 * Execution Control Tests
 *
 * Verifies:
 * 1. Reset interrupts an in-flight program.
 * 2. executeProgram cannot be re-entered while running.
 *
 * Run these tests by:
 * 1. Opening the game in browser
 * 2. Opening Developer Tools (F12)
 * 3. Pasting the contents of this file into the Console
 */

(async function runExecutionControlTests() {
    console.log("Starting Execution Control Tests...\n");

    const GameEngine = window.GameEngine;
    if (!GameEngine) {
        console.error("GameEngine not found! Make sure game-engine.js is loaded.");
        return;
    }

    let passed = 0;
    let failed = 0;

    function expect(desc, actual, expected) {
        if (actual === expected) {
            console.log("PASS " + desc);
            passed++;
        } else {
            console.error("FAIL " + desc + " | expected: " + expected + ", got: " + actual);
            failed++;
        }
    }

    function makeEmptyMap(size) {
        const map = [];
        for (let y = 0; y < size; y++) {
            const row = [];
            for (let x = 0; x < size; x++) {
                row.push({ type: "empty", value: 0 });
            }
            map.push(row);
        }
        return map;
    }

    function makeMapObject() {
        return {
            mapData: makeEmptyMap(21),
            bunnyPosition: { x: 10, y: 10, direction: "up" }
        };
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Test 1: reset() should interrupt active execution and prevent old async flow from mutating state.
    console.log("Test 1: reset interrupts running program");
    {
        const ge = new GameEngine();
        ge.loadMap(makeMapObject());
        ge.stepDelay = 60;

        const longProgram = [
            {
                type: "Repeat",
                times: 20,
                body: [{ type: "F_Jump", value: 1 }]
            }
        ];

        const runPromise = ge.executeProgram(longProgram);
        await sleep(10);
        ge.reset();

        const runResult = await runPromise;
        await sleep(120);

        expect("run result after reset", runResult, false);
        expect("bunny x stays at reset position", ge.bunnies[0].x, 10);
        expect("bunny y stays at reset position", ge.bunnies[0].y, 10);
        expect("move count reset and not overwritten", ge.moveCounts[0], 0);
        expect("engine is not running", ge.isRunning, false);
    }

    // Test 2: executeProgram should reject re-entry while already running.
    console.log("\nTest 2: executeProgram re-entry guard");
    {
        const ge = new GameEngine();
        ge.loadMap(makeMapObject());
        ge.stepDelay = 60;

        const program = [
            {
                type: "Repeat",
                times: 5,
                body: [{ type: "F_Jump", value: 1 }]
            }
        ];

        const firstPromise = ge.executeProgram(program);
        await sleep(5);
        const secondResult = await ge.executeProgram(program);
        const firstResult = await firstPromise;

        expect("second executeProgram returns false while running", secondResult, false);
        expect("first executeProgram completes", firstResult, true);
        expect("engine unlocked after completion", ge.isRunning, false);
    }

    console.log("\n" + "=".repeat(40));
    console.log("Execution Control Results: " + passed + " passed, " + failed + " failed");
    console.log("=".repeat(40));

    return { passed, failed };
})();
