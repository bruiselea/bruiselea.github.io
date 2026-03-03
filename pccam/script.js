// DOM Elements
const video = document.getElementById('cameraFeed');
const canvas = document.getElementById('photoCanvas');
const ctx = canvas.getContext('2d');
const captureBtn = document.getElementById('captureBtn');
const placeholder = document.getElementById('placeholderState');
const downloadBtn = document.getElementById('downloadBtn');
const cameraSelect = document.getElementById('cameraSelect');
const cameraStatus = document.getElementById('cameraStatus');

// Editor Elements
const startCropBtn = document.getElementById('startCropBtn');
const confirmCropBtn = document.getElementById('confirmCropBtn');
const cancelCropBtn = document.getElementById('cancelCropBtn');
const mainControls = document.getElementById('mainControls');
const cropControls = document.getElementById('cropControls');

// State
let currentStream = null;
let currentFilter = 'none';
let cropper = null;

// Filters
const filters = {
    none: 'none',
    grayscale: 'grayscale(100%)',
    sepia: 'sepia(100%)',
    contrast: 'contrast(150%)'
};

// Initialize
async function init() {
    await getCameras();
    // Try to start with the first available camera
    if (cameraSelect.options.length > 0) {
        startCamera(cameraSelect.value);
    }
}

// Get available video devices
async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        cameraSelect.innerHTML = '<option value="" disabled>Select Camera...</option>';

        videoDevices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Camera ${index + 1}`;
            cameraSelect.appendChild(option);

            // If it's the default camera select it
            if (index === 0) cameraSelect.value = device.deviceId;
        });

        if (videoDevices.length === 0) {
            cameraStatus.textContent = 'No available cameras';
        }
    } catch (err) {
        console.error('Error enumerating devices:', err);
        cameraStatus.textContent = 'Permission denied';
    }
}

// Start Camera Stream
async function startCamera(deviceId) {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
        video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        }
    };

    try {
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = currentStream;
        cameraStatus.textContent = 'Active';
    } catch (err) {
        console.error('Error starting camera:', err);
        cameraStatus.textContent = 'Error starting camera';
        alert('Could not access camera. Please ensure you have granted permission.');
    }
}

// Capture Photo
function capturePhoto() {
    if (!currentStream) return;

    // Destroy existing cropper if active
    if (cropper) {
        destroyCropper();
    }

    // Set canvas dimensions to match video stream
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    // We draw the raw video frame (true orientation) without mirroring, 
    // so that text is readable and it represents reality.
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Show result
    canvas.classList.remove('hidden');
    placeholder.style.display = 'none';
    downloadBtn.disabled = false;
    downloadBtn.textContent = 'Download Image';
    startCropBtn.disabled = false;

    applyVisualFilter();
}

// Apply visual filter to canvas element
function applyVisualFilter() {
    canvas.style.filter = filters[currentFilter];
}

// Save Image
async function saveImage() {
    // Generate filename
    const filename = `pccam-capture-${Date.now()}.png`;

    // Modern "Save As" picker (File System Access API)
    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: 'PNG Image',
                    accept: { 'image/png': ['.png'] },
                }],
            });
            const writable = await handle.createWritable();

            // Convert canvas to blob
            canvas.toBlob(async (blob) => {
                await writable.write(blob);
                await writable.close();
                showSaveFeedback();
            });
        } catch (err) {
            // User cancelled or error
            console.log('Save cancelled or failed:', err);
        }
    } else {
        // Fallback for older browsers: Auto-download to default folder
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showSaveFeedback();
    }
}

function showSaveFeedback() {
    const originalText = downloadBtn.textContent;
    downloadBtn.textContent = 'Saved!';
    downloadBtn.disabled = true;
    setTimeout(() => {
        downloadBtn.textContent = originalText;
        downloadBtn.disabled = false;
    }, 2000);
}

// Cropping Functions
function enableCropper() {
    if (cropper) return;

    // Switch controls
    mainControls.classList.add('hidden');
    cropControls.classList.remove('hidden');
    downloadBtn.disabled = true;

    // Initialize Cropper.js
    cropper = new Cropper(canvas, {
        viewMode: 1,
        background: false,
        autoCropArea: 0.8,
        responsive: true,
    });
}

function confirmCrop() {
    if (!cropper) return;

    const croppedCanvas = cropper.getCroppedCanvas();

    // Update main canvas with cropped content
    canvas.width = croppedCanvas.width;
    canvas.height = croppedCanvas.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(croppedCanvas, 0, 0);

    // Clean up
    destroyCropper();
}

function cancelCrop() {
    destroyCropper();
}

function destroyCropper() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }

    // Switch controls back
    mainControls.classList.remove('hidden');
    cropControls.classList.add('hidden');
    downloadBtn.disabled = false;
}

// Event Listeners
captureBtn.addEventListener('click', capturePhoto);

cameraSelect.addEventListener('change', (e) => {
    startCamera(e.target.value);
});

downloadBtn.addEventListener('click', saveImage);

// Crop Listeners
startCropBtn.addEventListener('click', enableCropper);
confirmCropBtn.addEventListener('click', confirmCrop);
cancelCropBtn.addEventListener('click', cancelCrop);

// Filter Buttons
document.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Remove active class from all
        document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
        // Add active to clicked
        e.target.classList.add('active');

        // Update filter
        const id = e.target.id;
        if (id === 'filterNone') currentFilter = 'none';
        if (id === 'filterGrayscale') currentFilter = 'grayscale';
        if (id === 'filterSepia') currentFilter = 'sepia';
        if (id === 'filterContrast') currentFilter = 'contrast';

        applyVisualFilter();
    });
});

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault(); // Prevent scrolling
        // Only capture if we are not currently cropping
        if (!cropper) {
            captureBtn.classList.add('active'); // Visual feedback
            capturePhoto();
            setTimeout(() => captureBtn.classList.remove('active'), 100);
        }
    }
});

// Start
init();
