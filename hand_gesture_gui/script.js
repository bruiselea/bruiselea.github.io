const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const cursor = document.getElementById('custom-cursor');

// State
let isPinching = false;
let cursorX = 0;
let cursorY = 0;

function onResults(results) {
  // Update canvas size to match video
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;
  
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  // Draw Video Feed (Optional, if we want to see it on canvas)
  // canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,
                     {color: '#00FF00', lineWidth: 5});
      drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 2});

      // Implement cursor control here
      processGestures(landmarks);
    }
  }
  canvasCtx.restore();
}

function processGestures(landmarks) {
    // 8: Index Finger Tip
    // 4: Thumb Tip
    const indexTip = landmarks[8];
    const thumbTip = landmarks[4];
    
    if (indexTip) {
        // Map coordinates (Mirror effect handling is in CSS, here we need logical X)
        // MediaPipe coords are 0-1.
        // Screen is window.innerWidth/Height
        
        // Invert X because video is mirrored
        const x = (1 - indexTip.x) * window.innerWidth;
        const y = indexTip.y * window.innerHeight;
        
        // Smooth cursor movement (Basic Lerp)
        const lerpFactor = 0.2;
        cursorX = cursorX + (x - cursorX) * lerpFactor;
        cursorY = cursorY + (y - cursorY) * lerpFactor;
        
        // Update Cursor Element
        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;
        
        // Gesture Detection: Pinch
        const distance = Math.hypot(
            (indexTip.x - thumbTip.x),
            (indexTip.y - thumbTip.y)
        );
        
        // Threshold for pinch (tune this)
        const pinchThreshold = 0.05;
        
        if (distance < pinchThreshold) {
            if (!isPinching) {
                isPinching = true;
                cursor.classList.add('clicking');
                triggerClick(cursorX, cursorY);
            }
        } else {
            if (isPinching) {
                isPinching = false;
                cursor.classList.remove('clicking');
                triggerRelease(cursorX, cursorY);
            }
        }
        
        // Hover detection
        checkHover(cursorX, cursorY);
    }
}

function triggerClick(x, y) {
    const element = document.elementFromPoint(x, y);
    if (element) {
        // Dispatch click event
        element.click();
        
        // Visual feedback for custom elements
        if (element.classList.contains('gesture-btn')) {
            element.classList.add('clicked');
            setTimeout(() => element.classList.remove('clicked'), 200);
        }
    }
}

function triggerRelease(x, y) {
    // Handle drag end if needed
}

function checkHover(x, y) {
    // Hide default cursor
    document.body.style.cursor = 'none';
    
    // Find element under cursor
    const element = document.elementFromPoint(x, y);
    
    // Clear previous hovers
    document.querySelectorAll('.hovered').forEach(el => el.classList.remove('hovered'));
    
    if (element) {
        // Add hover class to interactive elements
        if (element.classList.contains('gesture-btn') || element.closest('.card')) {
            const target = element.classList.contains('gesture-btn') ? element : element.closest('.card');
            target.classList.add('hovered');
        }
    }
}

const hands = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

hands.onResults(onResults);

// Camera Setup
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: 1280,
  height: 720
});

// Start camera
camera.start();

// Button Event Listeners for Demo
document.getElementById('btn1').addEventListener('click', () => {
    alert('Button 1 Clicked with Gesture!');
});

document.getElementById('btn2').addEventListener('click', () => {
    document.body.style.backgroundColor = 
        document.body.style.backgroundColor === 'rgb(15, 23, 42)' ? '#1e293b' : '#0f172a';
});
