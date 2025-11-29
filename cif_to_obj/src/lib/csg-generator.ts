import * as THREE from 'three';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import type { Atom, Bond } from './structure-manager';

export interface PrintableAtom {
  id: string;
  symbol: string;
  position: THREE.Vector3;
  geometry: THREE.BufferGeometry;
  color: string;
}

export class CSGGenerator {
  private evaluator: Evaluator;

  constructor() {
    this.evaluator = new Evaluator();
    // this.evaluator.attributes = ['position', 'normal']; // Optimize attributes if needed
  }

  public generatePrintableAtoms(
    atoms: Atom[],
    bonds: Bond[],
    atomRadiusScale: number,
    bondRadius: number,
    tolerance: number = 0.2
  ): PrintableAtom[] {
    const printableAtoms: PrintableAtom[] = [];
    const holeRadius = bondRadius + tolerance;

    // 1. Map bonds to atoms
    const atomBonds = new Map<string, Bond[]>();
    bonds.forEach(bond => {
      if (!atomBonds.has(bond.atom1Id)) atomBonds.set(bond.atom1Id, []);
      if (!atomBonds.has(bond.atom2Id)) atomBonds.set(bond.atom2Id, []);
      atomBonds.get(bond.atom1Id)?.push(bond);
      atomBonds.get(bond.atom2Id)?.push(bond);
    });

    // 2. Process each atom
    atoms.forEach(atom => {
      const connectedBonds = atomBonds.get(atom.id) || [];
      
      // Base Atom Geometry
      const atomGeo = new THREE.SphereGeometry(atom.radius * atomRadiusScale, 32, 32);
      let atomBrush = new Brush(atomGeo);
      atomBrush.updateMatrixWorld();

      // If no bonds, just return the sphere
      if (connectedBonds.length === 0) {
        printableAtoms.push({
          id: atom.id,
          symbol: atom.symbol,
          position: atom.position,
          geometry: atomGeo,
          color: atom.color
        });
        return;
      }

      // Subtract each bond
      for (const bond of connectedBonds) {
        // Determine direction from atom to bond end
        const isStart = bond.atom1Id === atom.id;
        const otherEnd = isStart ? bond.end : bond.start;
        const direction = new THREE.Vector3().subVectors(otherEnd, atom.position).normalize();
        
        // Create Cylinder Cutter
        // We want to cut a hole of specific depth into the atom, not pierce it through.
        // piercing through causes "floating parts" if the atom is small or bonds are close.
        const atomRealRadius = atom.radius * atomRadiusScale;
        // Depth limit: 80% of radius or max 0.6 units (Angstroms)
        const cutDepth = Math.min(atomRealRadius * 0.8, 0.6); 
        const margin = 0.2; // Stick out a bit to ensure clean surface cut
        const cutterHeight = cutDepth + margin;
        
        const cutterGeo = new THREE.CylinderGeometry(holeRadius, holeRadius, cutterHeight, 32);
        const cutterBrush = new Brush(cutterGeo);

        // Align cutter with bond direction
        // Cylinder is Y-up by default.
        const up = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
        cutterBrush.quaternion.copy(quaternion);
        
        // Position: 
        // We want the inner tip at (R - cutDepth)
        // We want the outer tip at (R + margin)
        // Center is at (R - cutDepth + R + margin) / 2 = R + (margin - cutDepth) / 2
        const centerOffset = atomRealRadius + (margin - cutDepth) / 2;
        cutterBrush.position.copy(direction.multiplyScalar(centerOffset));
        
        cutterBrush.updateMatrixWorld();

        // Perform Subtraction
        const result = this.evaluator.evaluate(atomBrush, cutterBrush, SUBTRACTION);
        atomBrush = result;
      }

      printableAtoms.push({
        id: atom.id,
        symbol: atom.symbol,
        position: atom.position,
        geometry: atomBrush.geometry,
        color: atom.color
      });
    });

    return printableAtoms;
  }
}
