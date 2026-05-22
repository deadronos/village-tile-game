

// should render Object entities like crops, trees, etc. based on their position and type
import React, { useContext, useEffect } from 'react'
import { ECSContext } from '../ecs/ecsProvider';
import type { GameStateEntity, TileEntity, PlantEntity } from '../ecs/ecs';
import * as THREE from 'three';
import { getCachedYOffsetForGeometry } from './utils/CachedYOffsetForGeometry';

interface GameCropsProps {
    maphasLoaded: boolean;
    gameState: GameStateEntity | undefined;
}




const cropTypesMeshes: Record<string, THREE.Mesh> = {
    wheat: new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 0.8), new THREE.MeshBasicMaterial({ color: 'yellow' })),
    corn: new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.8), new THREE.MeshBasicMaterial({ color: 'gold' })),
    carrot: new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.6), new THREE.MeshBasicMaterial({ color: 'orange' }))
};

const PlantEntitiesToSpawn: PlantEntity[] = [
    {
        id: 1001,   // unique ID for this plant entity
        name: "Wheat Plant",
        position: { id:1001, x: 5, y: 4 }, // example position, should be set based on tilemap data
        mesh: cropTypesMeshes["wheat"], // type assertion to satisfy PlantEntity interface
        isRegisteredToGameTick: false,
        onTick(delta: number, gameTick: number) {
            // Placeholder onTick function to handle growth logic, will be called by the ECS game loop
        },
        growthStage: 0, // initial growth stage
        maxGrowthStage: 5, // example max growth stage
        growthTime: 10, // example time in seconds to grow to the next stage
        timeSinceLastGrowth: 0, // initial time since last growth
        cropType: "wheat"
    },
    {
        id: 1002,   // unique ID for this plant entity
        name: "Corn Plant",
        position: { id:1002, x: 6, y: 3 }, // example position, should be set based on tilemap data
        mesh: cropTypesMeshes["corn"], // type assertion to satisfy PlantEntity interface
        isRegisteredToGameTick: false,
        onTick(delta: number, gameTick: number) {
            // Placeholder onTick function to handle growth logic, will be called by the ECS game loop
        },
        growthStage: 0,
        maxGrowthStage: 5, // example max growth stage
        growthTime: 10, // example time in seconds to grow to the next stage
        timeSinceLastGrowth: 0, // initial time since last growth
        cropType: "corn"
    },
    {
        id: 1003,   // unique ID for this plant entity
        name: "Carrot Plant",
        position: { id:1003, x: 7, y: 5 }, // example position, should be set based on tilemap data
        mesh: cropTypesMeshes["carrot"], // type assertion to satisfy PlantEntity interface
        isRegisteredToGameTick: false,
        onTick(delta: number, gameTick: number) {
            // Placeholder onTick function to handle growth logic, will be called by the ECS game loop
        },
        growthStage: 0,
        maxGrowthStage: 5, // example max growth stage
        growthTime: 10, // example time in seconds to grow to the next stage
        timeSinceLastGrowth: 0, // initial time since last growth
        cropType: "carrot"
    }];



export default function GameCrops({ maphasLoaded, gameState }: GameCropsProps): React.ReactElement {
    const world = useContext(ECSContext);
    const [tiles, setTiles] = React.useState<TileEntity[]| null>(null);
    const tilesizeX= 1  // in R3F world units, which are equivalent to tiles in our game logic, so 1 means 1 tile
    const tilesizeY= 1  // in R3F world units, which are equivalent to tiles in our game logic, so 1 means 1 tile
    const [tilemap, setTilemap] = React.useState<number[][] | null>(null);
    const [mapHeight, setMapHeight] = React.useState<number>(0);
    const [mapWidth, setMapWidth] = React.useState<number>(0);
    const [plants, setPlants] = React.useState<PlantEntity[]>([]);
    
    function spawnInitialPlants() {
        if (!world) {
            console.error("Cannot spawn plants because ECS world is not available");
            return;
        }
        const newPlants: PlantEntity[] = [];
        PlantEntitiesToSpawn.forEach(plantEntity => {
            world.add(plantEntity);
            if(!plantEntity.position) {
                console.error(`Plant entity ${plantEntity.name} is missing position data, cannot spawn in ECS world`);
                return;
            }
            
            newPlants.push(plantEntity);
            console.log(`Spawned plant entity: ${plantEntity.name} at position (${plantEntity.position.x}, ${plantEntity.position.y})`);
        });
        setPlants(newPlants);
        gameState?.gameObjects.push(...newPlants); // add the new plant entities to the game state for tracking
        console.log('Current game state after spawning plants:', gameState);
    };

    if (!world) {
        throw new Error("GameCrops must be used within an ECSProvider")
    }

    // checking if passed props have state defined and extract tileset and tilemap data from loaded map
    useEffect(() => {
            if(!gameState) {
                console.error("GameStateEntity is undefined in GameCrops component");
                return;
            }
            if(!maphasLoaded) {
                console.log('GameCrops component detected map has not loaded yet');
                return;
            }
            if(!gameState.gameMap) {
                console.error("GameStateEntity does not have gameMap property set after map has loaded");
                return;
            }
            if(!gameState.gameMap.map) {
                console.error("GameMapEntity is null in GameStateEntity after map has loaded");
                return;
            }
            console.log('GameCrops component detected map has loaded, extracting tileset');
            const loadedTiles=gameState.gameMap.map.tileset.tiles;
            if(!loadedTiles || loadedTiles.length === 0) {
                console.error("No tiles found in loaded map's tileset");
                return;
            }
            setTiles(loadedTiles);
            if(!gameState.gameMap.map.tilemap) {
                console.error("Tilemap data is missing in loaded GameMapEntity");
                return;
            }
            setTilemap(gameState.gameMap.map.tilemap);
            setMapHeight(gameState.gameMap.map.tilemap.length);
            setMapWidth(gameState.gameMap.map.tilemap[0].length);
            return () => {
                console.log('GameCrops component unmounted');
            }
        }, [maphasLoaded, gameState]);

    useEffect(()=>{
            if(tiles) {
                console.log('GameCrops component has tiles available:', tiles);
            } else {
                console.log('GameCrops component has no tiles to display');
                return;
            }
            if(tilemap) {
                console.log('GameCrops component has tilemap data available:', tilemap);
            } else {
                console.log('GameCrops component has no tilemap data to display');
                return;
            }
            if(mapHeight > 0 && mapWidth > 0) {
                console.log(`GameCrops component has map dimensions: width=${mapWidth}, height=${mapHeight}`);
            } else {
                console.log('GameCrops component has invalid map dimensions');
                return;
            }
            spawnInitialPlants();

            return () => {
                console.log('Cleaning up GameCrops component tiles effect');
            }
        }, [tiles, tilemap, mapHeight, mapWidth]); // on change to tiles, tilemap, mapheight, or mapwidth

    useEffect(() => {
        console.log('GameCrops component plants state updated:', plants);
        return () => {
            console.log('Cleaning up GameCrops component plants effect');
        }
    }, [plants]);

    interface CropsViewProps {
        plantid: number;
        name: string;
        positionx: number;
        positiony: number;
        mesh: THREE.Mesh;
    }

    function CropsView({plantid, name, positionx, positiony, mesh}: CropsViewProps): React.ReactElement | null {
        if(positionx === undefined || positiony === undefined) {
            console.error(`Plant entity ${name} is missing position data, cannot render`);
            return null;
        }
        return (
            <group name={`plantid-${plantid}-name-${name}`} key={`plantid-${plantid}`} position={[positionx * tilesizeX, getCachedYOffsetForGeometry(mesh.geometry as THREE.BoxGeometry), positiony * tilesizeY]}>
                <primitive name={`plantid-${plantid}-name-${name}-mesh`} key={`plantid-${plantid}-name-${name}-mesh`} object={mesh} />
            </group>
        )
    };

return (
    <group>
        {/* Crop entities will be rendered here based on their position and type */}
        {!plants || plants.length === 0 ? (
            <group>
                {/* Optionally render something when there are no plants to display */}
            </group>
        ) : (
            plants.map((plant, k)=> (
                <CropsView 
                    key={k}
                    plantid={plant.id}
                    name={plant.name}
                    positionx={plant.position?.x ?? 0} // default to 0 if position or x is undefined
                    positiony={plant.position?.y ?? 0} // default to 0 if position or y is undefined
                    mesh={plant.mesh}
                />
            ))
        )}
    </group>
)
}
