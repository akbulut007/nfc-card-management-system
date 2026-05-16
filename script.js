const defaultUsers = [
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

const rules = {
  Student: ["Main Entrance", "Library"],
  Employee: ["Main Entrance", "Library", "Laboratory"],
  Admin: ["Main Entrance", "Library", "Laboratory", "Server Room"],
  Guest: ["Main Entrance"]
};

let users = JSON.parse(localStorage.getItem("users")) || defaultUsers;
let logs = JSON.parse(localStorage.getItem("logs")) || [];

function saveData() {
  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("logs", JSON.stringify(logs));
}

function get(id) {
  return document.getElementById(id);
}

function cleanUid(uid) {
  return uid.trim().toUpperCase().replaceAll(" ", "");
}

function makeUid() {
  const chars = "0123456789ABCDEF";
  let uid = "";

  for (let i = 0; i < 8; i++) {
    uid += chars[Math.floor(Math.random() * chars.length)];
  }

  return uid;
}

function showMessage(text) {
  const toast = get("toast");
  toast.textContent = text;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

function todayOnly(log) {
  const logDate = new Date(log.time);
  const today = new Date();

  return (
    logDate.getDate() === today.getDate() &&
    logDate.getMonth() === today.getMonth() &&
    logDate.getFullYear() === today.getFullYear()
  );
}

function badge(text) {
  if (text === "Granted") {
    return `<span class="badge badge-granted">Granted</span>`;
  }

  if (text === "Denied") {
    return `<span class="badge badge-denied">Denied</span>`;
  }

  return `<span class="badge badge-neutral">${text}</span>`;
}

function statusBadge(status) {
  return `<span class="badge badge-${status.toLowerCase()}">${status}</span>`;
}

function updateDashboard() {
  const todayLogs = logs.filter(todayOnly);

  get("totalUsers").textContent = users.length;
  get("registeredCards").textContent = users.length;
  get("activeCards").textContent = users.filter(user => user.status === "Active").length;
  get("grantedToday").textContent = todayLogs.filter(log => log.result === "Granted").length;
  get("deniedToday").textContent = todayLogs.filter(log => log.result === "Denied").length;

  const last = logs[0];

  if (!last) {
    get("latestUid").textContent = "-";
    get("latestUser").textContent = "-";
    get("latestResult").textContent = "-";
    get("latestLocation").textContent = "-";
    get("latestTime").textContent = "-";
    get("latestStatus").textContent = "No scan yet";
    get("latestStatus").className = "badge badge-neutral";
    return;
  }

  get("latestUid").textContent = last.cardUid;
  get("latestUser").textContent = last.userName;
  get("latestResult").textContent = last.result;
  get("latestLocation").textContent = last.location;
  get("latestTime").textContent = last.displayTime;
  get("latestStatus").textContent = last.result;
  get("latestStatus").className =
    last.result === "Granted" ? "badge badge-granted" : "badge badge-denied";
}

function showUsers() {
  const table = get("usersTable");

  table.innerHTML = users.map((user, index) => {
    return `
      <tr>
        <td>${user.fullName}</td>
        <td>${user.personId}</td>
        <td>${user.department}</td>
        <td>${user.accessLevel}</td>
        <td><strong>${user.cardUid}</strong></td>
        <td>${statusBadge(user.status)}</td>
        <td>
          <div class="action-group">
            <button class="small-btn secondary-btn" onclick="blockCard(${index})">Block</button>
            <button class="small-btn primary-btn" onclick="activateCard(${index})">Activate</button>
            <button class="small-btn danger-btn" onclick="deleteCard(${index})">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  get("userCountLabel").textContent = users.length + " records";
}

function showLogs() {
  const table = get("logsTable");

  if (logs.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="7" class="muted">No access logs yet.</td>
      </tr>
    `;
    return;
  }

  table.innerHTML = logs.map(log => {
    return `
      <tr>
        <td>${log.displayTime}</td>
        <td><strong>${log.cardUid}</strong></td>
        <td>${log.userName}</td>
        <td>${log.accessLevel}</td>
        <td>${log.location}</td>
        <td>${badge(log.result)}</td>
        <td>${log.reason}</td>
      </tr>
    `;
  }).join("");
}

function refreshPage() {
  showUsers();
  showLogs();
  updateDashboard();
}

function registerCard(event) {
  event.preventDefault();

  const user = {
    fullName: get("fullName").value.trim(),
    personId: get("personId").value.trim(),
    department: get("department").value.trim(),
    accessLevel: get("accessLevel").value,
    status: get("cardStatus").value,
    cardUid: cleanUid(get("cardUid").value)
  };

  if (!user.fullName || !user.personId || !user.department || !user.cardUid) {
    showMessage("Please fill all fields.");
    return;
  }

  const alreadyExists = users.some(item => item.cardUid === user.cardUid);

  if (alreadyExists) {
    showMessage("This UID is already registered.");
    return;
  }

  users.push(user);
  saveData();

  get("registerForm").reset();
  refreshPage();
  showMessage("Card registered.");
}

function checkAccess(user, location) {
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

  if (!rules[user.accessLevel].includes(location)) {
    return {
      result: "Denied",
      reason: "Access level not allowed for this location"
    };
  }

  return {
    result: "Granted",
    reason: "Card is active and permission is valid"
  };
}

function scanCard(uidInput) {
  const cardUid = cleanUid(uidInput);
  const location = get("scanLocation").value;

  if (!cardUid) {
    showMessage("Enter a card UID.");
    return;
  }

  const user = users.find(item => item.cardUid === cardUid);
  const decision = checkAccess(user, location);
  const now = new Date();

  const log = {
    time: now.toISOString(),
    displayTime: now.toLocaleString(),
    cardUid: cardUid,
    userName: user ? user.fullName : "Unknown",
    accessLevel: user ? user.accessLevel : "-",
    location: location,
    result: decision.result,
    reason: decision.reason
  };

  logs.unshift(log);
  saveData();
  refreshPage();
  showScanResult(log, user);
  showMessage("Scan completed.");
}

function showScanResult(log, user) {
  const box = get("scanResult");

  if (log.result === "Granted") {
    box.className = "scan-result result-granted";
    box.innerHTML = `
      <p class="result-title">ACCESS GRANTED</p>
      <div class="result-grid">
        <div><span>User</span><strong>${user.fullName}</strong></div>
        <div><span>ID</span><strong>${user.personId}</strong></div>
        <div><span>Department</span><strong>${user.department}</strong></div>
        <div><span>Access Level</span><strong>${user.accessLevel}</strong></div>
        <div><span>Location</span><strong>${log.location}</strong></div>
        <div><span>UID</span><strong>${user.cardUid}</strong></div>
        <div><span>Time</span><strong>${log.displayTime}</strong></div>
      </div>
    `;
  } else {
    box.className = "scan-result result-denied";
    box.innerHTML = `
      <p class="result-title">ACCESS DENIED</p>
      <div class="result-grid">
        <div><span>UID</span><strong>${log.cardUid}</strong></div>
        <div><span>User</span><strong>${log.userName}</strong></div>
        <div><span>Location</span><strong>${log.location}</strong></div>
        <div><span>Reason</span><strong>${log.reason}</strong></div>
        <div><span>Time</span><strong>${log.displayTime}</strong></div>
      </div>
    `;
  }
}

function randomScan() {
  const unknownCards = ["91AB20FF", "CC8102D4", "70EF4A99"];
  const knownCards = users.map(user => user.cardUid);
  const allCards = knownCards.concat(unknownCards);

  const randomUid = allCards[Math.floor(Math.random() * allCards.length)];

  get("scanUid").value = randomUid;
  scanCard(randomUid);
}

function clearLogs() {
  logs = [];
  saveData();

  get("scanResult").className = "scan-result empty-state";
  get("scanResult").textContent = "Waiting for card scan...";

  refreshPage();
  showMessage("Logs cleared.");
}

function blockCard(index) {
  users[index].status = "Blocked";
  saveData();
  refreshPage();
  showMessage("Card blocked.");
}

function activateCard(index) {
  users[index].status = "Active";
  saveData();
  refreshPage();
  showMessage("Card activated.");
}

function deleteCard(index) {
  users.splice(index, 1);
  saveData();
  refreshPage();
  showMessage("Card deleted.");
}

function login(event) {
  event.preventDefault();

  const username = get("loginUsername").value.trim();
  const password = get("loginPassword").value;

  if (username === "admin" && password === "admin123") {
    get("loginScreen").classList.add("hidden");
    get("appShell").classList.remove("hidden");
    sessionStorage.setItem("loggedIn", "yes");
  } else {
    get("loginError").textContent = "Wrong username or password.";
  }
}

function checkLogin() {
  if (sessionStorage.getItem("loggedIn") === "yes") {
    get("loginScreen").classList.add("hidden");
    get("appShell").classList.remove("hidden");
  }
}

get("loginForm").addEventListener("submit", login);
get("registerForm").addEventListener("submit", registerCard);

get("generateUidBtn").addEventListener("click", function () {
  get("cardUid").value = makeUid();
});

get("authenticateBtn").addEventListener("click", function () {
  scanCard(get("scanUid").value);
});

get("randomScanBtn").addEventListener("click", randomScan);
get("clearLogsBtn").addEventListener("click", clearLogs);

checkLogin();
saveData();
refreshPage();