document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  const checkBtn = document.getElementById('checkServerBtn');
  const statusText = document.getElementById('serverStatusText');
  const timestampEl = document.getElementById('serverTimestamp');

  async function verifyServerHealth() {
    if (!statusText || !timestampEl) return;

    statusText.textContent = 'Checking Express server...';
    statusText.className = 'status-value';

    try {
      const response = await fetch('/api/health');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Server returned an unexpected response.');
      }

      statusText.textContent = `${data.status} (${data.step})`;
      statusText.className = 'status-value ok';
      timestampEl.textContent = new Date(data.timestamp).toLocaleString();
    } catch (error) {
      statusText.textContent =
        error instanceof Error ? error.message : 'Unable to reach backend server.';
      statusText.className = 'status-value err';
      timestampEl.textContent = new Date().toLocaleString();
    }
  }

  if (checkBtn) {
    checkBtn.addEventListener('click', verifyServerHealth);
  }

  // Run initial health check automatically on page load
  verifyServerHealth();
});
