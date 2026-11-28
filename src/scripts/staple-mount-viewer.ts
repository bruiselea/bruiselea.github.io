import {
  AmbientLight, Box3, Color, DirectionalLight, GridHelper, Group, Mesh, MeshStandardMaterial,
  PerspectiveCamera, Scene, Vector3, WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import type { MountModels, MountView } from "./staple-mount-types";

const loader = new STLLoader();

export function coverInAssembly(models: MountModels) {
  const geometry = loader.parse(models.cover);
  if (models.style === 1) {
    geometry.translate(0, 0, -models.printPlane).rotateX(-Math.PI);
  } else if (models.style === 3) {
    geometry.translate(0, 0, models.printPlane);
  } else if (models.style === 4) {
    geometry.translate(0, 0, -models.printPlane).rotateX(Math.PI / 2);
  } else {
    geometry.translate(0, 0, models.frontBottom).rotateX(-Math.PI / 2);
  }
  return geometry;
}

export function createMountViewer(stage: HTMLElement) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.domElement.setAttribute("aria-label", "モデルを回転・拡大できる3Dプレビュー");
  renderer.domElement.setAttribute("role", "img");
  const scene = new Scene();
  scene.background = new Color(0x15171a);
  scene.add(new AmbientLight(0xffffff, 2.35));
  const key = new DirectionalLight(0xfff2e7, 3.15);
  key.position.set(30, 110, 180);
  scene.add(key);
  const fill = new DirectionalLight(0x9dbddf, 1.45);
  fill.position.set(-110, 35, -75);
  scene.add(fill);
  const camera = new PerspectiveCamera(36, 1, 0.1, 4000);
  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enablePan = true;
  orbit.minDistance = 20;
  orbit.maxDistance = 2000;
  const assembly = new Group();
  scene.add(assembly);
  const grid = new GridHelper(720, 72, 0x49464a, 0x282a2f);
  scene.add(grid);
  const baseMaterial = new MeshStandardMaterial({ color: 0x6799a7, roughness: 0.58, metalness: 0.04 });
  const coverMaterial = new MeshStandardMaterial({ color: 0xe7985d, roughness: 0.6, metalness: 0.03 });
  const draw = () => renderer.render(scene, camera);
  orbit.addEventListener("change", draw);
  new ResizeObserver(() => {
    const { clientWidth: width, clientHeight: height } = stage;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    draw();
  }).observe(stage);
  stage.append(renderer.domElement);
  stage.querySelector("img")?.setAttribute("hidden", "");

  function show(models: MountModels, view: MountView) {
    for (const child of [...assembly.children]) {
      if (child instanceof Mesh) child.geometry.dispose();
      assembly.remove(child);
    }

    const base = new Mesh(loader.parse(models.base), baseMaterial);
    const cover = new Mesh(coverInAssembly(models), coverMaterial);
    if (view === "print") {
      cover.geometry.dispose();
      cover.geometry = loader.parse(models.cover);
      if (models.style === 3) cover.geometry.rotateX(Math.PI);
      base.geometry.rotateX(-Math.PI / 2);
      cover.geometry.rotateX(-Math.PI / 2);
      base.geometry.computeBoundingBox();
      cover.geometry.computeBoundingBox();
      base.position.x = cover.geometry.boundingBox!.min.x - base.geometry.boundingBox!.max.x - 12;
    } else if (view === "exploded") {
      cover.position.y = models.lift;
    }
    assembly.add(base, cover);
    const bounds = new Box3().setFromObject(assembly);
    const center = bounds.getCenter(new Vector3());
    const size = bounds.getSize(new Vector3());
    grid.position.set(center.x, bounds.min.y - 5, 0);
    const radius = size.length() * 0.5;
    const aspect = Math.max(stage.clientWidth / Math.max(stage.clientHeight, 1), 0.45);
    const halfFov = Math.atan(Math.tan(Math.PI / 10) * Math.min(1, aspect));
    const distance = radius / Math.sin(halfFov) * (view === "exploded" ? 0.95 : 1.14);
    const direction = view === "print" ? new Vector3(0.65, 0.85, 1.15)
      : models.style === 4 ? new Vector3(0.64, 0.50, 1.48) : new Vector3(0.29, 0.17, 1.48);
    camera.position.copy(center).add(direction.normalize().multiplyScalar(distance));
    orbit.target.copy(center);
    orbit.update();
    draw();
  }

  return { show };
}
