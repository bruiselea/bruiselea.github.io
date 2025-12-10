import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
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

    const geometries: THREE.BufferGeometry[] = [];

    bonds.forEach(bond => {
      const { start, end } = bond;
      const direction = new THREE.Vector3().subVectors(end, start);
      const length = direction.length();
      const position = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      
      const geometry = new THREE.CylinderGeometry(radius, radius, length, 16);
      
      // Align cylinder with bond direction
      const up = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction.normalize());
      
      // Apply transformation directly to geometry
      const matrix = new THREE.Matrix4().compose(position, quaternion, new THREE.Vector3(1, 1, 1));
      geometry.applyMatrix4(matrix);
      
      geometries.push(geometry);
    });

    if (geometries.length === 0) {
      return new DataView(new ArrayBuffer(0));
    }

    // Merge all geometries into one
    let mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);
    
    // Clean up: merge vertices and recompute normals
    mergedGeometry = BufferGeometryUtils.mergeVertices(mergedGeometry);
    mergedGeometry.computeVertexNormals();

    const mesh = new THREE.Mesh(mergedGeometry, new THREE.MeshBasicMaterial());
    scene.add(mesh);

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
