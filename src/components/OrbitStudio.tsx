import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  AdditiveBlending,
  Group,
  MathUtils,
  SRGBColorSpace,
  TextureLoader,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { works, type Work } from "../data/works";
import "./orbit-studio.css";

const positions: Record<string, [number, number, number]> = {
  keyboard: [0.25, 0.15, 0.5],
  robot: [-0.55, 2.0, -0.25],
  keychain: [1.85, 2.25, -0.35],
  scheduler: [3.15, -1.45, -0.25],
  print: [0.1, -2.45, -0.35],
  filter: [-3.25, -1.45, -0.15],
  "keyboard-full": [-3.45, 1.05, -0.45],
  hours: [3.2, 0.4, -0.35],
};

function ImageVisual({ work }: { work: Work }) {
  const texture = useLoader(TextureLoader, work.asset.src);
  texture.colorSpace = SRGBColorSpace;

  const aspect = useMemo(() => {
    const image = texture.image as { width?: number; height?: number } | undefined;
    return image?.width && image?.height ? image.width / image.height : 1;
  }, [texture]);

  return (
    <sprite scale={[work.asset.scale * aspect, work.asset.scale, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </sprite>
  );
}

function ModelVisual({ work }: { work: Work }) {
  const gltf = useLoader(GLTFLoader, work.asset.modelSrc || "");
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  return <primitive object={scene} scale={work.asset.scale} />;
}

function WorkObject({
  work,
  selected,
  motion,
  onSelect,
}: {
  work: Work;
  selected: boolean;
  motion: boolean;
  onSelect: (work: Work) => void;
}) {
  const group = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const basePosition = positions[work.id] ?? [0, 0, 0];
  const phase = useMemo(() => Number.parseInt(work.index, 10) * 0.73, [work.index]);

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    const targetScale = selected ? 1.16 : hovered ? 1.08 : 1;
    const nextScale = MathUtils.damp(group.current.scale.x, targetScale, 7, delta);
    group.current.scale.setScalar(nextScale);
    group.current.position.y =
      basePosition[1] + (motion ? Math.sin(clock.elapsedTime * 0.6 + phase) * 0.08 : 0);
    group.current.rotation.z = motion
      ? Math.sin(clock.elapsedTime * 0.25 + phase) * 0.035
      : 0;
  });

  return (
    <group
      ref={group}
      position={basePosition}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(work);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "default";
      }}
    >
      {selected && work.id === "keyboard" && (
        <mesh position={[0, 0, -0.4]} scale={[1.35, 0.7, 1]}>
          <ringGeometry args={[1.28, 1.3, 96]} />
          <meshBasicMaterial
            color={work.accent}
            transparent
            opacity={0.82}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
      {work.asset.type === "model" && work.asset.modelSrc ? (
        <ModelVisual work={work} />
      ) : (
        <ImageVisual work={work} />
      )}
    </group>
  );
}

function OrbitRings() {
  return (
    <group position={[-0.25, -0.05, -1.2]} rotation={[0.06, 0.03, -0.04]}>
      {[2.2, 3.35, 4.55].map((radius, index) => (
        <mesh key={radius} scale={[1, 0.56, 1]}>
          <ringGeometry args={[radius - 0.009, radius, 160]} />
          <meshBasicMaterial
            color={index === 0 ? "#8d4029" : "#313136"}
            transparent
            opacity={index === 0 ? 0.55 : 0.48}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function OrbitWorld({
  selectedId,
  motion,
  onSelect,
}: {
  selectedId: string;
  motion: boolean;
  onSelect: (work: Work) => void;
}) {
  const world = useRef<Group>(null);

  useFrame(({ pointer }, delta) => {
    if (!world.current) return;
    world.current.rotation.y = MathUtils.damp(
      world.current.rotation.y,
      motion ? pointer.x * 0.09 : 0,
      3,
      delta,
    );
    world.current.rotation.x = MathUtils.damp(
      world.current.rotation.x,
      motion ? -pointer.y * 0.045 : 0,
      3,
      delta,
    );
  });

  return (
    <group ref={world} position={[0, -0.1, 0]}>
      <OrbitRings />
      {works.map((work) => (
        <WorkObject
          key={work.id}
          work={work}
          selected={selectedId === work.id}
          motion={motion}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}

function SceneFallback() {
  return <div className="studio-loading">LOADING ORBIT…</div>;
}

export default function OrbitStudio() {
  const [selectedId, setSelectedId] = useState(works[0].id);
  const [motion, setMotion] = useState(true);
  const selected = works.find((work) => work.id === selectedId) ?? works[0];

  const selectByOffset = (offset: number) => {
    const current = works.findIndex((work) => work.id === selectedId);
    const next = (current + offset + works.length) % works.length;
    setSelectedId(works[next].id);
  };

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) setMotion(false);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") selectByOffset(1);
      if (event.key === "ArrowLeft") selectByOffset(-1);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  return (
    <main className="studio-main">
      <section className="studio-intro" aria-labelledby="studio-title">
        <h1 id="studio-title">Natsuki Sato</h1>
        <p className="studio-intro__kicker">Interaction · Modeling · Design</p>
        <p className="studio-intro__description">
          材料工学を軸に、3Dプリンティング、電子工作、
          <br />
          ソフトウェア、インタラクションを横断するスタジオ。
        </p>
      </section>

      <div className="studio-stage" aria-hidden="true">
        <Suspense fallback={<SceneFallback />}>
          <Canvas
            camera={{ position: [0, 0, 10], fov: 44 }}
            dpr={[1, 1.65]}
            gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          >
            <ambientLight intensity={1.25} />
            <directionalLight position={[4, 6, 8]} intensity={2.1} />
            <OrbitWorld selectedId={selectedId} motion={motion} onSelect={(work) => setSelectedId(work.id)} />
          </Canvas>
        </Suspense>
      </div>

      <div className="orbit-labels" aria-label="作品を選択">
        {works.map((work) => (
          <button
            key={work.id}
            className={`orbit-label orbit-label--${work.id}`}
            data-selected={selectedId === work.id}
            onClick={() => setSelectedId(work.id)}
            type="button"
          >
            <span>{work.index}</span>
            {work.categoryLabel}
          </button>
        ))}
      </div>

      <aside className="studio-inspector" aria-live="polite">
        <p className="studio-inspector__index">{selected.index}</p>
        <h2>{selected.title}</h2>
        <p className="studio-inspector__symbol">
          {selected.symbol} · {selected.categoryLabel}
        </p>
        <div className="studio-inspector__rule" />
        <p className="studio-inspector__summary">{selected.summary}</p>

        <div className="studio-inspector__meta">
          <p>ROLE</p>
          <span>{selected.role.join(" / ")}</span>
        </div>
        <div className="studio-inspector__meta">
          <p>TOOLS</p>
          <ul>
            {selected.tools.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
          </ul>
        </div>

        <a className="studio-inspector__cta" href={`/works/${selected.slug}/`}>
          プロジェクトを見る <span aria-hidden="true">→</span>
        </a>

        <div className="studio-thumbnails">
          <button type="button" onClick={() => selectByOffset(-1)} aria-label="前の作品">
            ←
          </button>
          <div>
            {works.slice(0, 4).map((work) => (
              <button
                type="button"
                key={work.id}
                className={selectedId === work.id ? "is-selected" : ""}
                onClick={() => setSelectedId(work.id)}
                aria-label={work.title}
              >
                <img src={work.asset.src} alt="" />
              </button>
            ))}
          </div>
          <button type="button" onClick={() => selectByOffset(1)} aria-label="次の作品">
            →
          </button>
        </div>
      </aside>

      <div className="studio-help" aria-label="操作方法">
        <span><b>MOVE</b> 視点</span>
        <span><b>← →</b> 作品選択</span>
        <span><b>CLICK</b> フォーカス</span>
      </div>

      <button
        className="studio-motion"
        type="button"
        aria-pressed={motion}
        onClick={() => setMotion((value) => !value)}
      >
        MOTION <span className={motion ? "is-on" : ""} aria-hidden="true" />
      </button>
    </main>
  );
}
