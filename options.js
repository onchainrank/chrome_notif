// options.js

document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const statusEl = document.getElementById("status");
  const notifyCountEl = document.getElementById("notifyCount");
  const toggleButton = document.getElementById("toggleConnect");
  const apiKeyInput = document.getElementById("apiKey");
  const saveButton = document.getElementById("saveApiKey");
  const saveMessageEl = document.getElementById("saveMessage");
  const apiKeyStatusEl = document.getElementById("apiKeyStatus");
  const openWebsiteCheckbox = document.getElementById("openWebsite");
  const openXcomCheckbox = document.getElementById("openXcom");
  const openOnlyUniqueCb = document.getElementById("openOnlyUnique");
  const bullxTableBody = document.querySelector("#bullxTable tbody");
  const openValidLaunchCb = document.getElementById("openValidLaunch");
  const ignoreFreshWalletCb = document.getElementById("ignoreFreshWallet");
  const volumeSlider = document.getElementById("volumeSlider");
  const volumeValue = document.getElementById("volumeValue");

  // State
  let notifyCounter = 0;
  let socket = null;
  let token = "";
  const bullxSet = new Set();
  const audio = new Audio("notif.wav");

  // Initialize button state
  toggleButton.textContent = "Connect";
  toggleButton.className = "connect";

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
    ["apiKey", "openWebsite", "openXcom", "openOnlyUnique", "openValidLaunch", "ignoreFreshWallet", "notificationVolume"],
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
      if (typeof data.ignoreFreshWallet === "boolean")
        ignoreFreshWalletCb.checked = data.ignoreFreshWallet;
      
      // Load volume setting
      const volume = data.notificationVolume !== undefined ? data.notificationVolume : 50;
      volumeSlider.value = volume;
      volumeValue.textContent = volume;
      audio.volume = volume / 100;
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
  ignoreFreshWalletCb.addEventListener("change", () => {
    chrome.storage.sync.set({ ignoreFreshWallet: ignoreFreshWalletCb.checked });
  });

  // Volume slider event listener
  volumeSlider.addEventListener("input", () => {
    const volume = volumeSlider.value;
    volumeValue.textContent = volume;
    audio.volume = volume / 100;
    chrome.storage.sync.set({ notificationVolume: parseInt(volume) });
  });

  // Connect to onchainrank server
  function connectSocket() {
    statusEl.textContent = "Connecting to onchainrank server...";
    statusEl.style.color = "";

    socket = io("https://ws.onchainrank.com", {
      query: { token },
    });

    socket.on("connect", () => {
      statusEl.textContent = "Connected to onchainrank server";
      statusEl.style.color = "green";
      toggleButton.textContent = "Disconnect";
      toggleButton.className = "disconnect";
    });

    socket.on("disconnect", () => {
      statusEl.textContent = "Disconnected from onchainrank server";
      statusEl.style.color = "red";
      toggleButton.textContent = "Connect";
      toggleButton.className = "connect";
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
      // Filter fresh wallet launches if needed
      if (ignoreFreshWalletCb.checked && msg.fresh_creator_wallet === true) {
        console.log("Skipped fresh wallet launch event", msg);
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
  toggleButton.addEventListener("click", function () {
    if (this.textContent === "Connect") {
      connectSocket();
    } else if (socket) {
      socket.disconnect();
      socket = null;
      statusEl.textContent = "Disconnected from onchainrank server";
      statusEl.style.color = "black";
      this.textContent = "Connect";
      this.className = "connect";
    }
  });
});
