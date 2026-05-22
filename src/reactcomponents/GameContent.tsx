import React, { useContext, useEffect } from 'react'
import { ECSContext } from '../ecs/ecsProvider';
import { ECS } from '../ecs/ecsImpl';
import type { GameMapStateEntity } from '../ecs/ecsImpl';
import { Text } from '@react-three/drei';
import { loadMap } from '../../public/assets/map/loadMap';
import type { GameStateEntity, Entity } from '../ecs/ecs';
import GameMap from './GameMap';
import GameCrops from './GameCrops';
import GamePawns from './GamePawns';





export function GameContent(): React.ReactElement {
    const world = useContext(ECSContext);
    if (!world) {
        throw new Error("GameContent must be used within an ECSProvider")
    }
    const [mapHasLoaded, setMapHasLoaded] = React.useState(false);
    
    const gameState = world.entities.find((entity): entity is GameStateEntity => 'gameTick' in entity);
    

    useEffect(() => {
        if (!mapHasLoaded) {
            // Simulate loading time for demonstration purposes
            const MapEntity=world.add({id: 1, mapState: "unloaded", map: null}as GameMapStateEntity);
            loadMap(MapEntity);
            setMapHasLoaded(true);
            if (!gameState) {
                console.error("GameStateEntity not found in world after loading map.");
                return;
            }
            gameState.gameMap = MapEntity;
            console.log('map loaded, updating state to trigger re-render', MapEntity);
            console.log('current game state after loading map:', gameState);
        }
    }, [mapHasLoaded, world]);

    

    return (
        <group>
            {/* Game content will go here */}
            <GameMap maphasLoaded={mapHasLoaded} gameState={gameState}/>
            <GameCrops maphasLoaded={mapHasLoaded} gameState={gameState}/>
            <GamePawns maphasLoaded={mapHasLoaded} gameState={gameState}/>
        </group>
    )
}





