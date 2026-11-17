import * as THREE from 'three';

export interface ProceduralTextureSet {
  silkColor: THREE.CanvasTexture;
  silkBump: THREE.CanvasTexture;
  chenilleColor: THREE.CanvasTexture;
  chenilleBump: THREE.CanvasTexture;
  kraftColor: THREE.CanvasTexture;
  velvetColor: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  dispose: () => void;
}

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

export function createSilkThreadTexture(
  primaryHex: string,
  secondaryHex: string,
  maxAnisotropy: number,
): { color: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const size = 256;
  const { canvas: cCol, ctx: ctxCol } = makeCanvas(size, size);
  const { canvas: cBmp, ctx: ctxBmp } = makeCanvas(size, size);

  ctxCol.fillStyle = primaryHex;
  ctxCol.fillRect(0, 0, size, size);

  ctxBmp.fillStyle = '#808080';
  ctxBmp.fillRect(0, 0, size, size);

  // Diagonal wrapped silk threads
  for (let i = -size; i < size * 2; i += 6) {
    const isAccent = (Math.abs(i) / 6) % 5 === 0;
    ctxCol.strokeStyle = isAccent ? secondaryHex : primaryHex;
    ctxCol.globalAlpha = isAccent ? 0.55 : 0.25;
    ctxCol.lineWidth = 2.6;
    ctxCol.beginPath();
    ctxCol.moveTo(i, 0);
    ctxCol.lineTo(i + size, size);
    ctxCol.stroke();

    ctxBmp.strokeStyle = '#d4d4d4';
    ctxBmp.globalAlpha = 0.65;
    ctxBmp.lineWidth = 2.4;
    ctxBmp.beginPath();
    ctxBmp.moveTo(i, 0);
    ctxBmp.lineTo(i + size, size);
    ctxBmp.stroke();
  }
  ctxCol.globalAlpha = 1;
  ctxBmp.globalAlpha = 1;

  // Fine sheen grain
  for (let y = 0; y < size; y += 2) {
    ctxCol.fillStyle = y % 4 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
    ctxCol.fillRect(0, y, size, 1);
  }

  const color = new THREE.CanvasTexture(cCol);
  color.colorSpace = THREE.SRGBColorSpace;
  color.wrapS = THREE.RepeatWrapping;
  color.wrapT = THREE.RepeatWrapping;
  color.repeat.set(4, 2);
  color.anisotropy = maxAnisotropy;

  const bump = new THREE.CanvasTexture(cBmp);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(4, 2);
  bump.anisotropy = maxAnisotropy;

  return { color, bump };
}

export function createChenilleFiberTexture(
  primaryHex: string,
  secondaryHex: string,
  maxAnisotropy: number,
): { color: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const size = 256;
  const { canvas: cCol, ctx: ctxCol } = makeCanvas(size, size);
  const { canvas: cBmp, ctx: ctxBmp } = makeCanvas(size, size);

  ctxCol.fillStyle = primaryHex;
  ctxCol.fillRect(0, 0, size, size);

  ctxBmp.fillStyle = '#686868';
  ctxBmp.fillRect(0, 0, size, size);

  // Deterministic pseudo-random fuzzy fibers
  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  for (let i = 0; i < 1600; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const len = 6 + rand() * 10;
    const ang = rand() * Math.PI * 2;
    ctxCol.strokeStyle = rand() > 0.45 ? secondaryHex : primaryHex;
    ctxCol.globalAlpha = 0.25 + rand() * 0.3;
    ctxCol.lineWidth = 1.4;
    ctxCol.beginPath();
    ctxCol.moveTo(x, y);
    ctxCol.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctxCol.stroke();

    const lum = Math.floor(140 + rand() * 110);
    ctxBmp.strokeStyle = `rgb(${lum},${lum},${lum})`;
    ctxBmp.globalAlpha = 0.7;
    ctxBmp.lineWidth = 1.5;
    ctxBmp.beginPath();
    ctxBmp.moveTo(x, y);
    ctxBmp.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctxBmp.stroke();
  }
  ctxCol.globalAlpha = 1;
  ctxBmp.globalAlpha = 1;

  const color = new THREE.CanvasTexture(cCol);
  color.colorSpace = THREE.SRGBColorSpace;
  color.wrapS = THREE.RepeatWrapping;
  color.wrapT = THREE.RepeatWrapping;
  color.repeat.set(3, 3);
  color.anisotropy = maxAnisotropy;

  const bump = new THREE.CanvasTexture(cBmp);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(3, 3);
  bump.anisotropy = maxAnisotropy;

  return { color, bump };
}

export function createKraftTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const { canvas, ctx } = makeCanvas(size, size);
  ctx.fillStyle = '#efe9dc';
  ctx.fillRect(0, 0, size, size);

  let seed = 91;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(130,115,90,0.08)' : 'rgba(255,255,255,0.22)';
    ctx.fillRect(rand() * size, rand() * size, 2 + rand() * 5, 1.5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createVelvetTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const { canvas, ctx } = makeCanvas(size, size);
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, '#f3eee4');
  grad.addColorStop(1, '#ddd4c4');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  let seed = 17;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  for (let i = 0; i < 1200; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(90,78,60,0.06)';
    ctx.fillRect(rand() * size, rand() * size, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const { canvas, ctx } = makeCanvas(size, size);
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.06,
    size / 2,
    size / 2,
    size * 0.48,
  );
  grad.addColorStop(0, 'rgba(30, 38, 14, 0.42)');
  grad.addColorStop(0.55, 'rgba(30, 38, 14, 0.14)');
  grad.addColorStop(1, 'rgba(30, 38, 14, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createCraftTextureSet(
  primaryHex: string,
  secondaryHex: string,
  maxAnisotropy: number,
): ProceduralTextureSet {
  const silk = createSilkThreadTexture(primaryHex, secondaryHex, maxAnisotropy);
  const chenille = createChenilleFiberTexture(primaryHex, secondaryHex, maxAnisotropy);
  const kraftColor = createKraftTexture(maxAnisotropy);
  const velvetColor = createVelvetTexture(maxAnisotropy);
  const contactShadow = createContactShadowTexture();

  return {
    silkColor: silk.color,
    silkBump: silk.bump,
    chenilleColor: chenille.color,
    chenilleBump: chenille.bump,
    kraftColor,
    velvetColor,
    contactShadow,
    dispose: () => {
      silk.color.dispose();
      silk.bump.dispose();
      chenille.color.dispose();
      chenille.bump.dispose();
      kraftColor.dispose();
      velvetColor.dispose();
      contactShadow.dispose();
    },
  };
}
