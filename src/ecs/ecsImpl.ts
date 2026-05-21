

import { world, ECS, type ObserverEntity, type ActorEntity, type GameMapStateEntity, type ObjectEntity, type PawnEntity, useECSWorld } from "./ecs";



export { world, ECS, useECSWorld }
export type { ObserverEntity, ActorEntity, GameMapStateEntity, ObjectEntity, PawnEntity }

export type GameStateImpl = {
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
    registerEntityToTick: (entityId: number, gameState: GameStateImpl) => void
    unregisterEntityToTick: (entityId: number, gameState: GameStateImpl) => void
}

export type MovementSystem = {
    update: (delta: number) => void
}

export type GameStateImplFactory = () => GameStateImpl

export function createInitialGameStateImpl(): GameStateImpl {
    return {
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
        registerEntityToTick: (entityId: number, gameState:GameStateImpl) => {
            gameState.registeredEntitiesToTick.add(entityId)
        },
        unregisterEntityToTick: (entityId: number, gameState:GameStateImpl) => {
            gameState.registeredEntitiesToTick.delete(entityId)
        }
    }
}
