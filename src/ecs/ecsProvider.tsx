import React, { useEffect, useMemo, useState } from 'react'
import * as ECS from './ecsImpl'
import { createInitialGameStateEntityImpl, world } from './ecsImpl'
import type { GameStateEntity } from './ecs'




export const ECSContext= React.createContext(ECS.world)


export function ECSProvider({ children }: { children: React.ReactNode }):React.ReactElement {
    
    
    const providedWorld= ECS.useECSWorld();
    let gameStateEntity:GameStateEntity;

    if (!providedWorld) {
        throw new Error("ECSProvider must be used within an ECSContext.Provider")
    }

    useEffect(()=>{
        if(!providedWorld) return;
        if(providedWorld.entities.length === 0) {
            // no entities exist, creating initial game state entity
            console.log('No entities found in world, creating initial game state entity')
            const initialGameStateEntityImpl= (createInitialGameStateEntityImpl() as GameStateEntity);
            console.log('initial game state entity implementation:', initialGameStateEntityImpl);
            gameStateEntity=providedWorld.add(initialGameStateEntityImpl);
            
        } else {
            // entities already exist, likely due to hot module replacement during development, so we should not create a new initial game state entity

            console.warn("ECSProvider mounted but world already has entities. This is likely due to hot module replacement during development. No new initial game state entity will be created.")
        }
        console.log('ECS Provider mounted', providedWorld);
        return () => {
            // Cleanup if necessary when the provider unmounts
            providedWorld.clear()
        }
    }, [providedWorld]);  // Run once on mount to initialize the game state entity and any other necessary setup

    
    return (
        <ECSContext.Provider value={providedWorld}>
            {children}
        </ECSContext.Provider>
    )
}


