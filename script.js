const sampleUsers = [
  {
    fullName: "Muhammed Akbulut",
    personId: "45133",
    department: "Computer Engineering",
    cardUid: "A7F23D11",
    accessLevel: "Student",
    status: "Active"
  },
  {
    fullName: "Anna Kowalska",
    personId: "10021",
    department: "Administration",
    cardUid: "04A39C21",
    accessLevel: "Employee",
    status: "Active"
  },
  {
    fullName: "John Smith",
    personId: "20444",
    department: "IT Support",
    cardUid: "B82FD901",
    accessLevel: "Admin",
    status: "Active"
  }
];

const demoUnknownUids = ["91AB20FF", "CC8102D4", "70EF4A99", "D4208CE1"];
const accessRules = {
  Student: ["Main Entrance", "Library"],
  Employee: ["Main Entrance", "Library", "Laboratory"],
  Admin: ["Main Entrance", "Library", "Laboratory", "Server Room"],
  Guest: ["Main Entrance"]
};

const storageKeys = {
  users: "nfcDemoUsers",
  logs: "nfcDemoLogs",
  loggedIn: "nfcDemoLoggedIn"
};

const elements = {
  loginScreen: document.getElementById("loginScreen"),
  appShell: document.getElementById("appShell"),
  loginForm: document.getElementById("loginForm"),
  loginUsername: document.getElementById("loginUsername"),
  loginPassword: document.getElementById("loginPassword"),
  loginError: document.getElementById("loginError"),
  totalUsers: document.getElementById("totalUsers"),
  registeredCards: document.getElementById("registeredCards"),
  activeCards: document.getElementById("activeCards"),
  grantedToday: document.getElementById("grantedToday"),
  deniedToday: document.getElementById("deniedToday"),
  latestUid: document.getElementById("latestUid"),
  latestUser: document.getElementById("latestUser"),
  latestResult: document.getElementById("latestResult"),
  latestLocation: document.getElementById("latestLocation"),
  latestTime: document.getElementById("latestTime"),
  latestStatus: document.getElementById("latestStatus"),
  usersTable: document.getElementById("usersTable"),
  logsTable: document.getElementById("logsTable"),
  userCountLabel: document.getElementById("userCountLabel"),
  registerForm: document.getElementById("registerForm"),
  fullName: document.getElementById("fullName"),
  personId: document.getElementById("personId"),
  department: document.getElementById("department"),
  accessLevel: document.getElementById("accessLevel"),
  cardStatus: document.getElementById("cardStatus"),
  cardUid: document.getElementById("cardUid"),
  scanUid: document.getElementById("scanUid"),
  scanLocation: document.getElementById("scanLocation"),
  scanResult: document.getElementById("scanResult"),
  toast: document.getElementById("toast")
};

let users = loadUsers();
let logs = loadLogs();
let toastTimer;

function loadUsers() {
  const stored = localStorage.getItem(storageKeys.users);
  if (!stored) {
    localStorage.setItem(storageKeys.users, JSON.stringify(sampleUsers));
    return [...sampleUsers];
  }

  const parsedUsers = JSON.parse(stored).map(user => ({
    ...user,
    accessLevel: user.accessLevel || "Student",
    status: user.status || "Active"
  }));
  localStorage.setItem(storageKeys.users, JSON.stringify(parsedUsers));
  return parsedUsers;
}

function loadLogs() {
  const stored = localStorage.getItem(storageKeys.logs);
  if (!stored) {
    return [];
  }

  return JSON.parse(stored).map(log => ({
    ...log,
    accessLevel: log.accessLevel || "-",
    location: log.location || "-",
    result: log.result || "Denied",
    reason: log.reason || "No reason recorded"
  }));
}

function saveUsers() {
  localStorage.setItem(storageKeys.users, JSON.stringify(users));
}

function saveLogs() {
  localStorage.setItem(storageKeys.logs, JSON.stringify(logs));
}

function normalizeUid(uid) {
  return uid.trim().toUpperCase().replace(/\s/g, "");
}

function formatTime(date = new Date()) {
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isToday(timeString) {
  const date = new Date(timeString);
  const today = new Date();
  return date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate();
}

function generateUid() {
  const chars = "0123456789ABCDEF";
  let uid = "";
  for (let index = 0; index < 8; index += 1) {
    uid += chars[Math.floor(Math.random() * chars.length)];
  }
  return uid;
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  toastTimer = setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 2600);
}

function resultBadge(result) {
  const className = result === "Granted" ? "badge-granted" : "badge-denied";
  return `<span class="badge ${className}">${escapeHtml(result)}</span>`;
}

function statusBadge(status) {
  return `<span class="badge badge-${status.toLowerCase()}">${escapeHtml(status)}</span>`;
}

function renderUsers() {
  elements.usersTable.innerHTML = users.map((user, index) => `
    <tr>
      <td>${escapeHtml(user.fullName)}</td>
      <td>${escapeHtml(user.personId)}</td>
      <td>${escapeHtml(user.department)}</td>
      <td>${escapeHtml(user.accessLevel)}</td>
      <td><strong>${escapeHtml(user.cardUid)}</strong></td>
      <td>${statusBadge(user.status)}</td>
      <td>
        <div class="action-group">
          <button class="small-btn secondary-btn" data-action="block" data-index="${index}" ${user.status === "Blocked" ? "disabled" : ""}>Block Card</button>
          <button class="small-btn primary-btn" data-action="activate" data-index="${index}" ${user.status === "Active" ? "disabled" : ""}>Activate Card</button>
          <button class="small-btn danger-btn" data-action="delete" data-index="${index}">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");

  elements.userCountLabel.textContent = `${users.length} ${users.length === 1 ? "record" : "records"}`;
}

function renderLogs() {
  if (logs.length === 0) {
    elements.logsTable.innerHTML = `
      <tr>
        <td colspan="7" class="muted">No access logs yet.</td>
      </tr>
    `;
    return;
  }

  elements.logsTable.innerHTML = logs.map(log => `
    <tr>
      <td>${escapeHtml(log.displayTime)}</td>
      <td><strong>${escapeHtml(log.cardUid)}</strong></td>
      <td>${escapeHtml(log.userName)}</td>
      <td>${escapeHtml(log.accessLevel)}</td>
      <td>${escapeHtml(log.location)}</td>
      <td>${resultBadge(log.result)}</td>
      <td>${escapeHtml(log.reason)}</td>
    </tr>
  `).join("");
}

function renderStats() {
  const todaysLogs = logs.filter(log => isToday(log.time));
  elements.totalUsers.textContent = users.length;
  elements.registeredCards.textContent = users.length;
  elements.activeCards.textContent = users.filter(user => user.status === "Active").length;
  elements.grantedToday.textContent = todaysLogs.filter(log => log.result === "Granted").length;
  elements.deniedToday.textContent = todaysLogs.filter(log => log.result === "Denied").length;
}

function renderLatestScan() {
  const latest = logs[0];
  if (!latest) {
    elements.latestUid.textContent = "-";
    elements.latestUser.textContent = "-";
    elements.latestResult.textContent = "-";
    elements.latestLocation.textContent = "-";
    elements.latestTime.textContent = "-";
    elements.latestStatus.textContent = "No scan yet";
    elements.latestStatus.className = "badge badge-neutral";
    return;
  }

  elements.latestUid.textContent = latest.cardUid;
  elements.latestUser.textContent = latest.userName;
  elements.latestResult.textContent = latest.result;
  elements.latestLocation.textContent = latest.location;
  elements.latestTime.textContent = latest.displayTime;
  elements.latestStatus.textContent = latest.result;
  elements.latestStatus.className = `badge ${latest.result === "Granted" ? "badge-granted" : "badge-denied"}`;
}

function renderAll() {
  renderUsers();
  renderLogs();
  renderStats();
  renderLatestScan();
}

function registerCard(event) {
  event.preventDefault();

  const newUser = {
    fullName: elements.fullName.value.trim(),
    personId: elements.personId.value.trim(),
    department: elements.department.value.trim(),
    accessLevel: elements.accessLevel.value,
    cardUid: normalizeUid(elements.cardUid.value),
    status: elements.cardStatus.value
  };

  if (!newUser.fullName || !newUser.personId || !newUser.department || !newUser.cardUid) {
    showToast("Please complete all registration fields.");
    return;
  }

  const duplicate = users.some(user => user.cardUid === newUser.cardUid);
  if (duplicate) {
    showToast("This Card UID is already registered.");
    return;
  }

  users.push(newUser);
  saveUsers();
  elements.registerForm.reset();
  renderAll();
  showToast("Card registered successfully.");
}

function evaluateAccess(user, location) {
  if (!user) {
    return {
      result: "Denied",
      reason: "Card UID not found"
    };
  }

  if (user.status === "Blocked") {
    return {
      result: "Denied",
      reason: "Card is blocked"
    };
  }

  if (user.status === "Expired") {
    return {
      result: "Denied",
      reason: "Card is expired"
    };
  }

  const allowedLocations = accessRules[user.accessLevel] || [];
  if (!allowedLocations.includes(location)) {
    return {
      result: "Denied",
      reason: `${user.accessLevel} access is not permitted for ${location}`
    };
  }

  return {
    result: "Granted",
    reason: "Active card and access level permitted"
  };
}

function authenticateUid(uidValue) {
  const cardUid = normalizeUid(uidValue);
  const location = elements.scanLocation.value;
  if (!cardUid) {
    showToast("Enter a Card UID before authentication.");
    return;
  }

  const user = users.find(record => record.cardUid === cardUid);
  const decision = evaluateAccess(user, location);
  const now = new Date();
  const log = {
    time: now.toISOString(),
    displayTime: formatTime(now),
    cardUid,
    userName: user ? user.fullName : "Unknown",
    accessLevel: user ? user.accessLevel : "-",
    location,
    result: decision.result,
    reason: decision.reason
  };

  logs.unshift(log);
  saveLogs();
  renderAll();
  renderScanResult(log, user);
  showToast(`Scan completed: Access ${log.result}.`);
}

function renderScanResult(log, user) {
  if (log.result === "Granted") {
    elements.scanResult.className = "scan-result result-granted";
    elements.scanResult.innerHTML = `
      <p class="result-title">ACCESS GRANTED</p>
      <div class="result-grid">
        <div><span>User Name</span><strong>${escapeHtml(user.fullName)}</strong></div>
        <div><span>ID</span><strong>${escapeHtml(user.personId)}</strong></div>
        <div><span>Department</span><strong>${escapeHtml(user.department)}</strong></div>
        <div><span>Access Level</span><strong>${escapeHtml(user.accessLevel)}</strong></div>
        <div><span>Location</span><strong>${escapeHtml(log.location)}</strong></div>
        <div><span>Card UID</span><strong>${escapeHtml(user.cardUid)}</strong></div>
        <div><span>Time</span><strong>${escapeHtml(log.displayTime)}</strong></div>
      </div>
    `;
    return;
  }

  elements.scanResult.className = "scan-result result-denied";
  elements.scanResult.innerHTML = `
    <p class="result-title">ACCESS DENIED</p>
    <div class="result-grid">
      <div><span>Card UID</span><strong>${escapeHtml(log.cardUid)}</strong></div>
      <div><span>User</span><strong>${escapeHtml(log.userName)}</strong></div>
      <div><span>Access Level</span><strong>${escapeHtml(log.accessLevel)}</strong></div>
      <div><span>Location</span><strong>${escapeHtml(log.location)}</strong></div>
      <div><span>Reason</span><strong>${escapeHtml(log.reason)}</strong></div>
      <div><span>Time</span><strong>${escapeHtml(log.displayTime)}</strong></div>
    </div>
  `;
}

function simulateRandomScan() {
  const registeredUids = users.map(user => user.cardUid);
  const uidPool = [...registeredUids, ...demoUnknownUids, generateUid()];
  const randomUid = uidPool[Math.floor(Math.random() * uidPool.length)];
  elements.scanUid.value = randomUid;
  authenticateUid(randomUid);
}

function clearLogs() {
  logs = [];
  saveLogs();
  elements.scanResult.className = "scan-result empty-state";
  elements.scanResult.textContent = "Waiting for NFC card scan...";
  renderAll();
  showToast("Access logs cleared.");
}

function updateCardStatus(index, status) {
  users[index].status = status;
  saveUsers();
  renderAll();
  showToast(`Card status updated to ${status}.`);
}

function deleteUser(index) {
  const removed = users.splice(index, 1)[0];
  saveUsers();
  renderAll();
  showToast(`${removed.fullName} was deleted from registered cards.`);
}

function handleUserAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const index = Number(button.dataset.index);
  const action = button.dataset.action;

  if (action === "block") {
    updateCardStatus(index, "Blocked");
  }

  if (action === "activate") {
    updateCardStatus(index, "Active");
  }

  if (action === "delete") {
    deleteUser(index);
  }
}

function handleLogin(event) {
  event.preventDefault();
  const username = elements.loginUsername.value.trim();
  const password = elements.loginPassword.value;

  if (username === "admin" && password === "admin123") {
    sessionStorage.setItem(storageKeys.loggedIn, "true");
    showDashboard();
    showToast("Login successful.");
    return;
  }

  elements.loginError.textContent = "Invalid username or password.";
}

function showDashboard() {
  elements.loginScreen.classList.add("hidden");
  elements.appShell.classList.remove("hidden");
}

function initializeLoginState() {
  if (sessionStorage.getItem(storageKeys.loggedIn) === "true") {
    showDashboard();
  }
}

function setActiveNavLink() {
  const sections = document.querySelectorAll(".section");
  const navLinks = document.querySelectorAll(".nav-link");
  let activeId = "dashboard";

  sections.forEach(section => {
    const box = section.getBoundingClientRect();
    if (box.top <= 130 && box.bottom >= 130) {
      activeId = section.id;
    }
  });

  navLinks.forEach(link => {
    link.classList.toggle("active", link.getAttribute("href") === `#${activeId}`);
  });
}

document.getElementById("generateUidBtn").addEventListener("click", () => {
  elements.cardUid.value = generateUid();
});

document.getElementById("authenticateBtn").addEventListener("click", () => {
  authenticateUid(elements.scanUid.value);
});

document.getElementById("randomScanBtn").addEventListener("click", simulateRandomScan);
document.getElementById("clearLogsBtn").addEventListener("click", clearLogs);
elements.registerForm.addEventListener("submit", registerCard);
elements.usersTable.addEventListener("click", handleUserAction);
elements.loginForm.addEventListener("submit", handleLogin);
window.addEventListener("scroll", setActiveNavLink);

initializeLoginState();
renderAll();
setActiveNavLink();

