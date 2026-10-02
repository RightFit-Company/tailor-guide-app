import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import type { BodyCm, GarmentType } from "@/lib/fit";

const COLORS: Record<string, string> = {
  black: "#1c1c1f", white: "#f4f1ea", grey: "#8a8d93", gray: "#8a8d93", red: "#d23a2f",
  pink: "#f28ab2", orange: "#f08a2c", yellow: "#f2c53d", green: "#3f9a5a", olive: "#6b7340",
  khaki: "#b9a77a", beige: "#d9c7a6", cream: "#efe5cf", brown: "#7a4f32", tan: "#c19a6b",
  blue: "#3563c9", navy: "#1f2b52", denim: "#3f5f8f", teal: "#2a9393", purple: "#7a4bb3",
  lilac: "#b9a2dd", burgundy: "#6e1f2e", maroon: "#6e1f2e", mint: "#8fd9bf",
};

/** Turn "dark jeans" / "pink t shirt" into a colour. */
export function colorFromDescription(desc: string, type: GarmentType): string {
  const d = desc.toLowerCase();
  let hex = Object.keys(COLORS).find((k) => d.includes(k));
  let base = hex ? COLORS[hex]! : /jean|denim/.test(d) ? COLORS.denim! : type === "top" ? "#e9e4da" : "#3a3d44";
  const c = new THREE.Color(base);
  if (/\bdark\b|deep/.test(d)) c.multiplyScalar(0.55);
  if (/\blight\b|pale|pastel/.test(d)) c.lerp(new THREE.Color("#ffffff"), 0.4);
  return `#${c.getHexString()}`;
}

const r = (circ: number) => circ / (2 * Math.PI);

function Lathe({ pts, color, rough = 0.85 }: { pts: [number, number][]; color: string; rough?: number }) {
  const geo = useMemo(
    () => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 40),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(pts)],
  );
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color={color} roughness={rough} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Limb({ from, to, radius, color }: { from: [number, number, number]; to: [number, number, number]; radius: number; color: string }) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const len = a.distanceTo(b);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return (
    <mesh position={mid} quaternion={q} castShadow>
      <capsuleGeometry args={[radius, len, 6, 20]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}

const SKIN = "#e8c3a0";

export default function BodyViewer({
  body,
  garment,
  type,
  color,
}: {
  body: BodyCm;
  garment: BodyCm;
  type: GarmentType;
  color: string;
}) {
  const chestR = r(body.chest ?? 92);
  const waistR = r(body.waist ?? 80);
  const hipR = r(body.hips ?? (body.waist ?? 80) * 1.15);
  const legR = hipR * 0.42;
  const legX = hipR * 0.48;
  const shoulderX = chestR + 4;

  // garment radii — never inside the body so a "small" fit still shows, skin-tight
  const g = (circ: number | undefined, bodyR: number) => Math.max(circ ? r(circ) : bodyR + 2, bodyR + 0.4);
  const gChest = g(garment.chest, chestR);
  const gWaist = g(garment.waist, waistR);
  const gHip = g(garment.hips, hipR);
  const legScale = gHip / hipR;

  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 110, 260], fov: 40 }}>
      <color attach="background" args={["#fff6ec"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[80, 220, 140]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      <Environment>
        <Lightformer intensity={2} position={[0, 5, 5]} scale={[10, 10, 1]} />
        <Lightformer intensity={1} color="#ffd9c8" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
      </Environment>

      {/* mannequin */}
      <Lathe
        color={SKIN}
        rough={0.6}
        pts={[[0.1, 80], [hipR * 0.85, 82], [hipR, 92], [waistR, 106], [chestR, 124], [chestR * 0.92, 140], [chestR * 0.5, 147], [5, 150], [0.1, 150]]}
      />
      <Limb from={[0, 148, 0]} to={[0, 158, 0]} radius={5} color={SKIN} />
      <mesh position={[0, 170, 0]} castShadow>
        <sphereGeometry args={[11, 32, 32]} />
        <meshStandardMaterial color={SKIN} roughness={0.6} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Limb from={[s * shoulderX, 142, 0]} to={[s * (shoulderX + 8), 88, 0]} radius={4.3} color={SKIN} />
          <Limb from={[s * legX, 84, 0]} to={[s * legX, 6, 0]} radius={legR} color={SKIN} />
        </group>
      ))}

      {/* clothing */}
      {type === "top" ? (
        <>
          <Lathe
            color={color}
            pts={[[gWaist * 1.02, 96], [gWaist, 106], [gChest, 124], [gChest * 0.93, 140], [chestR * 0.55, 147.5], [6, 150.5]]}
          />
          {[-1, 1].map((s) => (
            <Limb key={s} from={[s * shoulderX, 142, 0]} to={[s * (shoulderX + 3), 122, 0]} radius={4.3 + (gChest - chestR) * 0.3 + 1} color={color} />
          ))}
        </>
      ) : (
        <>
          <Lathe color={color} pts={[[gHip * 0.86, 80], [gHip, 92], [gWaist, 104.5], [gWaist, 106.5]]} />
          {[-1, 1].map((s) => (
            <Limb key={s} from={[s * legX, 84, 0]} to={[s * legX, 8, 0]} radius={legR * legScale + 0.6} color={color} />
          ))}
        </>
      )}

      <ContactShadows position={[0, -1, 0]} opacity={0.45} scale={200} blur={2.5} far={60} />
      <OrbitControls target={[0, 100, 0]} enablePan={false} minDistance={140} maxDistance={400} />
    </Canvas>
  );
}
