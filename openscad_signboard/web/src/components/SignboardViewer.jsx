import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { useLoader } from '@react-three/fiber';

function Model({ url }) {
  // Load the STL file
  const geom = useLoader(STLLoader, url);
  
  // Center geometry
  React.useMemo(() => {
    geom.center();
    geom.computeVertexNormals();
  }, [geom]);

  return (
    <mesh geometry={geom} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial color="#00bcd4" roughness={0.3} />
    </mesh>
  );
}

export function SignboardViewer({ stlUrl }) {
  if (!stlUrl) return <div style={{width: 400, height: 400, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>No Model</div>;

  return (
    <div style={{ width: '100%', height: '400px', background: '#f0f0f0', borderRadius: '8px', overflow: 'hidden' }}>
      <Canvas shadows camera={{ position: [0, 0, 150], fov: 50 }}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.6}>
            <Model url={stlUrl} />
          </Stage>
        </Suspense>
        <OrbitControls autoRotate />
      </Canvas>
    </div>
  );
}
