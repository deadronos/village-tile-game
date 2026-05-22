import React, { useContext, useEffect, useState } from "react";
import { ECSContext } from "../ecs/ecsProvider";
import type { GameStateEntity, PawnEntity, ActorEntity, PlantEntity, ObjectEntity } from "../ecs/ecs";
import { SIM_CONFIG } from "../config/simConfig";
import * as THREE from "three";

export default function HudUI(): React.ReactElement {
    const world = useContext(ECSContext);
    const [tick, setTick] = useState(0);
    const [simSpeed, setSimSpeed] = useState(1);

    // Find GameStateEntity
    const gameState = world.entities.find((entity): entity is GameStateEntity => "gameTick" in entity);

    // Poll simulation state to keep the HUD reactive
    useEffect(() => {
        const timer = setInterval(() => {
            if (gameState) {
                setTick(gameState.gameTick);
                setSimSpeed((gameState as any).simSpeed ?? 1);
            }
        }, 100); // 100ms refresh rate is fast and efficient
        return () => clearInterval(timer);
    }, [gameState]);

    if (!gameState) {
        return (
            <div className="hud-ui-loading">
                Connecting to simulation world...
            </div>
        );
    }

    const gState = gameState as any;
    const logs: string[] = gState.logMessages ?? [];
    
    const hour = gameState.currentHour;
    const day = gameState.currentDay;
    const season = gameState.season;
    const sunLightLevel = gameState.sunLightLevel;

    // Display daylight status
    let lightStatusIcon = "☀️";
    let lightStatusText = "Daytime";
    if (hour >= 20 || hour < 5) {
        lightStatusIcon = "🌙";
        lightStatusText = "Night (Dark)";
    } else if ((hour >= 5 && hour < 7) || (hour >= 18 && hour < 20)) {
        lightStatusIcon = "⛅";
        lightStatusText = "Dawn/Dusk";
    }

    const seasonEmoji = {
        spring: "🌸",
        summer: "☀️",
        autumn: "🍂",
        winter: "❄️"
    }[season] || "🌸";

    const formattedTime = `${String(hour).padStart(2, '0')}:00`;

    // Find static structures
    const barn = world.entities.find(e => (e as any).name === "Barn") as ObjectEntity | undefined;
    const storedWheat = barn ? ((barn as any).storedWheat ?? 0) : 0;
    
    const plants = world.entities.filter((e): e is PlantEntity => "growthStage" in e);
    const activeCropsCount = plants.length;

    // Find farmer pawn & actor
    const farmer = world.entities.find(e => (e as any).name === "Farmer Joe") as PawnEntity | undefined;
    const actor = world.entities.find(e => (e as any).name === "Farmer Joe Actor") as ActorEntity | undefined;

    // Get Farmer state
    let farmerStatus = "Idling";
    if (actor?.queuedActions && actor.queuedActions.length > 0) {
        const nextAction = actor.queuedActions[0];
        if (nextAction.type === "move") {
            farmerStatus = "Walking to task";
        } else if (nextAction.type === "wait") {
            const isNight = hour >= 20 || hour < 5;
            farmerStatus = isNight ? "Sleeping in Farmhouse" : "Resting/Idling";
        } else if (nextAction.type === "interact") {
            const iType = nextAction.interactionType;
            if (iType === "plant") farmerStatus = "Planting wheat seeds";
            else if (iType === "water") farmerStatus = "Watering dry wheat";
            else if (iType === "harvest") farmerStatus = "Harvesting ripe wheat";
            else if (iType === "deposit") farmerStatus = "Depositing wheat in Barn";
            else if (iType === "refillWater") farmerStatus = "Refilling water at Well";
        }
    }

    // Get Farmer inventory
    const seeds = farmer?.inventory?.find(i => i.itemType === "seed")?.quantity ?? 0;
    const wheat = farmer?.inventory?.find(i => i.itemType === "crop")?.quantity ?? 0;
    const waterCan = farmer?.inventory?.find(i => i.itemType === "water can");
    const waterAmt = waterCan?.waterCanCurrentAmount ?? 0;
    const waterCap = waterCan?.waterCanCapacity ?? 5;

    // Adjust simulation speed
    const changeSpeed = (speed: number) => {
        if (gameState) {
            (gameState as any).simSpeed = speed;
            setSimSpeed(speed);
            const status = speed === 0 ? "Paused" : `${speed}x`;
            if (logs) {
                logs.push(`[Tick ${gameState.gameTick}] Simulation speed set to ${status}.`);
            }
        }
    };

    // User Interaction: Gift seeds to farmer
    const giftSeeds = () => {
        if (farmer) {
            const seedItem = farmer.inventory?.find(i => i.itemType === "seed");
            if (seedItem) {
                seedItem.quantity += 5;
            } else {
                farmer.inventory?.push({ itemType: "seed", cropType: "wheat", quantity: 5 });
            }
            logs.push(`[Tick ${gameState.gameTick}] PLAYER: Gifted 5 wheat seeds to Farmer Joe.`);
        }
    };

    // User Interaction: Spawn a random dry crop
    const spawnCrop = () => {
        const height = gameState.gameMap.map?.tilemap.length ?? 0;
        const width = gameState.gameMap.map?.tilemap[0].length ?? 0;
        const tilemap = gameState.gameMap.map?.tilemap;

        if (height > 0 && width > 0 && tilemap) {
            // Find all empty fertile land tiles
            const empties: { x: number, y: number }[] = [];
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (tilemap[y][x] === 5) {
                        const hasPlant = plants.some(p => p.position?.x === x && p.position?.y === y);
                        if (!hasPlant) {
                            empties.push({ x, y });
                        }
                    }
                }
            }

            if (empties.length > 0) {
                const randomTile = empties[Math.floor(Math.random() * empties.length)];
                const plantId = Date.now() + Math.random();
                const newPlant: PlantEntity = {
                    id: plantId,
                    name: "Wheat Plant",
                    position: { id: plantId, x: randomTile.x, y: randomTile.y },
                    mesh: new THREE.Mesh(),
                    growthStage: 0,
                    maxGrowthStage: SIM_CONFIG.maxGrowthStage,
                    growthTime: SIM_CONFIG.growthTime,
                    timeSinceLastGrowth: 0,
                    needsWater: true,
                    isRegisteredToGameTick: true,
                    cropType: "wheat",
                    onTick() {}
                };
                world.add(newPlant);
                gameState.gameObjects.push(newPlant);
                logs.push(`[Tick ${gameState.gameTick}] PLAYER: Spawned a dry wheat crop at (${randomTile.x}, ${randomTile.y}).`);
            } else {
                logs.push(`[Tick ${gameState.gameTick}] PLAYER: Cannot spawn, no empty fertile tiles!`);
            }
        }
    };

    return (
        <div className="hud-dashboard">
            {/* Header */}
            <div className="hud-header" style={{ flexDirection: "column", alignItems: "flex-start", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                    <h2>🚜 Wheat Farm AI Simulator</h2>
                    <div className="hud-tick-pill">Tick: {tick}</div>
                </div>
                <div style={{ display: "flex", gap: "6px", width: "100%", marginTop: "2px" }}>
                    <span style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "10px",
                        fontWeight: "bold",
                        color: "#ccd6f6",
                        border: "1px solid rgba(255, 255, 255, 0.1)"
                    }}>{seasonEmoji} {season.charAt(0).toUpperCase() + season.slice(1)}</span>
                    <span style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "10px",
                        fontWeight: "bold",
                        color: "#ccd6f6",
                        border: "1px solid rgba(255, 255, 255, 0.1)"
                    }}>Day {day}</span>
                    <span style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "10px",
                        fontWeight: "bold",
                        color: "#64ffda",
                        border: "1px solid rgba(100, 255, 218, 0.2)"
                    }}>⏰ {formattedTime}</span>
                </div>
            </div>

            {/* Simulation controls */}
            <div className="hud-section speed-controls">
                <h3>⚡ Speed Controls</h3>
                <div className="button-group">
                    <button className={simSpeed === 0 ? "active" : ""} onClick={() => changeSpeed(0)}>⏸ Pause</button>
                    <button className={simSpeed === 1 ? "active" : ""} onClick={() => changeSpeed(1)}>1x</button>
                    <button className={simSpeed === 2 ? "active" : ""} onClick={() => changeSpeed(2)}>2x</button>
                    <button className={simSpeed === 5 ? "active" : ""} onClick={() => changeSpeed(5)}>5x</button>
                    <button className={simSpeed === 10 ? "active" : ""} onClick={() => changeSpeed(10)}>10x</button>
                </div>
            </div>

            {/* Environment Status */}
            <div className="hud-section" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "#8892b0" }}>🌞 Light Level:</span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "11px", color: "#ccd6f6" }}>{lightStatusIcon} {lightStatusText}</span>
                    <span style={{
                        background: "rgba(100, 255, 218, 0.12)",
                        color: "#64ffda",
                        padding: "1px 6px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: "bold"
                    }}>{Math.round(sunLightLevel * 100)}%</span>
                </div>
            </div>

            {/* Farm Stats */}
            <div className="hud-section stats-grid">
                <div className="stat-card">
                    <div className="stat-label">🏠 Wheat in Barn</div>
                    <div className="stat-value highlight">{storedWheat}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">🌱 Active Crops</div>
                    <div className="stat-value">{activeCropsCount}</div>
                </div>
            </div>

            {/* Farmer Joe Status */}
            {farmer && (
                <div className="hud-section farmer-card">
                    <h3>🤠 Farmer Joe</h3>
                    <div className="farmer-status">
                        <span className="label">Status:</span>
                        <span className="value">{farmerStatus}</span>
                    </div>
                    <div className="farmer-pos">
                        <span className="label">Position:</span>
                        <span className="value">({farmer.position?.x}, {farmer.position?.y})</span>
                    </div>
                    
                    <div className="farmer-inventory">
                        <h4>🎒 Inventory</h4>
                        <div className="inventory-grid">
                            <div className="inv-item">
                                <span className="icon">🌰</span>
                                <span className="name">Seeds:</span>
                                <span className="val">{seeds}</span>
                            </div>
                            <div className="inv-item">
                                <span className="icon">🌾</span>
                                <span className="name">Wheat:</span>
                                <span className="val">{wheat}</span>
                            </div>
                            <div className="inv-item">
                                <span className="icon">💧</span>
                                <span className="name">Water:</span>
                                <span className="val">{waterAmt}/{waterCap}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Player Interactions */}
            <div className="hud-section player-interactions">
                <h3>🎮 Interactivity</h3>
                <div className="button-group-vertical">
                    <button className="btn-interact" onClick={spawnCrop}>🌱 Spawn Wheat Crop</button>
                    <button className="btn-interact" onClick={giftSeeds}>🎁 Give Farmer +5 Seeds</button>
                </div>
            </div>

            {/* Event Console Logs */}
            <div className="hud-section console-logs">
                <h3>📜 Activity Console</h3>
                <div className="console-box">
                    {logs.slice(-8).reverse().map((log, i) => (
                        <div key={`log-${i}`} className="console-line">
                            {log}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}