document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("status");
  const notifyCountEl = document.getElementById("notifyCount");
  const toggleCheckbox = document.getElementById("toggleConnect");
  let notifyCounter = 0;
  let socket = null;

  // Create an audio element
  const audio = new Audio("notif.wav");

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

      // Play sound on notify event
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

  // Toggle event listener
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
