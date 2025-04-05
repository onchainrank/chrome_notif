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
  let token = ""; // Global variable to hold the API key token

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

  // Retrieve saved API key (if any) and store it in the global token variable
  chrome.storage.sync.get("apiKey", (data) => {
    if (data && data.apiKey) {
      token = data.apiKey;
      apiKeyInput.value = data.apiKey;
      updateApiKeyStatus(data.apiKey);
    }
  });

  // Save API key on button click, update the global token, and clear the input field
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

  // Function to connect to the onchainrank server using the token as part of auth options
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
