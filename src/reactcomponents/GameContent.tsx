import React, { useContext, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber';
import { ECSContext } from '../ecs/ecsProvider';
import { loadMap } from '../../public/assets/map/loadMap';
import type { GameStateEntity, PawnEntity, ActorEntity, PlantEntity, GameMapStateEntity } from '../ecs/ecs';
import GameMap from './GameMap';
import GameCrops from './GameCrops';
import GamePawns from './GamePawns';
import GameObjects from './GameObjects';
import GameLoop from './GameLoop';
import { SIM_CONFIG } from '../config/simConfig';
import * as THREE from 'three';

export function GameContent(): React.ReactElement {
    const world = useContext(ECSContext);
    if (!world) {
        throw new Error("GameContent must be used within an ECSProvider")
    }
    const [mapHasLoaded, setMapHasLoaded] = React.useState(false);
    const [tickCount, setTickCount] = React.useState(0);
    const [logCount, setLogCount] = React.useState(0);
    
    const gameState = world.entities.find((entity): entity is GameStateEntity => 'gameTick' in entity);

    const onTickUpdate = () => {
        setTickCount((prev) => prev + 1);
    };

    const onLogAdded = () => {
        setLogCount((prev) => prev + 1);
    };

    React.useEffect(() => {
        // Read to satisfy TS unused compiler rule and force render on tick/log updates
        void [tickCount, logCount];
    }, [tickCount, logCount]);

    useEffect(() => {
        if (!mapHasLoaded && gameState) {
            console.log('Initializing game map and entities...');
            
            // Load map state
            let mapEntity = world.entities.find((e): e is GameMapStateEntity => e.id === 1);
            if (!mapEntity) {
                mapEntity = world.add({ id: 1, mapState: "unloaded", map: null } as GameMapStateEntity);
                loadMap(mapEntity);
            }
            setMapHasLoaded(true);
            gameState.gameMap = mapEntity;
 
            // 1. Spawn storage (Barn)
            let barn = world.entities.find(e => e.id === 2001) as any;
            if (!barn) {
                barn = world.add({
                    id: 2001,
                    name: "Barn",
                    position: { id: 2001, x: SIM_CONFIG.barnPosition.x, y: SIM_CONFIG.barnPosition.y },
                    mesh: new THREE.Mesh(),
                    storedWheat: 0
                } as any);
                if (!gameState.gameObjects.some(g => g.id === 2001)) {
                    gameState.gameObjects.push(barn);
                }
            }
 
            // 2. Spawn water well (Well)
            let well = world.entities.find(e => e.id === 2002) as any;
            if (!well) {
                well = world.add({
                    id: 2002,
                    name: "Well",
                    position: { id: 2002, x: SIM_CONFIG.wellPosition.x, y: SIM_CONFIG.wellPosition.y },
                    mesh: new THREE.Mesh()
                } as any);
                if (!gameState.gameObjects.some(g => g.id === 2002)) {
                    gameState.gameObjects.push(well);
                }
            }
 
            // 2.5. Spawn Farmhouse
            let farmhouse = world.entities.find(e => e.id === 2003) as any;
            if (!farmhouse) {
                farmhouse = world.add({
                    id: 2003,
                    name: "Farmhouse",
                    position: { id: 2003, x: SIM_CONFIG.farmhousePosition.x, y: SIM_CONFIG.farmhousePosition.y },
                    mesh: new THREE.Mesh()
                } as any);
                if (!gameState.gameObjects.some(g => g.id === 2003)) {
                    gameState.gameObjects.push(farmhouse);
                }
            }
 
            // 3. Spawn Farmer Pawn
            let farmerPawn = world.entities.find(e => e.id === 100) as PawnEntity | undefined;
            if (!farmerPawn) {
                farmerPawn = world.add({
                    id: 100,
                    name: "Farmer Joe",
                    position: { id: 100, x: SIM_CONFIG.farmerStartPosition.x, y: SIM_CONFIG.farmerStartPosition.y },
                    mesh: new THREE.Mesh(),
                    inventory: [
                        { itemType: "water can", waterCanCapacity: SIM_CONFIG.waterCanCapacity, waterCanCurrentAmount: SIM_CONFIG.waterCanCapacity, quantity: 1 },
                        { itemType: "seed", cropType: "wheat", quantity: SIM_CONFIG.startingSeeds },
                        { itemType: "crop", cropType: "wheat", quantity: 0 }
                    ]
                } as PawnEntity);
                if (!gameState.gamePawns.some(p => p.id === 100)) {
                    gameState.gamePawns.push(farmerPawn);
                }
            }
 
            // 4. Spawn AI Controller / Actor
            let farmerActor = world.entities.find(e => e.id === 101) as ActorEntity | undefined;
            if (!farmerActor) {
                farmerActor = world.add({
                    id: 101,
                    name: "Farmer Joe Actor",
                    pawnToActOn: farmerPawn,
                    controller: {
                        id: 102,
                        type: "ai",
                        aiType: "farmer",
                        actorToControl: null as any
                    },
                    queuedActions: [],
                    isRegisteredToGameTick: true,
                    onTick(_delta: number, _gameTick: number) {}
                } as ActorEntity);
                if (!gameState.gameActors.some(a => a.id === 101)) {
                    gameState.gameActors.push(farmerActor);
                }
            }
 
            // 5. Spawn some starting crops
            const initialCrops = [
                { id: 3001, x: 6, y: 4, growth: 0, watered: false }, // Needs watering
                { id: 3002, x: 8, y: 6, growth: 3, watered: true },  // Growing
                { id: 3003, x: 7, y: 7, growth: 5, watered: false }  // Harvest ready
            ];
 
            initialCrops.forEach(c => {
                const crop = world.entities.find(e => e.id === c.id);
                if (!crop) {
                    const newPlant: PlantEntity = {
                        id: c.id,
                        name: "Wheat Plant",
                        position: { id: c.id, x: c.x, y: c.y },
                        mesh: new THREE.Mesh(),
                        growthStage: c.growth,
                        maxGrowthStage: SIM_CONFIG.maxGrowthStage,
                        growthTime: SIM_CONFIG.growthTime,
                        timeSinceLastGrowth: 0,
                        needsWater: !c.watered && c.growth < SIM_CONFIG.maxGrowthStage,
                        isRegisteredToGameTick: true,
                        cropType: "wheat",
                        onTick() {}
                    };
                    world.add(newPlant);
                    if (!gameState.gameObjects.some(g => g.id === c.id)) {
                        gameState.gameObjects.push(newPlant);
                    }
                }
            });
 
            // Set game simulation active
            gameState.internalGameState = "playing";
        }
    }, [mapHasLoaded, world, gameState]);

    return (
        <group>
            {/* Decoupled simulation game loop tick driver */}
            <GameLoop 
                gameState={gameState} 
                onTickUpdate={onTickUpdate} 
                onLogAdded={onLogAdded} 
            />

            {/* Dynamic Environment Lighting & Sky */}
            <GameEnvironment gameState={gameState} />

            {/* Render systems */}
            <GameMap maphasLoaded={mapHasLoaded} gameState={gameState}/>
            <GameObjects maphasLoaded={mapHasLoaded} gameState={gameState}/>
            <GameCrops maphasLoaded={mapHasLoaded} gameState={gameState}/>
            <GamePawns maphasLoaded={mapHasLoaded} gameState={gameState}/>
        </group>
    )
}

function GameEnvironment({ gameState }: { gameState: GameStateEntity | undefined }) {
    const { scene } = useThree();
    const ambientRef = React.useRef<THREE.AmbientLight>(null);
    const sunRef = React.useRef<THREE.DirectionalLight>(null);

    useFrame((_state, delta) => {
        if (!gameState) return;
        const hour = gameState.currentHour;
        const targetLightLevel = gameState.sunLightLevel; // logical light level (0.0 to 1.0)

        // Interpolate ambient light intensity
        if (ambientRef.current) {
            // Ambient: night (0.05) to day (0.6)
            const targetAmbient = THREE.MathUtils.lerp(0.05, 0.6, targetLightLevel);
            ambientRef.current.intensity = THREE.MathUtils.lerp(ambientRef.current.intensity, targetAmbient, delta * 2.0);
        }

        // Interpolate sun light intensity and color
        if (sunRef.current) {
            // Sun: night (0.0) to day (1.5)
            const targetSun = THREE.MathUtils.lerp(0.0, 1.5, targetLightLevel);
            sunRef.current.intensity = THREE.MathUtils.lerp(sunRef.current.intensity, targetSun, delta * 2.0);

            // Determine sunlight position based on hour (rotating arc)
            const angle = ((hour - 6) / 24) * Math.PI * 2; // offset so at 12:00 it's overhead
            const radius = 30;
            const targetX = 20 + Math.cos(angle) * radius;
            const targetY = radius * Math.sin(angle); // height
            const targetZ = 20 + Math.sin(angle) * 5; // slight tilt

            // Lerp sun position
            sunRef.current.position.x = THREE.MathUtils.lerp(sunRef.current.position.x, targetX, delta * 2.0);
            sunRef.current.position.y = THREE.MathUtils.lerp(sunRef.current.position.y, Math.max(0.1, targetY), delta * 2.0);
            sunRef.current.position.z = THREE.MathUtils.lerp(sunRef.current.position.z, targetZ, delta * 2.0);

            // Shift sun color
            let targetColor = new THREE.Color("#ffffff");
            if (hour >= 20 || hour < 5) {
                targetColor.set("#1a1a3a");
            } else if ((hour >= 5 && hour < 7) || (hour >= 18 && hour < 20)) {
                targetColor.set("#ff7f50"); // Warm sunset/sunrise orange
            } else {
                targetColor.set("#fffaed"); // Crisp warm sunlight
            }
            sunRef.current.color.lerp(targetColor, delta * 2.0);
        }

        // Sky background color (canvas clear color)
        let targetBg = new THREE.Color("#111122"); // Deep night sky
        if (hour >= 20 || hour < 5) {
            targetBg.set("#050510");
        } else if (hour >= 5 && hour < 7) {
            targetBg.set("#fda4af"); // Rose pink dawn
        } else if (hour >= 7 && hour < 18) {
            targetBg.set("#bae6fd"); // Bright sky blue
        } else if (hour >= 18 && hour < 20) {
            targetBg.set("#f97316"); // Sunset orange
        }
        scene.background = targetBg;
    });

    return (
        <group>
            <ambientLight ref={ambientRef} intensity={0.2} />
            <directionalLight
                ref={sunRef}
                intensity={1.0}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
                shadow-camera-far={100}
                shadow-camera-left={-25}
                shadow-camera-right={25}
                shadow-camera-top={25}
                shadow-camera-bottom={-25}
            />
        </group>
    );
}





