const { ipcRenderer } = require('electron');

let timerInterval = null;
let startTime = null;
let isRunning = false;
let alertInterval = null;
let lastAlertTime = null;
let elapsedMs = 0;

const jiraSelect = document.getElementById('jiraTask');
const jiraManual = document.getElementById('jiraTaskManual');
const manualToggle = document.getElementById('manualInputToggle');
const timerDisplay = document.getElementById('timer');
const actionBtn = document.getElementById('actionBtn');
const statusDiv = document.getElementById('status');
const commentGroup = document.getElementById('commentGroup');
const commentInput = document.getElementById('comment');
const folderPathDiv = document.getElementById('folderPath');
const changeFolderBtn = document.getElementById('changeFolderBtn');

function formatTime(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function formatTimeSpent(ms) {
  const minutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 8); // Assuming 8-hour work days
  const weeks = Math.floor(days / 5); // Assuming 5-day work weeks

  const remainingDays = days % 5;
  const remainingHours = hours % 8;
  const remainingMinutes = minutes % 60;

  let result = '';
  if (weeks > 0) result += `${weeks}w `;
  if (remainingDays > 0) result += `${remainingDays}d `;
  if (remainingHours > 0) result += `${remainingHours}h `;
  if (remainingMinutes > 0) result += `${remainingMinutes}m`;

  return result.trim() || '0m';
}

function formatTimeSpentForComment(ms) {
  const minutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `Logs ${hours} hours and ${remainingMinutes} mins`;
}

function formatDateTime(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

function getJiraTask() {
  if (manualToggle.checked) {
    return jiraManual.value.trim();
  } else {
    return jiraSelect.value;
  }
}

function updateTimer() {
  const now = Date.now();
  elapsedMs = now - startTime;
  timerDisplay.textContent = formatTime(elapsedMs);
}

function startTimer() {
  const jiraTask = getJiraTask();

  if (!jiraTask) {
    showStatus('Please select or enter a JIRA task', 'error');
    return;
  }

  isRunning = true;
  startTime = Date.now();
  elapsedMs = 0;
  
  // Disable inputs
  jiraSelect.disabled = true;
  jiraManual.disabled = true;
  manualToggle.disabled = true;
  
  commentGroup.classList.remove('hidden');
  commentInput.value = '';

  actionBtn.textContent = 'Stop & Save';
  actionBtn.classList.remove('btn-start');
  actionBtn.classList.add('btn-stop');

  timerInterval = setInterval(updateTimer, 1000);
  showStatus('Timer running...', '');
}

async function stopTimer() {
  isRunning = false;
  clearInterval(timerInterval);

  const comment = commentInput.value.trim();
  const jiraTask = getJiraTask();

  const data = {
    ticketNo: jiraTask,
    startDate: formatDateTime(new Date(startTime)),
    timeSpent: formatTimeSpent(elapsedMs),
    comment: comment || formatTimeSpentForComment(elapsedMs)
  };

  try {
    const result = await ipcRenderer.invoke('save-log', data);

    if (result.success) {
      showStatus(`Saved: ${data.timeSpent}`, 'success');
    } else {
      showStatus(`Error: ${result.error}`, 'error');
    }
  } catch (error) {
    showStatus(`Error: ${error.message}`, 'error');
  }

  // Reset UI
  timerDisplay.textContent = '00:00:00';
  
  // Re-enable inputs
  jiraSelect.disabled = false;
  jiraManual.disabled = false;
  manualToggle.disabled = false;
  jiraSelect.value = '';
  jiraManual.value = '';
  
  commentGroup.classList.add('hidden');
  commentInput.value = '';

  actionBtn.textContent = 'Start Timer';
  actionBtn.classList.remove('btn-stop');
  actionBtn.classList.add('btn-start');
}

function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + type;
}

function checkWorkHoursAlert() {
  if (isRunning) return;

  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const hour = now.getHours();

  // Check if weekday (Monday = 1 to Friday = 5)
  const isWeekday = day >= 1 && day <= 5;

  // Check if time is between 10 AM (10) and 5 PM (17)
  const isWorkHours = hour >= 10 && hour < 17;

  if (isWeekday && isWorkHours) {
    // Prevent alert spam - only alert once per hour
    const currentHour = now.getHours();
    if (lastAlertTime === currentHour) return;

    lastAlertTime = currentHour;

    // Send alert to main process to show notification
    ipcRenderer.send('show-alert', {
      title: 'TimeLog Reminder',
      body: 'Timer is not running during work hours. Start tracking your time!'
    });
  }
}

function startAlertChecker() {
  // Check immediately and then every 5 minutes
  checkWorkHoursAlert();
  alertInterval = setInterval(checkWorkHoursAlert, 5 * 60 * 1000);
}

// Toggle between dropdown and manual input
manualToggle.addEventListener('change', () => {
  if (manualToggle.checked) {
    jiraSelect.classList.add('hidden');
    jiraManual.classList.remove('hidden');
    jiraManual.focus();
  } else {
    jiraManual.classList.add('hidden');
    jiraSelect.classList.remove('hidden');
  }
});

actionBtn.addEventListener('click', () => {
  if (isRunning) {
    stopTimer();
  } else {
    startTimer();
  }
});

// Start the alert checker when app loads
startAlertChecker();

// Load and display current storage folder
async function loadStorageFolder() {
  try {
    const folder = await ipcRenderer.invoke('get-storage-folder');
    folderPathDiv.textContent = folder;
  } catch (error) {
    folderPathDiv.textContent = 'Error loading folder';
  }
}

// Handle folder change button
changeFolderBtn.addEventListener('click', async () => {
  try {
    const result = await ipcRenderer.invoke('select-folder');
    if (result.success) {
      folderPathDiv.textContent = result.path;
      showStatus('Storage folder updated', 'success');
    }
  } catch (error) {
    showStatus('Error changing folder', 'error');
  }
});

// Listen for folder selection from main process
ipcRenderer.on('folder-selected', (event, path) => {
  folderPathDiv.textContent = path;
});

// Load folder on startup
loadStorageFolder();
