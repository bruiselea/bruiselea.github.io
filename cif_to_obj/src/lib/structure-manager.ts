import { Vector3, Matrix4 } from 'three';
import type { CIFData } from './cif-parser';

export interface Atom {
  id: string;
  symbol: string;
  position: Vector3; // Cartesian
  originalFract: Vector3;
  radius: number;
  color: string;
}

export interface Bond {
  id: string;
  atom1Id: string;
  atom2Id: string;
  start: Vector3;
  end: Vector3;
}

export class StructureManager {
  private data: CIFData;
  private matrix: Matrix4;

  constructor(data: CIFData) {
    this.data = data;
    this.matrix = this.calculateUnitCellMatrix();
  }

  private calculateUnitCellMatrix(): Matrix4 {
    const { a, b, c, alpha, beta, gamma } = this.data.cell;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const alphaRad = toRad(alpha);
    const betaRad = toRad(beta);
    const gammaRad = toRad(gamma);

    const n2 = (Math.cos(alphaRad) - Math.cos(betaRad) * Math.cos(gammaRad)) / Math.sin(gammaRad);
    
    const m = new Matrix4();
    m.set(
      a, b * Math.cos(gammaRad), c * Math.cos(betaRad), 0,
      0, b * Math.sin(gammaRad), c * n2, 0,
      0, 0, c * Math.sqrt(Math.sin(betaRad)**2 - n2**2), 0,
      0, 0, 0, 1
    );

    return m;
  }

  private parseSymmetryOp(op: string): (v: Vector3) => Vector3 {
    // Parse strings like "x, y, z" or "-x, y+1/2, z"
    // Returns a function that applies the operation
    const parts = op.split(',').map(p => p.trim().toLowerCase());
    if (parts.length !== 3) return (v) => v.clone();

    const parseComponent = (comp: string, v: Vector3) => {
      // let val = 0;
      // Simple parser: look for x, y, z, and numbers
      // This is a bit hacky but works for standard CIF ops
      // Replace x with v.x, y with v.y, z with v.z
      // But we need to handle coefficients like -x.
      
      // Better approach: evaluate string? No, dangerous.
      // Let's parse manually.
      
      // let currentSign = 1;
      let currentVal = 0;
      
      // Remove spaces
      comp = comp.replace(/\s/g, '');
      
      // Split by + or - (keeping delimiters)
      const terms = comp.split(/([+-])/).filter(t => t.length > 0);
      
      // Re-assemble terms with signs
      let termSign = 1;
      for (const term of terms) {
        if (term === '+') { termSign = 1; continue; }
        if (term === '-') { termSign = -1; continue; }
        
        if (term.includes('x')) {
            const coeff = term.replace('x', '') === '' ? 1 : parseFloat(term.replace('x', ''));
            currentVal += termSign * (isNaN(coeff) ? 1 : coeff) * v.x;
        } else if (term.includes('y')) {
            const coeff = term.replace('y', '') === '' ? 1 : parseFloat(term.replace('y', ''));
            currentVal += termSign * (isNaN(coeff) ? 1 : coeff) * v.y;
        } else if (term.includes('z')) {
            const coeff = term.replace('z', '') === '' ? 1 : parseFloat(term.replace('z', ''));
            currentVal += termSign * (isNaN(coeff) ? 1 : coeff) * v.z;
        } else {
            // Number (fraction or decimal)
            if (term.includes('/')) {
                const [num, den] = term.split('/').map(parseFloat);
                currentVal += termSign * (num / den);
            } else {
                currentVal += termSign * parseFloat(term);
            }
        }
      }
      return currentVal;
    };

    return (v: Vector3) => new Vector3(
      parseComponent(parts[0], v),
      parseComponent(parts[1], v),
      parseComponent(parts[2], v)
    );
  }

  public generateStructure(supercell: [number, number, number], bondCutoff: number): { atoms: Atom[]; bonds: Bond[] } {
    const atoms: Atom[] = [];
    const bonds: Bond[] = [];
    const [nx, ny, nz] = supercell;

    // 1. Expand Symmetry
    // Generate full unit cell atoms from asymmetric unit
    const unitCellAtoms: { symbol: string; fract: Vector3; label: string }[] = [];
    const ops = this.data.symmetryOps.map(op => this.parseSymmetryOp(op));
    
    this.data.atoms.forEach(baseAtom => {
        ops.forEach(op => {
            const newFract = op(baseAtom.fract);
            
            // Wrap to [0, 1)
            newFract.x = ((newFract.x % 1) + 1) % 1;
            newFract.y = ((newFract.y % 1) + 1) % 1;
            newFract.z = ((newFract.z % 1) + 1) % 1;

            // Check for duplicates
            const isDuplicate = unitCellAtoms.some(existing => 
                existing.symbol === baseAtom.symbol && 
                existing.fract.distanceTo(newFract) < 0.001
            );

            if (!isDuplicate) {
                unitCellAtoms.push({
                    symbol: baseAtom.symbol,
                    fract: newFract,
                    label: baseAtom.label
                });
            }
        });
    });

    // 2. Supercell Expansion
    let atomCount = 0;
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        for (let k = 0; k < nz; k++) {
          unitCellAtoms.forEach((baseAtom) => {
            const fract = baseAtom.fract.clone().add(new Vector3(i, j, k));
            const cartesian = fract.clone().applyMatrix4(this.matrix);
            
            atoms.push({
              id: `atom-${atomCount++}`,
              symbol: baseAtom.symbol,
              position: cartesian,
              originalFract: fract,
              radius: this.getElementRadius(baseAtom.symbol),
              color: this.getElementColor(baseAtom.symbol),
            });
          });
        }
      }
    }

    // 3. Bond Detection
    // Naive O(N^2) for now, optimize with octree if needed
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const dist = atoms[i].position.distanceTo(atoms[j].position);
        if (dist <= bondCutoff) {
          bonds.push({
            id: `bond-${i}-${j}`,
            atom1Id: atoms[i].id,
            atom2Id: atoms[j].id,
            start: atoms[i].position.clone(),
            end: atoms[j].position.clone(),
          });
        }
      }
    }

    return { atoms, bonds };
  }

  private getElementRadius(symbol: string): number {
    // Basic radii in Angstroms (approximate)
    const radii: Record<string, number> = {
      H: 0.37, C: 0.77, N: 0.75, O: 0.73, F: 0.71,
      Si: 1.11, P: 1.06, S: 1.02, Cl: 0.99,
      Fe: 1.26, Au: 1.44, Cu: 1.28, Ag: 1.44, Al: 1.43,
    };
    return radii[symbol] || 1.0;
  }

  private getElementColor(symbol: string): string {
    const colors: Record<string, string> = {
      H: '#FFFFFF', C: '#909090', N: '#3050F8', O: '#FF0D0D', F: '#90E050',
      Si: '#F0C8A0', P: '#FF8000', S: '#FFFF30', Cl: '#1FF01F',
      Fe: '#E06633', Au: '#FFD123', Cu: '#C88033', Ag: '#C0C0C0', Al: '#BFA6A6',
    };
    return colors[symbol] || '#FF00FF';
  }
}
