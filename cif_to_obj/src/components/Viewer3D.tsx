import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import type { Atom, Bond } from '../lib/structure-manager';
import type { PrintableAtom } from '../lib/csg-generator';

interface Viewer3DProps {
  atoms: Atom[];
  bonds: Bond[];
  printableAtoms?: PrintableAtom[];
  atomRadiusScale: number;
  bondRadius: number;
  showBonds: boolean;
}

const AtomMesh: React.FC<{ atom: Atom; scale: number }> = ({ atom, scale }) => {
  return (
    <mesh position={atom.position}>
      <sphereGeometry args={[atom.radius * scale, 32, 32]} />
      <meshStandardMaterial color={atom.color} roughness={0.3} metalness={0.2} />
    </mesh>
  );
};

const BondMesh: React.FC<{ bond: Bond; radius: number }> = ({ bond, radius }) => {
  const { start, end } = bond;
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const position = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

  
  // Align cylinder with direction
  // Default cylinder is along Y axis
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction.normalize());

  return (
    <mesh position={position} quaternion={quaternion}>
      <cylinderGeometry args={[radius, radius, length, 16]} />
      <meshStandardMaterial color="#cccccc" roughness={0.5} />
    </mesh>
  );
};

export const Viewer3D: React.FC<Viewer3DProps> = ({ 
  atoms, 
  bonds, 
  printableAtoms,
  atomRadiusScale = 0.5, 
  bondRadius = 0.2,
  showBonds = true 
}) => {
  return (
    <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
      <Canvas>
        <PerspectiveCamera makeDefault position={[10, 10, 10]} />
        <OrbitControls />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment preset="city" />
        
        <group>
          {printableAtoms ? (
            printableAtoms.map((atom) => (
              <mesh key={atom.id} position={atom.position} geometry={atom.geometry}>
                <meshStandardMaterial color={atom.color} roughness={0.3} metalness={0.2} />
              </mesh>
            ))
          ) : (
            atoms.map((atom) => (
              <AtomMesh key={atom.id} atom={atom} scale={atomRadiusScale} />
            ))
          )}
          
          {showBonds && bonds.map((bond) => (
            <BondMesh key={bond.id} bond={bond} radius={bondRadius} />
          ))}
        </group>
        
        {/* Helper grid */}
        <gridHelper args={[20, 20, 0x444444, 0x222222]} />
        <axesHelper args={[5]} />
      </Canvas>
    </div>
  );
};
