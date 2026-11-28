/* [Mount / 形状] */
// Shape on the removable cover. / カバーと一体にする形状
mount_style = 0; // [0:Device holder, 1:Flat plate, 2:Add to an STL]

// Front outline for Flat plate. / 平板を選んだときのカバーの外形
cover_outline = 0; // [0:Rectangle, 1:Rounded, 2:Tapered, 3:Arch]

// Device width, or plate or imported STL width along X. / 機器・平板・STLの幅
width_mm = 60; // [10:0.1:250]

// Backing plate height, or imported STL height along Y. / 背板またはSTLの高さ
height_mm = 80; // [20:0.1:250]

/* [Wall base / 壁側ベース] */
// Match the size of the base and cover. / ベースとカバーの共通サイズ
base_size = 0; // [0:S - 6 staples, 1:M - 12 staples, 2:L - 20 staples]

// Dovetail clearance per side. / あり溝の片側のすき間
slide_clearance_mm = 0.25; // [0.15:0.05:0.35]

/* [Device holder / 機器の受け] */
// Thickness where the device sits. / 受けに入る部分の厚み
device_thickness_mm = 18; // [2:0.1:65]

// Extra space at each side and in front of the device. / 左・右・手前それぞれのすき間
clearance_mm = 0.5; // [0.2:0.1:2]

// Height of the front lip above the seat. / 受けの底から前縁までの高さ
lip_height_mm = 6; // [4:0.1:16]

/* [Imported STL / 手持ちのSTL] */
// Use a closed mesh in mm, with its attachment face down (-Z). / 接着面が-Z側にある閉じたSTL
stl_file = "default.stl";

// Bounding-box center X, center Y and minimum Z. / STLの中心X、中心Y、底面Z
stl_origin_mm = [0.0, 0.0, 0.0]; // [:0.01:]

// Move the imported shape horizontally and vertically on the cover. / カバー上での左右・上下位置
stl_offset_mm = [0.0, 0.0]; // [:0.1:]

/* [Output / 出力] */
// Export print parts or a blank cover for designing in CAD. / 印刷用部品かCAD設計用カバーを選択
print_part = 0; // [0:Both parts, 1:Wall base only, 2:Removable cover only, 3:CAD cover template]

// OpenSCAD assembly view for Both parts. / Both partsを選んだときの組み付け表示
local_preview = 2; // [0:Print layout, 1:Installed, 2:Before sliding down]

/* [Hidden] */
// X is across the wall, Y is up, Z is out from the wall.
// The 67 mm base and the dovetail are the compact standard in modular.py.
rows = [3, 6, 10][base_size];
base_half_width = 33.5;
base_half_height = (8.5 + rows * 8.5) / 2;
core_half = 16.5;
base_face = 8;
window_left = 19.5;
window_width = 12;
window_height = 6.5;
window_pitch = 8.5;
membrane = 0.20;

groove_floor = 3.2;
groove_knee = 6.8;
groove_mouth = 9.6;
slide_bottom = -14;
slide_top = 14;
plate_back = 8.4;
plate_front = 12.4;
cover_back = 1;
cover_inner = base_half_width + 1;
cover_outer = cover_inner + 2;
cover_bottom = -base_half_height - 1;
cover_inner_top = base_half_height + 1;
cover_face_top = cover_inner_top + 2;
skirt_rise = plate_back - cover_back;
outline_center = (cover_bottom + cover_face_top) / 2;
has_outline = mount_style == 1 && cover_outline != 0;

side_wall = 4;
seat = 4;
holder_inner_width = width_mm + 2 * clearance_mm;
holder_width = holder_inner_width + 2 * side_wall;
lip_start = plate_front + device_thickness_mm + clearance_mm;
lip_top = seat + lip_height_mm;
holder_front = lip_start + lip_height_mm + 3;
guide_height = max(lip_top, min(26, height_mm));
front_half_width = max(cover_outer,
    mount_style == 0 ? holder_width / 2 :
    width_mm / 2 + (mount_style == 2 ? abs(stl_offset_mm.x) : 0));
holder_panel_bottom = min(-height_mm / 2, cover_bottom - skirt_rise);
front_bottom = mount_style == 0 ? holder_panel_bottom :
    min(cover_bottom, -height_mm / 2 + (has_outline ? outline_center :
        mount_style == 2 ? stl_offset_mm.y : 0));

module box(x0, x1, y0, y1, z0, z1) {
    translate([x0, y0, z0]) cube([x1 - x0, y1 - y0, z1 - z0]);
}

module along_y(profile, bottom, top) {
    translate([0, top, 0]) rotate([90, 0, 0])
        linear_extrude(height = top - bottom) polygon(profile);
}

module across_x(profile, left, right) {
    translate([left, 0, 0]) rotate([90, 0, 90])
        linear_extrude(height = right - left) polygon(profile);
}

function dovetail(bottom, wide, narrow, top) = [
    [-wide, bottom], [wide, bottom], [narrow, groove_knee],
    [narrow, top], [-narrow, top], [-narrow, groove_knee]
];

module staple_wing() {
    difference() {
        union() {
            box(core_half - 0.4, window_left + 0.2, -base_half_height, base_half_height, 0, 4);
            box(window_left, base_half_width, -base_half_height, base_half_height, 0, 1.2);
        }
        for (i = [0 : rows - 1]) {
            y = (i - (rows - 1) / 2) * window_pitch;
            box(window_left, window_left + window_width, y - window_height / 2,
                y + window_height / 2, membrane, 5);
            box(window_left - 2, window_left + 0.2, y - 0.4, y + 0.4, 3.5, 5);
        }
    }
}

module wall_base() {
    difference() {
        union() {
            along_y([
                [-core_half, 0], [core_half, 0], [core_half, 4], [core_half - 2, base_face],
                [2 - core_half, base_face], [-core_half, 4]
            ], -base_half_height, base_half_height);
            staple_wing();
            mirror([1, 0, 0]) staple_wing();
        }
        along_y(dovetail(groove_floor, groove_mouth + groove_knee - groove_floor,
                         groove_mouth, base_face + 1), slide_bottom, base_half_height + 1);
    }
}

module sliding_tongue() {
    bottom = groove_floor + 0.25;
    narrow = groove_mouth - slide_clearance_mm;
    wide = narrow + groove_knee - bottom;
    intersection() {
        along_y(dovetail(bottom, wide, narrow, plate_back + 0.4), slide_bottom, slide_top);
        linear_extrude(height = plate_front) polygon([
            [-wide + 1, slide_bottom], [wide - 1, slide_bottom],
            [wide + 1, slide_bottom + 2], [wide + 1, slide_top],
            [-wide - 1, slide_top], [-wide - 1, slide_bottom + 2]
        ]);
    }
}

module covered_carrier() {
    difference() {
        // Flat roof with a 2 mm wall above the cavity.
        box(-cover_outer, cover_outer, cover_bottom, cover_face_top, cover_back, plate_front);
        box(-cover_inner, cover_inner, cover_bottom - 1, cover_inner_top, 0, plate_back);
    }
    sliding_tongue();
}

module backing_plate(width) {
    box(-width / 2, width / 2, -height_mm / 2, height_mm / 2, plate_back, plate_front);
}

function cover_fits_outline(w, h, x, y, radius, rise, taper) =
    x <= w / 2 && y <= h / 2 && (
        cover_outline == 1 ?
            norm([max(0, x - (w / 2 - radius)), max(0, y - (h / 2 - radius))]) <= radius :
        cover_outline == 2 ?
            x <= w / 2 - taper * (0.5 + y / h) :
            pow(x / (w / 2), 2) + pow(max(0, y - (h / 2 - rise)) / rise, 2) <= 1
    );

module shaped_plate() {
    w = width_mm;
    h = height_mm;
    radius = 12;
    rise = h * 0.46;
    taper = w * 0.165;
    // Cover the full silhouette of the stock sleeve.
    // Leave a small margin for polygonal arcs and mesh export.
    assert(cover_fits_outline(w, h, cover_outer + 0.08,
                             (cover_face_top - cover_bottom) / 2 + 0.08,
                             radius, rise, taper),
           "Cover outline must hide the wall base. Increase width or height.");
    translate([0, outline_center, plate_back])
        linear_extrude(height = plate_front - plate_back) {
            if (cover_outline == 1)
                offset(r = radius, $fn = 120) square([w - 2 * radius, h - 2 * radius], center = true);
            else if (cover_outline == 2)
                polygon([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2 - taper, h / 2], [taper - w / 2, h / 2]]);
            else
                polygon(concat([[-w / 2, -h / 2], [w / 2, -h / 2]],
                    [for (angle = [0 : 3 : 180]) [w / 2 * cos(angle), h / 2 - rise + rise * sin(angle)]]));
        }
}

module device_holder() {
    y_bottom = -height_mm / 2;
    box(-front_half_width, front_half_width, holder_panel_bottom, max(height_mm / 2, cover_face_top),
        plate_back, plate_front);
    // Grow the lower side skirts from the front panel as the upright print rises.
    for (x = [-cover_outer, cover_inner])
        across_x([
            [cover_bottom - skirt_rise, plate_back], [cover_bottom + 0.1, cover_back],
            [cover_bottom + 0.1, plate_back + 0.1], [cover_bottom - skirt_rise, plate_back + 0.1]
        ], x, x + 2);
    box(-holder_width / 2, holder_width / 2, y_bottom, y_bottom + seat, plate_back, holder_front);
    for (x = [-holder_width / 2, holder_inner_width / 2])
        box(x, x + side_wall, y_bottom, y_bottom + guide_height, plate_back, holder_front);
    across_x([
        [y_bottom, lip_start], [y_bottom, holder_front], [y_bottom + lip_top, holder_front],
        [y_bottom + lip_top, holder_front - 3], [y_bottom + seat, lip_start]
    ], -holder_width / 2, holder_width / 2);
}

module removable_cover() {
    union() {
        covered_carrier();
        if (mount_style == 0) {
            device_holder();
        } else if (mount_style == 1) {
            if (has_outline)
                shaped_plate();
            else
                backing_plate(width_mm);
        } else {
            assert(stl_file != "default.stl" && stl_file != "", "Upload your STL first.");
            assert(abs(stl_offset_mm.x) < (width_mm / 2 + cover_outer) &&
                   stl_offset_mm.y - height_mm / 2 < cover_face_top &&
                   stl_offset_mm.y + height_mm / 2 > cover_bottom,
                   "Move the STL onto the front of the cover.");
            translate([stl_offset_mm.x, stl_offset_mm.y, plate_front - 0.6] - stl_origin_mm)
                import(file = stl_file, convexity = 10);
        }
    }
}

module print_cover() {
    if (mount_style == 1)
        translate([0, 0, plate_front]) rotate([180, 0, 0]) removable_cover();
    else
        translate([0, 0, -front_bottom]) rotate([90, 0, 0]) removable_cover();
}

assert(mount_style == 0 || mount_style == 1 || mount_style == 2, "Choose a mount shape.");
assert(cover_outline == 0 || cover_outline == 1 || cover_outline == 2 || cover_outline == 3,
       "Choose a cover outline.");
assert(print_part == 0 || print_part == 1 || print_part == 2 || print_part == 3, "Choose an output.");
assert(base_size == 0 || base_size == 1 || base_size == 2, "Choose base size S, M or L.");
assert(slide_clearance_mm >= 0.15 && slide_clearance_mm <= 0.35, "Set slide clearance to 0.15–0.35 mm.");
assert(width_mm >= 10 && width_mm <= 250 && height_mm >= 20 && height_mm <= 250, "Check width and height.");
assert(mount_style != 0 || (device_thickness_mm >= 2 && device_thickness_mm <= 65 &&
       clearance_mm >= 0.2 && clearance_mm <= 2 && lip_height_mm >= 4 && lip_height_mm <= 16),
       "Check device thickness, clearance and lip height.");

if (print_part == 3) {
    // CAD reference: the mounting face is Z=0, +Y points up on the wall.
    translate([0, 0, -plate_front]) covered_carrier();
} else if ($preview && local_preview != 0 && print_part == 0) {
    color("#607784") wall_base();
    lift = local_preview == 2 ? base_half_height - front_bottom + 18 : 0;
    color("#e2a45f") translate([0, lift, 0]) removable_cover();
} else {
    if (print_part == 0)
        translate([-front_half_width - base_half_width - 8, 0, 0]) wall_base();
    else if (print_part == 1)
        wall_base();
    if (print_part != 1) print_cover();
}
