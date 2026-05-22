

// should render Object entities like crops, trees, etc. based on their position and type
import React, { useContext, useEffect } from 'react'
import { ECSContext } from '../ecs/ecsProvider';
import type { GameStateEntity, TileEntity } from '../ecs/ecs';


interface GameCropsProps {
    maphasLoaded: boolean;
    gameState: GameStateEntity | undefined;
}


export default function GameCrops({ maphasLoaded, gameState }: GameCropsProps): React.ReactElement {
    const world = useContext(ECSContext);
    const [tiles, setTiles] = React.useState<TileEntity[]| null>(null);
    const tilesizeX= 1  // in R3F world units, which are equivalent to tiles in our game logic, so 1 means 1 tile
    const tilesizeY= 1  // in R3F world units, which are equivalent to tiles in our game logic, so 1 means 1 tile
    const [tilemap, setTilemap] = React.useState<number[][] | null>(null);
    const [mapHeight, setMapHeight] = React.useState<number>(0);
    const [mapWidth, setMapWidth] = React.useState<number>(0);

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

            return () => {
                console.log('Cleaning up GameCrops component tiles effect');
            }
        }, [tiles, tilemap, mapHeight, mapWidth]); // on change to tiles, tilemap, mapheight, or mapwidth


return (
    <group>
        {/* Crop entities will be rendered here based on their position and type */}
    </group>
)
}
