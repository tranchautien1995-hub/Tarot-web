"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { createLayeredHand, updateHandLayers } from "./entryLayeredHand";

export type EntryMode = "tarot" | "lenormand" | "combined";
type EntryPhase = "portal" | "identity" | "choice" | "ritual";

type Props = {
  onContinue: (mode: EntryMode) => void;
  initialMode?: EntryMode;
};

const MODE_COPY: Record<EntryMode, { title: string; eyebrow: string; description: string }> = {
  tarot: {
    title: "Tarot",
    eyebrow: "Chiều sâu",
    description: "Chiều sâu cảm xúc và bức tranh tổng thể."
  },
  lenormand: {
    title: "Lenormand",
    eyebrow: "Tín hiệu",
    description: "Cụ thể, trực tiếp và gần với diễn biến thực tế."
  },
  combined: {
    title: "Tarot × Lenormand",
    eyebrow: "Giao thoa",
    description: "Kết hợp chiều sâu của Tarot và sự cụ thể của Lenormand."
  }
};

const TAROT_ASSET = "/cards/rider-waite/major-00.jpg";
const LENORMAND_ASSET = "/entry-v3/lenormand-33-key.png";
const CHOICE_CARDS = [[0], [1], [2, 3]];
const CHOICE_DEPTH = [-0.2, 0.12, 0.08, -0.62];

function EntryCanvas({ phase, selected, hovered, onHover }: { phase: EntryPhase; selected: EntryMode; hovered: EntryMode | null; onHover: (mode: EntryMode | null) => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    world: THREE.Group;
    portal: THREE.Group;
    rings: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>[];
    planets: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>[];
    hovered: EntryMode | null;
    cards: THREE.Group[];
    cardFaces: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>[];
    cardGlows: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[];
    fingerLayers: ReturnType<typeof createLayeredHand>["fingers"];
    phase: EntryPhase;
    settled: boolean;
    layout: () => void;
    cardGroup: THREE.Group;
    hands: THREE.Group;
    leftHand: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
    rightHand: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
    aura: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
    starField: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
    textures: THREE.Texture[];
    raf: number;
    pointer: THREE.Vector2;
    reduced: boolean;
  } | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.domElement.className = "entry-webgl-canvas";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07060b, 0.075);
    const camera = new THREE.PerspectiveCamera(34, mount.clientWidth / mount.clientHeight, 0.1, 80);
    camera.position.set(0, 0, 8.8);
    const world = new THREE.Group();
    scene.add(world);

    const ambient = new THREE.AmbientLight(0xc9b8ff, 1.2);
    const key = new THREE.DirectionalLight(0xf6d79a, 2.7);
    key.position.set(-4, 5, 6);
    const fill = new THREE.PointLight(0x1b9c91, 16, 18, 2);
    fill.position.set(4, -2, 4);
    scene.add(ambient, key, fill);

    const auraMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x40264e) },
        uStrength: { value: 0.72 }
      },
      vertexShader: "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader: "varying vec2 vUv;uniform float uTime;uniform vec3 uColor;uniform float uStrength;void main(){vec2 p=vUv-.5;float d=length(p);float halo=smoothstep(.72,.02,d);float ring=.5+.5*cos(d*28.-uTime*.5);float a=(halo*.24+halo*ring*.035)*uStrength;gl_FragColor=vec4(uColor,a);}"
    });
    const aura = new THREE.Mesh(new THREE.PlaneGeometry(28, 18), auraMaterial);
    aura.position.z = -6;
    world.add(aura);

    const starPositions = new Float32Array(180 * 3);
    for (let index = 0; index < 180; index += 1) {
      const seed = index * 12.9898;
      starPositions[index * 3] = (Math.sin(seed) * 0.5) * 24;
      starPositions[index * 3 + 1] = (Math.sin(seed * 1.73) * 0.5) * 15;
      starPositions[index * 3 + 2] = -2 - ((index * 17) % 45) / 5;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xd8bf8a, size: 0.018, transparent: true, opacity: 0.5, depthWrite: false });
    const starField = new THREE.Points(starGeometry, starMaterial);
    world.add(starField);

    const portal = new THREE.Group();
    const ringSpecs = [
      { radius: 1.48, tube: 0.012, opacity: 0.72 },
      { radius: 1.78, tube: 0.006, opacity: 0.3 },
      { radius: 2.06, tube: 0.004, opacity: 0.18 }
    ];
    const rings = ringSpecs.map((spec, index) => {
      const material = new THREE.MeshBasicMaterial({ color: index === 0 ? 0xe6c786 : 0x8d6ba3, transparent: true, opacity: spec.opacity, depthWrite: false });
      const mesh = new THREE.Mesh(new THREE.TorusGeometry(spec.radius, spec.tube, 12, 180), material);
      mesh.rotation.x = index * 0.17;
      mesh.rotation.y = index * -0.11;
      portal.add(mesh);
      return mesh;
    });
    const planets: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>[] = [];
    rings.forEach((ring, orbitIndex) => {
      [0, 1].forEach(planetIndex => {
        const radius = [0.095, 0.075, 0.065][orbitIndex] * (planetIndex === 0 ? 1 : 0.7);
        const material = new THREE.MeshStandardMaterial({ color: [0xd8b77a, 0xcfc6ac, 0x9483a0][orbitIndex], roughness: 0.85, metalness: 0.02, transparent: true });
        material.emissive.copy(material.color);
        const planet = new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 12), material);
        planet.userData.glowOffset = (orbitIndex * 2 + planetIndex) * 0.65;
        planet.userData.orbitRadius = ringSpecs[orbitIndex].radius;
        planet.userData.orbitSpeed = [0.18, -0.14, 0.11][orbitIndex];
        planet.userData.orbitOffset = orbitIndex * 0.8 + planetIndex * Math.PI;
        const angle = planet.userData.orbitOffset;
        planet.position.set(Math.cos(angle) * planet.userData.orbitRadius, Math.sin(angle) * planet.userData.orbitRadius, 0);
        ring.add(planet);
        planets.push(planet);
      });
    });
    const portalDisc = new THREE.Mesh(
      new THREE.CircleGeometry(1.38, 96),
      new THREE.MeshBasicMaterial({ color: 0x120f1a, transparent: true, opacity: 0.62, depthWrite: false })
    );
    portalDisc.position.z = -0.03;
    portal.add(portalDisc);
    world.add(portal);

    const cardGroup = new THREE.Group();
    cardGroup.visible = false;
    world.add(cardGroup);
    const textureLoader = new THREE.TextureLoader();
    const textures: THREE.Texture[] = [];
    const cardFaces: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>[] = [];
    const cardGlows: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];
    const cardPaths = [TAROT_ASSET, LENORMAND_ASSET, TAROT_ASSET, LENORMAND_ASSET];
    const cards = cardPaths.map((path, index) => {
      const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72, metalness: 0.04, side: THREE.DoubleSide });
      material.userData.hoverLight = { value: 1 };
      // Clip only the scan's black outer margin, retaining all artwork and the title.
      material.onBeforeCompile = shader => {
        shader.uniforms.uHoverLight = material.userData.hoverLight;
        shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec2 vCardUv;").replace("#include <uv_vertex>", "#include <uv_vertex>\nvCardUv = uv;");
        shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec2 vCardUv;uniform float uHoverLight;").replace("#include <clipping_planes_fragment>", "#include <clipping_planes_fragment>\nvec2 corner = max(abs(vCardUv - .5) - vec2(.482, .489), 0.) / vec2(.018, .011); if(length(corner) > 1.) discard;").replace("#include <fog_fragment>", "#include <fog_fragment>\ngl_FragColor.rgb *= uHoverLight;");
      };
      material.customProgramCacheKey = () => "entry-trimmed-card-hover-v2";
      const texture = textureLoader.load(path, loaded => {
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        material.map = loaded;
        // Hover uses a small brightness gain after scene fog, preserving image detail.
        material.emissiveMap = null;
        material.emissive.set(0xffffff);
        material.emissiveIntensity = 0;
        material.needsUpdate = true;
        // Preserve scan proportions after removing only the outer black margin.
        const image = loaded.image as HTMLImageElement;
        const tarot = index === 0 || index === 2;
        if (tarot) {
          loaded.offset.set(7 / image.width, 7 / image.height);
          loaded.repeat.set((image.width - 14) / image.width, (image.height - 14) / image.height);
        }
        // Both systems use the same displayed width and height as the trimmed Tarot.
        cardFaces[index].scale.x = (286 / 513) / (1.62 / 2.76);
      });
      textures.push(texture);
      const face = new THREE.Mesh(new THREE.PlaneGeometry(1.62, 2.76, 1, 1), material);
      cardFaces.push(face);
      const glowMaterial = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false,
        uniforms: { uStrength: { value: 0.5 } },
        vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
        fragmentShader: "varying vec2 vUv;uniform float uStrength;void main(){vec2 q=abs(vUv-.5)*vec2(2.35,3.49)-vec2(.81,1.38);float d=length(max(q,0.));float a=exp(-d*10.)*.22*uStrength;gl_FragColor=vec4(.78,.64,.40,a);}",
        toneMapped: false
      });
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.35, 3.49), glowMaterial);
      glow.position.z = -0.09;
      face.add(glow);
      cardGlows.push(glow);
      const card = new THREE.Group();
      card.add(face);
      card.position.set(0, 0, -4 - index * 0.25);
      card.rotation.set(0.08 * (index - 1), 0.12 * (index - 1), 0);
      cardGroup.add(card);
      return card;
    });

    const hands = new THREE.Group();
    hands.visible = false;
    world.add(hands);
    const leftMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: true, alphaTest: 0.1, toneMapped: true });
    const rightMaterial = leftMaterial.clone();
    const leftTexture = textureLoader.load("/entry-v3/ritual-hand-left.webp", loaded => {
      loaded.colorSpace = THREE.SRGBColorSpace;
      leftMaterial.map = loaded;
      leftMaterial.needsUpdate = true;
    });
    const rightTexture = textureLoader.load("/entry-v3/ritual-hand-right.webp", loaded => {
      loaded.colorSpace = THREE.SRGBColorSpace;
      rightMaterial.map = loaded;
      rightMaterial.needsUpdate = true;
    });
    textures.push(leftTexture, rightTexture);
    leftMaterial.map = leftTexture;
    rightMaterial.map = rightTexture;
    const leftRig = createLayeredHand(0, leftMaterial);
    const rightRig = createLayeredHand(1, rightMaterial);
    const leftHand = leftRig.hand;
    const rightHand = rightRig.hand;
    const fingerLayers = [...leftRig.fingers, ...rightRig.fingers];
    leftHand.position.set(-7.2, -1.65, 0.38);
    rightHand.position.set(7.2, 1.65, 0.22);
    leftHand.rotation.z = 0.04;
    rightHand.rotation.z = -0.04;
    hands.add(leftHand, rightHand);

    const pointer = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const hoverPointer = new THREE.Vector2();
    const onPointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
      const stage = stageRef.current;
      if (stage?.phase !== "choice") return;
      if (event.target instanceof Element && event.target.closest(".entry-choice-card")) return;
      hoverPointer.set(pointer.x, -pointer.y);
      raycaster.setFromCamera(hoverPointer, camera);
      const hit = raycaster.intersectObjects(cardFaces, false)[0];
      const index = hit ? cardFaces.indexOf(hit.object as typeof cardFaces[number]) : -1;
      const mode = index === 0 ? "tarot" : index === 1 ? "lenormand" : index >= 2 ? "combined" : null;
      if (mode !== stage.hovered) onHover(mode);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const layout = () => {
      const stage = stageRef.current;
      if (!stage) return;
      const height = mount.clientHeight;
      const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
      const viewWidth = viewHeight * camera.aspect;
      const worldScale = world.scale.x;
      if (stage.phase === "choice") {
        const grid = mount.closest(".entry-experience")?.querySelector(".entry-choice-grid");
        if (!grid) return;
        const gridBounds = grid.getBoundingClientRect();
        const mobile = mount.clientWidth <= 820;
        const scale = Math.min(0.94, (viewHeight * (mobile ? 0.21 : 0.39)) / (2.76 * worldScale), mobile ? viewWidth * 0.29 / (2.6 * worldScale) : Infinity);
        cardGroup.scale.setScalar(scale);
        const cardHeight = 2.76 * scale * worldScale / viewHeight * height;
        const centerY = gridBounds.top - cardHeight / 2 - (mobile ? 24 : 44);
        const y = (0.5 - centerY / height) * viewHeight / worldScale;
        const buttons = grid.querySelectorAll("button");
        CHOICE_CARDS.forEach((indices, modeIndex) => {
          const bounds = buttons[modeIndex].getBoundingClientRect();
          const screenX = mobile ? (modeIndex + 0.5) * mount.clientWidth / 3 : bounds.left + bounds.width / 2;
          const x = (screenX / mount.clientWidth - 0.5) * viewWidth / worldScale / scale;
          indices.forEach((cardIndex, pairIndex) => {
            cards[cardIndex].position.x = x + (indices.length === 2 ? (pairIndex - 0.5) * 0.85 : 0);
            cards[cardIndex].position.y = y / scale;
            cards[cardIndex].userData.choiceScale = indices.length === 2 ? (mobile ? 0.78 : 0.84) : 1;
          });
        });
      } else if (stage.phase === "ritual") {
        const portrait = camera.aspect < 1;
        const combined = cards[0].visible && cards[1].visible;
        const scale = Math.min(1.04, viewHeight * (portrait ? 0.42 : 0.51) / (2.76 * worldScale), viewWidth * (combined ? 0.72 : 0.38) / ((combined ? 3.2 : 1.86) * worldScale));
        cardGroup.scale.setScalar(scale);
        const handScale = portrait ? Math.min(0.75, viewWidth / (7.2 * worldScale)) : 0.74;
        hands.scale.setScalar(handScale);
        const reach = (portrait ? 3.1 : Math.max(2.6, viewWidth / (2 * handScale * worldScale) - 3.2));
        leftHand.position.set(-reach, portrait ? -2.40 : -1.05, -1.0);
        rightHand.position.set(reach, portrait ? 2.25 : 0.85, 0.22);
      }
    };
    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < 700 ? 1.35 : 1.7));
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      const worldScale = camera.aspect < 0.7 ? 0.68 : camera.aspect < 1 ? 0.82 : 1;
      world.scale.setScalar(worldScale);
      layout();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    const clock = new THREE.Clock();
    let raf = 0;
    const render = () => {
      const elapsed = clock.getElapsedTime();
      auraMaterial.uniforms.uTime.value = elapsed;
      if (!reduced) {
        // Inclined orbital planes revolve around the unchanged CTA center.
        if (stageRef.current?.phase === "portal" || stageRef.current?.phase === "choice") {
          planets.forEach(planet => {
            const angle = elapsed * planet.userData.orbitSpeed + planet.userData.orbitOffset;
            planet.position.set(Math.cos(angle) * planet.userData.orbitRadius, Math.sin(angle) * planet.userData.orbitRadius, 0);
            // One soft pulse every 4.8s, staggered without extra loops or timers.
            const pulseTime = (elapsed + planet.userData.glowOffset) % 4.8;
            const pulse = Math.sin(Math.PI * Math.min(pulseTime / 1.35, 1));
            planet.material.emissiveIntensity = pulse * pulse * 1.25;
          });
        }
        if (stageRef.current?.phase === "portal") {
          portal.rotation.z = elapsed * 0.026;
          rings.forEach((ring, index) => {
            const angle = elapsed * [0.12, -0.095, 0.08][index] + [0, 0.7, -0.5][index];
            ring.rotation.set([0.78, 0.96, 0.62][index], Math.sin(angle * 0.5) * 0.16, angle);
          });
        } else {
          portal.rotation.z = elapsed * 0.035;
          rings[1].rotation.z = -elapsed * 0.08;
          rings[2].rotation.z = elapsed * 0.055;
        }
        starField.rotation.z = elapsed * 0.0025;
        world.rotation.y += (pointer.x * 0.012 - world.rotation.y) * 0.025;
        world.rotation.x += (-pointer.y * 0.008 - world.rotation.x) * 0.025;
        if (stageRef.current?.phase === "choice") {
          cardFaces.forEach((face, index) => {
            face.rotation.set(Math.sin(elapsed * 0.48 + index * 0.35) * 0.018, Math.sin(elapsed * 0.66 + index * 0.35) * 0.12, 0);
            face.position.y = Math.sin(elapsed * 0.44 + index * 0.35) * 0.012;
          });
        }
        if (hands.visible && stageRef.current?.settled) {
          // Keep the previous wrist cadence and fixed framing; increase its small tilt only.
          leftHand.rotation.x = Math.sin(elapsed * 0.43) * 0.040;
          rightHand.rotation.x = Math.cos(elapsed * 0.39) * 0.040;
          leftHand.rotation.y = Math.sin(elapsed * 0.41) * 0.050;
          rightHand.rotation.y = Math.cos(elapsed * 0.37) * 0.050;
          cards.forEach((card, index) => {
            if (!card.visible) return;
            cardFaces[index].rotation.set(Math.sin(elapsed * 0.58) * 0.055, Math.sin(elapsed * 0.72) * 0.27, Math.sin(elapsed * 0.46) * 0.035);
            cardFaces[index].position.y = Math.sin(elapsed * 0.48) * 0.045;
            cardFaces[index].position.z = Math.sin(elapsed * 0.45) * 0.04;
          });
        }
      }
      updateHandLayers(fingerLayers, elapsed, !reduced && hands.visible && Boolean(stageRef.current?.settled), [leftMaterial.opacity, rightMaterial.opacity]);
      renderer.render(scene, camera);
      raf = window.requestAnimationFrame(render);
    };
    render();

    stageRef.current = { renderer, scene, camera, world, portal, rings, planets, hovered: null, cards, cardFaces, fingerLayers, phase: "portal", settled: false, layout, cardGroup, hands, leftHand, rightHand, aura, starField, textures, raf, pointer, reduced, cardGlows };

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      observer.disconnect();
      window.cancelAnimationFrame(raf);
      gsap.killTweensOf([camera.position, portal.position, portal.scale, cardGroup.position, cardGroup.rotation, cardGroup.scale, hands.position, leftHand.position, rightHand.position, leftHand.rotation, rightHand.rotation, leftHand.material, rightHand.material, ...rings.map(ring => ring.material), ...planets.map(planet => planet.material), ...cardFaces.map(face => face.material.userData.hoverLight), ...cardGlows.map(glow => glow.material.uniforms.uStrength), ...cardFaces.map(face => face.material), ...cards.flatMap(card => [card.position, card.rotation, card.scale])]);
      scene.traverse(object => {
        if (object instanceof THREE.SkinnedMesh) object.skeleton.dispose();
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry?.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach(material => material?.dispose());
        }
      });
      textures.forEach(texture => texture.dispose());
      renderer.dispose();
      renderer.domElement.remove();
      stageRef.current = null;
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const { camera, portal, rings, planets, cardGroup, cards, cardFaces, cardGlows, hands, leftHand, rightHand, aura, reduced, layout } = stage;
    stage.phase = phase;
    stage.settled = false;
    cardGlows.forEach(glow => { gsap.killTweensOf(glow.material.uniforms.uStrength); glow.material.uniforms.uStrength.value = phase === "ritual" ? 0.75 : 0.45; });
    planets.forEach(planet => { planet.visible = phase === "portal" || phase === "identity" || phase === "choice"; planet.scale.setScalar(phase === "choice" ? 0.55 : 1); planet.material.emissiveIntensity = 0; if (phase === "portal") planet.material.opacity = 1; });
    cardFaces.forEach(face => { face.rotation.set(0, 0, 0); face.position.set(0, 0, 0); face.material.emissiveIntensity = 0; face.material.userData.hoverLight.value = 1; });
    const duration = reduced ? 0 : 1;
    gsap.killTweensOf([camera.position, portal.position, portal.scale, cardGroup.position, cardGroup.rotation, cardGroup.scale, hands.position, leftHand.position, rightHand.position, leftHand.rotation, rightHand.rotation, leftHand.material, rightHand.material, ...rings.map(ring => ring.material), ...planets.map(planet => planet.material), ...cardFaces.map(face => face.material.userData.hoverLight), ...cardGlows.map(glow => glow.material.uniforms.uStrength), ...cardFaces.map(face => face.material), ...cards.flatMap(card => [card.position, card.rotation, card.scale])]);

    if (phase === "portal") {
      portal.visible = true;
      cardGroup.visible = false;
      hands.visible = false;
      gsap.set(portal.scale, { x: 0.74, y: 0.74, z: 0.74 });
      gsap.set(portal.position, { x: 0, y: 0, z: 0 });
      gsap.set(camera.position, { x: 0, y: 0, z: 8.8 });
      rings.forEach((ring, index) => { ring.material.opacity = [0.72, 0.3, 0.18][index]; });
      aura.material.uniforms.uColor.value.set(0x40264e);
      aura.material.uniforms.uStrength.value = 0.72;
      return;
    }

    if (phase === "identity") {
      portal.visible = true;
      const timeline = gsap.timeline({ defaults: { ease: "power3.inOut" } });
      timeline.to(portal.scale, { x: 3.4, y: 3.4, z: 3.4, duration: 1.45 * duration }, 0)
        .to(portal.position, { z: -2.2, duration: 1.45 * duration }, 0)
        .to(camera.position, { z: 7.25, duration: 1.65 * duration }, 0);
      planets.forEach(planet => timeline.to(planet.material, { opacity: 0, duration: 0.65 * duration }, 0));
      rings.forEach((ring, index) => timeline.to(ring.material, { opacity: index === 0 ? 0.16 : 0.06, duration: 1.1 * duration }, 0.25));
      return () => { timeline.kill(); };
    }

    if (phase === "choice") {
      portal.visible = true;
      cardGroup.visible = true;
      hands.visible = false;
      aura.material.uniforms.uColor.value.set(0x2b5e59);
      aura.material.uniforms.uStrength.value = 0.88;
      leftHand.material.opacity = 0;
      rightHand.material.opacity = 0;
      leftHand.rotation.set(0, 0, 0.04);
      rightHand.rotation.set(0, 0, -0.04);
      const previousCameraZ = camera.position.z;
      const previousScale = cardGroup.scale.x;
      const previousPositions = cards.map(card => card.position.clone());
      camera.position.z = 9.4;
      layout();
      const targetScale = cardGroup.scale.x;
      const targets = cards.map(card => card.position.clone());
      camera.position.z = previousCameraZ;
      cardGroup.scale.setScalar(previousScale);
      cards.forEach((card, index) => card.position.copy(previousPositions[index]));
      const timeline = gsap.timeline({ defaults: { ease: "power4.out" } });
      cards.forEach((card, index) => {
        card.visible = true;
        card.scale.setScalar(card.userData.choiceScale || 1);
        const combined = index >= 2;
        const targetZ = CHOICE_DEPTH[index];
        const rz = combined ? (index === 2 ? -0.11 : 0.11) : index === 0 ? -0.12 : 0;
        timeline.to(card.position, { x: targets[index].x, y: targets[index].y, z: targetZ, duration: 1.2 * duration }, index * 0.055 * duration)
          .to(card.rotation, { x: 0, y: 0, z: rz, duration: 1.25 * duration }, index * 0.055 * duration);
      });
      timeline.to(cardGroup.scale, { x: targetScale, y: targetScale, z: targetScale, duration: 1.1 * duration, ease: "power3.out" }, 0)
        .to(camera.position, { z: 9.4, duration: 1.2 * duration, ease: "power3.inOut" }, 0);
      planets.forEach(planet => timeline.to(planet.material, { opacity: 0.85, duration: 0.8 * duration }, 0));
      rings.forEach(ring => timeline.to(ring.material, { opacity: 0.055, duration: 0.8 * duration }, 0));
      return () => { timeline.kill(); };
    }

    portal.visible = true;
    cardGroup.visible = true;
    hands.visible = true;
    aura.material.uniforms.uColor.value.set(selected === "lenormand" ? 0x294d43 : selected === "combined" ? 0x4d395f : 0x4b294e);
    aura.material.uniforms.uStrength.value = 1.2;

    // Combined now presents both genuine systems, as requested.
    const heroIndex = selected === "lenormand" ? 1 : 0;
    cards.forEach((card, index) => { card.visible = index === heroIndex || (selected === "combined" && index === 1); card.scale.setScalar(selected === "combined" ? 0.9 : 1); });
    const timeline = gsap.timeline({ defaults: { ease: "power3.inOut" }, onComplete: () => { stage.settled = true; } });
    const previousCameraZ = camera.position.z;
    const previousScale = cardGroup.scale.x;
    camera.position.z = 8.15;
    layout();
    const targetScale = cardGroup.scale.x;
    camera.position.z = previousCameraZ;
    cardGroup.scale.setScalar(previousScale);
    const leftTarget = leftHand.position.clone();
    const rightTarget = rightHand.position.clone();
    leftHand.position.x -= 2.6;
    rightHand.position.x += 2.6;
    leftHand.material.opacity = 0;
    rightHand.material.opacity = 0;
    timeline.to(cardGroup.scale, { x: targetScale, y: targetScale, z: targetScale, duration: 1.35 * duration }, 0)
      .to(camera.position, { z: 8.15, duration: 1.45 * duration }, 0)
      .to(cards[heroIndex].position, { x: selected === "combined" ? -0.58 : 0, y: 0, z: 0, duration: 1.35 * duration, ease: "power4.inOut" }, 0)
      .to(cards[heroIndex].rotation, { x: 0, y: 0, z: -0.07, duration: 1.35 * duration, ease: "power4.inOut" }, 0)
      .to(leftHand.material, { opacity: 1, duration: 0.65 * duration, ease: "power2.out" }, 0.35 * duration)
      .to(rightHand.material, { opacity: 1, duration: 0.65 * duration, ease: "power2.out" }, 0.42 * duration)
      .to(leftHand.position, { x: leftTarget.x, y: leftTarget.y, duration: 1.65 * duration, ease: "power4.out" }, 0.28 * duration)
      .to(rightHand.position, { x: rightTarget.x, y: rightTarget.y, duration: 1.72 * duration, ease: "power4.out" }, 0.34 * duration)
      .to(leftHand.rotation, { z: -0.025, duration: 1.5 * duration, ease: "power3.out" }, 0.3 * duration)
      .to(rightHand.rotation, { z: 0.025, duration: 1.55 * duration, ease: "power3.out" }, 0.36 * duration);
    if (selected === "combined") {
      // Keep the full Lenormand surface behind The Fool throughout tilt and entry.
      cards[1].position.z = Math.min(cards[1].position.z, cards[0].position.z - 0.7);
      timeline.to(cards[1].position, { x: 0.65, y: 0.035, z: -0.7, duration: 1.35 * duration }, 0)
        .to(cards[1].rotation, { x: 0, y: 0, z: 0.08, duration: 1.35 * duration }, 0);
    }
    return () => { timeline.kill(); };

  }, [phase, selected]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.hovered = hovered;
    if (phase !== "choice") return;
    const index = hovered === "tarot" ? 0 : hovered === "lenormand" ? 1 : hovered === "combined" ? 2 : -1;
    const baseDepth = CHOICE_DEPTH;
    stage.cards.forEach((card, cardIndex) => {
      const active = index >= 0 && CHOICE_CARDS[index].includes(cardIndex);
      gsap.to(stage.cardFaces[cardIndex].material, { emissiveIntensity: 0, duration: stage.reduced ? 0 : 0.4, ease: "power2.out", overwrite: "auto" });
      gsap.to(stage.cardFaces[cardIndex].material.userData.hoverLight, { value: active ? 1.75 : 1, duration: stage.reduced ? 0 : 0.4, ease: "power2.out", overwrite: "auto" });
      gsap.to(stage.cardGlows[cardIndex].material.uniforms.uStrength, { value: active ? 1.9 : 0.45, duration: stage.reduced ? 0 : 0.4, ease: "power2.out", overwrite: "auto" });
      const scale = (card.userData.choiceScale || 1) * (active ? 1.06 : 1);
      gsap.to(card.scale, { x: scale, y: scale, z: 1, duration: stage.reduced ? 0 : 0.5, ease: "power3.out", overwrite: "auto" });
      gsap.to(card.position, { z: baseDepth[cardIndex] + (active ? 0.38 : 0), duration: stage.reduced ? 0 : 0.5, ease: "power3.out", overwrite: "auto" });
    });
  }, [hovered, phase]);

  return <div className="entry-webgl" ref={mountRef} aria-hidden="true" />;
}

export default function TarotEntryExperience({ onContinue, initialMode = "tarot" }: Props) {
  const [phase, setPhase] = useState<EntryPhase>("portal");
  const [selected, setSelected] = useState<EntryMode>(initialMode);
  const [hovered, setHovered] = useState<EntryMode | null>(null);
  const [settled, setSettled] = useState(false);
  const timers = useRef<number[]>([]);
  const phaseRef = useRef<EntryPhase>("portal");
  const clearTimers = () => { timers.current.forEach(window.clearTimeout); timers.current = []; };

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const enterPortal = () => {
    if (phaseRef.current !== "portal") return;
    phaseRef.current = "identity";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPhase("identity");
    timers.current.push(window.setTimeout(() => { phaseRef.current = "choice"; setPhase("choice"); }, reduced ? 2400 : 3400));
  };

  const choose = (mode: EntryMode) => {
    if (phaseRef.current !== "choice") return;
    clearTimers();
    phaseRef.current = "ritual";
    setHovered(null);
    setSelected(mode);
    setSettled(false);
    setPhase("ritual");
    sessionStorage.setItem("ttarot:selected-experience", mode);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timers.current.push(window.setTimeout(() => setSettled(true), reduced ? 80 : 2300));
  };

  return (
    <main className={`entry-experience entry-phase-${phase}`}>
      <EntryCanvas phase={phase} selected={selected} hovered={hovered} onHover={setHovered} />
      <div className="entry-vignette" aria-hidden="true" />
      <div className="entry-grain" aria-hidden="true" />

      {phase === "portal" && (
        <section className="entry-portal-scene" aria-labelledby="entry-portal-title">
          <p className="entry-index">TTAROT · PRIVATE RITUAL</p>
          <button className="entry-portal-button" type="button" onClick={enterPortal}>
            <span className="entry-portal-hit" aria-hidden="true" />
            <span id="entry-portal-title">Chạm để bước vào</span>
            <small>ENTER THE READING</small>
          </button>
          <p className="entry-portal-note">Âm thanh không bắt buộc · Toàn màn hình được khuyến nghị</p>
        </section>
      )}

      {phase === "identity" && (
        <section className="entry-identity-scene" aria-label="Giới thiệu TTarot">
          <p className="entry-index">A PRIVATE SPACE FOR SEEING CLEARLY</p>
          <h1 className="entry-custom-logo"><img src="/entry-v3/ttarot-logo.svg" alt="TTarot" width={99} height={137} loading="eager" decoding="async" /></h1>
          <div className="entry-identity-line" aria-hidden="true" />
          <p>Mỗi lá bài đang chờ được nhìn thấy.</p>
        </section>
      )}

      {phase === "choice" && (
        <section className="entry-choice-scene" aria-labelledby="entry-choice-title">
          <header>
            <p className="entry-index">CHỌN CÁCH BẠN MUỐN NHÌN</p>
            <h1 id="entry-choice-title">Ba cánh cửa,<br /><em>Một câu trả lời</em></h1>
          </header>
          <div className="entry-choice-grid">
            {(Object.keys(MODE_COPY) as EntryMode[]).map((mode, index) => (
              <button
                key={mode}
                type="button"
                className={`entry-choice-card entry-choice-${mode}`}
                onPointerEnter={() => setHovered(mode)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(mode)}
                onBlur={() => setHovered(null)}
                onClick={() => choose(mode)}
              >
                <span className="entry-choice-number">0{index + 1}</span>
                <span className="entry-choice-copy">
                  <small>{MODE_COPY[mode].eyebrow}</small>
                  <strong>{MODE_COPY[mode].title}</strong>
                  <em>{MODE_COPY[mode].description}</em>
                </span>
                <span className="entry-choice-arrow" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {phase === "ritual" && (
        <section className={`entry-ritual-scene ${settled ? "is-settled" : ""}`} aria-labelledby="entry-ritual-title">
          <header>
            <p className="entry-index">YOUR READING AWAITS</p>
            <h1 id="entry-ritual-title">{MODE_COPY[selected].title}</h1>
            <p>{MODE_COPY[selected].description}</p>
          </header>
          <button className="entry-continue" type="button" onClick={() => onContinue(selected)} disabled={!settled}>
            <span>Bước vào trải bài</span>
            <span aria-hidden="true">↗</span>
          </button>
          <button className="entry-back" type="button" onClick={() => { clearTimers(); phaseRef.current = "choice"; setHovered(null); setPhase("choice"); setSettled(false); }}>
            ← Chọn lại
          </button>
        </section>
      )}

      <div className="entry-progress" aria-hidden="true">
        {(["portal", "identity", "choice", "ritual"] as EntryPhase[]).map(item => <i key={item} className={item === phase ? "active" : ""} />)}
      </div>
    </main>
  );
}

