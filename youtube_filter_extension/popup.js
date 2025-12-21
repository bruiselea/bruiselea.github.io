document.addEventListener('DOMContentLoaded', () => {
  const keywordInput = document.getElementById('keywordInput');
  const addBtn = document.getElementById('addBtn');
  const keywordList = document.getElementById('keywordList');
  const status = document.getElementById('status');

  let keywords = [];

  // Load keywords from storage
  chrome.storage.local.get(['keywords'], (result) => {
    if (result.keywords) {
      keywords = result.keywords;
      renderList();
    }
  });

  addBtn.addEventListener('click', addKeyword);
  keywordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addKeyword();
    }
  });

  function addKeyword() {
    const word = keywordInput.value.trim();
    if (word) {
      if (!keywords.includes(word)) {
        keywords.push(word);
        saveKeywords();
        renderList();
        keywordInput.value = '';
      } else {
        showStatus('Keyword already exists', 'red');
      }
    }
  }

  function removeKeyword(index) {
    keywords.splice(index, 1);
    saveKeywords();
    renderList();
  }

  function saveKeywords() {
    chrome.storage.local.set({ keywords: keywords }, () => {
      showStatus('Saved!', '#4CAF50');
      
      // Send message to active tab to update immediately
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { 
            action: 'updateKeywords',
            keywords: keywords 
          });
        }
      });
    });
  }

  function renderList() {
    keywordList.innerHTML = '';
    keywords.forEach((word, index) => {
      const li = document.createElement('li');
      li.textContent = word;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'X';
      deleteBtn.className = 'delete-btn';
      deleteBtn.addEventListener('click', () => removeKeyword(index));
      
      li.appendChild(deleteBtn);
      keywordList.appendChild(li);
    });
  }

  function showStatus(text, color) {
    status.textContent = text;
    status.style.color = color;
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  }
});
