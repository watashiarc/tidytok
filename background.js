chrome.runtime.onInstalled.addListener(() => {
    // Create main context menu item
    chrome.contextMenus.create({
      id: "remindMeContextMenu",
      title: "Remind Me",
      contexts: ["page"]
    });
  
    // Create nested options under "Remind Me"
    chrome.contextMenus.create({
      id: "in1Hour",
      title: "In 1 Hour",
      parentId: "remindMeContextMenu",
      contexts: ["page"]
    });
  
    chrome.contextMenus.create({
      id: "tomorrow",
      title: "Tomorrow",
      parentId: "remindMeContextMenu",
      contexts: ["page"]
    });
  
    chrome.contextMenus.create({
      id: "nextWeek",
      title: "Next Week",
      parentId: "remindMeContextMenu",
      contexts: ["page"]
    });
  });
  
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
      case "in1Hour":
        handleContextMenuClick(tab, calculateNextHour());
        break;
  
      case "tomorrow":
        handleContextMenuClick(tab, calculateTomorrow());
        break;
  
      case "nextWeek":
        handleContextMenuClick(tab, calculateNextWeek());
        break;
  
      case "remindMeContextMenu":
        // Do something if the main context menu item is clicked
        break;
  
      default:
        break;
    }

    // Close the browser tab
    chrome.tabs.remove(tab.id);
    
    // Send a notification
    const title = tab.title;
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Reminder Notification',
      message: `${title} has been saved for later`,
    });
  });
  
  function handleContextMenuClick(tab, reminderDateTime) {
  // Get the current tab URL and title
  const url = tab.url;
  const title = tab.title;
  
    // Save the reminder to local storage
    chrome.storage.local.set({ [url]: { title, reminderDateTime } }, () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
      } else {
        console.log(`Reminder set for ${url} at ${reminderDateTime}`);
      }
    });
  }
  
  function calculateNextHour() {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toLocaleString().slice(0, 16);
  }
  
  function calculateTomorrow() {
    const now = new Date();
    now.setDate(now.getDate() + 1);
    return now.toLocaleString().slice(0, 10) + "T12:00";
  }
  
  function calculateNextWeek() {
    const now = new Date();
    now.setDate(now.getDate() + 7);
    return now.toLocaleString().slice(0, 10) + "T12:00";
  }
  
  // Listen for messages from the popup or content scripts
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'setReminder') {
      const { url, title, reminderDateTime } = request;
  
      // Save the reminder to local storage
      chrome.storage.local.set({ [url]: { title, reminderDateTime } }, () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
        } else {
          console.log(`Reminder set for ${url} at ${new Date(reminderDateTime).toLocaleString()}`);
        }
      });
    } else if (request.action === 'getReminders') {
      // Retrieve all reminders from local storage
      chrome.storage.local.get(null, function (reminders) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
        } else {
          // Convert reminder date to local format
          const localReminders = Object.fromEntries(
            Object.entries(reminders).map(([url, reminder]) => {
              const { title, reminderDateTime} = reminder;
              return [ url, { title, reminderDateTime: new Date(reminderDateTime).toLocaleString() }];
            })
          );
          sendResponse(localReminders);
        }
      });
  
      // Return true to indicate that the response will be sent asynchronously
      return true;
    } else if (request.action === 'deleteReminder') {
      const { url } = request;
  
      // Remove the reminder from local storage
      chrome.storage.local.remove(url, () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
        } else {
          console.log(`Reminder deleted for ${url}`);
        }
      });
    }
  });
  