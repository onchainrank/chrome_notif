# onchainrank notifier

onchainrank notifier is a Chrome extension that connects to the onchainrank server using WebSockets (Socket.IO) to receive real-time notifications. It displays the connection status, counts notifications, plays a sound on each event, and opens URLs in new tabs when notifications are received. The extension also supports API key authentication.

## Features

- **Real-Time Notifications:**  
  Connects to the onchainrank server and listens for `"notify"` events.
- **Authentication:**  
  Sends an API key (as `auth-token`) with each connection request.

- **User Interface:**

  - Toggle button to enable or disable the connection.
  - Displays connection status (in green when connected).
  - Counts and displays the number of notification events received.
  - Plays a notification sound (`notif.wav`) on each event.
  - Automatically opens URLs received via notifications in a new tab.

- **API Key Management:**  
  Enter and save your API key using the input field. The saved key is persisted using Chrome's `chrome.storage.sync` and a portion (first 4 characters) is displayed for confirmation.

- **Usage Note:**  
  The extension operates only while the options tab remains open.

## Disclaimer

**Risk Warning:** Trading meme coins is highly speculative and involves significant risk.  
This extension is designed to provide general information about interesting meme coins only. It is not intended to be used as the sole signal for buying or selling coins. Users should perform their own due diligence and consider multiple sources of information before making any trading decisions.

## Installation

1. **Clone or Download the Repository:**  
   Ensure the following files are included in the extension folder:

   - `manifest.json`
   - `background.js`
   - `options.html`
   - `options.js`
   - `socket.io.min.js` (downloaded from a CDN)
   - `notif.wav` (notification sound file)
   - `logo.png` (logo image)

2. **Load the Extension in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable "Developer mode" (toggle in the upper-right corner).
   - Click "Load unpacked" and select the folder containing the extension.

## Usage

1. **Open the Options Page:**  
   Click the extension icon to display the options UI.

2. **Set Your API Key:**  
   Enter your API key into the provided input field and click **Save**. The first 4 characters of the key will appear next to the field for confirmation.

3. **Enable the Connection:**  
   Check the **Enable Connection** toggle to connect to the onchainrank server. When connected, the status message will appear in green.

4. **Notification Handling:**

   - When a `"notify"` event is received, a sound (`notif.wav`) plays.
   - The notification counter increments.
   - A new tab opens with the URL provided in the event.

5. **Disconnection Behavior:**  
   If the connection is lost, the extension displays a disconnected status, and the toggle checkbox is automatically unchecked.

## Customization

- **API Key:**  
  Update your API key as needed by entering a new value and clicking **Save**.

- **Notification Sound:**  
  Replace `notif.wav` with your preferred audio file (ensure the filename is updated in the code if you change it).

- **Server URL:**  
  If required, change the server URL in `options.js` (currently set to `https://api.onchainrank.com`).

## Troubleshooting

- **chrome.storage.sync Issues:**  
  Ensure the code runs in an extension context (e.g., options page) and that the `"storage"` permission is added to the manifest.

- **File Requirements:**  
  Verify that all required files (`socket.io.min.js`, `notif.wav`, `logo.png`) are present in the extension folder.

- **Connection Errors:**  
  Check the browser console for error messages if the connection to the onchainrank server fails.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For support or questions regarding onchainrank notifier, please contact [Your Contact Information] or visit the [Repository Link].
