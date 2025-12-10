import { primitives, booleans, extrusions, transforms, hulls } from '@jscad/modeling';

const { circle, roundedRectangle } = primitives;
const { subtract } = booleans;
const { extrudeLinear } = extrusions;
const { translate } = transforms;
const { convexHull } = hulls;

// --- Shape Factories (2D) ---

function getHouseShape(w, h, r) {
    // House: Hull of 5 circles
    const bodyH = h * 0.7;
    
    // Anchors relative to center bottom [0,0]? 
    // Let's assume w/h center roughly at [0, h/2] to simplify
    // Or just custom coordinates
    
    const circles = [
        translate([-w/2 + r, r], circle({radius: r})), // Bottom Left
        translate([w/2 - r, r], circle({radius: r})),  // Bottom Right
        translate([-w/2 + r, bodyH], circle({radius: r})), // Eaves Left
        translate([w/2 - r, bodyH], circle({radius: r})),  // Eaves Right
        translate([0, h - r], circle({radius: r}))      // Peak
    ];
    
    return convexHull(circles);
}

function getPentagonShape(w, r) {
    // Regular pentagon
    // Radius approx w/2
    const rad = w/2;
    const pieces = [];
    for(let i=0; i<5; i++) {
        const ang = i * Math.PI * 2 / 5 + Math.PI/2; 
        const x = (rad - r) * Math.cos(ang);
        const y = (rad - r) * Math.sin(ang);
        pieces.push(translate([x + w/2, y + w/2], circle({radius: r}))); // Center roughly
    }
    return convexHull(pieces);
}

function getBaseShape(type, w, h) {
    const r = 3; // Corner radius
    if (type === 'HOUSE') return getHouseShape(w, h, r);
    if (type === 'SQUARE') return roundedRectangle({size: [w, h], roundRadius: r, center: [0, h/2]}); 
    if (type === 'PENTAGON') return getPentagonShape(w, r);
    if (type === 'CIRCLE') return circle({radius: w/2});
    
    // Default
    return roundedRectangle({size: [w, h], roundRadius: r});
}

// --- Main Generator Function ---

export function generateSignboardGeometry(params) {
    const { 
        shapeType = 'HOUSE', 
        width = 80, 
        height = 100,
        thicknessBase = 2,
        thicknessRim = 4,
        rimWidth = 2 
    } = params;

    // 1. Generate 2D Outline
    const outline2D = getBaseShape(shapeType, width, height);

    // 2. Extrude Base
    const base3D = extrudeLinear({height: thicknessBase}, outline2D);

    // 3. Create Rim
    // Rim = Extruded(Outline) - Extruded(InnerOutline)
    // InnerOutline = Offset(Outline, -rimWidth) -- JSCAD 'offset' corresponds to expansions/expands
    const { offset } = require('@jscad/modeling').expansions;
    
    // Note: offset in JSCAD can be tricky with negative values on complex hulls. 
    // A robust way is often subtraction of a smaller shape if analytically known, 
    // or using offset if the geometry is clean.
    const inside2D = offset({delta: -rimWidth, corners: 'round'}, outline2D);
    
    const rimSolid = extrudeLinear({height: thicknessRim}, 
        subtract(outline2D, inside2D)
    );

    // 4. Combine
    const { union } = booleans;
    // We can return an array of geometries (Base, Rim) to keep colors separate in the viewer!
    
    // Return objects with metadata if possible, or just raw geometry
    return [
        { geometry: base3D, color: [0, 1, 1, 1] }, // Cyan
        { geometry: rimSolid, color: [1, 1, 1, 1] } // White
    ];
}
