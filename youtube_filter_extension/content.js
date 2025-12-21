// YouTube Feed Filter - Content Script

let allowedKeywords = [];
let isProcessing = false;

// Initialize
chrome.storage.local.get(['keywords'], (result) => {
  console.log('YouTube Filter: Initializing...');
  if (result.keywords) {
    allowedKeywords = result.keywords;
    console.log('YouTube Filter: Loaded keywords', allowedKeywords);
    filterVideos();
  }
});

// Listen for storage changes - usually handles keeping multiple tabs in sync
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.keywords) {
    allowedKeywords = changes.keywords.newValue || [];
    console.log('YouTube Filter: Storage changed', allowedKeywords);
    filterVideos();
  }
});

// Listen for direct messages from popup (for immediate update)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateKeywords') {
    allowedKeywords = request.keywords || [];
    console.log('YouTube Filter: Received update message', allowedKeywords);
    filterVideos();
    sendResponse({ status: 'ok' });
  }
});

// Observe DOM changes (throttled)
const observer = new MutationObserver(() => {
  if (!isProcessing) {
    isProcessing = true;
    requestAnimationFrame(() => {
      filterVideos();
      isProcessing = false;
    });
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

function filterVideos() {
  console.log('YouTube Filter: Filtering videos...');
  
  // If no keywords are set, show everything (default behavior)
  if (!allowedKeywords.length) {
    console.log('YouTube Filter: No keywords set, showing all.');
    showAllVideos();
    return;
  }

  // Selectors for various video containers on YouTube
  const videoSelectors = [
    'ytd-rich-item-renderer',      // Home feed
    'ytd-video-renderer',          // Search results
    'ytd-grid-video-renderer',     // Channel videos
    'ytd-compact-video-renderer',  // Sidebar / Up next
    'ytd-reel-item-renderer'       // Shorts
  ];

  const videos = document.querySelectorAll(videoSelectors.join(','));
  console.log(`YouTube Filter: Found ${videos.length} video elements.`);

  let hiddenCount = 0;
  videos.forEach(video => {
    // Try multiple ways to find the title
    const titleElement = video.querySelector('#video-title') || video.querySelector('#video-title-link') || video.querySelector('h3') || video.querySelector('[aria-label]');
    
    if (titleElement) {
      // Use textContent or aria-label as fallback
      const titleText = (titleElement.textContent || titleElement.getAttribute('aria-label') || '').toLowerCase().trim();
      
      const isMatch = allowedKeywords.some(keyword => titleText.includes(keyword.toLowerCase()));

      if (isMatch) {
        video.style.display = ''; // Show
      } else {
        video.style.display = 'none'; // Hide
        hiddenCount++;
      }
    }
  });
  console.log(`YouTube Filter: Hidden ${hiddenCount} videos.`);
}

function showAllVideos() {
  const videoSelectors = [
    'ytd-rich-item-renderer',
    'ytd-video-renderer',
    'ytd-grid-video-renderer',
    'ytd-compact-video-renderer',
    'ytd-reel-item-renderer'
  ];
  
  const videos = document.querySelectorAll(videoSelectors.join(','));
  videos.forEach(video => {
    video.style.display = '';
  });
}
