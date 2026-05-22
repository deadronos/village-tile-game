import type { TilesEntity } from "../../../src/ecs/ecs";
import type { GameMapStateEntity } from "../../../src/ecs/ecsImpl";
import tilemapJSON from "./tilemap.json";
import tilesJSON from "./tiles.json";


const mapToLoad:string = "farmyard";






export function loadMap(mapEntity:GameMapStateEntity) {

    if (mapEntity.mapState !== "loaded") {
        if (mapEntity.map?.mapPreset === mapToLoad) {
            // farmyard already loaded, just need to update the map state
            mapEntity.mapState = "loaded";
            return;
        }
        try {
            const tileset=  tilesJSON.tiles;
            const tilemap= tilemapJSON.mapPresets.farmyard.mapData;
            if (!tilemap) {
                console.error(`Map preset ${mapToLoad} not found in tilemap JSON.`);
                return;
            }
            const height = tilemap.length;
            const width = tilemap[0].length;
            mapEntity.map = {
                id: mapEntity.id,
                tileset: {id: mapEntity.id, tiles: tileset} as TilesEntity,
                tilemap: tilemap,
                mapPreset: mapToLoad,
                height: height,
                width: width
            };
            mapEntity.mapState = "loaded";
            console.log('constructed map entity:', mapEntity);
            
        } catch (error) {
            console.error(`Failed to load tileset for map preset ${mapToLoad}:`, error);
            return;
        }
    }

}