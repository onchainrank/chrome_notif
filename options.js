document.addEventListener("DOMContentLoaded", () => {
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

  let notifyCounter = 0;
  let socket = null;
  let token = ""; // API key

  const audio = new Audio("notif.wav");

  // Show first‐4 + ellipsis
  const updateApiKeyStatus = (apiKey) => {
    apiKeyStatusEl.textContent = apiKey
      ? `Key: ${apiKey.substring(0, 4)}...`
      : "";
  };

  // Load saved settings
  chrome.storage.sync.get(
    ["apiKey", "openWebsite", "openXcom", "openOnlyUnique"],
    (data) => {
      if (data.apiKey) {
        token = data.apiKey;
        apiKeyInput.value = data.apiKey;
        updateApiKeyStatus(data.apiKey);
      }
      if (typeof data.openWebsite === "boolean")
        openWebsiteCheckbox.checked = data.openWebsite;
      if (typeof data.openXcom === "boolean")
        openXcomCheckbox.checked = data.openXcom;
      if (typeof data.openOnlyUnique === "boolean")
        openOnlyUniqueCb.checked = data.openOnlyUnique;
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
      setTimeout(() => (saveMessageEl.textContent = ""), 3000);
    });
  });

  // Save toggles
  openWebsiteCheckbox.addEventListener("change", () =>
    chrome.storage.sync.set({ openWebsite: openWebsiteCheckbox.checked })
  );
  openXcomCheckbox.addEventListener("change", () =>
    chrome.storage.sync.set({ openXcom: openXcomCheckbox.checked })
  );
  openOnlyUniqueCb.addEventListener("change", () =>
    chrome.storage.sync.set({ openOnlyUnique: openOnlyUniqueCb.checked })
  );

  // Connect logic
  const connectSocket = () => {
    statusEl.textContent = "Connecting to onchainrank server...";
    statusEl.style.color = "";

    socket = io("https://api.onchainrank.com", {
      query: { token },
    });

    socket.on("connect", () => {
      statusEl.textContent = "Connected to onchainrank server";
      statusEl.style.color = "green";
    });

    socket.on("disconnect", () => {
      statusEl.textContent = "Disconnected from onchainrank server";
      statusEl.style.color = "red";
      toggleCheckbox.checked = false;
    });

    socket.on("connect_error", (err) => {
      statusEl.textContent = `Connection error: ${err}`;
      statusEl.style.color = "red";
    });

    socket.on("notify", (msg) => {
      // If “open only unique” is on, skip events with valid_launch=true & unique_socials=false
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
      audio.play().catch(console.error);

      if (msg.url) {
        chrome.tabs.create({ url: msg.url });
      }
      if (msg.www && openWebsiteCheckbox.checked) {
        chrome.tabs.create({ url: msg.www });
      }
      if (msg.xcom && openXcomCheckbox.checked) {
        chrome.tabs.create({ url: msg.xcom });
      }
    });
  };

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
