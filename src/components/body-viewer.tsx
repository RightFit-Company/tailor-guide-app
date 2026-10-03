import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, useTexture } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import { avatarProportions, type AvatarMeasurements } from "@/lib/avatar";
import type { BodyType, CupSize, GarmentType } from "@/lib/fit";

const COLORS: Record<string, string> = {
  black: "#1c1c1f", white: "#f4f1ea", grey: "#8a8d93", gray: "#8a8d93", red: "#d23a2f",
  pink: "#f28ab2", orange: "#f08a2c", yellow: "#f2c53d", green: "#3f9a5a", olive: "#6b7340",
  khaki: "#b9a77a", beige: "#d9c7a6", cream: "#efe5cf", brown: "#7a4f32", tan: "#c19a6b",
  blue: "#3563c9", navy: "#1f2b52", denim: "#3f5f8f", teal: "#2a9393", purple: "#7a4bb3",
  lilac: "#b9a2dd", burgundy: "#6e1f2e", maroon: "#6e1f2e", mint: "#8fd9bf",
};

export interface ViewerGarment {
  url?: string | undefined;
  color: string;
  description?: string | undefined;
}

/** Turn “dark jeans” / “pink t shirt” into a colour. */
export function colorFromDescription(desc: string, type: GarmentType): string {
  const d = desc.toLowerCase();
  const key = Object.keys(COLORS).find((name) => d.includes(name));
  const base = key ? COLORS[key] : /jean|denim/.test(d) ? COLORS.denim : type === "top" ? "#e9e4da" : "#3a3d44";
  const color = new THREE.Color(base);
  if (/\bdark\b|deep/.test(d)) color.multiplyScalar(0.55);
  if (/\blight\b|pale|pastel/.test(d)) color.lerp(new THREE.Color("#ffffff"), 0.4);
  return `#${color.getHexString()}`;
}

function Limb({ from, to, radiusTop, radiusBottom, color }: {
  from: [number, number, number]; to: [number, number, number]; radiusTop: number; radiusBottom: number; color: string;
}) {
  const { midpoint, length, quaternion } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    return {
      midpoint: a.clone().add(b).multiplyScalar(0.5),
      length: a.distanceTo(b),
      quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()),
    };
  }, [from, to]);
  return (
    <mesh position={midpoint} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[radiusTop, radiusBottom, length, 24]} />
      <meshPhysicalMaterial color={color} roughness={0.72} sheen={0.08} />
    </mesh>
  );
}

function CurvedPhoto({ url, width, height, y, z }: { url: string; width: number; height: number; y: number; z: number }) {
  const texture = useTexture(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(width, height, 14, 10);
    const position = geo.attributes.position;
    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i) / (width / 2);
      position.setZ(i, -Math.pow(Math.abs(x), 2) * width * 0.11);
    }
    position.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, [height, width]);
  return (
    <mesh geometry={geometry} position={[0, y, z]} castShadow renderOrder={3}>
      <meshStandardMaterial map={texture} transparent alphaTest={0.12} side={THREE.DoubleSide} roughness={0.82} polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  );
}

function Top({ garment, chestWidth, chestDepth, waistWidth, shoulderY, waistY, skin }: {
  garment: ViewerGarment; chestWidth: number; chestDepth: number; waistWidth: number; shoulderY: number; waistY: number; skin: string;
}) {
  const length = shoulderY - waistY + 0.08;
  const centerY = (shoulderY + waistY) / 2;
  const width = Math.max(chestWidth, waistWidth) * 2.14;
  return (
    <group>
      <mesh position={[0, centerY, 0]} scale={[width, length, chestDepth * 2.18]} castShadow>
        <capsuleGeometry args={[0.5, 0.34, 12, 28]} />
        <meshPhysicalMaterial color={garment.color} roughness={0.83} sheen={0.35} sheenColor={garment.color} />
      </mesh>
      {[-1, 1].map((side) => (
        <Limb key={side} from={[side * chestWidth * 0.9, shoulderY - 0.03, 0]} to={[side * chestWidth * 1.13, shoulderY - 0.25, 0]} radiusTop={0.085} radiusBottom={0.105} color={garment.color} />
      ))}
      {garment.url && (
        <Suspense fallback={null}>
          <CurvedPhoto url={garment.url} width={width * 0.92} height={length * 0.98} y={centerY} z={chestDepth * 1.12 + 0.012} />
        </Suspense>
      )}
      <mesh position={[0, shoulderY + 0.01, chestDepth * 1.05]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.095, 0.011, 10, 30]} />
        <meshStandardMaterial color={skin} roughness={0.8} />
      </mesh>
    </group>
  );
}

function Trousers({ garment, hipWidth, hipDepth, waistWidth, waistY, ankleY, legX }: {
  garment: ViewerGarment; hipWidth: number; hipDepth: number; waistWidth: number; waistY: number; ankleY: number; legX: number;
}) {
  const color = garment.color;
  const crotchY = waistY - 0.23;
  const legLength = crotchY - ankleY;
  return (
    <group>
      <mesh position={[0, waistY - 0.13, 0]} scale={[hipWidth * 2.12, 0.3, hipDepth * 2.08]} castShadow>
        <capsuleGeometry args={[0.5, 0.2, 10, 24]} />
        <meshPhysicalMaterial color={color} roughness={0.78} sheen={0.2} sheenColor={color} />
      </mesh>
      {[-1, 1].map((side) => (
        <Limb key={side} from={[side * legX, crotchY, 0]} to={[side * legX * 0.82, ankleY, 0]} radiusTop={hipWidth * 0.36} radiusBottom={hipWidth * 0.21} color={color} />
      ))}
      {garment.url && (
        <Suspense fallback={null}>
          <CurvedPhoto url={garment.url} width={Math.max(hipWidth, waistWidth) * 2.02} height={legLength + 0.25} y={(waistY + ankleY) / 2} z={hipDepth * 1.08 + 0.014} />
        </Suspense>
      )}
    </group>
  );
}

function Person({ body, bodyType, cup, top, trousers }: {
  body: AvatarMeasurements; bodyType: BodyType; cup: CupSize | ""; top?: ViewerGarment | undefined; trousers?: ViewerGarment | undefined;
}) {
  const p = avatarProportions(body, bodyType, cup);
  const skin = bodyType === "woman" ? "#d9a77f" : "#c99470";
  const soleY = 0.04;
  const ankleY = 0.13;
  const crotchY = p.inseam + soleY;
  const waistY = crotchY + p.height * 0.08;
  const shoulderY = waistY + p.torsoLength;
  const neckY = shoulderY + p.height * 0.045;
  const headY = neckY + p.headRadius * 1.1;
  const legX = p.hipWidth * 0.45;
  const elbowY = shoulderY - p.armLength * 0.48;
  const wristY = shoulderY - p.armLength;
  const armX = p.shoulderWidth * 0.54;
  const dressedTop = top != null;
  const dressedBottom = trousers != null;

  return (
    <group position={[0, 0, 0]}>
      {/* softly layered anatomy reads more naturally than a single rotational mannequin */}
      <mesh position={[0, waistY + p.torsoLength * 0.68, 0]} scale={[p.chestWidth * 2, p.torsoLength * 0.72, p.chestDepth * 2]} castShadow>
        <sphereGeometry args={[0.5, 32, 24]} />
        <meshPhysicalMaterial color={skin} roughness={0.72} />
      </mesh>
      <mesh position={[0, waistY + p.torsoLength * 0.28, 0]} scale={[p.waistWidth * 2, p.torsoLength * 0.58, p.waistDepth * 2]} castShadow>
        <sphereGeometry args={[0.5, 32, 24]} />
        <meshPhysicalMaterial color={skin} roughness={0.72} />
      </mesh>
      <mesh position={[0, crotchY + 0.18, 0]} scale={[p.hipWidth * 2, 0.42, p.hipDepth * 2]} castShadow>
        <sphereGeometry args={[0.5, 32, 24]} />
        <meshPhysicalMaterial color={skin} roughness={0.72} />
      </mesh>

      <Limb from={[0, shoulderY, 0]} to={[0, neckY, 0]} radiusTop={p.headRadius * 0.48} radiusBottom={p.headRadius * 0.54} color={skin} />
      <mesh position={[0, headY, 0]} scale={[0.88, 1.08, 0.92]} castShadow>
        <sphereGeometry args={[p.headRadius, 32, 28]} />
        <meshPhysicalMaterial color={skin} roughness={0.68} />
      </mesh>
      <mesh position={[0, headY - p.headRadius * 0.05, p.headRadius * 0.89]} scale={[0.35, 0.46, 0.38]} castShadow>
        <sphereGeometry args={[p.headRadius * 0.28, 16, 12]} />
        <meshPhysicalMaterial color={skin} roughness={0.7} />
      </mesh>
      <mesh position={[0, headY + p.headRadius * 0.55, -p.headRadius * 0.08]} scale={[1.01, 0.58, 1]} castShadow>
        <sphereGeometry args={[p.headRadius, 24, 18]} />
        <meshStandardMaterial color="#3a2a22" roughness={0.94} />
      </mesh>

      {[-1, 1].map((side) => (
        <group key={side}>
          <Limb from={[side * p.shoulderWidth * 0.48, shoulderY, 0]} to={[side * armX, elbowY, 0.015]} radiusTop={p.height * 0.041} radiusBottom={p.height * 0.047} color={dressedTop ? top.color : skin} />
          <Limb from={[side * armX, elbowY, 0.015]} to={[side * armX * 0.92, wristY, 0.04]} radiusTop={p.height * 0.028} radiusBottom={p.height * 0.037} color={skin} />
          <mesh position={[side * armX * 0.92, wristY - 0.045, 0.045]} scale={[0.7, 1.25, 0.42]} castShadow>
            <sphereGeometry args={[p.height * 0.035, 18, 14]} />
            <meshPhysicalMaterial color={skin} roughness={0.72} />
          </mesh>
          <Limb from={[side * legX, crotchY, 0]} to={[side * legX * 0.9, crotchY * 0.53, 0.01]} radiusTop={p.hipWidth * 0.31} radiusBottom={p.hipWidth * 0.39} color={dressedBottom ? trousers.color : skin} />
          <Limb from={[side * legX * 0.9, crotchY * 0.53, 0.01]} to={[side * legX * 0.82, ankleY, 0]} radiusTop={p.hipWidth * 0.2} radiusBottom={p.hipWidth * 0.26} color={dressedBottom ? trousers.color : skin} />
          <mesh position={[side * legX * 0.82, soleY, p.height * 0.035]} scale={[0.7, 0.42, 1.45]} castShadow>
            <sphereGeometry args={[p.height * 0.048, 20, 14]} />
            <meshPhysicalMaterial color={skin} roughness={0.76} />
          </mesh>
        </group>
      ))}

      {trousers && <Trousers garment={trousers} hipWidth={p.hipWidth} hipDepth={p.hipDepth} waistWidth={p.waistWidth} waistY={waistY} ankleY={ankleY} legX={legX} />}
      {top && <Top garment={top} chestWidth={p.chestWidth} chestDepth={p.chestDepth} waistWidth={p.waistWidth} shoulderY={shoulderY} waistY={waistY} skin={skin} />}
    </group>
  );
}

export default function BodyViewer({ body, bodyType = "woman", cup = "", top, trousers }: {
  body: AvatarMeasurements; bodyType?: BodyType; cup?: CupSize | ""; top?: ViewerGarment | undefined; trousers?: ViewerGarment | undefined;
}) {
  const p = avatarProportions(body, bodyType, cup);
  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: [0, p.height * 0.54, p.height * 2.05], fov: 34 }} gl={{ antialias: true }}>
      <color attach="background" args={["#fff6ec"]} />
      <hemisphereLight args={["#fff7ee", "#d9b38c", 1.25]} />
      <directionalLight position={[2.5, 4, 3]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-2} shadow-camera-right={2} shadow-camera-top={3} shadow-camera-bottom={-1} />
      <Environment>
        <Lightformer intensity={2.8} position={[0, 4, 4]} scale={[7, 7, 1]} />
        <Lightformer intensity={1.4} color="#ffd9c8" position={[-4, 2, 0]} rotation-y={Math.PI / 2} scale={[5, 2, 1]} />
      </Environment>
      <Person body={body} bodyType={bodyType} cup={cup} top={top} trousers={trousers} />
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[4, 64]} />
        <meshStandardMaterial color="#f3e3cf" roughness={1} />
      </mesh>
      <ContactShadows position={[0, 0.006, 0]} opacity={0.42} scale={3.2} blur={2.8} far={2.8} />
      <OrbitControls target={[0, p.height * 0.52, 0]} enablePan={false} minDistance={p.height * 1.15} maxDistance={p.height * 3.1} minPolarAngle={Math.PI * 0.24} maxPolarAngle={Math.PI * 0.62} />
    </Canvas>
  );
}