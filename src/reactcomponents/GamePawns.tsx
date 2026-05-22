import React, { useContext, useRef } from "react";
import { ECSContext } from "../ecs/ecsProvider";
import type { PawnEntity, GameStateEntity, ActorEntity } from "../ecs/ecs";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { getWaterCan, getInventoryItem } from "./utils/farmerAISystem";

interface GamePawnsProps {
    maphasLoaded: boolean;
    gameState: GameStateEntity | undefined;
}

export default function GamePawns({ maphasLoaded, gameState }: GamePawnsProps): React.ReactElement | null {
    const world = useContext(ECSContext);
    if (!world || !maphasLoaded || !gameState) return null;

    // Get all pawn entities in the world
    const pawns = world.entities.filter((e): e is PawnEntity => 
        "position" in e && 
        !("growthStage" in e) && 
        (e as any).name !== "Barn" && 
        (e as any).name !== "Well"
    );

    function PawnView({ pawn }: { pawn: PawnEntity }): React.ReactElement | null {
        const groupRef = useRef<THREE.Group>(null);

        // Find the actor associated with this pawn
        const actor = world.entities.find((e): e is ActorEntity => 
            "pawnToActOn" in e && (e as any).pawnToActOn?.id === pawn.id
        );

        // Determine current action status
        let statusText = "Idling";
        if (actor?.queuedActions && actor.queuedActions.length > 0) {
            const nextAction = actor.queuedActions[0];
            if (nextAction.type === "move") {
                statusText = "🚶 Moving";
            } else if (nextAction.type === "wait") {
                statusText = "😴 Resting";
            } else if (nextAction.type === "interact") {
                const iType = nextAction.interactionType;
                if (iType === "plant") statusText = "🌱 Planting seed";
                else if (iType === "water") statusText = "💧 Watering crop";
                else if (iType === "harvest") statusText = "🌾 Harvesting crop";
                else if (iType === "deposit") statusText = "📦 Depositing wheat";
                else if (iType === "refillWater") statusText = "🚰 Refilling water";
            }
        }

        // Get inventory details
        const waterCan = getWaterCan(pawn);
        const waterCurrent = waterCan?.waterCanCurrentAmount ?? 0;
        const waterCap = waterCan?.waterCanCapacity ?? 5;

        const seeds = getInventoryItem(pawn, "seed", "wheat")?.quantity ?? 0;
        const wheat = getInventoryItem(pawn, "crop", "wheat")?.quantity ?? 0;

        // Visual interpolation loop
        useFrame((_state, delta) => {
            if (groupRef.current && pawn.position) {
                const targetX = pawn.position.x;
                const targetZ = pawn.position.y; // logical Y maps to 3D Z

                // Lerp current 3D position towards target logical grid coordinates
                groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, delta * 6);
                groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, delta * 6);
            }
        });

        // Initialize 3D position if it's the first frame
        const initialX = pawn.position?.x ?? 0;
        const initialZ = pawn.position?.y ?? 0;

        return (
            <group ref={groupRef} position={[initialX, 0.4, initialZ]} key={`pawn-group-${pawn.id}`}>
                {/* Farmer Body */}
                <mesh castShadow position={[0, 0.4, 0]}>
                    <cylinderGeometry args={[0.25, 0.35, 0.8, 12]} />
                    <meshStandardMaterial color="#1e90ff" roughness={0.5} /> {/* Blue denim overalls */}
                </mesh>

                {/* Farmer Head */}
                <mesh castShadow position={[0, 0.95, 0]}>
                    <sphereGeometry args={[0.2, 16, 16]} />
                    <meshStandardMaterial color="#ffe4c4" roughness={0.3} /> {/* Peach skin color */}
                </mesh>

                {/* Farmer Straw Hat (Cone + Flat Cylinder for brim) */}
                <group position={[0, 1.1, 0]}>
                    {/* Hat Brim */}
                    <mesh castShadow position={[0, -0.05, 0]}>
                        <cylinderGeometry args={[0.38, 0.38, 0.02, 16]} />
                        <meshStandardMaterial color="#deb887" roughness={0.8} />
                    </mesh>
                    {/* Hat Cone */}
                    <mesh castShadow>
                        <coneGeometry args={[0.22, 0.22, 16]} />
                        <meshStandardMaterial color="#deb887" roughness={0.8} />
                    </mesh>
                </group>

                {/* Status and Inventory bubble */}
                <Html distanceFactor={8} position={[0, 1.5, 0]} center>
                    <div style={{
                        background: "rgba(10, 25, 47, 0.9)",
                        backdropFilter: "blur(4px)",
                        color: "#64ffda",
                        padding: "5px 10px",
                        borderRadius: "8px",
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: "11px",
                        border: "1px solid #64ffda",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
                        width: "max-content",
                        pointerEvents: "none",
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                        alignItems: "center"
                    }}>
                        <div style={{ fontWeight: "bold", color: "#fff" }}>🤠 {pawn.name}</div>
                        <div style={{ fontSize: "10px", color: "#8892b0" }}>{statusText}</div>
                        <div style={{ display: "flex", gap: "6px", fontSize: "9px", marginTop: "2px", borderTop: "1px solid rgba(100,255,218,0.2)", paddingTop: "2px" }}>
                            <span>🌰 {seeds}</span>
                            <span>🌾 {wheat}</span>
                            <span>💧 {waterCurrent}/{waterCap}</span>
                        </div>
                    </div>
                </Html>
            </group>
        );
    }

    return (
        <group name="game-pawns">
            {pawns.map(pawn => (
                <PawnView key={`pawn-view-${pawn.id}`} pawn={pawn} />
            ))}
        </group>
    );
}