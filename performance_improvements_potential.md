# Potential Performance Improvements

## Implemented
- [x] Reduced RENDER_DISTANCE from 3 to 2 (49 → 25 chunks)
- [x] Reduced parked car density (40% → 20%, spacing 8 → 16)
- [x] Increased streetlight spacing (20 → 32)
- [x] Shared geometries for ground/streets/sidewalks
- [x] Shared materials (reused across chunks)
- [x] Disabled antialiasing
- [x] Reduced shadow map size (2048 → 1024)
- [x] Changed to PCFShadowMap (from PCFSoftShadowMap)
- [x] Disabled shadows on small objects
- [x] Throttled game loop updates (minimap, proximity checks)
- [x] Cached DOM elements
- [x] InstancedMesh for trees and rocks
- [x] MeshLambertMaterial instead of MeshStandardMaterial for terrain

## Ready to Try
- [ ] InstancedMesh for streetlights (in progress)
- [ ] InstancedMesh for parked cars (complex due to different types)

## If Still Slow - Additional Options

### 1. Further Reduce Content
- Reduce RENDER_DISTANCE to 1 (25 → 9 chunks)
- Reduce tree count per chunk
- Remove rocks entirely
- Reduce building count

### 2. Simplify Geometry
- Fewer segments on cylinders/spheres (already reduced to 6)
- Use boxes instead of cylinders for tree trunks
- Use pyramids instead of cones for foliage
- Simpler building geometry (no interior furniture)

### 3. Level of Detail (LOD)
- Use THREE.LOD for distant objects
- Show simplified meshes far away
- Hide small objects beyond certain distance

### 4. Geometry Merging
- Merge all static chunk geometry into single BufferGeometry
- Use BufferGeometryUtils.mergeBufferGeometries()
- One draw call per chunk instead of dozens

### 5. Texture Atlasing
- Combine all textures into single atlas
- Reduces texture switching overhead

### 6. WebGPU Renderer
```javascript
// Replace WebGLRenderer with WebGPURenderer
import { WebGPURenderer } from 'three/addons/renderers/webgpu/WebGPURenderer.js';
const renderer = new WebGPURenderer();
```
- Requires Chrome 113+ or Firefox 118+
- 2-3x faster than WebGL

### 7. Frustum Culling Optimization
- Group distant objects
- Manual frustum culling for object groups
- Skip updates for off-screen chunks

### 8. Object Pooling
- Pool particle effects instead of creating/destroying
- Pool bullet trails
- Pool hit effects

### 9. Reduce Physics/Collision Checks
- Spatial partitioning for collision detection
- Only check nearby objects
- Use bounding boxes before precise checks

### 10. Lower Resolution Rendering
```javascript
renderer.setPixelRatio(1.0); // Force 1:1 pixel ratio
// Or render at lower resolution and upscale
renderer.setSize(window.innerWidth / 2, window.innerHeight / 2);
```

### 11. Disable Unnecessary Features
- Remove day/night cycle (expensive sky updates)
- Disable minimap rendering
- Remove particle effects

### 12. Web Workers
- Move collision detection to web worker
- Move pathfinding to web worker
- Offload heavy calculations

## Debugging Performance
```javascript
// Add to game loop to monitor:
console.log('Draw calls:', renderer.info.render.calls);
console.log('Triangles:', renderer.info.render.triangles);
console.log('Geometries:', renderer.info.memory.geometries);
console.log('Textures:', renderer.info.memory.textures);
```

Target metrics:
- Draw calls: < 100
- Triangles: < 100,000
- 60 FPS on mid-range hardware
