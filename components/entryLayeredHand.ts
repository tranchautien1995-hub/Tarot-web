import * as THREE from "three";

type Finger = { root: [number, number]; tip: [number, number]; radius: number };
type FingerLayer = { joint: THREE.Bone; material: THREE.MeshBasicMaterial; side: number; index: number };

// Pixel-space joint axes in the unchanged skin/cyan textures.
// A single connected skin replaces cutout layers: there are no holes or moving cut edges.
const FINGERS: Finger[][] = [
  [
    { root: [752, 375], tip: [974, 315], radius: 30 },
    { root: [770, 442], tip: [929, 399], radius: 29 },
    { root: [605, 323], tip: [730, 215], radius: 37 }
  ],
  [
    { root: [315, 422], tip: [130, 513], radius: 29 },
    { root: [270, 466], tip: [218, 627], radius: 30 },
    { root: [337, 488], tip: [330, 646], radius: 29 }
  ]
];

export function createLayeredHand(side: number, material: THREE.MeshBasicMaterial) {
  const scale = side === 0 ? 0.80 : 0.85;
  const offset = side === 0 ? [0.60, -1.05] : [-0.35, 1.48];
  const framePoint = (u: number, v: number) => new THREE.Vector2(
    (u - 0.5) * 6.8 * scale + offset[0] + (side === 0
      ? -1.28 * (1 - THREE.MathUtils.smoothstep(u, 0, 0.40))
      : 0.86 * THREE.MathUtils.smoothstep(u, 0.75, 1)),
    (v - 0.5) * 5.1 * scale + offset[1]
  );
  const geometry = new THREE.PlaneGeometry(6.8, 5.1, 48, 36);
  const positions = geometry.getAttribute("position");
  const uvs = geometry.getAttribute("uv");
  const indices: number[] = [];
  const weights: number[] = [];
  for (let vertex = 0; vertex < positions.count; vertex++) {
    const u = uvs.getX(vertex), v = uvs.getY(vertex);
    const framed = framePoint(u, v);
    positions.setXY(vertex, framed.x, framed.y);
    const pixelX = u * 1024, pixelY = (1 - v) * 768;
    const influences = FINGERS[side].map(finger => {
      const axisX = finger.tip[0] - finger.root[0], axisY = finger.tip[1] - finger.root[1];
      const axisLength = Math.hypot(axisX, axisY);
      const along = ((pixelX - finger.root[0]) * axisX + (pixelY - finger.root[1]) * axisY) / axisLength;
      const t = THREE.MathUtils.clamp(along / axisLength, 0, 1);
      const distance = Math.hypot(pixelX - finger.root[0] - t * axisX, pixelY - finger.root[1] - t * axisY);
      const attachment = THREE.MathUtils.smoothstep(along, 0, 64);
      const coverage = 1 - THREE.MathUtils.smoothstep(distance, finger.radius, finger.radius + 32);
      return attachment * coverage;
    });
    // Blend all nearby joints continuously instead of switching abruptly to a winning bone.
    const total = influences.reduce((sum, value) => sum + value, 0);
    const divisor = Math.max(1, total);
    indices.push(0, 1, 2, 3);
    weights.push(Math.max(0, 1 - total), ...influences.map(value => value / divisor));
  }
  positions.needsUpdate = true;
  geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(indices, 4));
  geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(weights, 4));
  geometry.computeBoundingSphere();

  // Feather only the cropped forearm end; palm and fingers remain solid and sharp.
  material.alphaTest = 0.01;
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec2 vHandUv;").replace("#include <uv_vertex>", "#include <uv_vertex>\nvHandUv = uv;");
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec2 vHandUv;");
    shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `
      #include <map_fragment>
      float handAlpha = diffuseColor.a / max(opacity, 0.001);
      float forearmFade = smoothstep(0.0, 0.10, ${side === 0 ? "vHandUv.x" : "1.0 - vHandUv.x"});
      diffuseColor.a = opacity * smoothstep(0.35, 0.75, handAlpha) * forearmFade;
      diffuseColor.rgb *= ${side === 0 ? "vec3(0.88, 0.83, 0.80)" : "vec3(0.72, 0.90, 0.94)"};
    `);
  };
  material.customProgramCacheKey = () => `hand-forearm-feather-v1-${side}`;
  if (side === 1) {
    // Cyan is the foreground compositing layer in this 2.5D scene.
    material.depthTest = false;
    material.depthWrite = false;
  }
  const hand = new THREE.SkinnedMesh(geometry, material);
  hand.renderOrder = side === 1 ? 20 : 0;
  // Bounds cover the small joint rotation; avoid a per-frame CPU bounds calculation.
  hand.frustumCulled = false;
  const root = new THREE.Bone();
  root.name = `hand-${side}-wrist`;
  const bones: THREE.Bone[] = [root];
  const fingers: FingerLayer[] = [];
  FINGERS[side].forEach((finger, index) => {
    const pivot = framePoint(finger.root[0] / 1024, 1 - finger.root[1] / 768);
    const joint = new THREE.Bone();
    joint.name = `hand-${side}-finger-${index}`;
    joint.position.set(pivot.x, pivot.y, 0);
    root.add(joint);
    bones.push(joint);
    fingers.push({ joint, material, side, index });
  });
  hand.add(root);
  hand.bind(new THREE.Skeleton(bones));
  hand.normalizeSkinWeights();
  return { hand, fingers };
}

export function updateHandLayers(fingers: FingerLayer[], time: number, moving: boolean, opacity: number[]) {
  fingers.forEach(({ joint, material, side, index }) => {
    material.opacity = opacity[side];
    if (!moving) return;
    const phase = index * 0.7 + side * 1.1;
    const cadence = [1.05, 0.92, 0.82][index];
    joint.rotation.set(
      Math.sin(time * cadence + phase) * (side === 0 ? 0.035 : 0.055),
      Math.sin(time * cadence + phase + 0.5) * (side === 0 ? 0.050 : 0.095),
      Math.sin(time * cadence + phase) * (side === 0 ? [0.050, 0.050, 0.040] : [0.080, 0.090, 0.060])[index] * (side === 0 ? 1 : -1)
    );
  });
}
