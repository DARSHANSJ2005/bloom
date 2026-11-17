import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ChevronDown, ChevronUp, RotateCcw, Sparkles } from 'lucide-react';
import {
  CRAFT_CATEGORIES,
  CRAFT_PALTES_FALLBACK,
} from './studioHelpers';
import {
  CRAFT_PALETTES,
  type CraftCategoryId,
  type CraftPalette,
} from '../constants/assets';
import { createCraftTextureSet, type ProceduralTextureSet } from '../three/proceduralTextures';
import { buildCraftModel, disposeObject3D } from '../three/craftModels';

// Module-scope scratch math helpers (zero GC inside animation loop)
const _scratchTargetPos = new THREE.Vector3();
const _scratchExplode = new THREE.Vector3();

type CameraPresetId = 'hero' | 'top' | 'detail';

const CAMERA_PRESETS: Record<
  CameraPresetId,
  { label: string; pos: [number, number, number]; target: [number, number, number] }
> = {
  hero: { label: 'Hero Angle', pos: [2.75, 1.95, 3.25], target: [0, 0.85, 0] },
  top: { label: 'Top View', pos: [0.1, 3.85, 1.45], target: [0, 0.65, 0] },
  detail: { label: 'Close Detail', pos: [1.55, 1.35, 1.95], target: [0, 0.85, 0] },
};

interface CraftStudio3DProps {
  selectedCategory: CraftCategoryId;
  selectedPalette: CraftPalette;
  onSelectCategory: (cat: CraftCategoryId) => void;
  onSelectPalette: (pal: CraftPalette) => void;
  onEnquirePiece: (cat: CraftCategoryId, pal: CraftPalette) => void;
}

export function CraftStudio3D({
  selectedCategory,
  selectedPalette,
  onSelectCategory,
  onSelectPalette,
  onEnquirePiece,
}: CraftStudio3DProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasMountRef = useRef<HTMLDivElement | null>(null);

  const [explodeAmount, setExplodeAmount] = useState(0);
  const [autoSpin, setAutoSpin] = useState(true);
  const [activePreset, setActivePreset] = useState<CameraPresetId>('hero');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [webglError, setWebglError] = useState(false);

  // Mutable refs read inside WebGL loop without re-creating renderer
  const stateRef = useRef({
    explodeTarget: 0,
    explodeCurrent: 0,
    autoSpin: true,
    isVisible: true,
    transitionActive: false,
    camTargetPos: new THREE.Vector3(...CAMERA_PRESETS.hero.pos),
    camTargetLook: new THREE.Vector3(...CAMERA_PRESETS.hero.target),
  });

  // Scene object refs for dynamic model/palette swapping
  const sceneRefs = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    controls: OrbitControls | null;
    modelAnchor: THREE.Group | null;
    currentModel: THREE.Group | null;
    textures: ProceduralTextureSet | null;
    isSoftwareGl: boolean;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    modelAnchor: null,
    currentModel: null,
    textures: null,
    isSoftwareGl: false,
  });

  // Sync reactive state into ref
  useEffect(() => {
    stateRef.current.explodeTarget = explodeAmount;
  }, [explodeAmount]);

  useEffect(() => {
    stateRef.current.autoSpin = autoSpin;
    if (sceneRefs.current.controls) {
      sceneRefs.current.controls.autoRotate =
        autoSpin && !sceneRefs.current.isSoftwareGl;
    }
  }, [autoSpin]);

  // Keyboard shortcut 'H' to toggle control dock
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Initialize Three.js WebGL scene once
  useEffect(() => {
    const mount = canvasMountRef.current;
    const section = sectionRef.current;
    if (!mount || !section) return;

    const isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl = probeCanvas.getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError(true);
      return;
    }

    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || 680;

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
    );
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(true);
    };
    const handleContextRestored = () => {
      setWebglError(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener(
      'webglcontextrestored',
      handleContextRestored,
    );

    const scene = new THREE.Scene();
    const bgHex = 0xf7f9f2;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.045);

    // Mandatory studio environment map via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 60);
    camera.position.set(...CAMERA_PRESETS.hero.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...CAMERA_PRESETS.hero.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 1.6;
    controls.maxDistance = 6.2;
    controls.minPolarAngle = 0.25;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.enablePan = false;
    controls.autoRotate = stateRef.current.autoSpin && !isSoftwareGl;
    controls.autoRotateSpeed = 1.1;

    // Cancel camera preset lerp as soon as user interacts
    const onControlStart = () => {
      stateRef.current.transitionActive = false;
    };
    controls.addEventListener('start', onControlStart);

    // 3-Point Warm / Cool Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xf0f6ff, 0xc9d2b5, 0.85);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff6e5, 2.2);
    keyLight.position.set(3.5, 5.5, 3.8);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 16;
    const d = 3.2;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xfbe6ef, 1.15);
    rimLight.position.set(-4.0, 3.2, -3.5);
    scene.add(rimLight);

    // Ground Stage Disc + Soft Radial Contact Shadow Plane
    const stageGeo = new THREE.CylinderGeometry(3.8, 3.8, 0.08, 64);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0xf0f3e8,
      roughness: 0.9,
      metalness: 0.0,
    });
    const stageDisc = new THREE.Mesh(stageGeo, stageMat);
    stageDisc.position.y = -0.042;
    stageDisc.receiveShadow = true;
    scene.add(stageDisc);

    // Subtle botanical stone perimeter ring
    const ringGeo = new THREE.RingGeometry(1.42, 1.455, 64);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xb4cd52,
      roughness: 0.55,
      metalness: 0.1,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const studioRing = new THREE.Mesh(ringGeo, ringMat);
    studioRing.position.y = 0.004;
    scene.add(studioRing);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const initialTextures = createCraftTextureSet(
      selectedPalette.primary,
      selectedPalette.secondary,
      maxAniso,
    );

    const shadowPlaneGeo = new THREE.PlaneGeometry(2.8, 2.8);
    shadowPlaneGeo.rotateX(-Math.PI / 2);
    const shadowPlaneMat = new THREE.MeshBasicMaterial({
      map: initialTextures.contactShadow,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    });
    const contactShadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    contactShadowPlane.position.y = 0.002;
    scene.add(contactShadowPlane);

    const modelAnchor = new THREE.Group();
    scene.add(modelAnchor);

    const initialModel = buildCraftModel(
      selectedCategory,
      selectedPalette,
      initialTextures,
      isSoftwareGl,
    );
    modelAnchor.add(initialModel);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    sceneRefs.current = {
      renderer,
      scene,
      camera,
      controls,
      modelAnchor,
      currentModel: initialModel,
      textures: initialTextures,
      isSoftwareGl,
    };

    // Pause rendering when scrolled completely out of view
    const observer = new IntersectionObserver(
      (entries) => {
        stateRef.current.isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.02 },
    );
    observer.observe(section);

    // Resize observer
    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || 680;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop with software WebGL afterDraw pacing
    let frameId = 0;
    let disposed = false;
    let prevTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const status = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (status === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min((now - prevTime) / 1000, 0.1);
      prevTime = now;

      if (stateRef.current.isVisible) {
        // Exponentially damped exploded-view separation
        stateRef.current.explodeCurrent = THREE.MathUtils.damp(
          stateRef.current.explodeCurrent,
          stateRef.current.explodeTarget,
          7,
          dt,
        );

        const activeModel = sceneRefs.current.currentModel;
        if (activeModel) {
          activeModel.children.forEach((part) => {
            const base = part.userData.basePos as THREE.Vector3 | undefined;
            const offset = part.userData.explodeOffset as THREE.Vector3 | undefined;
            if (base && offset) {
              _scratchExplode
                .copy(offset)
                .multiplyScalar(stateRef.current.explodeCurrent);
              part.position.copy(base).add(_scratchExplode);
            }
          });
        }

        // Smooth camera preset damping
        if (stateRef.current.transitionActive) {
          const factor = 1 - Math.exp(-5.5 * dt);
          camera.position.lerp(stateRef.current.camTargetPos, factor);
          controls.target.lerp(stateRef.current.camTargetLook, factor);
          _scratchTargetPos
            .copy(camera.position)
            .sub(stateRef.current.camTargetPos);
          if (_scratchTargetPos.lengthSq() < 0.0004) {
            stateRef.current.transitionActive = false;
          }
        }

        controls.update();
        renderer.render(scene, camera);
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    if (isSoftwareGl) {
      renderer.render(scene, camera);
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('start', onControlStart);
      controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener(
        'webglcontextrestored',
        handleContextRestored,
      );
      if (sceneRefs.current.currentModel) {
        disposeObject3D(sceneRefs.current.currentModel);
      }
      sceneRefs.current.textures?.dispose();
      stageGeo.dispose();
      stageMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      shadowPlaneGeo.dispose();
      shadowPlaneMat.dispose();
      envTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rebuild 3D craft model whenever category or palette changes
  useEffect(() => {
    const refs = sceneRefs.current;
    if (!refs.renderer || !refs.modelAnchor) return;

    const maxAniso = refs.renderer.capabilities.getMaxAnisotropy();
    const nextTextures = createCraftTextureSet(
      selectedPalette.primary,
      selectedPalette.secondary,
      maxAniso,
    );

    const nextModel = buildCraftModel(
      selectedCategory,
      selectedPalette,
      nextTextures,
      refs.isSoftwareGl,
    );

    if (refs.currentModel) {
      refs.modelAnchor.remove(refs.currentModel);
      disposeObject3D(refs.currentModel);
    }
    refs.textures?.dispose();

    refs.modelAnchor.add(nextModel);
    refs.currentModel = nextModel;
    refs.textures = nextTextures;

    if (refs.isSoftwareGl && refs.scene && refs.camera) {
      refs.renderer.render(refs.scene, refs.camera);
    }
  }, [selectedCategory, selectedPalette]);

  const handlePresetClick = (presetId: CameraPresetId) => {
    setActivePreset(presetId);
    const preset = CAMERA_PRESETS[presetId];
    stateRef.current.camTargetPos.set(...preset.pos);
    stateRef.current.camTargetLook.set(...preset.target);
    stateRef.current.transitionActive = true;
  };

  const handleResetView = () => {
    setExplodeAmount(0);
    setAutoSpin(true);
    handlePresetClick('hero');
  };

  const activeCategoryObj =
    CRAFT_CATEGORIES.find((c) => c.id === selectedCategory) ?? CRAFT_CATEGORIES[0];

  return (
    <section
      id="studio"
      ref={sectionRef}
      className="relative w-full h-[100vh] min-h-[680px] overflow-hidden bg-[#f7f9f2] border-t border-[#eef0ea]"
      aria-label="Interactive 3D Craft Studio"
    >
      {/* Dedicated WebGL canvas mount isolated from React HUD */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Graceful fallback if WebGL is unavailable */}
      {webglError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#f7f9f2] px-6 text-center">
          <p className="text-sm font-medium text-[#4d6a10]">
            3D Interactive Preview · Bloom by Kavi
          </p>
          <h2 className="mt-2 text-2xl font-medium tracking-tight text-[#121410]">
            {activeCategoryObj.label} in {selectedPalette.label}
          </h2>
          <p className="mt-2 max-w-md text-sm text-[#434a3a]">
            {activeCategoryObj.shortDesc}
          </p>
          <button
            type="button"
            onClick={() => onEnquirePiece(selectedCategory, selectedPalette)}
            className="btn mt-5"
          >
            Enquire About This Piece
          </button>
        </div>
      )}

      {/* Minimal Top-Left Studio Title & Current Piece Metadata (no side cards, no backdrop-filter) */}
      <div className="pointer-events-none absolute top-20 left-4 right-4 z-10 flex flex-col items-center text-center sm:left-8 sm:right-auto sm:items-start sm:text-left">
        <div className="pointer-events-auto rounded-2xl bg-[#ffffff]/92 px-4 py-3 border border-[#121410]/10 shadow-sm max-w-xs">
          <div className="flex items-center gap-2 text-[11px] font-medium text-[#4d6a10]">
            <span>3D Craft Preview</span>
            <span aria-hidden="true">·</span>
            <span>Drag to orbit</span>
          </div>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#121410]">
            {activeCategoryObj.label}
          </h2>
          <p className="mt-0.5 text-xs leading-relaxed text-[#3b4234]">
            {activeCategoryObj.shortDesc}
          </p>
        </div>
      </div>

      {/* Collapsible Unified Bottom Control Dock (solid/rgba without backdrop-filter over WebGL) */}
      <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 w-[min(940px,94vw)] -translate-x-1/2 flex flex-col items-center">
        <button
          type="button"
          onClick={() => setDockCollapsed((v) => !v)}
          className="pointer-events-auto mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#ffffff]/95 px-3.5 py-1.5 text-xs font-medium text-[#121410] border border-[#121410]/10 shadow-sm hover:bg-[#e7efcf] transition-colors cursor-pointer"
          aria-expanded={!dockCollapsed}
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="h-3.5 w-3.5 text-[#4d6a10]" />
              <span>Show Controls (H)</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5 text-[#4d6a10]" />
              <span>Hide Controls (H)</span>
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="pointer-events-auto w-full rounded-2xl bg-[#ffffff]/95 border border-[#121410]/10 shadow-lg p-3 sm:px-5 sm:py-3.5 flex flex-col gap-3">
            {/* Row 1: Craft Category Selector + Colorway Swatches + Enquire CTA */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                className="flex items-center gap-1 rounded-xl bg-[#f1f4ea] p-1"
                role="tablist"
                aria-label="Craft category"
              >
                {CRAFT_CATEGORIES.map((cat) => {
                  const active = cat.id === selectedCategory;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => onSelectCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#4d6a10] text-[#f3f8e4] shadow-xs'
                          : 'text-[#313829] hover:text-[#121410]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Colorway swatches */}
              <div className="flex items-center gap-2" role="group" aria-label="Colorway palette">
                <span className="text-xs font-medium text-[#4a5240] mr-1 hidden md:inline">
                  Shade:
                </span>
                {(CRAFT_PALETTES.length ? CRAFT_PALETTES : CRAFT_PALTES_FALLBACK).map(
                  (pal) => {
                    const isSelected = pal.id === selectedPalette.id;
                    return (
                      <button
                        key={pal.id}
                        type="button"
                        onClick={() => onSelectPalette(pal)}
                        title={pal.label}
                        aria-label={`Select ${pal.label} palette`}
                        aria-pressed={isSelected}
                        className={`h-7 w-7 rounded-full border-2 transition-transform cursor-pointer ${
                          isSelected
                            ? 'scale-110 border-[#121410]'
                            : 'border-[#ffffff] hover:scale-105'
                        }`}
                        style={{
                          background: `linear-gradient(135deg, ${pal.primary} 55%, ${pal.secondary} 100%)`,
                        }}
                      />
                    );
                  },
                )}
              </div>

              <button
                type="button"
                onClick={() => onEnquirePiece(selectedCategory, selectedPalette)}
                className="btn h-9 px-4 text-xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Enquire This Piece</span>
              </button>
            </div>

            {/* Row 2: Exploded View Slider + Camera Presets + Reset */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef0ea] pt-2.5">
              <label className="flex items-center gap-2.5 text-xs font-medium text-[#2b3124] flex-1 min-w-[200px] max-w-xs">
                <span className="whitespace-nowrap">Inspect Layers</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={explodeAmount}
                  onChange={(e) => setExplodeAmount(parseFloat(e.target.value))}
                  className="w-full accent-[#4d6a10] cursor-pointer"
                  aria-label="Inspect craft layers exploded view"
                />
                <span className="tabular-nums text-[11px] text-[#4d6a10] w-9 text-right">
                  {Math.round(explodeAmount * 100)}%
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-1.5">
                {(Object.keys(CAMERA_PRESETS) as CameraPresetId[]).map((presetKey) => {
                  const preset = CAMERA_PRESETS[presetKey];
                  const active = activePreset === presetKey;
                  return (
                    <button
                      key={presetKey}
                      type="button"
                      onClick={() => handlePresetClick(presetKey)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#e7efcf] border-[#4d6a10]/30 text-[#2c3a10]'
                          : 'bg-[#ffffff] border-[#121410]/10 text-[#3c4434] hover:bg-[#f6f8f1]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setAutoSpin((s) => !s)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
                    autoSpin
                      ? 'bg-[#e7efcf] border-[#4d6a10]/30 text-[#2c3a10]'
                      : 'bg-[#ffffff] border-[#121410]/10 text-[#3c4434]'
                  }`}
                >
                  {autoSpin ? 'Auto-Spin On' : 'Auto-Spin Off'}
                </button>

                <button
                  type="button"
                  onClick={handleResetView}
                  title="Reset 3D View"
                  aria-label="Reset 3D View"
                  className="p-1.5 rounded-lg border border-[#121410]/10 text-[#3c4434] hover:bg-[#f6f8f1] cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
