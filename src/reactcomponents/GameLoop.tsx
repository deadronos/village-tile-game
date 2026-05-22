import React, { useContext, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { ECSContext } from "../ecs/ecsProvider";
import { SIM_CONFIG } from "../config/simConfig";
import type { GameStateEntity, PlantEntity, ActorEntity } from "../ecs/ecs";
import { generateFarmerPlan, executeFarmerAction } from "./utils/farmerAISystem";
import * as THREE from "three";

interface GameLoopProps {
    gameState: GameStateEntity | undefined;
    onTickUpdate?: () => void;
    onLogAdded?: () => void;
}

export default function GameLoop({ gameState, onTickUpdate, onLogAdded }: GameLoopProps): React.ReactElement | null {
    const world = useContext(ECSContext);
    const timeAccumulator = useRef(0);

    // Initialize custom state variables on gameState if not already present
    useEffect(() => {
        if (gameState) {
            const gState = gameState as any;
            if (gState.simSpeed === undefined) gState.simSpeed = 1;
            if (gState.logMessages === undefined) gState.logMessages = [`[Tick 0] Simulation initialized.`];
            if (gState.onTickUpdate === undefined) gState.onTickUpdate = onTickUpdate;
            if (gState.onLogAdded === undefined) gState.onLogAdded = onLogAdded;
        }
    }, [gameState, onTickUpdate, onLogAdded]);

    // Keep callbacks updated
    useEffect(() => {
        if (gameState) {
            const gState = gameState as any;
            gState.onTickUpdate = onTickUpdate;
            gState.onLogAdded = onLogAdded;
        }
    }, [gameState, onTickUpdate, onLogAdded]);

    useFrame((_state, delta) => {
        if (!world || !gameState || gameState.internalGameState !== "playing") return;

        const gState = gameState as any;
        const simSpeed = gState.simSpeed || 1;
        
        // Accumulate delta time
        timeAccumulator.current += delta;

        // Logical tick duration depends on simulation speed (speed multiplier)
        const tickDuration = SIM_CONFIG.tickDuration / simSpeed;

        if (timeAccumulator.current >= tickDuration) {
            // Decouple multiple ticks if frame rate dropped extremely low
            const ticksToProcess = Math.min(Math.floor(timeAccumulator.current / tickDuration), 5); // cap at 5 to prevent lockup
            timeAccumulator.current %= tickDuration;

            for (let i = 0; i < ticksToProcess; i++) {
                // 1. Advance Logical Tick & Time
                gameState.gameTick += 1;
                gameState.currentHour += 1;
                if (gameState.currentHour >= 24) {
                    gameState.currentHour = 0;
                    gameState.currentDay += 1;
                }

                // Calculate sunLightLevel based on hour
                const hour = gameState.currentHour;
                if (hour >= 20 || hour < 5) {
                    gameState.sunLightLevel = 0.0;
                } else if (hour >= 5 && hour < 7) {
                    gameState.sunLightLevel = (hour - 5) / 2.0;
                } else if (hour >= 7 && hour < 18) {
                    gameState.sunLightLevel = 1.0;
                } else { // 18 to 20
                    gameState.sunLightLevel = 1.0 - (hour - 18) / 2.0;
                }

                const addLog = (msg: string) => {
                    if (!gState.logMessages) gState.logMessages = [];
                    gState.logMessages.push(`[Day ${gameState.currentDay} - ${String(gameState.currentHour).padStart(2, '0')}:00] ${msg}`);
                    if (gState.logMessages.length > 50) gState.logMessages.shift();
                    if (gState.onLogAdded) gState.onLogAdded();
                };

                // Time-based notifications
                if (hour === 0) {
                    addLog(`📅 Day ${gameState.currentDay} has begun.`);
                } else if (hour === 5) {
                    addLog("🌅 Dawn is breaking. Sun rises in the east.");
                    // Wake up: clear plans to start working immediately
                    const actors = world.entities.filter((e): e is ActorEntity => "controller" in e && (e as any).controller?.type === "ai");
                    actors.forEach(actor => {
                        actor.queuedActions = [];
                    });
                } else if (hour === 7) {
                    addLog("☀️ Daytime. Crops are basking in full sunlight.");
                } else if (hour === 18) {
                    addLog("🌇 Dusk falls. The sun starts to set.");
                } else if (hour === 20) {
                    addLog("🌙 Night cycle. Crops have stopped growing.");
                    // Sleep: clear plans to return to farmhouse immediately
                    const actors = world.entities.filter((e): e is ActorEntity => "controller" in e && (e as any).controller?.type === "ai");
                    actors.forEach(actor => {
                        actor.queuedActions = [];
                    });
                }

                // 2. Growth System: Update crops growth
                const plants = world.entities.filter((e): e is PlantEntity => "growthStage" in e);
                plants.forEach(plant => {
                    if (plant.growthStage < plant.maxGrowthStage) {
                        if (!plant.needsWater) {
                            // Only grow if there is sunlight
                            if (gameState.sunLightLevel > 0.1) {
                                plant.timeSinceLastGrowth += 1; // 1 tick = 1 growth point
                                if (plant.timeSinceLastGrowth >= plant.growthTime) {
                                    plant.growthStage += 1;
                                    plant.timeSinceLastGrowth = 0;
                                    if (plant.growthStage < plant.maxGrowthStage) {
                                        plant.needsWater = true; // Soil becomes dry, needs watering again
                                    } else {
                                        addLog(`Wheat plant at (${plant.position?.x}, ${plant.position?.y}) is fully grown and ready to harvest!`);
                                    }
                                }
                            }
                        }
                    }
                });

                // 3. AI / Actor Decision and Action Execution System
                const actors = world.entities.filter((e): e is ActorEntity => "controller" in e && (e as any).controller?.type === "ai");
                actors.forEach(actor => {
                    const pawn = actor.pawnToActOn;
                    if (!pawn) return;

                    // If actor has no queued actions, generate a new plan
                    if (!actor.queuedActions || actor.queuedActions.length === 0) {
                        const tilemap = gameState.gameMap.map?.tilemap;
                        const tileset = gameState.gameMap.map?.tileset.tiles;
                        if (tilemap && tileset) {
                            actor.queuedActions = generateFarmerPlan(
                                actor,
                                pawn,
                                world.entities,
                                tilemap,
                                tileset,
                                addLog
                            );
                        }
                    }

                    // If actor has queued actions, execute the first action
                    if (actor.queuedActions && actor.queuedActions.length > 0) {
                        executeFarmerAction(
                            actor,
                            pawn,
                            world,
                            gameState,
                            addLog,
                            // Passing crop geometry
                            new THREE.Mesh(
                                new THREE.BoxGeometry(0.8, 1.0, 0.8),
                                new THREE.MeshBasicMaterial({ color: "yellow" })
                            )
                        );
                    }
                });
            }

            // Trigger re-render of HUD/UI when simulation ticks
            if (gState.onTickUpdate) {
                gState.onTickUpdate();
            }
        }
    });

    return null;
}
