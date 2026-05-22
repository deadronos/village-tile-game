import React, { useContext } from "react";
import { ECSContext } from "../ecs/ecsProvider";
import type { ObjectEntity, GameStateEntity } from "../ecs/ecs";
import { Html } from "@react-three/drei";

interface GameObjectsProps {
    maphasLoaded: boolean;
    gameState: GameStateEntity | undefined;
}

export default function GameObjects({ maphasLoaded, gameState }: GameObjectsProps): React.ReactElement | null {
    const world = useContext(ECSContext);
    if (!world || !maphasLoaded || !gameState) return null;
    const gState = gameState;

    // Filter static game objects (e.g. Barn, Well, Farmhouse)
    const objects = world.entities.filter((e): e is ObjectEntity => 
        (e as any).name === "Barn" || (e as any).name === "Well" || (e as any).name === "Farmhouse"
    );

    function ObjectView({ obj }: { obj: ObjectEntity }): React.ReactElement | null {
        if (!obj.position) return null;

        const { x, y } = obj.position;

        if (obj.name === "Barn") {
            const storedWheat = (obj as any).storedWheat ?? 0;
            return (
                <group position={[x, 0.5, y]} name="Barn">
                    {/* Barn main body */}
                    <mesh castShadow receiveShadow>
                        <boxGeometry args={[1.5, 1.0, 1.5]} />
                        <meshStandardMaterial color="#8b0000" roughness={0.7} />
                    </mesh>
                    {/* Barn roof */}
                    <mesh position={[0, 0.75, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                        <coneGeometry args={[1.2, 0.6, 4]} />
                        <meshStandardMaterial color="#3a3a3a" roughness={0.5} />
                    </mesh>
                    {/* Barn door */}
                    <mesh position={[0, -0.2, 0.76]}>
                        <boxGeometry args={[0.5, 0.6, 0.05]} />
                        <meshStandardMaterial color="#deb887" />
                    </mesh>
                    {/* HTML Overlay */}
                    <Html distanceFactor={10} position={[0, 1.2, 0]} center>
                        <div style={{
                            background: "rgba(139, 0, 0, 0.9)",
                            color: "#fff",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: "11px",
                            fontWeight: "bold",
                            border: "2px solid #ffd700",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
                            whiteSpace: "nowrap",
                            pointerEvents: "none"
                        }}>
                            🏠 Barn (🌾 {storedWheat})
                        </div>
                    </Html>
                </group>
            );
        }

        if (obj.name === "Well") {
            return (
                <group position={[x, 0.4, y]} name="Well">
                    {/* Well base stone */}
                    <mesh castShadow receiveShadow>
                        <cylinderGeometry args={[0.5, 0.5, 0.6, 12]} />
                        <meshStandardMaterial color="#708090" roughness={0.9} />
                    </mesh>
                    {/* Well support pillars */}
                    <mesh position={[-0.4, 0.5, 0]}>
                        <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
                        <meshStandardMaterial color="#8b5a2b" />
                    </mesh>
                    <mesh position={[0.4, 0.5, 0]}>
                        <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
                        <meshStandardMaterial color="#8b5a2b" />
                    </mesh>
                    {/* Well roof */}
                    <mesh position={[0, 0.8, 0]}>
                        <boxGeometry args={[1.0, 0.1, 0.6]} />
                        <meshStandardMaterial color="#8b5a2b" roughness={0.6} />
                    </mesh>
                    {/* HTML Overlay */}
                    <Html distanceFactor={10} position={[0, 1.1, 0]} center>
                        <div style={{
                            background: "rgba(47, 79, 79, 0.9)",
                            color: "#fff",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: "11px",
                            fontWeight: "bold",
                            border: "1px solid #00bfff",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
                            whiteSpace: "nowrap",
                            pointerEvents: "none"
                        }}>
                            🚰 Water Well
                        </div>
                    </Html>
                </group>
            );
        }
        if (obj.name === "Farmhouse") {
            const hour = gState.currentHour;
            const isNight = hour >= 20 || hour < 5;
            return (
                <group position={[x, 0.5, y]} name="Farmhouse">
                    {/* House main body */}
                    <mesh castShadow receiveShadow>
                        <boxGeometry args={[1.6, 1.0, 1.4]} />
                        <meshStandardMaterial color="#d2b48c" roughness={0.6} />
                    </mesh>
                    {/* Roof */}
                    <mesh position={[0, 0.75, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                        <coneGeometry args={[1.3, 0.6, 4]} />
                        <meshStandardMaterial color="#8b4513" roughness={0.5} />
                    </mesh>
                    {/* Door */}
                    <mesh position={[0, -0.2, 0.71]}>
                        <boxGeometry args={[0.4, 0.6, 0.05]} />
                        <meshStandardMaterial color="#5c4033" />
                    </mesh>
                    {/* Window */}
                    <mesh position={[0.5, 0.1, 0.71]}>
                        <boxGeometry args={[0.3, 0.3, 0.04]} />
                        <meshBasicMaterial color={isNight ? "#ffd700" : "#87ceeb"} />
                    </mesh>
                    {/* PointLight inside window if night */}
                    {isNight && (
                        <pointLight position={[0.5, 0.1, 1.0]} intensity={0.8} distance={3} color="#ffd700" />
                    )}
                    {/* HTML Overlay */}
                    <Html distanceFactor={10} position={[0, 1.2, 0]} center>
                        <div style={{
                            background: "rgba(92, 64, 51, 0.9)",
                            color: "#fff",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: "11px",
                            fontWeight: "bold",
                            border: "1.5px solid #ffd700",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
                            whiteSpace: "nowrap",
                            pointerEvents: "none"
                        }}>
                            🏠 Farmhouse {isNight ? "(💤 Sleep)" : ""}
                        </div>
                    </Html>
                </group>
            );
        }

        return null;
    }

    return (
        <group name="game-objects">
            {objects.map((obj, i) => (
                <ObjectView key={`static-obj-${i}`} obj={obj} />
            ))}
        </group>
    );
}
