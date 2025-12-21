// signboard_core.scad
include <shape_lib.scad>;

// --- Parameters ---
// These will be overridden by the command line or JSON values
SHAPE_TYPE = "HOUSE"; // HOUSE, SQUARE, PENTAGON, CIRCLE
WIDTH = 80;
HEIGHT = 100;
THICKNESS_BASE = 2;
THICKNESS_RIM = 4; // Total height including base
RIM_WIDTH = 2;

// --- Logic ---

module base_plate() {
    linear_extrude(THICKNESS_BASE) {
        if (SHAPE_TYPE == "HOUSE") shape_house(WIDTH, HEIGHT);
        else if (SHAPE_TYPE == "SQUARE") shape_square(WIDTH, HEIGHT);
        else if (SHAPE_TYPE == "PENTAGON") shape_pentagon(WIDTH/2); // Width as diameter approx
        else if (SHAPE_TYPE == "CIRCLE") shape_circle(WIDTH/2);
    }
}

module rim() {
    linear_extrude(THICKNESS_RIM) {
        difference() {
            if (SHAPE_TYPE == "HOUSE") shape_house(WIDTH, HEIGHT);
            else if (SHAPE_TYPE == "SQUARE") shape_square(WIDTH, HEIGHT);
            else if (SHAPE_TYPE == "PENTAGON") shape_pentagon(WIDTH/2);
            else if (SHAPE_TYPE == "CIRCLE") shape_circle(WIDTH/2);
            
            offset(r = -RIM_WIDTH) {
                if (SHAPE_TYPE == "HOUSE") shape_house(WIDTH, HEIGHT);
                else if (SHAPE_TYPE == "SQUARE") shape_square(WIDTH, HEIGHT);
                else if (SHAPE_TYPE == "PENTAGON") shape_pentagon(WIDTH/2);
                else if (SHAPE_TYPE == "CIRCLE") shape_circle(WIDTH/2);
            }
        }
    }
}

// --- Assembly ---
union() {
    color("cyan") base_plate();
    color("white") rim();
}
