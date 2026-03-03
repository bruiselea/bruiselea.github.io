# PCCam

A premium, web-based USB Camera application built with Vanilla JS.
Designed for Windows 11, it provides a seamless experience for capturing and editing photos directly from your browser.

## Features

- **Live Camera Feed**: Real-time preview with support for multiple devices.
- **Split-Pane Interface**: View camera feed and editor side-by-side.
- **Capture**: fast capture using the shutter button or **Space key** shortcut.
- **Image Editor**:
  - **Cropping**: Integrated cropping tool.
  - **Filters**: Simple filters (Grayscale, Sepia, Contrast).
- **Save**: Save images to your local file system with "Save As" support.
- **Privacy First**: Runs entirely locally in your browser. No data is sent to any server.

## Usage

1. Open `index.html` in a modern web browser (edge, Chrome, etc.).
2. Grant camera permissions when prompted.
3. Use the dropdown to select your camera if multiple are available.
4. Press **Space** or click the Shutter button to take a photo.
5. In the right pane, crop or apply filters as needed.
6. Click **Download Image** to save.

## Tech Stack

- HTML5
- CSS3 (Vanilla, Dark Mode)
- JavaScript (Vanilla)
- [Cropper.js](https://github.com/fengyuanchen/cropperjs) (via CDN)

## License

MIT
