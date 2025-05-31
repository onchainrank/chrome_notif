// options.js

document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const statusEl = document.getElementById("status");
  const notifyCountEl = document.getElementById("notifyCount");
  const toggleCheckbox = document.getElementById("toggleConnect");
  const apiKeyInput = document.getElementById("apiKey");
  const saveButton = document.getElementById("saveApiKey");
  const saveMessageEl = document.getElementById("saveMessage");
  const apiKeyStatusEl = document.getElementById("apiKeyStatus");
  const openWebsiteCheckbox = document.getElementById("openWebsite");
  const openXcomCheckbox = document.getElementById("openXcom");
  const openOnlyUniqueCb = document.getElementById("openOnlyUnique");
  const bullxTableBody = document.querySelector("#bullxTable tbody");
  const openValidLaunchCb = document.getElementById("openValidLaunch");

  // State
  let notifyCounter = 0;
  let socket = null;
  let token = "";
  const bullxSet = new Set();
  const audio = new Audio("notif.wav");

  // Helpers
  function updateApiKeyStatus(apiKey) {
    if (apiKey) {
      apiKeyStatusEl.textContent = `Key: ${apiKey.substring(0, 4)}...`;
    } else {
      apiKeyStatusEl.textContent = "";
    }
  }

  function addBullxRow(url, name, symbol, date) {
    const tr = document.createElement("tr");
    // URL cell
    const tdUrl = document.createElement("td");
    const link = document.createElement("a");
    link.href = url;
    link.textContent = url;
    link.target = "_blank";
    tdUrl.appendChild(link);

    // Name (Symbol) cell
    const tdName = document.createElement("td");
    tdName.textContent = `${name} (${symbol})`;

    // Date cell
    const tdDate = document.createElement("td");
    tdDate.textContent = date;

    tr.append(tdUrl, tdName, tdDate);
    // Prepend new row
    bullxTableBody.insertBefore(tr, bullxTableBody.firstChild);
  }

  // Load saved API key and settings
  chrome.storage.sync.get(
    ["apiKey", "openWebsite", "openXcom", "openOnlyUnique", "openValidLaunch"],
    (data) => {
      if (data.apiKey) {
        token = data.apiKey;
        updateApiKeyStatus(data.apiKey);
      }
      if (typeof data.openWebsite === "boolean")
        openWebsiteCheckbox.checked = data.openWebsite;
      if (typeof data.openXcom === "boolean")
        openXcomCheckbox.checked = data.openXcom;
      if (typeof data.openOnlyUnique === "boolean")
        openOnlyUniqueCb.checked = data.openOnlyUnique;
      if (typeof data.openValidLaunch === "boolean")
        openValidLaunchCb.checked = data.openValidLaunch;
    }
  );

  // Save API key
  saveButton.addEventListener("click", () => {
    const apiKey = apiKeyInput.value.trim();
    chrome.storage.sync.set({ apiKey }, () => {
      token = apiKey;
      saveMessageEl.textContent = "API key saved!";
      updateApiKeyStatus(apiKey);
      apiKeyInput.value = "";
      setTimeout(() => {
        saveMessageEl.textContent = "";
      }, 3000);
    });
  });

  // Save extra settings
  openWebsiteCheckbox.addEventListener("change", () => {
    chrome.storage.sync.set({ openWebsite: openWebsiteCheckbox.checked });
  });
  openXcomCheckbox.addEventListener("change", () => {
    chrome.storage.sync.set({ openXcom: openXcomCheckbox.checked });
  });
  openOnlyUniqueCb.addEventListener("change", () => {
    chrome.storage.sync.set({ openOnlyUnique: openOnlyUniqueCb.checked });
  });
  openValidLaunchCb.addEventListener("change", () => {
    chrome.storage.sync.set({ openValidLaunch: openValidLaunchCb.checked });
  });

  // Connect to onchainrank server
  function connectSocket() {
    statusEl.textContent = "Connecting to onchainrank server...";
    statusEl.style.color = "";

    socket = io("https://api.onchainrank.com", {
      query: { token },
    });

    socket.on("connect", () => {
      statusEl.textContent = "Connected to onchainrank server";
      statusEl.style.color = "green";
      toggleCheckbox.checked = true;
    });

    socket.on("disconnect", () => {
      statusEl.textContent = "Disconnected from onchainrank server";
      statusEl.style.color = "red";
      toggleCheckbox.checked = false;
      console.log("disconnected from server");
    });

    socket.on("connect_error", (err) => {
      statusEl.textContent = `Connection error: ${err}`;
      statusEl.style.color = "red";
    });

    socket.on("notify", (msg) => {
      if (openValidLaunchCb.checked && !msg.valid_launch) {
        console.log("Skipped invalid launch event", msg);
        return;
      }
      // Filter non-unique if needed
      if (
        openOnlyUniqueCb.checked &&
        msg.valid_launch === true &&
        msg.unique_socials === false
      ) {
        console.log("Skipped non-unique event", msg);
        return;
      }

      notifyCounter++;
      notifyCountEl.textContent = `Notify events received: ${notifyCounter}`;

      // Main URL
      if (msg.url) {
        // Record & display unique Bullx URLs
        if (msg.url.includes("bullx") && !bullxSet.has(msg.url)) {
          chrome.tabs.create({ url: msg.url });
          const date = new Date().toLocaleString();
          bullxSet.add(msg.url);
          addBullxRow(
            msg.url,
            msg.name || "",
            msg.symbol || "",
            new Date().toLocaleString()
          );
          audio.play().catch(console.error);

          // Website URL
          if (msg.www && openWebsiteCheckbox.checked) {
            chrome.tabs.create({ url: msg.www });
          }
          // X.com URL
          if (msg.xcom && openXcomCheckbox.checked) {
            chrome.tabs.create({ url: msg.xcom });
          }
        }
      }
    });
  }

  // Toggle connect/disconnect
  toggleCheckbox.addEventListener("change", function () {
    if (this.checked) {
      connectSocket();
    } else if (socket) {
      socket.disconnect();
      socket = null;
      statusEl.textContent = "Disconnected from onchainrank server";
      statusEl.style.color = "black";
    }
  });
});
