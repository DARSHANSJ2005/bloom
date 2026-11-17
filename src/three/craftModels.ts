import * as THREE from 'three';
import type { CraftCategoryId, CraftPalette } from '../constants/assets';
import type { ProceduralTextureSet } from './proceduralTextures';

function tagExplodePart(
  obj: THREE.Object3D,
  offsetX: number,
  offsetY: number,
  offsetZ: number,
) {
  obj.userData.basePos = obj.position.clone();
  obj.userData.explodeOffset = new THREE.Vector3(offsetX, offsetY, offsetZ);
}

function enableShadows(root: THREE.Object3D) {
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}

/**
 * 1. Silk-Thread & Kundan Bangle Stack (9-part composite model, grounded at y = 0)
 */
export function buildBangleStack(
  palette: CraftPalette,
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean,
): THREE.Group {
  const root = new THREE.Group();
  root.name = 'bangle_stack';

  // Material library with >= 0.25 roughness contrast between velvet, silk, and brass
  const velvetMat = new THREE.MeshStandardMaterial({
    map: textures.velvetColor,
    roughness: 0.92,
    metalness: 0.0,
  });

  const silkPrimaryMat = new THREE.MeshPhysicalMaterial({
    map: textures.silkColor,
    bumpMap: textures.silkBump,
    bumpScale: 0.015,
    roughness: 0.42,
    metalness: 0.05,
    sheen: 0.85,
    sheenRoughness: 0.35,
    sheenColor: new THREE.Color(palette.secondary),
  });

  const silkSecondaryMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(palette.secondary),
    bumpMap: textures.silkBump,
    bumpScale: 0.012,
    roughness: 0.45,
    metalness: 0.05,
    sheen: 0.8,
    sheenColor: new THREE.Color('#ffffff'),
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(palette.accent),
    roughness: 0.16,
    metalness: 0.94,
  });

  const kundanGemMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#fffdf7'),
    roughness: 0.06,
    metalness: 0.05,
    clearcoat: 1.0,
    ior: 1.75,
    transmission: isSoftwareGl ? 0 : 0.72,
    transparent: isSoftwareGl,
    opacity: isSoftwareGl ? 0.85 : 1.0,
  });

  // Part 1: Velvet & Brass Display Pedestal Cone (LatheGeometry grounded flush at y = 0)
  const conePts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.86, 0),
    new THREE.Vector2(0.86, 0.08),
    new THREE.Vector2(0.76, 0.12),
    new THREE.Vector2(0.56, 1.35),
    new THREE.Vector2(0.42, 1.65),
    new THREE.Vector2(0, 1.68),
  ];
  const standGeo = new THREE.LatheGeometry(conePts, 48);
  const standMesh = new THREE.Mesh(standGeo, velvetMat);
  tagExplodePart(standMesh, 0, -0.18, 0);
  root.add(standMesh);

  // Part 2: Brass Base Trim Ring
  const baseRingGeo = new THREE.TorusGeometry(0.84, 0.032, 16, 64);
  baseRingGeo.rotateX(Math.PI / 2);
  const baseRing = new THREE.Mesh(baseRingGeo, goldMat);
  baseRing.position.y = 0.08;
  tagExplodePart(baseRing, 0, -0.28, 0);
  root.add(baseRing);

  // Parts 3–7: 5 Layered Silk-Thread & Filigree Bangles stacked along the cone
  const bangleSpecs = [
    { y: 0.25, radius: 0.82, tube: 0.105, mat: silkPrimaryMat, explodeY: 0.08, tilt: 0.03 },
    { y: 0.47, radius: 0.78, tube: 0.055, mat: goldMat, explodeY: 0.28, tilt: -0.02 },
    { y: 0.68, radius: 0.74, tube: 0.125, mat: silkSecondaryMat, explodeY: 0.52, tilt: 0.025 },
    { y: 0.92, radius: 0.69, tube: 0.052, mat: goldMat, explodeY: 0.76, tilt: -0.03 },
    { y: 1.14, radius: 0.65, tube: 0.11, mat: silkPrimaryMat, explodeY: 1.02, tilt: 0.02 },
  ];

  // Beveled Kundan Stone Profile (ExtrudeGeometry)
  const kundanShape = new THREE.Shape();
  const ks = 0.042;
  kundanShape.moveTo(0, ks);
  kundanShape.lineTo(ks * 0.85, 0);
  kundanShape.lineTo(0, -ks);
  kundanShape.lineTo(-ks * 0.85, 0);
  kundanShape.closePath();

  const kundanGeo = new THREE.ExtrudeGeometry(kundanShape, {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.01,
    bevelSegments: 2,
  });
  kundanGeo.center();

  const bezelGeo = new THREE.CylinderGeometry(0.055, 0.062, 0.024, 16);

  bangleSpecs.forEach((spec, idx) => {
    const bangleGroup = new THREE.Group();
    bangleGroup.position.y = spec.y;
    bangleGroup.rotation.z = spec.tilt;

    // Main curved bangle band
    const bandGeo = new THREE.TorusGeometry(spec.radius, spec.tube, 24, 72);
    bandGeo.rotateX(Math.PI / 2);
    const bandMesh = new THREE.Mesh(bandGeo, spec.mat);
    bangleGroup.add(bandMesh);

    // Add Kundan stone bezels + gems around wider silk bangles
    if (idx === 0 || idx === 2 || idx === 4) {
      const stoneCount = 12;
      for (let i = 0; i < stoneCount; i++) {
        const angle = (i / stoneCount) * Math.PI * 2;
        const r = spec.radius + spec.tube * 0.92;
        const bezel = new THREE.Mesh(bezelGeo, goldMat);
        bezel.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
        bezel.rotation.z = -Math.PI / 2;
        bezel.rotation.y = -angle;
        bangleGroup.add(bezel);

        const gem = new THREE.Mesh(kundanGeo, kundanGemMat);
        gem.position.set(
          Math.cos(angle) * (r + 0.016),
          0,
          Math.sin(angle) * (r + 0.016),
        );
        gem.rotation.y = -angle + Math.PI / 2;
        bangleGroup.add(gem);
      }
    }

    tagExplodePart(bangleGroup, 0, spec.explodeY, 0);
    root.add(bangleGroup);
  });

  // Part 8: Instanced Gold Seed Beads accent ring on center bangle
  const beadCount = 32;
  const beadGeo = new THREE.SphereGeometry(0.022, 10, 10);
  const beadInstanced = new THREE.InstancedMesh(beadGeo, goldMat, beadCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < beadCount; i++) {
    const a = (i / beadCount) * Math.PI * 2;
    dummy.position.set(Math.cos(a) * 0.87, 0.68, Math.sin(a) * 0.87);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    beadInstanced.setMatrixAt(i, dummy.matrix);
  }
  beadInstanced.instanceMatrix.needsUpdate = true;
  beadInstanced.computeBoundingSphere();
  tagExplodePart(beadInstanced, 0, 0.52, 0);
  root.add(beadInstanced);

  // Part 9: Top Brass Finial Cap
  const capGeo = new THREE.SphereGeometry(0.16, 24, 16);
  capGeo.scale(1, 0.55, 1);
  const capMesh = new THREE.Mesh(capGeo, goldMat);
  capMesh.position.y = 1.69;
  tagExplodePart(capMesh, 0, 1.25, 0);
  root.add(capMesh);

  enableShadows(root);
  return root;
}

/**
 * 2. Pipe-Cleaner Tulip & Sunflower Bouquet (10+ parts grounded at y = 0)
 */
export function buildPipeCleanerBouquet(
  palette: CraftPalette,
  textures: ProceduralTextureSet,
): THREE.Group {
  const root = new THREE.Group();
  root.name = 'pipe_cleaner_bouquet';

  const ceramicMat = new THREE.MeshStandardMaterial({
    map: textures.kraftColor,
    roughness: 0.78,
    metalness: 0.02,
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#4d6a10'),
    bumpMap: textures.chenilleBump,
    bumpScale: 0.025,
    roughness: 0.92,
    metalness: 0.0,
  });

  const petalMat = new THREE.MeshStandardMaterial({
    map: textures.chenilleColor,
    bumpMap: textures.chenilleBump,
    bumpScale: 0.022,
    roughness: 0.88,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  const innerPetalMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(palette.secondary),
    bumpMap: textures.chenilleBump,
    bumpScale: 0.02,
    roughness: 0.86,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  const centerMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(palette.accent),
    roughness: 0.55,
    metalness: 0.12,
  });

  const ribbonMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(palette.ribbon),
    roughness: 0.34,
    metalness: 0.08,
    sheen: 0.9,
    sheenColor: new THREE.Color('#ffffff'),
  });

  // Part 1: Ribbed Artisan Vase (LatheGeometry flush at y = 0)
  const vasePts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.46, 0),
    new THREE.Vector2(0.56, 0.25),
    new THREE.Vector2(0.58, 0.62),
    new THREE.Vector2(0.42, 0.92),
    new THREE.Vector2(0.38, 1.08),
    new THREE.Vector2(0.45, 1.18),
    new THREE.Vector2(0.39, 1.18),
    new THREE.Vector2(0.33, 0.95),
    new THREE.Vector2(0, 0.95),
  ];
  const vaseGeo = new THREE.LatheGeometry(vasePts, 40);
  const vase = new THREE.Mesh(vaseGeo, ceramicMat);
  tagExplodePart(vase, 0, -0.25, 0);
  root.add(vase);

  // Part 2: Satin Ribbon Wrap & Bow around vase neck
  const collarGeo = new THREE.TorusGeometry(0.41, 0.032, 12, 48);
  collarGeo.rotateX(Math.PI / 2);
  const collar = new THREE.Mesh(collarGeo, ribbonMat);
  collar.position.y = 0.98;
  tagExplodePart(collar, 0, -0.1, 0.35);
  root.add(collar);

  const bowLoopCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.18, 0.1, 0.08),
    new THREE.Vector3(-0.24, -0.02, 0.14),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.18, 0.1, 0.08),
    new THREE.Vector3(0.24, -0.02, 0.14),
    new THREE.Vector3(0, 0, 0),
  ]);
  const bowGeo = new THREE.TubeGeometry(bowLoopCurve, 40, 0.024, 10, false);
  const bow = new THREE.Mesh(bowGeo, ribbonMat);
  bow.position.set(0, 0.98, 0.42);
  tagExplodePart(bow, 0, -0.05, 0.52);
  root.add(bow);

  // Beveled Pipe-Cleaner Petal Shape
  const petalShape = new THREE.Shape();
  petalShape.moveTo(0, 0);
  petalShape.bezierCurveTo(0.16, 0.08, 0.2, 0.34, 0, 0.48);
  petalShape.bezierCurveTo(-0.2, 0.34, -0.16, 0.08, 0, 0);

  const petalGeo = new THREE.ExtrudeGeometry(petalShape, {
    depth: 0.024,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.014,
    bevelSegments: 2,
  });

  // Leaf shape
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.bezierCurveTo(0.12, 0.12, 0.12, 0.45, 0, 0.58);
  leafShape.bezierCurveTo(-0.12, 0.45, -0.12, 0.12, 0, 0);
  const leafGeo = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.016,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.008,
    bevelSegments: 2,
  });

  // Build 5 curved chenille flowers in bouquet arrangement
  const flowerConfigs = [
    { top: [0, 2.35, 0], mid: [0.05, 1.6, 0.04], spread: [0, 0.85, 0], tilt: [0.1, 0, 0], scale: 1.1 },
    { top: [-0.46, 2.08, 0.22], mid: [-0.22, 1.5, 0.12], spread: [-0.45, 0.55, 0.25], tilt: [0.28, 0.2, 0.35], scale: 0.92 },
    { top: [0.46, 2.12, 0.18], mid: [0.22, 1.52, 0.1], spread: [0.45, 0.6, 0.2], tilt: [0.22, -0.2, -0.35], scale: 0.95 },
    { top: [-0.28, 1.98, -0.36], mid: [-0.14, 1.45, -0.18], spread: [-0.3, 0.45, -0.4], tilt: [-0.32, 0.2, 0.25], scale: 0.88 },
    { top: [0.3, 1.94, -0.34], mid: [0.15, 1.44, -0.16], spread: [0.32, 0.45, -0.38], tilt: [-0.28, -0.2, -0.28], scale: 0.88 },
  ];

  const pollenPositions: THREE.Vector3[] = [];

  flowerConfigs.forEach((cfg, idx) => {
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.9, 0),
      new THREE.Vector3(cfg.mid[0], cfg.mid[1], cfg.mid[2]),
      new THREE.Vector3(cfg.top[0], cfg.top[1], cfg.top[2]),
    ]);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 24, 0.032, 10, false);
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    tagExplodePart(stemMesh, cfg.spread[0] * 0.2, 0.15, cfg.spread[2] * 0.2);
    root.add(stemMesh);

    // Leaf attached mid-stem
    const leaf = new THREE.Mesh(leafGeo, stemMat);
    leaf.position.set(cfg.mid[0], cfg.mid[1] - 0.15, cfg.mid[2]);
    leaf.rotation.set(0.55, idx * 1.3, 0.45);
    leaf.scale.setScalar(0.85);
    tagExplodePart(leaf, cfg.spread[0] * 0.5, 0.22, cfg.spread[2] * 0.5);
    root.add(leaf);

    // Flower Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(cfg.top[0], cfg.top[1], cfg.top[2]);
    headGroup.rotation.set(cfg.tilt[0], cfg.tilt[1], cfg.tilt[2]);
    headGroup.scale.setScalar(cfg.scale);

    // Center pollen dome
    const centerGeo = new THREE.SphereGeometry(0.13, 20, 14);
    centerGeo.scale(1, 0.65, 1);
    const centerDome = new THREE.Mesh(centerGeo, centerMat);
    headGroup.add(centerDome);

    // Outer & inner layered petals (6 outer + 5 inner)
    for (let p = 0; p < 6; p++) {
      const ang = (p / 6) * Math.PI * 2;
      const petalHolder = new THREE.Group();
      petalHolder.rotation.y = ang;
      const pMesh = new THREE.Mesh(petalGeo, p % 2 === 0 ? petalMat : innerPetalMat);
      pMesh.rotation.x = -0.68;
      pMesh.position.set(0, -0.02, 0.08);
      petalHolder.add(pMesh);
      headGroup.add(petalHolder);
    }

    for (let p = 0; p < 5; p++) {
      const ang = (p / 5) * Math.PI * 2 + 0.3;
      const petalHolder = new THREE.Group();
      petalHolder.rotation.y = ang;
      const pMesh = new THREE.Mesh(petalGeo, petalMat);
      pMesh.scale.setScalar(0.76);
      pMesh.rotation.x = -0.35;
      pMesh.position.set(0, 0.02, 0.06);
      petalHolder.add(pMesh);
      headGroup.add(petalHolder);
    }

    tagExplodePart(headGroup, cfg.spread[0], cfg.spread[1], cfg.spread[2]);
    root.add(headGroup);

    // Collect pollen dot spots
    for (let s = 0; s < 6; s++) {
      const a = (s / 6) * Math.PI * 2;
      pollenPositions.push(
        new THREE.Vector3(
          cfg.top[0] + Math.cos(a) * 0.065,
          cfg.top[1] + 0.085,
          cfg.top[2] + Math.sin(a) * 0.065,
        ),
      );
    }
  });

  // Part 10: Instanced Golden Pollen Beads (30 instances)
  const pollenGeo = new THREE.SphereGeometry(0.018, 8, 8);
  const pollenInst = new THREE.InstancedMesh(pollenGeo, centerMat, pollenPositions.length);
  const dummy = new THREE.Object3D();
  pollenPositions.forEach((pos, idx) => {
    dummy.position.copy(pos);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    pollenInst.setMatrixAt(idx, dummy.matrix);
  });
  pollenInst.instanceMatrix.needsUpdate = true;
  pollenInst.computeBoundingSphere();
  tagExplodePart(pollenInst, 0, 0.95, 0);
  root.add(pollenInst);

  enableShadows(root);
  return root;
}

/**
 * 3. DIY Craft Kit & Keepsake Box (8-part composite model grounded at y = 0)
 */
export function buildDiyCraftKit(
  palette: CraftPalette,
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean,
): THREE.Group {
  const root = new THREE.Group();
  root.name = 'diy_craft_kit';

  const boxMat = new THREE.MeshStandardMaterial({
    map: textures.kraftColor,
    roughness: 0.84,
    metalness: 0.0,
  });

  const lidMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(palette.secondary),
    roughness: 0.62,
    metalness: 0.02,
  });

  const ribbonMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(palette.ribbon),
    roughness: 0.3,
    metalness: 0.1,
    sheen: 0.9,
  });

  const wireMat = new THREE.MeshStandardMaterial({
    map: textures.chenilleColor,
    bumpMap: textures.chenilleBump,
    bumpScale: 0.025,
    roughness: 0.88,
    metalness: 0.0,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#c79f6b'),
    roughness: 0.72,
    metalness: 0.02,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#ffffff'),
    roughness: 0.08,
    metalness: 0.0,
    clearcoat: 1.0,
    ior: 1.52,
    transmission: isSoftwareGl ? 0 : 0.88,
    transparent: true,
    opacity: isSoftwareGl ? 0.38 : 1.0,
  });

  const pearlMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(palette.accent),
    roughness: 0.18,
    metalness: 0.45,
    clearcoat: 0.8,
  });

  // Helper rounded rect shape
  const makeRoundedRect = (w: number, d: number, r: number) => {
    const s = new THREE.Shape();
    const x = -w / 2;
    const y = -d / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + d - r);
    s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
    s.lineTo(x + r, y + d);
    s.quadraticCurveTo(x, y + d, x, y + d - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  };

  // Part 1: Beveled Keepsake Box Base (flush at y = 0)
  const baseGeo = new THREE.ExtrudeGeometry(makeRoundedRect(1.85, 1.35, 0.12), {
    depth: 0.56,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 3,
  });
  baseGeo.rotateX(-Math.PI / 2);
  const baseBox = new THREE.Mesh(baseGeo, boxMat);
  baseBox.position.y = 0.03;
  tagExplodePart(baseBox, 0, -0.15, 0);
  root.add(baseBox);

  // Part 2: Keepsake Lid
  const lidGroup = new THREE.Group();
  const lidGeo = new THREE.ExtrudeGeometry(makeRoundedRect(1.94, 1.44, 0.14), {
    depth: 0.18,
    bevelEnabled: true,
    bevelThickness: 0.028,
    bevelSize: 0.028,
    bevelSegments: 3,
  });
  lidGeo.rotateX(-Math.PI / 2);
  const lidMesh = new THREE.Mesh(lidGeo, lidMat);
  lidGroup.add(lidMesh);

  // Satin Cross Ribbons on Lid
  const rib1Geo = new THREE.BoxGeometry(1.98, 0.22, 0.14);
  const rib1 = new THREE.Mesh(rib1Geo, ribbonMat);
  rib1.position.y = 0.1;
  lidGroup.add(rib1);

  const rib2Geo = new THREE.BoxGeometry(0.14, 0.22, 1.48);
  const rib2 = new THREE.Mesh(rib2Geo, ribbonMat);
  rib2.position.y = 0.1;
  lidGroup.add(rib2);

  // Bow Loops on Top of Lid
  const bowCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.22, 0),
    new THREE.Vector3(-0.26, 0.4, 0.12),
    new THREE.Vector3(-0.3, 0.24, -0.12),
    new THREE.Vector3(0, 0.22, 0),
    new THREE.Vector3(0.26, 0.4, -0.12),
    new THREE.Vector3(0.3, 0.24, 0.12),
    new THREE.Vector3(0, 0.22, 0),
  ]);
  const bowMesh = new THREE.Mesh(
    new THREE.TubeGeometry(bowCurve, 44, 0.035, 10, false),
    ribbonMat,
  );
  lidGroup.add(bowMesh);

  lidGroup.position.set(0, 0.62, 0);
  tagExplodePart(lidGroup, 0, 1.05, 0);
  root.add(lidGroup);

  // Part 3 & 4: Coiled Pipe-Cleaner Bundles inside box
  for (let i = 0; i < 2; i++) {
    const helixPts: THREE.Vector3[] = [];
    for (let t = 0; t <= 48; t++) {
      const ang = (t / 48) * Math.PI * 6;
      helixPts.push(
        new THREE.Vector3(Math.cos(ang) * 0.22, (t / 48) * 0.28, Math.sin(ang) * 0.22),
      );
    }
    const coilGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(helixPts),
      48,
      0.028,
      10,
      false,
    );
    const coil = new THREE.Mesh(coilGeo, wireMat);
    coil.position.set(-0.48 + i * 0.48, 0.62, -0.18);
    tagExplodePart(coil, -0.25 + i * 0.2, 0.48, -0.2);
    root.add(coil);
  }

  // Part 5: Wooden Spool of Silk Thread
  const spoolPts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.2, 0),
    new THREE.Vector2(0.2, 0.05),
    new THREE.Vector2(0.14, 0.07),
    new THREE.Vector2(0.14, 0.36),
    new THREE.Vector2(0.2, 0.38),
    new THREE.Vector2(0.2, 0.43),
    new THREE.Vector2(0, 0.43),
  ];
  const spoolGroup = new THREE.Group();
  const spoolWood = new THREE.Mesh(new THREE.LatheGeometry(spoolPts, 28), woodMat);
  spoolGroup.add(spoolWood);
  const threadWrap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.165, 0.165, 0.27, 28),
    new THREE.MeshPhysicalMaterial({
      map: textures.silkColor,
      roughness: 0.4,
      sheen: 0.8,
    }),
  );
  threadWrap.position.y = 0.215;
  spoolGroup.add(threadWrap);
  spoolGroup.position.set(0.48, 0.6, -0.2);
  tagExplodePart(spoolGroup, 0.4, 0.55, -0.18);
  root.add(spoolGroup);

  // Part 6 & 7: Glass Bead Jar + Instanced Pearl Beads
  const jarGroup = new THREE.Group();
  const jarPts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.19, 0),
    new THREE.Vector2(0.2, 0.32),
    new THREE.Vector2(0.15, 0.38),
    new THREE.Vector2(0.15, 0.44),
  ];
  const jarGlass = new THREE.Mesh(new THREE.LatheGeometry(jarPts, 28), glassMat);
  jarGlass.renderOrder = 4;
  jarGroup.add(jarGlass);

  const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.13, 0.1, 24), woodMat);
  cork.position.y = 0.46;
  jarGroup.add(cork);

  const beadCount = 24;
  const beadInst = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.032, 10, 10),
    pearlMat,
    beadCount,
  );
  const dummy = new THREE.Object3D();
  for (let i = 0; i < beadCount; i++) {
    const row = Math.floor(i / 6);
    const ang = ((i % 6) / 6) * Math.PI * 2 + row * 0.4;
    const rad = i % 3 === 0 ? 0.04 : 0.11;
    dummy.position.set(Math.cos(ang) * rad, 0.05 + row * 0.065, Math.sin(ang) * rad);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    beadInst.setMatrixAt(i, dummy.matrix);
  }
  beadInst.instanceMatrix.needsUpdate = true;
  beadInst.computeBoundingSphere();
  jarGroup.add(beadInst);

  jarGroup.position.set(0.45, 0.6, 0.32);
  tagExplodePart(jarGroup, 0.42, 0.62, 0.3);
  root.add(jarGroup);

  // Part 8: Handwritten Kraft Instruction Card
  const cardGeo = new THREE.BoxGeometry(0.78, 0.02, 0.5);
  const card = new THREE.Mesh(cardGeo, boxMat);
  card.position.set(-0.34, 0.63, 0.32);
  card.rotation.y = -0.14;
  tagExplodePart(card, -0.35, 0.58, 0.32);
  root.add(card);

  enableShadows(root);
  return root;
}

export function buildCraftModel(
  category: CraftCategoryId,
  palette: CraftPalette,
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean,
): THREE.Group {
  switch (category) {
    case 'bangles':
      return buildBangleStack(palette, textures, isSoftwareGl);
    case 'florals':
      return buildPipeCleanerBouquet(palette, textures);
    case 'diy':
      return buildDiyCraftKit(palette, textures, isSoftwareGl);
  }
}

export function disposeObject3D(root: THREE.Object3D) {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
    }
  });
}
