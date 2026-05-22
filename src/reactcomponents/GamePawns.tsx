import React, { useContext,useEffect } from 'react';
import { ECSContext } from '../ecs/ecsProvider';
import type { TileEntity, GameStateEntity, PawnEntity, ControllerEntity, ObjectEntity, PlantEntity } from '../ecs/ecs';
import * as THREE from 'three';
import { getCachedYOffsetForGeometry } from './utils/CachedYOffsetForGeometry';



interface GamePawnsProps {
    maphasLoaded: boolean;
    gameState: GameStateEntity | undefined;
}


export default function GamePawns({ maphasLoaded, gameState }: GamePawnsProps): React.ReactElement {
    const world = useContext(ECSContext);
    const [tiles, setTiles] = React.useState<TileEntity[]| null>(null);
    const tilesizeX= 1  // in R3F world units, which are equivalent to tiles in our game logic, so 1 means 1 tile
    const tilesizeY= 1  // in R3F world units, which are equivalent to tiles in our game logic, so 1 means 1 tile
    const [tilemap, setTilemap] = React.useState<number[][] | null>(null);
    const [mapHeight, setMapHeight] = React.useState<number>(0);
    const [mapWidth, setMapWidth] = React.useState<number>(0);
    const [gameObjects, setGameObjects] = React.useState<Record<number, (ObjectEntity|PlantEntity)>>({});
    const [pawns, setPawns] = React.useState<PawnEntity[]>([]);
    const [controllers, setControllers] = React.useState<ControllerEntity[]>([]);

    if (!world) {
        throw new Error("GamePawns must be used within an ECSProvider")
    }

    function updateObjectsFromGameState() {
        if(!gameState) {
            console.error("GameStateEntity is undefined in GamePawns component");
            return;
        }
        if(!gameState.gameObjects || gameState.gameObjects.length === 0) {
            console.log("No game objects found in GameStateEntity to update in GamePawns component");
            return;
        }
        const newObjects = gameState.gameObjects;
        const newObjectsMap: Record<number, (ObjectEntity|PlantEntity)> = {};
        newObjects.forEach(obj => {
            if(!obj.id) {
                console.error("Game object entity is missing id property, cannot track in GamePawns component", obj);
                return;
            }
            newObjectsMap[obj.id] = obj;
        });
        setGameObjects(newObjectsMap);
    };

    // checking if passed props have state defined and extract tileset and tilemap data from loaded map
    useEffect(() => {
            if(!gameState) {
                console.error("GameStateEntity is undefined in GamePawns component");
                return;
            }
            if(!maphasLoaded) {
                console.log('GamePawns component detected map has not loaded yet');
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
            console.log('GamePawns component detected map has loaded, extracting tileset');
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
                console.log('GamePawns component unmounted');
            }
        }, [maphasLoaded, gameState]);

    useEffect(()=>{
            if(tiles) {
                console.log('GamePawns component has tiles available:', tiles);
            } else {
                console.log('GamePawns component has no tiles to display');
                return;
            }
            if(tilemap) {
                console.log('GamePawns component has tilemap data available:', tilemap);
            } else {
                console.log('GamePawns component has no tilemap data to display');
                return;
            }
            if(mapHeight > 0 && mapWidth > 0) {
                console.log(`GamePawns component has map dimensions: width=${mapWidth}, height=${mapHeight}`);
            } else {
                console.log('GamePawns component has invalid map dimensions');
                return;
            }
            updateObjectsFromGameState();
            return () => {
                console.log('Cleaning up GamePawns component tiles effect');
            }
        }, [tiles, tilemap, mapHeight, mapWidth]); // on change to tiles, tilemap, mapheight, or mapwidth

    useEffect(() => {
        updateObjectsFromGameState();
    }, [gameState?.gameObjects]); // on change to gameState's gameObjects array


    function PawnView({pawn}: {pawn: PawnEntity}): React.ReactElement | null {
        if(!pawn.mesh) {
            console.error("Pawn entity is missing mesh property, cannot render in GamePawns component", pawn);
            return (
                <mesh position={[0, getCachedYOffsetForGeometry(new THREE.BoxGeometry(0.8, 1.6, 0.8)), 0]}>
                    <boxGeometry args={[0.8, 1.6, 0.8]} />
                    <meshBasicMaterial color="blue" />
                    <mesh position={[0, getCachedYOffsetForGeometry(new THREE.BoxGeometry(0.4, 0.4, 0.8))+0.6, 0]}>
                        <capsuleGeometry args={[0.4, 0.4, 0.8]}/>
                        <meshBasicMaterial color="red" />
                    </mesh>
                </mesh>
            )
        }
        if(!pawn.position) {
            console.error("Pawn entity is missing position property, cannot render in GamePawns component", pawn);
            return null;
        }
        return (
            <group key={pawn.id} position={[pawn.position.x * tilesizeX, getCachedYOffsetForGeometry(pawn.mesh.geometry as THREE.BoxGeometry), pawn.position.y * tilesizeY]}>
                <primitive object={pawn.mesh} />
            </group>
        )
    }
        

    return (
        <group>
            {/* Game pawns will go here */}
            <PawnView pawn={{id: 999, name: "Test Pawn", position: {id:999, x: 2, y: 2}, mesh: new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.8), new THREE.MeshBasicMaterial({color: 'blue'}))}} />
        </group>
    )
}