interface Position {
    x: number;
    y: number;
}

interface PathNode {
    x: number;
    y: number;
    g: number; // cost from start
    h: number; // heuristic cost to end
    f: number; // total cost
    parent: PathNode | null;
}

/**
 * Find a path from start to end on the grid map using the A* algorithm.
 * If adjacentOK is true, the path will stop at an adjacent cell to the destination if the destination itself is blocked
 * or if we just want to stand adjacent to the target (like next to a well or storage).
 */
export function findPath(
    tilemap: number[][],
    tiles: { id: number; walkable: boolean }[],
    start: Position,
    end: Position,
    adjacentOK = false
): Position[] | null {
    const height = tilemap.length;
    const width = tilemap[0].length;

    // Helper to check if a tile is walkable
    const walkableCache = new Map<number, boolean>();
    tiles.forEach(t => walkableCache.set(t.id, t.walkable));

    const isWalkable = (x: number, y: number): boolean => {
        if (x < 0 || x >= width || y < 0 || y >= height) return false;
        const tileId = tilemap[y][x];
        return walkableCache.get(tileId) ?? false;
    };

    // If starting point is the same as end point, return empty path
    if (start.x === end.x && start.y === end.y) {
        return [];
    }

    // Determine target positions.
    // If adjacentOK, we accept any walkable neighbor of 'end'.
    const targets = new Set<string>();
    if (adjacentOK) {
        const neighbors = [
            { x: end.x + 1, y: end.y },
            { x: end.x - 1, y: end.y },
            { x: end.x, y: end.y + 1 },
            { x: end.x, y: end.y - 1 }
        ];
        neighbors.forEach(n => {
            if (isWalkable(n.x, n.y)) {
                targets.add(`${n.x},${n.y}`);
            }
        });
        // If the starting point is already one of the adjacent targets, return empty path
        if (targets.has(`${start.x},${start.y}`)) {
            return [];
        }
    } else {
        targets.add(`${end.x},${end.y}`);
    }

    if (targets.size === 0) {
        return null; // No valid destinations
    }

    const openSet: PathNode[] = [];
    const closedSet = new Set<string>();

    const startNode: PathNode = {
        x: start.x,
        y: start.y,
        g: 0,
        h: Math.abs(start.x - end.x) + Math.abs(start.y - end.y),
        f: Math.abs(start.x - end.x) + Math.abs(start.y - end.y),
        parent: null
    };

    openSet.push(startNode);

    while (openSet.length > 0) {
        // Find node with lowest f cost
        let currentIdx = 0;
        for (let i = 1; i < openSet.length; i++) {
            if (openSet[i].f < openSet[currentIdx].f) {
                currentIdx = i;
            }
        }

        const current = openSet[currentIdx];
        const currentKey = `${current.x},${current.y}`;

        // Check if we reached a target
        if (targets.has(currentKey) || (!adjacentOK && current.x === end.x && current.y === end.y)) {
            // Reconstruct path
            const path: Position[] = [];
            let curr: PathNode | null = current;
            while (curr !== null) {
                path.push({ x: curr.x, y: curr.y });
                curr = curr.parent;
            }
            path.reverse();
            // Remove the start position from the path, as the actor is already there
            return path.slice(1);
        }

        // Move current node from open to closed
        openSet.splice(currentIdx, 1);
        closedSet.add(currentKey);

        // Generate neighbors
        const neighbors = [
            { x: current.x + 1, y: current.y },
            { x: current.x - 1, y: current.y },
            { x: current.x, y: current.y + 1 },
            { x: current.x, y: current.y - 1 }
        ];

        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.x},${neighbor.y}`;
            if (closedSet.has(neighborKey)) continue;

            // Check if walkable or if it is the target (if not adjacentOK, we might need to step on a non-walkable tile, though generally targets should be walkable)
            if (!isWalkable(neighbor.x, neighbor.y)) {
                // If it's the target and we don't require adjacency, we can move onto it, but usually, we only walk on walkable tiles
                if (adjacentOK || neighbor.x !== end.x || neighbor.y !== end.y) {
                    continue;
                }
            }

            const gScore = current.g + 1;
            let neighborNode = openSet.find(node => node.x === neighbor.x && node.y === neighbor.y);

            if (!neighborNode) {
                const hScore = Math.abs(neighbor.x - end.x) + Math.abs(neighbor.y - end.y);
                neighborNode = {
                    x: neighbor.x,
                    y: neighbor.y,
                    g: gScore,
                    h: hScore,
                    f: gScore + hScore,
                    parent: current
                };
                openSet.push(neighborNode);
            } else if (gScore < neighborNode.g) {
                neighborNode.g = gScore;
                neighborNode.f = gScore + neighborNode.h;
                neighborNode.parent = current;
            }
        }
    }

    return null; // Path not found
}

/**
 * Helper to find the closest walkable tile adjacent to a target position.
 */
export function getClosestWalkableAdjacent(
    tilemap: number[][],
    tiles: { id: number; walkable: boolean }[],
    currentPos: Position,
    targetPos: Position
): Position | null {
    const neighbors = [
        { x: targetPos.x + 1, y: targetPos.y },
        { x: targetPos.x - 1, y: targetPos.y },
        { x: targetPos.x, y: targetPos.y + 1 },
        { x: targetPos.x, y: targetPos.y - 1 }
    ];

    const walkableCache = new Map<number, boolean>();
    tiles.forEach(t => walkableCache.set(t.id, t.walkable));

    const height = tilemap.length;
    const width = tilemap[0].length;
    const isWalkable = (x: number, y: number): boolean => {
        if (x < 0 || x >= width || y < 0 || y >= height) return false;
        const tileId = tilemap[y][x];
        return walkableCache.get(tileId) ?? false;
    };

    let bestDist = Infinity;
    let bestNeighbor: Position | null = null;

    for (const n of neighbors) {
        if (isWalkable(n.x, n.y)) {
            const dist = Math.abs(n.x - currentPos.x) + Math.abs(n.y - currentPos.y);
            if (dist < bestDist) {
                bestDist = dist;
                bestNeighbor = n;
            }
        }
    }

    return bestNeighbor;
}
