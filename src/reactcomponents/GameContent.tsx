import React, { useContext } from 'react'
import { ECSContext } from '../ecs/ecsProvider';
import { ECS, type GameMapStateEntity } from '../ecs/ecsImpl';
import { Text } from '@react-three/drei';
import { loadMap } from '../../public/assets/map/loadMap';





export function GameContent(): React.ReactElement {
    const world = useContext(ECSContext);
    if (!world) {
        throw new Error("GameContent must be used within an ECSProvider")
    }
    const [hasLoaded, setHasLoaded] = React.useState(false);
    
    if (!hasLoaded) {
        // Simulate loading time for demonstration purposes
        const MapEntity=world.add({id: 1, mapState: "unloaded", map: null}as GameMapStateEntity);
        loadMap(MapEntity);
        setHasLoaded(true);
    }

    return (
        <group>
            {/* Game content will go here */}
            <ECS.Entities entities={world.entities}>
                {entity => (
                    <group key={entity.id}>
                        {/* Render entity based on its components */}
                        <Text position={[0-entity.id*5, 0, -10]} fontSize={0.5} color="white">
                            Entity ID: {entity.id}
                        </Text>
                        {/* For example, if it has a position component, render it at that position */}
                    </group>
                )}
            </ECS.Entities>
        </group>
    )
}





