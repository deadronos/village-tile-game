import React, { useContext } from "react";
import { ECSContext } from "../ecs/ecsProvider";
import type { PlantEntity, GameStateEntity } from "../ecs/ecs";
import { Html } from "@react-three/drei";

interface GameCropsProps {
    maphasLoaded: boolean;
    gameState: GameStateEntity | undefined;
}

export default function GameCrops({ maphasLoaded, gameState }: GameCropsProps): React.ReactElement | null {
    const world = useContext(ECSContext);
    if (!world || !maphasLoaded || !gameState) return null;

    // Fetch all plants in the ECS world
    const plants = world.entities.filter((e): e is PlantEntity => "growthStage" in e);

    function PlantView({ plant }: { plant: PlantEntity }): React.ReactElement | null {
        if (!plant.position) return null;

        const { x, y } = plant.position;

        // Calculate size based on growth stage
        const pct = plant.growthStage / plant.maxGrowthStage;
        const scale = 0.25 + 0.75 * pct;
        const height = 0.7 * scale;

        // Determine color based on growth stage and water state
        let cropColor = "#32cd32"; // Lime green for early growth
        if (plant.growthStage === plant.maxGrowthStage) {
            cropColor = "#ffd700"; // Gold for fully mature
        } else if (plant.needsWater) {
            cropColor = "#cd853f"; // Peru/brownish for dry/wilted
        } else {
            // Blending from green to golden as stage increases
            const r = Math.floor(50 + 150 * pct);
            const g = Math.floor(205 - 10 * pct);
            const b = Math.floor(50 - 40 * pct);
            cropColor = `rgb(${r}, ${g}, ${b})`;
        }

        // Overlay status text / icon
        let overlayContent = null;
        if (plant.growthStage === plant.maxGrowthStage) {
            overlayContent = (
                <div style={{
                    background: "rgba(255, 215, 0, 0.95)",
                    color: "#000",
                    border: "1px solid #fff",
                    boxShadow: "0 0 10px #ffd700",
                    animation: "pulse 1.5s infinite"
                }} className="crop-badge">🌾 Harvest</div>
            );
        } else if (plant.needsWater) {
            overlayContent = (
                <div style={{
                    background: "rgba(205, 133, 63, 0.95)",
                    color: "#fff",
                    border: "1px solid #ff4500"
                }} className="crop-badge">💧 Dry</div>
            );
        } else {
            overlayContent = (
                <div style={{
                    background: "rgba(34, 139, 34, 0.85)",
                    color: "#fff",
                    border: "1px solid #7cfc00"
                }} className="crop-badge">🌱 Grow {plant.growthStage}/{plant.maxGrowthStage}</div>
            );
        }

        return (
            <group position={[x, height / 2, y]} key={`plant-${plant.id}`}>
                {/* Stem / main plant mesh */}
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[0.2 * scale, height, 0.2 * scale]} />
                    <meshStandardMaterial color={cropColor} roughness={0.6} />
                </mesh>
                
                {/* Leaves / head for mature plant */}
                {plant.growthStage > 0 && (
                    <mesh position={[0, height / 2, 0]} castShadow>
                        <sphereGeometry args={[0.25 * scale, 8, 8]} />
                        <meshStandardMaterial color={cropColor} roughness={0.8} />
                    </mesh>
                )}

                {/* HTML label */}
                <Html distanceFactor={8} position={[0, height + 0.3, 0]} center>
                    <style>{`
                        .crop-badge {
                            padding: 2px 6px;
                            border-radius: 4px;
                            font-family: 'Outfit', sans-serif;
                            font-size: 8px;
                            font-weight: bold;
                            white-space: nowrap;
                            pointer-events: none;
                            display: flex;
                            align-items: center;
                            gap: 2px;
                        }
                        @keyframes pulse {
                            0% { transform: scale(1); }
                            50% { transform: scale(1.08); }
                            100% { transform: scale(1); }
                        }
                    `}</style>
                    {overlayContent}
                </Html>
            </group>
        );
    }

    return (
        <group name="game-crops">
            {plants.map(plant => (
                <PlantView key={`plant-view-${plant.id}`} plant={plant} />
            ))}
        </group>
    );
}
