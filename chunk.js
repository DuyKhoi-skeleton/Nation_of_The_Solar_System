const CHUNK_SIZE = 512;

class ChunkManager {
    constructor() {
        this.chunks = {};
    }
    getChunkCoords(posX, posY) {
        return { x: Math.floor(posX / CHUNK_SIZE), y: Math.floor(posY / CHUNK_SIZE) };
    }
    generateChunk(cx, cy) {
        const key = cx + ',' + cy;
        if (this.chunks[key]) return this.chunks[key];

        const objects = [];
        if (cx !== 0 || cy !== 0) {
            const count = Math.floor(Math.random() * 3) + 2;
            for (let i = 0; i < count; i++) {
                objects.push({
                    x: cx * CHUNK_SIZE + Math.random() * (CHUNK_SIZE - 80) + 40,
                    y: cy * CHUNK_SIZE + Math.random() * (CHUNK_SIZE - 80) + 40,
                    radius: Math.random() > 0.5 ? 22 : 32,
                    type: Math.random() > 0.6 ? 'crystal' : 'asteroid'
                });
            }
        }
        this.chunks[key] = { objects: objects };
        return this.chunks[key];
    }
    getVisibleObjects(playerX, playerY) {
        const pChunk = this.getChunkCoords(playerX, playerY);
        let visibleObjects = [];
        for (let x = pChunk.x - 2; x <= pChunk.x + 2; x++) {
            for (let y = pChunk.y - 2; y <= pChunk.y + 2; y++) {
                visibleObjects = visibleObjects.concat(this.generateChunk(x, y).objects);
            }
        }
        return visibleObjects;
    }
}