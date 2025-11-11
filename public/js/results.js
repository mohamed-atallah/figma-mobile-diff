// Get comparison ID from URL
const path = window.location.pathname;
const comparisonId = path.split('/').pop();

// Load results
loadResults();

async function loadResults() {
  try {
    const response = await fetch(`/api/comparisons/${comparisonId}`);

    if (!response.ok) {
      throw new Error('Failed to load comparison results');
    }

    const comparison = await response.json();

    // Hide loading, show results
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('results').classList.remove('hidden');

    // Render results
    renderHeader(comparison);
    renderSummary(comparison);
    renderPairs(comparison);
  } catch (error) {
    console.error('Error loading results:', error);
    document.getElementById('loading').innerHTML = `
      <div style="color: var(--error-color);">
        <h3>Error Loading Results</h3>
        <p>${error.message}</p>
        <button class="btn-primary" onclick="window.location.href='/'">Go Home</button>
      </div>
    `;
  }
}

function renderHeader(comparison) {
  document.getElementById('projectName').textContent = comparison.projectName;

  const timestamp = new Date(comparison.timestamp).toLocaleString();
  document.getElementById('timestamp').textContent = `Created: ${timestamp}${
    comparison.devicePreset ? ` • Device: ${comparison.devicePreset}` : ''
  }`;
}

function renderSummary(comparison) {
  const summaryContainer = document.getElementById('summary');

  const totalCard = createSummaryCard(
    comparison.totalPairs,
    'Total Pairs',
    ''
  );

  const passedCard = createSummaryCard(
    comparison.passedPairs,
    'Passed',
    'success'
  );

  const failedCard = createSummaryCard(
    comparison.failedPairs,
    'Failed',
    comparison.failedPairs > 0 ? 'error' : ''
  );

  const statusCard = createSummaryCard(
    comparison.status.toUpperCase(),
    'Status',
    comparison.status === 'completed' ? 'success' : ''
  );

  summaryContainer.appendChild(totalCard);
  summaryContainer.appendChild(passedCard);
  summaryContainer.appendChild(failedCard);
  summaryContainer.appendChild(statusCard);
}

function createSummaryCard(value, label, className = '') {
  const card = document.createElement('div');
  card.className = `summary-card ${className}`;

  const valueEl = document.createElement('div');
  valueEl.className = 'summary-value';
  valueEl.textContent = value;

  const labelEl = document.createElement('div');
  labelEl.className = 'summary-label';
  labelEl.textContent = label;

  card.appendChild(valueEl);
  card.appendChild(labelEl);

  return card;
}

function renderPairs(comparison) {
  const pairsContainer = document.getElementById('pairs');

  comparison.pairs.forEach((pair, index) => {
    const pairElement = createPairElement(pair, index + 1, comparison.id);
    pairsContainer.appendChild(pairElement);
  });
}

function createPairElement(pair, index, comparisonId) {
  const container = document.createElement('div');
  container.className = 'pair-container';

  // Header
  const header = document.createElement('div');
  header.className = 'pair-header';

  const title = document.createElement('h3');
  title.textContent = `Pair ${index}`;

  const status = document.createElement('span');
  status.className = `pair-status ${pair.status === 'success' ? 'pass' : 'fail'}`;
  status.textContent = `${pair.mismatchPercentage.toFixed(2)}% Difference • ${
    pair.status === 'success' ? 'PASS' : 'FAIL'
  }`;

  header.appendChild(title);
  header.appendChild(status);
  container.appendChild(header);

  // Images grid
  const imagesGrid = document.createElement('div');
  imagesGrid.className = 'images-grid';

  // Design image
  const designCard = createImageCard(
    'Design',
    `/api/comparisons/${comparisonId}/files/${pair.id}/design`,
    'design-image'
  );
  imagesGrid.appendChild(designCard);

  // Screenshot image
  const screenshotCard = createImageCard(
    'Screenshot',
    `/api/comparisons/${comparisonId}/files/${pair.id}/screenshot`,
    'screenshot-image'
  );
  imagesGrid.appendChild(screenshotCard);

  container.appendChild(imagesGrid);

  // Comparison image (side-by-side)
  if (pair.comparisonPath) {
    const comparisonSection = document.createElement('div');
    comparisonSection.className = 'comparison-image';

    const comparisonTitle = document.createElement('h4');
    comparisonTitle.textContent = 'Side-by-Side Comparison';

    const comparisonImg = document.createElement('img');
    comparisonImg.src = `/api/comparisons/${comparisonId}/files/${pair.id}/comparison`;
    comparisonImg.alt = 'Side-by-side comparison';
    comparisonImg.onclick = () => openImageInNewTab(comparisonImg.src);

    comparisonSection.appendChild(comparisonTitle);
    comparisonSection.appendChild(comparisonImg);
    container.appendChild(comparisonSection);
  }

  // Diff image
  if (pair.diffPath) {
    const diffSection = document.createElement('div');
    diffSection.className = 'comparison-image';

    const diffTitle = document.createElement('h4');
    diffTitle.textContent = 'Difference Visualization';

    const diffImg = document.createElement('img');
    diffImg.src = `/api/comparisons/${comparisonId}/files/${pair.id}/diff`;
    diffImg.alt = 'Difference visualization';
    diffImg.onclick = () => openImageInNewTab(diffImg.src);

    diffSection.appendChild(diffTitle);
    diffSection.appendChild(diffImg);
    container.appendChild(diffSection);
  }

  // Report
  if (pair.reportPath) {
    const reportSection = document.createElement('div');

    const reportTitle = document.createElement('h4');
    reportTitle.textContent = 'Detailed Analysis Report';
    reportSection.appendChild(reportTitle);

    const reportText = document.createElement('pre');
    reportText.className = 'report-text';
    reportText.textContent = 'Loading report...';

    // Load report text
    fetch(`/api/comparisons/${comparisonId}/files/${pair.id}/report`)
      .then((res) => res.text())
      .then((text) => {
        reportText.textContent = text;
      })
      .catch((err) => {
        reportText.textContent = 'Error loading report: ' + err.message;
      });

    reportSection.appendChild(reportText);
    container.appendChild(reportSection);
  }

  return container;
}

function createImageCard(title, src, className) {
  const card = document.createElement('div');
  card.className = 'image-card';

  const titleEl = document.createElement('h4');
  titleEl.textContent = title;

  const img = document.createElement('img');
  img.src = src;
  img.alt = title;
  img.className = className;
  img.onclick = () => openImageInNewTab(src);

  card.appendChild(titleEl);
  card.appendChild(img);

  return card;
}

function openImageInNewTab(src) {
  window.open(src, '_blank');
}
