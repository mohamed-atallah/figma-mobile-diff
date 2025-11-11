// State management
let designFiles = [];
let screenshotFiles = [];

// DOM elements
const designInput = document.getElementById('designInput');
const screenshotInput = document.getElementById('screenshotInput');
const designDropZone = document.getElementById('designDropZone');
const screenshotDropZone = document.getElementById('screenshotDropZone');
const designPreview = document.getElementById('designPreview');
const screenshotPreview = document.getElementById('screenshotPreview');
const form = document.getElementById('uploadForm');
const submitBtn = document.getElementById('submitBtn');
const clearBtn = document.getElementById('clearBtn');
const thresholdInput = document.getElementById('threshold');
const thresholdValue = document.getElementById('thresholdValue');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

// Initialize
init();

function init() {
  // Threshold slider
  thresholdInput.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value) * 100;
    thresholdValue.textContent = `${value.toFixed(1)}%`;
  });

  // Design file input
  designInput.addEventListener('change', (e) => {
    handleFiles(Array.from(e.target.files), 'design');
  });

  // Screenshot file input
  screenshotInput.addEventListener('change', (e) => {
    handleFiles(Array.from(e.target.files), 'screenshot');
  });

  // Drag and drop for design
  setupDropZone(designDropZone, (files) => handleFiles(files, 'design'));

  // Drag and drop for screenshot
  setupDropZone(screenshotDropZone, (files) => handleFiles(files, 'screenshot'));

  // Form submission
  form.addEventListener('submit', handleSubmit);

  // Clear button
  clearBtn.addEventListener('click', clearAll);
}

function setupDropZone(dropZone, callback) {
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/')
    );
    callback(files);
  });

  dropZone.addEventListener('click', () => {
    if (dropZone.id === 'designDropZone') {
      designInput.click();
    } else {
      screenshotInput.click();
    }
  });
}

function handleFiles(files, type) {
  if (type === 'design') {
    designFiles = [...designFiles, ...files];
    renderFilePreview(designFiles, designPreview, 'design');
  } else {
    screenshotFiles = [...screenshotFiles, ...files];
    renderFilePreview(screenshotFiles, screenshotPreview, 'screenshot');
  }

  updateSubmitButton();
}

function renderFilePreview(files, container, type) {
  container.innerHTML = '';

  files.forEach((file, index) => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';

    // Create thumbnail
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.alt = file.name;

    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-info';

    const fileName = document.createElement('div');
    fileName.className = 'file-name';
    fileName.textContent = file.name;

    const fileSize = document.createElement('div');
    fileSize.className = 'file-size';
    fileSize.textContent = formatFileSize(file.size);

    fileInfo.appendChild(fileName);
    fileInfo.appendChild(fileSize);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'file-remove';
    removeBtn.textContent = 'Remove';
    removeBtn.type = 'button';
    removeBtn.onclick = () => removeFile(index, type);

    fileItem.appendChild(img);
    fileItem.appendChild(fileInfo);
    fileItem.appendChild(removeBtn);

    container.appendChild(fileItem);
  });
}

function removeFile(index, type) {
  if (type === 'design') {
    designFiles.splice(index, 1);
    renderFilePreview(designFiles, designPreview, 'design');
  } else {
    screenshotFiles.splice(index, 1);
    renderFilePreview(screenshotFiles, screenshotPreview, 'screenshot');
  }

  updateSubmitButton();
}

function updateSubmitButton() {
  const hasFiles = designFiles.length > 0 && screenshotFiles.length > 0;
  const countsMatch = designFiles.length === screenshotFiles.length;

  submitBtn.disabled = !hasFiles || !countsMatch;

  if (hasFiles && !countsMatch) {
    submitBtn.textContent = `Mismatched counts (${designFiles.length} designs, ${screenshotFiles.length} screenshots)`;
  } else if (hasFiles && countsMatch) {
    submitBtn.textContent = `Start Comparison (${designFiles.length} pair${designFiles.length > 1 ? 's' : ''})`;
  } else {
    submitBtn.textContent = 'Start Comparison';
  }
}

async function handleSubmit(e) {
  e.preventDefault();

  const projectName = document.getElementById('projectName').value.trim();
  const devicePreset = document.getElementById('devicePreset').value;
  const threshold = thresholdInput.value;

  if (!projectName) {
    alert('Please enter a project name');
    return;
  }

  if (designFiles.length === 0 || screenshotFiles.length === 0) {
    alert('Please upload both design images and screenshots');
    return;
  }

  if (designFiles.length !== screenshotFiles.length) {
    alert(`Mismatched file counts: ${designFiles.length} designs vs ${screenshotFiles.length} screenshots`);
    return;
  }

  // Prepare form data
  const formData = new FormData();
  formData.append('projectName', projectName);
  formData.append('threshold', threshold);

  if (devicePreset) {
    formData.append('devicePreset', devicePreset);
  }

  designFiles.forEach((file) => {
    formData.append('designs', file);
  });

  screenshotFiles.forEach((file) => {
    formData.append('screenshots', file);
  });

  // Show progress section
  form.classList.add('hidden');
  progressSection.classList.remove('hidden');
  progressText.textContent = 'Uploading files...';
  progressFill.style.width = '30%';

  try {
    const response = await fetch('/api/comparisons', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    const result = await response.json();

    progressText.textContent = 'Processing comparison...';
    progressFill.style.width = '60%';

    // Poll for completion
    await pollComparison(result.comparisonId);
  } catch (error) {
    console.error('Error:', error);
    alert('Error: ' + error.message);
    form.classList.remove('hidden');
    progressSection.classList.add('hidden');
  }
}

async function pollComparison(comparisonId) {
  const maxAttempts = 60; // 1 minute max
  let attempts = 0;

  const poll = async () => {
    attempts++;

    try {
      const response = await fetch(`/api/comparisons/${comparisonId}`);
      const comparison = await response.json();

      if (comparison.status === 'completed' || comparison.status === 'failed') {
        progressFill.style.width = '100%';
        progressText.textContent = 'Comparison complete! Redirecting...';

        setTimeout(() => {
          window.location.href = `/results/${comparisonId}`;
        }, 1000);
        return;
      }

      // Update progress
      const progress = 60 + (comparison.pairs.length / comparison.totalPairs) * 35;
      progressFill.style.width = `${progress}%`;
      progressText.textContent = `Processing pairs: ${comparison.pairs.length}/${comparison.totalPairs}`;

      if (attempts < maxAttempts) {
        setTimeout(poll, 1000);
      } else {
        throw new Error('Timeout waiting for comparison to complete');
      }
    } catch (error) {
      console.error('Polling error:', error);
      alert('Error checking comparison status: ' + error.message);
      form.classList.remove('hidden');
      progressSection.classList.add('hidden');
    }
  };

  poll();
}

function clearAll() {
  designFiles = [];
  screenshotFiles = [];
  designPreview.innerHTML = '';
  screenshotPreview.innerHTML = '';
  designInput.value = '';
  screenshotInput.value = '';
  document.getElementById('projectName').value = '';
  document.getElementById('devicePreset').value = '';
  updateSubmitButton();
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
