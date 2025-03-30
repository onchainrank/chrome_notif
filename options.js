document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("status");
  const notifyCountEl = document.getElementById("notifyCount");
  const toggleCheckbox = document.getElementById("toggleConnect");
  const apiKeyInput = document.getElementById("apiKey");
  const saveButton = document.getElementById("saveApiKey");
  const saveMessageEl = document.getElementById("saveMessage");
  const apiKeyStatusEl = document.getElementById("apiKeyStatus");
  let notifyCounter = 0;
  let socket = null;

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

  // Retrieve saved API key (if any)
  chrome.storage.sync.get("apiKey", (data) => {
    if (data && data.apiKey) {
      updateApiKeyStatus(data.apiKey);
    }
  });

  // Save API key on button click
  saveButton.addEventListener("click", () => {
    const apiKey = apiKeyInput.value.trim();
    chrome.storage.sync.set({ apiKey: apiKey }, () => {
      saveMessageEl.textContent = "API key saved!";
      updateApiKeyStatus(apiKey);
      // Clear the input field after saving
      apiKeyInput.value = "";
      setTimeout(() => {
        saveMessageEl.textContent = "";
      }, 3000);
      console.log("API key saved:", apiKey);
    });
  });

  // Function to connect to the Socket.IO server
  const connectSocket = () => {
    statusEl.textContent = "Connecting...";
    socket = io("https://api.onchainrank.com");

    socket.on("connect", () => {
      statusEl.textContent = "Connected";
    });

    socket.on("disconnect", () => {
      statusEl.textContent = "Disconnected";
    });

    socket.on("connect_error", (err) => {
      statusEl.textContent = "Connection error: " + err;
    });

    // Listen for "notify" events from the server
    socket.on("notify", (message) => {
      console.log("Notify received:", message);
      notifyCounter++;
      notifyCountEl.textContent = "Notify events received: " + notifyCounter;

      // Play notification sound
      audio.play().catch((err) => console.error("Error playing sound:", err));

      if (message && message.url) {
        // Open the URL in a new tab using chrome.tabs API
        chrome.tabs.create({ url: message.url }, (tab) => {
          console.log("New tab opened:", tab);
        });
      } else {
        console.error("Received notify event without a valid 'url' field.");
      }
    });
  };

  // Toggle event listener: connect/disconnect based on the toggle state
  toggleCheckbox.addEventListener("change", function () {
    if (this.checked) {
      // If toggle is on, establish the WebSocket connection.
      connectSocket();
    } else {
      // If toggle is off, disconnect if the socket exists.
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      statusEl.textContent = "Disconnected";
    }
  });
});
