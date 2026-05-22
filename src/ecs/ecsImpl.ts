

import { world, ECS, type ObserverEntity, type ActorEntity, type GameMapStateEntity, type ObjectEntity, type PawnEntity, useECSWorld } from "./ecs";



export { world, ECS, useECSWorld }
export type { ObserverEntity, ActorEntity, GameMapStateEntity, ObjectEntity, PawnEntity }

export type GameStateEntityImpl= {
    id: number
    internalGameState: "loading" | "playing" | "paused" | "gameover"
    gameTick: number
    onGameTick: (delta: number) => void
    registeredEntitiesToTick: Set<number>
    visibleGameState: "mainmenu" | "ingame" | "pauseMenu" | "gameOverScreen"
    gameMap: GameMapStateEntity
    gameActors: ActorEntity[]
    observers: ObserverEntity[]  // will usually only have one observer, but this allows for split-screen multiplayer or multiple camera angles in the future
    gamePawns: PawnEntity[]
    gameObjects: ObjectEntity[] // for things like crops, furniture, etc that aren't actors or pawns but still need to be ticked and rendered
    currentHour: number
    currentDay: number
    sunLightLevel: number
    season: "spring" | "summer" | "autumn" | "winter"
    registerEntityToTick: (entityId: number, gameState: GameStateEntityImpl) => void
    unregisterEntityToTick: (entityId: number, gameState: GameStateEntityImpl) => void
}

export type MovementSystem = {
    update: (delta: number) => void
}

export type GameStateEntityImplFactory = () => GameStateEntityImpl

export function createInitialGameStateEntityImpl(): GameStateEntityImpl {
    return {
        id: 0,
        internalGameState: "loading",
        gameTick: 0,
        onGameTick: () => {},
        registeredEntitiesToTick: new Set(),
        visibleGameState: "mainmenu",
        gameMap: {
            id: 0,
            mapState: "unloaded",
            map: null
        },
        gameActors: [],
        observers: [],
        gamePawns: [],
        gameObjects: [],
        currentHour: 6,
        currentDay: 1,
        sunLightLevel: 0.5,
        season: "spring",
        registerEntityToTick: (entityId: number, gameState:GameStateEntityImpl) => {
            gameState.registeredEntitiesToTick.add(entityId)
        },
        unregisterEntityToTick: (entityId: number, gameState:GameStateEntityImpl) => {
            gameState.registeredEntitiesToTick.delete(entityId)
        }
    }
}
