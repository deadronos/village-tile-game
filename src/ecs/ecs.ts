import { World } from "miniplex"
import createReactAPI from "miniplex-react"
import * as THREE from "three"



export { World } from "miniplex"
// reexporting these types from miniplex so that we can use them in our entity definitions without having to import them from miniplex directly

/* Our entity type */
export type Entity = {
    id: number
}

/* Create a Miniplex world that holds our entities */
export const world = new World<Entity>()

/* Create and export React bindings */
export const ECS = createReactAPI(world)

export function useECSWorld() {
    return world
}


export interface GameStateEntity extends Entity {
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
    registerEntityToTick: (entityId: number, gameState: GameStateEntity) => void
    unregisterEntityToTick: (entityId: number, gameState: GameStateEntity) => void
}

export interface MenuEntity extends Entity {
    menuType: "main" | "pause" | "gameOver"
}



export interface PositionEntity extends Entity {
    x: number
    y: number
}

export interface VelocityEntity extends Entity {
    x: number  // tiles per second
    y: number  // tiles per second
}

export interface GameMapEntity extends Entity {
    tileset: TilesEntity
    tilemap: number[][]
    mapPreset: string
    height: number
    width: number
}

export interface TilesEntity extends Entity {
    tiles:TileEntity[]
}

export interface TileEntity extends Entity {
    id: number
    name: string
    image: string
    placeholderColor: string
    walkable: boolean
}

export interface GameMapStateEntity extends Entity {
    mapState: "unloaded" | "loading" | "loaded"
    map: GameMapEntity | null
}

export interface ActorEntity extends Entity {
    name: string
    isActive?: boolean
    pawnToActOn?: PawnEntity | null
    controller?: ControllerEntity | null
    queuedActions?:Record<number, ActionTypes>
    onTick(delta: number, gameTick: number): void
    isRegisteredToGameTick: boolean
}

export interface ActionTypes {
    type: "move" | "interact" | "wait"
    targetPosition?: PositionEntity
    targetActor?: ActorEntity
    targetPawn?: PawnEntity
    interactionType?: "plant" | "checkGrowth" | "harvest"
    waitDuration?: number // in seconds
}

export interface PawnEntity extends Entity {
    name: string
    position?: PositionEntity
    velocity?: VelocityEntity
    mesh: THREE.Mesh
    onTick?(delta: number, gameTick: number): void
    isRegisteredToGameTick?: boolean
    isActive?: boolean
    isSelected?: boolean
    canMove?: boolean
    inventory?: InventoryItem[]
}

export interface InventoryItem {
    itemType: ItemTypesEntity["itemType"]
    cropType?: ItemTypesEntity["cropType"]
    waterCanCapacity?: ItemTypesEntity["waterCanCapacity"]
    waterCanCurrentAmount?: ItemTypesEntity["waterCanCurrentAmount"]
    quantity: number
}

export interface ItemTypesEntity extends Entity {
    itemType: "seed" | "crop" | "water can"
    cropType?: "wheat" | "corn" | "carrot"
    waterCanCapacity?: number
    waterCanCurrentAmount?: number
}

export interface ObjectEntity extends Entity {  // things that dont move or have controllers but still need to be rendered and ticked, like crops or furniture
    name: string
    position?: PositionEntity
    mesh: THREE.Mesh
    onTick?(delta: number, gameTick: number): void
    isRegisteredToGameTick?: boolean
    isActive?: boolean
}

export interface PlantEntity extends ObjectEntity {
    growthStage: number
    maxGrowthStage: number
    growthTime: number // time in seconds to grow to the next stage
    timeSinceLastGrowth: number // time in seconds since the last growth stage
    needsSunlight?: boolean
    needsWater?: boolean
    onTick(delta: number, gameTick: number): void
    isRegisteredToGameTick: boolean
    cropType: "wheat" | "corn" | "carrot"
}

export interface ControllerEntity extends Entity {
    type: "player" | "ai"

    actorToControl: ActorEntity
    aiType?: "farmer" | "villager" | "animal"
    playerInputState?: PlayerInputState
}

export interface PlayerInputState {
    up: boolean  // move one tile up
    down: boolean // move one tile down
    left: boolean // move one tile left
    right: boolean // move one tile right
    interact: boolean // interact with the tile or actor in front of the pawn
    wait: boolean // wait
}


export interface ObserverEntity extends Entity {
    onTick?(delta: number, gameTick: number): void
    controlCamera?: boolean
    orbitCamera?: boolean
    orbitTarget?: THREE.Vector3
    orbitQuaternion?: THREE.Quaternion
    orbitDistance?: number
    orbitAutoRotate?: boolean
    orbitAutoRotateSpeed?: number
    orbitMinDistance?: number
    orbitMaxDistance?: number
    orbitMinPolarAngle?: number
    orbitMaxPolarAngle?: number
    initialOrbitTarget?: THREE.Vector3
    initialOrbitQuaternion?: THREE.Quaternion
    initialOrbitDistance?: number
    initialOrbitAutoRotate?: boolean
    initialOrbitAutoRotateSpeed?: number
    initialOrbitMinDistance?: number
    initialOrbitMaxDistance?: number
    initialOrbitMinPolarAngle?: number
    initialOrbitMaxPolarAngle?: number
}