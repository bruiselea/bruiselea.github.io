import { Vector3 } from 'three';

export interface CIFData {
  cell: {
    a: number;
    b: number;
    c: number;
    alpha: number;
    beta: number;
    gamma: number;
  };
  atoms: {
    label: string;
    symbol: string;
    fract: Vector3;
  }[];
  symmetryOps: string[];
}

export function parseCIF(content: string): CIFData {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
  
  const data: CIFData = {
    cell: { a: 0, b: 0, c: 0, alpha: 90, beta: 90, gamma: 90 },
    atoms: [],
    symmetryOps: [],
  };

  let loopHeaders: string[] = [];
  let inLoop = false;
  let currentLoopType = ''; // 'atom' or 'symmetry' or 'other'

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('_cell_length_a')) data.cell.a = parseFloat(line.split(/\s+/)[1]);
    if (line.startsWith('_cell_length_b')) data.cell.b = parseFloat(line.split(/\s+/)[1]);
    if (line.startsWith('_cell_length_c')) data.cell.c = parseFloat(line.split(/\s+/)[1]);
    if (line.startsWith('_cell_angle_alpha')) data.cell.alpha = parseFloat(line.split(/\s+/)[1]);
    if (line.startsWith('_cell_angle_beta')) data.cell.beta = parseFloat(line.split(/\s+/)[1]);
    if (line.startsWith('_cell_angle_gamma')) data.cell.gamma = parseFloat(line.split(/\s+/)[1]);

    if (line.startsWith('loop_')) {
      inLoop = true;
      loopHeaders = [];
      currentLoopType = '';
      continue;
    }

    if (inLoop) {
      if (line.startsWith('_')) {
        loopHeaders.push(line);
        if (line.startsWith('_atom_site_')) currentLoopType = 'atom';
        if (line.startsWith('_symmetry_equiv_pos_') || line.startsWith('_space_group_symop_')) currentLoopType = 'symmetry';
      } else {
        // Data line
        // const parts = line.match(/(?:[^\s"]+|"[^"]*")+/g) || []; // Handle quotes if needed, simple split for now
        // Simple split might fail with quotes, but for basic CIFs it's often okay. 
        // Let's use a slightly better split that respects spaces but handles simple cases.
        const values = line.split(/\s+/);

        if (currentLoopType === 'atom') {
          const labelIndex = loopHeaders.findIndex(h => h.includes('_label'));
          const symbolIndex = loopHeaders.findIndex(h => h.includes('_type_symbol'));
          const xIndex = loopHeaders.findIndex(h => h.includes('_fract_x'));
          const yIndex = loopHeaders.findIndex(h => h.includes('_fract_y'));
          const zIndex = loopHeaders.findIndex(h => h.includes('_fract_z'));

          if (xIndex !== -1 && yIndex !== -1 && zIndex !== -1) {
            const label = labelIndex !== -1 ? values[labelIndex] : 'Atom';
            const symbol = symbolIndex !== -1 ? values[symbolIndex] : label.replace(/[0-9+-]/g, '');
            const x = parseFloat(values[xIndex].split('(')[0]); // Remove uncertainties like 0.123(4)
            const y = parseFloat(values[yIndex].split('(')[0]);
            const z = parseFloat(values[zIndex].split('(')[0]);

            if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
              data.atoms.push({
                label,
                symbol,
                fract: new Vector3(x, y, z),
              });
            }
          }
        } else if (currentLoopType === 'symmetry') {
            // Handle symmetry operations
            // Usually just one column: _symmetry_equiv_pos_as_xyz
            const symIndex = loopHeaders.findIndex(h => h.includes('_xyz'));
            if (symIndex !== -1) {
                // Symmetry strings can contain spaces, so we need to be careful with split.
                // Often in CIF loop, if it's the only item, the whole line is the op.
                // But if there are multiple columns, it's harder.
                // For now, assume it's the last column or handle quotes.
                // Actually, symmetry ops are often quoted like 'x, y, z'.
                // let op = values[symIndex];
                // If it was quoted and split broke it, we might need to reconstruct.
                // Let's just store the raw line for now if it looks like a sym op.
                // Better: just look for the xyz part.
                const fullLine = line;
                // Remove quotes
                let cleanLine = fullLine.replace(/'/g, '').replace(/"/g, '');
                // If there are multiple columns, this might be messy.
                // But usually symmetry loop is simple.
                // Let's try to extract the x,y,z part if possible.
                // A common format is: 1 'x, y, z'
                // Or just: x, y, z
                // If we split by spaces, we might get ["x,", "y,", "z"].
                // Let's just take the whole line and assume the parser will handle it later,
                // BUT we should try to remove the index number if present.
                // If the line starts with a number, remove it.
                cleanLine = cleanLine.replace(/^\s*\d+\s+/, '');
                data.symmetryOps.push(cleanLine.trim());
            }
        }
      }
    }
  }
  
  // If no symmetry ops found, assume P1 (x,y,z)
  if (data.symmetryOps.length === 0) {
      data.symmetryOps.push('x,y,z');
  }

  return data;
}
