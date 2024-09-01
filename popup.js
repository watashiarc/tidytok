document.addEventListener('DOMContentLoaded', function () {
  initializeDateTimeInput();
  initializeSetReminderButton();
  initializePurgeButton();

  // Load reminders when the popup is opened
  loadReminders();
});

/******************************************************
 * SECTION: UI Setup Functions
 * ----------------------------------------------------
 * Description: Functions related to setting up UI components like date-time input and event listeners.
 ******************************************************/

 function initializeDateTimeInput() {
  const reminderDateTimeInput = document.getElementById('reminderDateTime');
  const now = new Date();
  const defaultDateTime = formatDateTime(now);
  reminderDateTimeInput.value = defaultDateTime;
}

function initializeSetReminderButton() {
  const setReminderButton = document.getElementById('setReminder');
  setReminderButton.addEventListener('click', setReminder);
}

function initializePurgeButton() {
  const purgeButton = document.getElementById('purgeDuplicates');
  purgeButton.addEventListener('click', purgeDuplicateTabs);
}

/******************************************************
 * SECTION: Utility Functions
 * ----------------------------------------------------
 * Description: Helper functions for general tasks like formatting dates.
 ******************************************************/

function formatDateTime(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/******************************************************
 * SECTION: Reminders Management
 * ----------------------------------------------------
 * Description: Functions related to managing reminders.
 ******************************************************/

function loadReminders() {
  // Send a message to the background script to get the list of reminders
  chrome.runtime.sendMessage({ action: 'getReminders' }, function (reminders) {
    displayReminders(reminders);
  });
}

function displayReminders(reminders) {
  // Clear existing reminders
  reminderList.innerHTML = "";

  // Display each reminder in the list
  Object.entries(reminders).forEach(([url, reminder]) => {
    const { title, reminderDateTime } = reminder;
    const localReminder = new Date(reminderDateTime).toLocaleString();
    const listItem = document.createElement('li');

    // Create a container for the reminder content and actions
    const reminderContent = document.createElement('div');

    // Display the reminder content
    reminderContent.textContent = `Reminder for ${title}: ${localReminder}`;

    // Create icons for editing and deleting reminders
    const editIcon = document.createElement('span');
    editIcon.innerHTML = '&#9998;'; // Unicode for a pencil icon
    editIcon.className = 'action-icon';
    editIcon.addEventListener('click', function () {
      // Implement edit functionality or make it clickable
      console.log('Edit clicked for', url, 'at', reminder);
    });

    const deleteIcon = document.createElement('span');
    deleteIcon.innerHTML = '&#128465;'; // Unicode for a trash bin icon
    deleteIcon.className = 'action-icon';
    deleteIcon.addEventListener('click', function () {
      // Delete the reminder and reload the list
      deleteReminder(url);
    });

    // Append icons to the reminder content
    reminderContent.appendChild(editIcon);
    reminderContent.appendChild(deleteIcon);

    // Append the reminder content to the list item
    listItem.appendChild(reminderContent);

    // Append the list item to the reminder list
    reminderList.appendChild(listItem);
  });
}

function setReminder() {
  const reminderDateTimeInput = document.getElementById('reminderDateTime');
  const reminderDateTime = reminderDateTimeInput.value;
 
  // Use chrome.tabs.query to get information about the current active tab
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      // Check if there is at least one tab
      if (tabs.length > 0) {
          const currentTab = tabs[0];
          const url = currentTab.url;
          const title = currentTab.title;

          // Send a message to the background script to set the reminder
          // ? setReminder(url, title, reminderDateTime);
          chrome.runtime.sendMessage({ action: 'setReminder', url, title, reminderDateTime }, function () {
            // Reload the list of reminders
            loadReminders();
          });
      } else {
          console.error('No active tab found.');
      }
  });
}

function deleteReminder(url) {
  // Send a message to the background script to delete the reminder
  chrome.runtime.sendMessage({ action: 'deleteReminder', url }, function () {
    // Reload the list of reminders
    loadReminders();
  });
}

/******************************************************
 * SECTION: Duplicate Tab Management
 * ----------------------------------------------------
 * Description: Functions related to managing and purging duplicate tabs.
 ******************************************************/

 function purgeDuplicateTabs() {
  chrome.tabs.query({}, function (tabs) {
      const tabsToClose = findDuplicateTabs(tabs);
      closeTabs(tabsToClose);
  });
}

function findDuplicateTabs(tabs) {
  const seenUrls = new Map();
  const tabsToClose = [];

  for (let i = tabs.length - 1; i >= 0; i--) {
    const tab = tabs[i];

     // Check if the current tab is the active tab
     if (tab.active) {
      activeTabId = tab.id;
    }

    if (seenUrls.has(tab.url)) {
      const existingTabId = seenUrls.get(tab.url);

      // If the current tab is the active one, mark the previous one for closure instead
      if (tab.id === activeTabId) {
          tabsToClose.push(existingTabId);
          seenUrls.set(tab.url, tab.id); // Update to keep the active tab
      } else {
          tabsToClose.push(tab.id);
      }
    } else {
        seenUrls.set(tab.url, tab.id);
    }
  }

  return tabsToClose;
}

function closeTabs(tabsToClose) {
  chrome.tabs.remove(tabsToClose, function () {
      const purgedCount = tabsToClose.length;
      notifyTabsPurged(purgedCount);
      recordPurgeDate();
  });
}

function notifyTabsPurged(count) {
  chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Duplicate Tabs Purged',
      message: `Removed ${count} duplicate tab(s).`,
  });
}

function recordPurgeDate() {
  const currentDate = new Date();
  localStorage.setItem('lastPurgeDate', currentDate.toISOString());
  displayLastPurgeDate();
}

function displayLastPurgeDate() {
  const lastPurgeDateElement = document.getElementById('lastPurgeDate');
  const lastPurgeDate = localStorage.getItem('lastPurgeDate');
  lastPurgeDateElement.textContent = lastPurgeDate ? new Date(lastPurgeDate).toLocaleString() : 'N/A';
}