import * as THREE from 'three';


export function HashGeometryForCaching(geometry: THREE.BufferGeometry): string {
    // Create a hash based on the geometry's attributes and index
    const positionHash = geometry.attributes.position ? geometry.attributes.position.array.join(',') : '';
    const indexHash = geometry.index ? geometry.index.array.join(',') : '';
    return `${positionHash}|${indexHash}`;
}


export const yOffsetCache: Record<string, number> = {};

export function getCachedYOffsetForGeometry(geometry: THREE.BufferGeometry): number {
    const geometryHash = HashGeometryForCaching(geometry);
    if (yOffsetCache[geometryHash] !== undefined) {
        return yOffsetCache[geometryHash];
    }
    const yOffset = getYOffsetFromBoxGeometry(geometry as THREE.BoxGeometry);
    yOffsetCache[geometryHash] = yOffset;
    return yOffset;
}

export function getYOffsetFromBoxGeometry(geometry: THREE.BoxGeometry): number {
    const cloneGeometry = geometry.clone(); // Clone the geometry to avoid modifying the original
    cloneGeometry.computeBoundingBox();
    const boundingBox = cloneGeometry.boundingBox;
    if (!boundingBox) {
        console.error("Failed to compute bounding box for geometry:", geometry);
        return 0; // default to 0 offset if bounding box cannot be computed
    }
    const yOffset = (boundingBox.max.y - boundingBox.min.y) / 2;
    return yOffset;
}