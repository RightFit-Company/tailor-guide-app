import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, useTexture } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";

export type RailItem = { id: string; url: string; kind: "top" | "trousers" };

const SPACING = 1.25;

function Garment({ item, x, selected, onSelect }: { item: RailItem; x: number; selected: boolean; onSelect: () => void }) {
  const tex = useTexture(item.url);
  tex.colorSpace = THREE.SRGBColorSpace;
  const h = item.kind === "top" ? 1.5 : 1.9;
  return (
    <group position={[x, 0, selected ? 0.35 : 0]}>
      {/* hanger */}
      <mesh position={[0, 2.62, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.09, 0.015, 8, 24, Math.PI * 1.4]} />
        <meshStandardMaterial color="#1a1714" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 2.5, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.025, 0.025, 1.1, 10]} />
        <meshStandardMaterial color="#b98a5a" roughness={0.6} />
      </mesh>
      <mesh
        position={[0, 2.5 - h / 2, 0]}
        castShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <planeGeometry args={[h, h]} />
        <meshStandardMaterial map={tex} transparent alphaTest={0.4} side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
    </group>
  );
}

export default function ClothesRail({
  items,
  selectedId,
  onSelect,
}: {
  items: RailItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const width = Math.max(items.length * SPACING + 0.6, 4);
  const start = -((items.length - 1) * SPACING) / 2;
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1.8, 5.2], fov: 45 }}>
      <color attach="background" args={["#fff6ec"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 6, 4]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
      <Environment>
        <Lightformer intensity={2} position={[0, 5, 5]} scale={[10, 10, 1]} />
        <Lightformer intensity={1} color="#ffd9c8" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
      </Environment>
      {/* rail */}
      <mesh position={[0, 2.72, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.04, 0.04, width, 16]} />
        <meshStandardMaterial color="#1a1714" metalness={0.7} roughness={0.25} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * width) / 2, 1.36, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 2.72, 12]} />
          <meshStandardMaterial color="#1a1714" metalness={0.7} roughness={0.25} />
        </mesh>
      ))}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[12, 48]} />
        <meshStandardMaterial color="#f3e3cf" roughness={1} />
      </mesh>
      <Suspense fallback={null}>
        {items.map((it, i) => (
          <Garment key={it.id} item={it} x={start + i * SPACING} selected={it.id === selectedId} onSelect={() => onSelect(it.id)} />
        ))}
      </Suspense>
      <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={14} blur={2.5} far={4} />
      <OrbitControls target={[0, 1.6, 0]} enablePan maxPolarAngle={Math.PI / 2.05} minDistance={2.5} maxDistance={12} />
    </Canvas>
  );
}
