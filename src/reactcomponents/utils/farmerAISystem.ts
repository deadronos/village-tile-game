import type { ActorEntity, PawnEntity, PlantEntity, ObjectEntity, ActionTypes, InventoryItem } from "../../ecs/ecs";
import { SIM_CONFIG } from "../../config/simConfig";
import { findPath } from "./pathfinding";
import * as THREE from "three";

// Helper to get inventory details
export function getInventoryItem(pawn: PawnEntity, type: string, cropType?: string): InventoryItem | undefined {
    return pawn.inventory?.find(item => item.itemType === type && (!cropType || item.cropType === cropType));
}

export function getWaterCan(pawn: PawnEntity): InventoryItem | undefined {
    return pawn.inventory?.find(item => item.itemType === "water can");
}

/**
 * Generates a plan of actions for the farmer pawn to grow and harvest wheat.
 */
export function generateFarmerPlan(
    _actor: ActorEntity,
    pawn: PawnEntity,
    entities: any[],
    tilemap: number[][],
    tileset: any[],
    addLog: (msg: string) => void
): ActionTypes[] {
    if (!pawn.position) return [];

    const seedItem = getInventoryItem(pawn, "seed", "wheat");
    const seedsCount = seedItem?.quantity ?? 0;

    const cropItem = getInventoryItem(pawn, "crop", "wheat");
    const cropsCount = cropItem?.quantity ?? 0;

    const waterCan = getWaterCan(pawn);
    const waterCanAmount = waterCan?.waterCanCurrentAmount ?? 0;

    const currentPos = { x: pawn.position.x, y: pawn.position.y };

    // Find Farmhouse, Barn and Well
    const farmhouse = entities.find(e => e.name === "Farmhouse") as ObjectEntity;
    const barn = entities.find(e => e.name === "Barn") as ObjectEntity;
    const well = entities.find(e => e.name === "Well") as ObjectEntity;

    // Get all plants
    const plants = entities.filter(e => 'growthStage' in e) as PlantEntity[];

    // 0. NIGHT SLEEP: If it's night (20:00 - 05:00), return to Farmhouse and sleep
    const gameState = entities.find(e => 'gameTick' in e);
    const currentHour = gameState?.currentHour ?? 12;
    const isNightTime = currentHour >= 20 || currentHour < 5;

    if (isNightTime && farmhouse && farmhouse.position) {
        const path = findPath(tilemap, tileset, currentPos, farmhouse.position, true);
        if (path && path.length > 0) {
            addLog("Night falls. Farmer Joe is returning to the Farmhouse to sleep.");
            const actions: ActionTypes[] = path.map(p => ({
                type: "move",
                targetPosition: { id: Date.now() + Math.random(), x: p.x, y: p.y }
            }));
            actions.push({
                type: "wait",
                waitDuration: 1
            });
            return actions;
        } else {
            // Already adjacent to the Farmhouse, sleep
            return [
                {
                    type: "wait",
                    waitDuration: 1
                }
            ];
        }
    }

    // 1. DEPOSIT: If we have harvested wheat, go deposit it in the Barn
    if (cropsCount >= 1 && barn && barn.position) {
        const path = findPath(tilemap, tileset, currentPos, barn.position, true);
        if (path && path.length >= 0) {
            addLog(`Farmer planning to deposit ${cropsCount} wheat in the Barn.`);
            const actions: ActionTypes[] = path.map(p => ({
                type: "move",
                targetPosition: { id: Date.now() + Math.random(), x: p.x, y: p.y }
            }));
            actions.push({
                type: "interact",
                targetPosition: barn.position,
                interactionType: "deposit"
            });
            return actions;
        }
    }

    // 2. REFILL WATER: If our water can is empty and there are crops that need water, go refill
    const cropsNeedWater = plants.some(p => p.needsWater && p.growthStage < p.maxGrowthStage);
    if (waterCanAmount === 0 && cropsNeedWater && well && well.position) {
        const path = findPath(tilemap, tileset, currentPos, well.position, true);
        if (path && path.length >= 0) {
            addLog("Water can empty. Farmer planning to refill at the Well.");
            const actions: ActionTypes[] = path.map(p => ({
                type: "move",
                targetPosition: { id: Date.now() + Math.random(), x: p.x, y: p.y }
            }));
            actions.push({
                type: "interact",
                targetPosition: well.position,
                interactionType: "refillWater"
            });
            return actions;
        }
    }

    // 3. HARVEST: If a crop is fully grown, go harvest it (highest priority crop action)
    const readyCrops = plants.filter(p => p.growthStage === p.maxGrowthStage && p.position);
    if (readyCrops.length > 0) {
        // Find nearest ready crop
        let nearestCrop: PlantEntity | null = null;
        let nearestPath: { x: number, y: number }[] | null = null;

        for (const crop of readyCrops) {
            const cropPos = crop.position!;
            const path = findPath(tilemap, tileset, currentPos, cropPos, false);
            if (path) {
                if (!nearestPath || path.length < nearestPath.length) {
                    nearestPath = path;
                    nearestCrop = crop;
                }
            }
        }

        if (nearestCrop && nearestPath) {
            addLog(`Farmer planning to harvest wheat at (${nearestCrop.position!.x}, ${nearestCrop.position!.y}).`);
            const actions: ActionTypes[] = nearestPath.map(p => ({
                type: "move",
                targetPosition: { id: Date.now() + Math.random(), x: p.x, y: p.y }
            }));
            actions.push({
                type: "interact",
                targetPosition: nearestCrop.position,
                interactionType: "harvest"
            });
            return actions;
        }
    }

    // 4. WATER: If we have water and some crops need watering, go water the nearest one
    if (waterCanAmount > 0 && cropsNeedWater) {
        const dryCrops = plants.filter(p => p.needsWater && p.growthStage < p.maxGrowthStage && p.position);
        let nearestCrop: PlantEntity | null = null;
        let nearestPath: { x: number, y: number }[] | null = null;

        for (const crop of dryCrops) {
            const cropPos = crop.position!;
            const path = findPath(tilemap, tileset, currentPos, cropPos, false);
            if (path) {
                if (!nearestPath || path.length < nearestPath.length) {
                    nearestPath = path;
                    nearestCrop = crop;
                }
            }
        }

        if (nearestCrop && nearestPath) {
            addLog(`Farmer planning to water wheat at (${nearestCrop.position!.x}, ${nearestCrop.position!.y}).`);
            const actions: ActionTypes[] = nearestPath.map(p => ({
                type: "move",
                targetPosition: { id: Date.now() + Math.random(), x: p.x, y: p.y }
            }));
            actions.push({
                type: "interact",
                targetPosition: nearestCrop.position,
                interactionType: "water"
            });
            return actions;
        }
    }

    // 5. PLANT: If we have seeds, plant them on empty fertile tiles
    if (seedsCount > 0) {
        // Find empty fertile tiles (Tile ID 5)
        const emptyFertileTiles: { x: number, y: number }[] = [];
        const height = tilemap.length;
        const width = tilemap[0].length;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (tilemap[y][x] === 5) {
                    // Check if there is already a plant here
                    const hasPlant = plants.some(p => p.position && p.position.x === x && p.position.y === y);
                    if (!hasPlant) {
                        emptyFertileTiles.push({ x, y });
                    }
                }
            }
        }

        if (emptyFertileTiles.length > 0) {
            // Find nearest empty fertile tile
            let nearestTile: { x: number, y: number } | null = null;
            let nearestPath: { x: number, y: number }[] | null = null;

            for (const tile of emptyFertileTiles) {
                const path = findPath(tilemap, tileset, currentPos, tile, false);
                if (path) {
                    if (!nearestPath || path.length < nearestPath.length) {
                        nearestPath = path;
                        nearestTile = tile;
                    }
                }
            }

            if (nearestTile && nearestPath) {
                addLog(`Farmer planning to plant wheat seed at (${nearestTile.x}, ${nearestTile.y}).`);
                const actions: ActionTypes[] = nearestPath.map(p => ({
                    type: "move",
                    targetPosition: { id: Date.now() + Math.random(), x: p.x, y: p.y }
                }));
                actions.push({
                    type: "interact",
                    targetPosition: { id: Date.now() + Math.random(), x: nearestTile.x, y: nearestTile.y },
                    interactionType: "plant"
                });
                return actions;
            }
        }
    }

    // 6. IDLE: Walk to a random adjacent tile and wait
    addLog("Farmer has no immediate tasks. Idle.");
    return [
        {
            type: "wait",
            waitDuration: 2
        }
    ];
}

/**
 * Executes the next queued action for the actor and pawn.
 */
export function executeFarmerAction(
    actor: ActorEntity,
    pawn: PawnEntity,
    world: any,
    gameState: any,
    addLog: (msg: string) => void,
    cropMesh: THREE.Mesh
): void {
    if (!actor.queuedActions || actor.queuedActions.length === 0) return;

    // Get the first action
    const currentAction = actor.queuedActions[0];

    if (currentAction.type === "move" && currentAction.targetPosition) {
        const target = currentAction.targetPosition;
        if (pawn.position) {
            // Store previous position for smooth lerp rendering
            (pawn as any).prevPosition = { x: pawn.position.x, y: pawn.position.y };
            
            // Update to new logical position
            pawn.position.x = target.x;
            pawn.position.y = target.y;
        }
        // Remove completed move action
        actor.queuedActions.shift();
    } else if (currentAction.type === "wait") {
        if (currentAction.waitDuration === undefined) {
            currentAction.waitDuration = 0;
        }
        currentAction.waitDuration -= 1;
        if (currentAction.waitDuration <= 0) {
            actor.queuedActions.shift();
        }
    } else if (currentAction.type === "interact" && currentAction.targetPosition) {
        const target = currentAction.targetPosition;
        const interaction = currentAction.interactionType;

        if (interaction === "plant") {
            // Deduct seed
            const seedItem = getInventoryItem(pawn, "seed", "wheat");
            if (seedItem && seedItem.quantity > 0) {
                seedItem.quantity -= 1;
                
                // Spawn new plant in world
                const plantId = Date.now() + Math.random();
                const newPlant: PlantEntity = {
                    id: plantId,
                    name: "Wheat Plant",
                    position: { id: plantId, x: target.x, y: target.y },
                    mesh: cropMesh,
                    growthStage: 0,
                    maxGrowthStage: SIM_CONFIG.maxGrowthStage,
                    growthTime: SIM_CONFIG.growthTime,
                    timeSinceLastGrowth: 0,
                    needsWater: true, // Needs water to grow
                    isRegisteredToGameTick: true,
                    cropType: "wheat",
                    onTick(_delta: number, _gameTick: number) {
                        // Managed by simulation loop
                    }
                };

                world.add(newPlant);
                gameState.gameObjects.push(newPlant);
                addLog(`Farmer planted wheat seed at (${target.x}, ${target.y}).`);
            }
        } else if (interaction === "water") {
            const waterCan = getWaterCan(pawn);
            if (waterCan && waterCan.waterCanCurrentAmount! > 0) {
                // Find plant at position
                const plant = world.entities.find((e: any) => 
                    'growthStage' in e && e.position && e.position.x === target.x && e.position.y === target.y
                ) as PlantEntity | undefined;

                if (plant) {
                    plant.needsWater = false;
                    plant.timeSinceLastGrowth = 0;
                    waterCan.waterCanCurrentAmount! -= 1;
                    addLog(`Farmer watered wheat at (${target.x}, ${target.y}). Water can: ${waterCan.waterCanCurrentAmount}/${waterCan.waterCanCapacity}`);
                }
            }
        } else if (interaction === "harvest") {
            // Find plant at position
            const plant = world.entities.find((e: any) => 
                'growthStage' in e && e.position && e.position.x === target.x && e.position.y === target.y
            ) as PlantEntity | undefined;

            if (plant) {
                // Remove crop
                world.remove(plant);
                const idx = gameState.gameObjects.indexOf(plant);
                if (idx > -1) {
                    gameState.gameObjects.splice(idx, 1);
                }

                // Add to inventory
                const cropItem = getInventoryItem(pawn, "crop", "wheat");
                if (cropItem) {
                    cropItem.quantity += 1;
                } else {
                    pawn.inventory?.push({ itemType: "crop", cropType: "wheat", quantity: 1 });
                }

                // Sustain: give seeds back
                const seedItem = getInventoryItem(pawn, "seed", "wheat");
                const addedSeeds = Math.random() > 0.5 ? 2 : 1; // get 1 or 2 seeds back
                if (seedItem) {
                    seedItem.quantity += addedSeeds;
                } else {
                    pawn.inventory?.push({ itemType: "seed", cropType: "wheat", quantity: addedSeeds });
                }

                addLog(`Farmer harvested wheat at (${target.x}, ${target.y}). Gained 1 wheat and ${addedSeeds} seeds.`);
            }
        } else if (interaction === "deposit") {
            const barn = world.entities.find((e: any) => e.name === "Barn") as ObjectEntity | undefined;
            const cropItem = getInventoryItem(pawn, "crop", "wheat");
            const count = cropItem?.quantity ?? 0;

            if (barn && count > 0) {
                if ((barn as any).storedWheat === undefined) {
                    (barn as any).storedWheat = 0;
                }
                (barn as any).storedWheat += count;
                cropItem!.quantity = 0;
                addLog(`Farmer deposited ${count} wheat in the Barn. Total Stored: ${(barn as any).storedWheat}`);
            }
        } else if (interaction === "refillWater") {
            const waterCan = getWaterCan(pawn);
            if (waterCan) {
                waterCan.waterCanCurrentAmount = waterCan.waterCanCapacity;
                addLog(`Farmer refilled water can at the Well. Water can capacity: ${waterCan.waterCanCurrentAmount}/${waterCan.waterCanCapacity}`);
            }
        }

        // Remove completed interact action
        actor.queuedActions.shift();
    }
}
