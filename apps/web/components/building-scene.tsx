"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

function Building() {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = -0.3 + Math.sin(clock.elapsedTime * 0.2) * 0.08;
  });
  return (
    <group ref={group} rotation={[-0.08, -0.3, 0]}>
      <mesh position={[0, 0, 0]}><boxGeometry args={[3.8, 2.3, 2.6]} /><meshStandardMaterial color="#d9ddd8" roughness={0.75} /></mesh>
      {[[-1.15, .55, 1.32], [0, .55, 1.32], [1.15, .55, 1.32], [-1.15, -.45, 1.32], [0, -.45, 1.32], [1.15, -.45, 1.32]].map((position, index) =>
        <mesh key={index} position={position as [number, number, number]}><boxGeometry args={[.55, .45, .04]} /><meshStandardMaterial color="#f0b956" emissive="#875514" emissiveIntensity={1.2} /></mesh>
      )}
      <mesh position={[0, -1.55, 0]}><boxGeometry args={[6.3, .35, 4.7]} /><meshStandardMaterial color="#173d39" /></mesh>
    </group>
  );
}

export function BuildingScene() {
  return (
    <div className="building-scene" aria-label="Animated apartment escrow journey">
      <Canvas camera={{ position: [6, 4, 7], fov: 38 }} dpr={[1, 1.5]}>
        <ambientLight intensity={1.7} />
        <directionalLight position={[4, 7, 5]} intensity={3} color="#b7fff0" />
        <Building />
      </Canvas>
      <div className="journey" aria-hidden="true"><span>Book</span><i>→</i><span>Deposit</span><i>→</i><span>Check in</span><i>→</i><span>Refund</span></div>
    </div>
  );
}
