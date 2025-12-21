// shape_lib.scad
// Library of 2D base shapes for the signboard

$fn = 60; // Smooth curves

module shape_house(width, height, corner_r=2) {
    // House shape: Pentagon logic modification
    // "Pentagon with vertical sides and pointed top"
    // We can construct this by intersecting a square and a triangle or using hull()
    
    body_h = height * 0.7;
    roof_h = height - body_h;
    
    hull() {
        // Bottom corners
        translate([-width/2 + corner_r, corner_r]) circle(r=corner_r);
        translate([width/2 - corner_r, corner_r]) circle(r=corner_r);
        
        // Eaves corners (top of vertical section)
        translate([-width/2 + corner_r, body_h]) circle(r=corner_r);
        translate([width/2 - corner_r, body_h]) circle(r=corner_r);
        
        // Roof peak
        translate([0, height - corner_r]) circle(r=corner_r);
    }
}

module shape_square(width, height, corner_r=5) {
    hull() {
        translate([-width/2 + corner_r, corner_r]) circle(r=corner_r);
        translate([width/2 - corner_r, corner_r]) circle(r=corner_r);
        translate([-width/2 + corner_r, height - corner_r]) circle(r=corner_r);
        translate([width/2 - corner_r, height - corner_r]) circle(r=corner_r);
    }
}

module shape_pentagon(radius, corner_r=2) {
    // Regular pentagon
    hull() {
        for (i = [0:4]) {
            rotate([0, 0, i * 360/5 + 90]) // +90 to point up
            translate([radius - corner_r, 0, 0])
            circle(r=corner_r);
        }
    }
}

module shape_circle(radius) {
    circle(r=radius);
}

// Test render
// translate([-50, 0]) shape_house(40, 50);
// translate([0, 0]) shape_square(40, 40);
// translate([50, 0]) shape_pentagon(20);
