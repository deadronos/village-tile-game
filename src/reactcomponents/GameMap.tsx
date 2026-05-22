import React, { useEffect } from 'react';
import type { GameStateEntity, TileEntity } from '../ecs/ecs';
import { Text } from '@react-three/drei';


interface GameMapProps {
    maphasLoaded: boolean;
    gameState: GameStateEntity | undefined;
}

export default function GameMap({ maphasLoaded, gameState }: GameMapProps): React.ReactElement {
    const [tiles, setTiles] = React.useState<TileEntity[]| null>(null);
    const tilesizeX= 1  // in R3F world units, which are equivalent to tiles in our game logic, so 1 means 1 tile
    const tilesizeY= 1  // in R3F world units, which are equivalent to tiles in our game logic, so 1 means 1 tile
    const [tilemap, setTilemap] = React.useState<number[][] | null>(null);
    

    useEffect(() => {
        if(!gameState) {
            console.error("GameStateEntity is undefined in GameMap component");
            return;
        }
        if(!maphasLoaded) {
            console.log('GameMap component detected map has not loaded yet');
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
        console.log('GameMap component detected map has loaded, extracting tileset');
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
        return () => {
            console.log('GameMap component unmounted');
        }
    }, [maphasLoaded, gameState]);

    useEffect(()=>{
        if(tiles) {
            console.log('GameMap component has tiles available:', tiles);
        } else {
            console.log('GameMap component has no tiles to display');
            return;
        }
        if(tilemap) {
            console.log('GameMap component has tilemap data available:', tilemap);
        } else {
            console.log('GameMap component has no tilemap data to display');
            return;
        }

        return () => {
            console.log('Cleaning up GameMap component tiles effect');
        }
    }, [tiles, tilemap]); // on change to tiles

    function TileView({tileId, rowIndex,colIndex, tilesizeX, tilesizeY,offsetX,offsetY,tileData}: {tileId: number, rowIndex: number, colIndex: number, tilesizeX: number, tilesizeY: number, offsetX: number, offsetY: number, tileData: TileEntity}): React.ReactElement {
        return (
            <mesh name={`game-map-tile-${rowIndex}-${colIndex}`} key={`${rowIndex}-${colIndex}`} position={[colIndex * tilesizeX-offsetX, 0, rowIndex * tilesizeY-offsetY]}
                receiveShadow={true} 
                >
                <boxGeometry key={tileId} args={[tilesizeX, 0.1, tilesizeY]} />
                <meshPhysicalMaterial color={tileData.placeholderColor} />
            </mesh>
        );
    }


    return (
        <group name="game-map">
            {/* Game map will go here */}
            {/* we need flat arrays */}
            {tiles && tilemap ? (
                tilemap.map((row, rowIndex) => 
                    row.map((tileId, colIndex) => {   
                        const tileData = tiles.find(tile => tile.id === tileId);
                        if (!tileData) {
                            console.error(`Tile data not found for tileId: ${tileId}`);
                            return null;
                        }
                        return (
                            <TileView key={`tile-${rowIndex}-${colIndex}`} tileId={tileId} rowIndex={rowIndex} colIndex={colIndex} tilesizeX={tilesizeX} tilesizeY={tilesizeY} offsetX={tilemap.length/2} offsetY={tilemap.length/2} tileData={tileData} />
                        )
                    })
                )
            ) : (
                <Text key='loading-map' position={[0, 0, 0]} fontSize={1} color="black">
                    Loading Map...
                </Text>
            )}
        </group>
    )
}