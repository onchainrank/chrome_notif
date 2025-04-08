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
  let notifyCounter = 0;
  let socket = null;
  let token = ""; // holds the API key for auth

  // Create an audio element for sound notifications using notif.wav
  const audio = new Audio("notif.wav");

  // Function to update the API key status display
  const updateApiKeyStatus = (apiKey) => {
    if (apiKey && apiKey.length > 0) {
      apiKeyStatusEl.textContent = "Key: " + apiKey.substring(0, 4) + "...";
    } else {
      apiKeyStatusEl.textContent = "";
    }
  };

  // Retrieve saved API key and extra settings from storage
  chrome.storage.sync.get(["apiKey", "openWebsite", "openXcom"], (data) => {
    if (data) {
      if (data.apiKey) {
        token = data.apiKey;
        apiKeyInput.value = data.apiKey;
        updateApiKeyStatus(data.apiKey);
      }
      if (typeof data.openWebsite === "boolean") {
        openWebsiteCheckbox.checked = data.openWebsite;
      }
      if (typeof data.openXcom === "boolean") {
        openXcomCheckbox.checked = data.openXcom;
      }
    }
  });

  // Save API key on button click and update the token
  saveButton.addEventListener("click", () => {
    const apiKey = apiKeyInput.value.trim();
    chrome.storage.sync.set({ apiKey: apiKey }, () => {
      saveMessageEl.textContent = "API key saved!";
      token = apiKey;
      updateApiKeyStatus(apiKey);
      // Clear the input field after saving
      apiKeyInput.value = "";
      setTimeout(() => {
        saveMessageEl.textContent = "";
      }, 3000);
      console.log("API key saved:", apiKey);
    });
  });

  // Save extra settings when checkboxes are changed
  openWebsiteCheckbox.addEventListener("change", function () {
    chrome.storage.sync.set({ openWebsite: this.checked }, () => {
      console.log("Open website setting saved:", this.checked);
    });
  });

  openXcomCheckbox.addEventListener("change", function () {
    chrome.storage.sync.set({ openXcom: this.checked }, () => {
      console.log("Open X.com setting saved:", this.checked);
    });
  });

  // Function to connect to the onchainrank server using the token in auth options
  const connectSocket = () => {
    statusEl.textContent = "Connecting to onchainrank server...";
    statusEl.style.color = ""; // Reset color while connecting

    socket = io("https://api.onchainrank.com", {
      query: { token: token },
    });

    socket.on("connect", () => {
      statusEl.textContent = "Connected to onchainrank server";
      statusEl.style.color = "green";
    });

    socket.on("disconnect", () => {
      statusEl.textContent = "Disconnected from onchainrank server";
      statusEl.style.color = "red";
      // Uncheck the toggle checkbox when disconnected
      toggleCheckbox.checked = false;
    });

    socket.on("connect_error", (err) => {
      statusEl.textContent = "onchainrank server connection error: " + err;
      statusEl.style.color = "red";
    });

    // Listen for "notify" events from the onchainrank server
    socket.on("notify", (message) => {
      console.log("Notify event received from onchainrank server:", message);
      notifyCounter++;
      notifyCountEl.textContent = "Notify events received: " + notifyCounter;

      // Play notification sound
      audio.play().catch((err) => console.error("Error playing sound:", err));

      // Always open the main URL if provided
      if (message && message.url) {
        chrome.tabs.create({ url: message.url }, (tab) => {
          console.log("Opened URL tab:", tab);
        });
      } else {
        console.error("Received notify event without a valid 'url' field.");
      }

      // Open "www" link if available and the corresponding option is checked
      if (message && message.www && openWebsiteCheckbox.checked) {
        chrome.tabs.create({ url: message.www }, (tab) => {
          console.log("Opened website URL tab:", tab);
        });
      }

      // Open "xcom" link if available and the corresponding option is checked
      if (message && message.xcom && openXcomCheckbox.checked) {
        chrome.tabs.create({ url: message.xcom }, (tab) => {
          console.log("Opened X.com link tab:", tab);
        });
      }
    });
  };

  // Toggle event listener: connect/disconnect based on the toggle state
  toggleCheckbox.addEventListener("change", function () {
    if (this.checked) {
      // If toggle is on, establish the connection to the onchainrank server.
      connectSocket();
    } else {
      // If toggle is off, disconnect if the connection exists.
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      statusEl.textContent = "Disconnected from onchainrank server";
      statusEl.style.color = "black";
    }
  });
});
