# OpenSCAD Signboard Configurator Requirements

## Overview
A web-based application that allows users to design and generate 3D printable signboards. The system uses a defined workflow to customize the shape, logo, and content, utilizing OpenSCAD for 3D generation.

## User Workflow
The user moves through the following steps on the website:

1.  **Shape Selection**:
    -   User selects a base shape for the signboard.
    -   **Options** (based on reference sketch):
        -   **House** (Pentagon with vertical sides and pointed top)
        -   **Square** (Rectangle/Square with rounded corners?)
        -   **Pentagon** (Regular pentagon)
        -   **Circle** (Or rounded shapes)

2.  **Top Design (Logo/Main Graphic)**:
    -   User uploads an image (PNG/JPG) with transparency.
    -   **Backend Process**: The system automtically converts this bitmap image into an SVG vector path (tracing).
    -   The SVG is placed at the top center of the signboard and extruded.

3.  **Content Slots (Middle Section)**:
    -   User adds 0 to 5 "Content Sets".
    -   *Assumption based on reference photo*: A "Set" likely consists of a vertical stack of:
        -   QR Code (Generated from URL)
        -   Label Text (e.g., "LINE", "Instagram")
        -   Icon (Selected from library or uploaded?) - *User said "SNS Icon"*, likely needs a library of common SVG icons.
    -   *User Request Phrasing*: specified "Text & SNS Icon" and "Text & QR Code". Need to support flexible layout.

4.  **Footer Text**:
    -   One line of text at the very bottom (e.g., Shop Name, Address).

## Technical Requirements
### Frontend
-   **UI**: Step-by-step wizard or single page configurator.
-   **Preview**: 2D or 3D preview of the signboard.
-   **Input**:
    -   Image Upload (Logo)
    -   Text Fields (Labels, URLs)
    -   Dropdowns (Shape, Fonts)

### Backend / Processing
-   **Image Processing**: Convert uploaded raster images (PNG) to vector (SVG) for OpenSCAD import. Tools: `potrace` or similar.
-   **QR Code Generation**: Generate QR code SVG from URL.
-   **OpenSCAD Engine**:
    -   Compile definitions into a `.scad` file.
    -   Run OpenSCAD CLI to generate STL/GLB for preview/download.

## OpenSCAD Modules Needed
-   `ShapeBase(type, width, height, thickness)`
-   `LogoPlacement(svg_file, position)`
-   `ContentRow(items)`: Logic to distribute 1-5 items evenly across the width.
-   `QrCode3D(url)`: Import QR SVG.

## Reference Styles
-   **Colors**: Two-tone (Base color + Raised content color). See reference photo (Cyan base, White content).
-   **Style**: "Pop" and "Cute" aesthetic suitable for shops/counters.
