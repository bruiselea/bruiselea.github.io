import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import type { PrintableAtom } from './csg-generator';
import type { Bond } from './structure-manager';

export class Exporter {
  private exporter: STLExporter;

  constructor() {
    this.exporter = new STLExporter();
  }

  public exportAtoms(atoms: PrintableAtom[]): DataView {
    const scene = new THREE.Scene();
    
    atoms.forEach(atom => {
      const mesh = new THREE.Mesh(atom.geometry, new THREE.MeshBasicMaterial());
      mesh.position.copy(atom.position);
      scene.add(mesh);
    });

    scene.updateMatrixWorld(true);
    // Return binary STL
    return this.exporter.parse(scene, { binary: true }) as DataView;
  }

  public exportBonds(bonds: Bond[], radius: number): DataView {
    const scene = new THREE.Scene();

    bonds.forEach(bond => {
      const { start, end } = bond;
      const direction = new THREE.Vector3().subVectors(end, start);
      const length = direction.length();
      const position = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      
      const geometry = new THREE.CylinderGeometry(radius, radius, length, 16);
      const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
      
      const up = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction.normalize());
      
      mesh.position.copy(position);
      mesh.quaternion.copy(quaternion);
      
      scene.add(mesh);
    });

    scene.updateMatrixWorld(true);
    return this.exporter.parse(scene, { binary: true }) as DataView;
  }

  public downloadFile(content: DataView | string, filename: string) {
    const blob = new Blob([content as BlobPart], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
