document.addEventListener('DOMContentLoaded', function () {
  UIManager.initialize();
  UIManager.loadReminders();
  TabManager.updateTabHealthReport();  // Update tab health report on load
});

/******************************************************
* SECTION: UI Manager
* ----------------------------------------------------
* Description: Handles the initialization of UI elements and event listeners.
******************************************************/
const UIManager = {
  initialize: function() {
      this.initializeDateTimeInput();
      this.initializeSetReminderButton();
      this.initializePurgeSection();
  },

  initializeDateTimeInput: function() {
      const reminderDateTimeInput = document.getElementById('reminderDateTime');
      const now = new Date();
      const defaultDateTime = Utility.formatDateTime(now);
      reminderDateTimeInput.value = defaultDateTime;
  },

  initializeSetReminderButton: function() {
      const setReminderButton = document.getElementById('setReminder');
      setReminderButton.addEventListener('click', ReminderManager.setReminder);
  },

  initializePurgeSection: function() {
      const lastPurgeDateElement = document.getElementById('lastPurgeDate');
      const lastPurgeDate = localStorage.getItem('lastPurgeDate');
      lastPurgeDateElement.textContent = lastPurgeDate ? new Date(lastPurgeDate).toLocaleString() : 'N/A';

      // Initiliaze purge button
      const purgeButton = document.getElementById('purgeDuplicates');
      purgeButton.addEventListener('click', TabManager.purgeDuplicateTabs);
  },

  loadReminders: function() {
    chrome.runtime.sendMessage({ action: 'getReminders' }, function (reminders) {
        UIManager.updateReminderList(reminders);
    });
  },

  updateReminderList: function(reminders) {
      const reminderList = document.getElementById('reminderList');
      reminderList.innerHTML = "";

      Object.entries(reminders).forEach(([url, reminder]) => {
          const { title, reminderDateTime } = reminder;
          const localReminder = new Date(reminderDateTime).toLocaleString();
          const listItem = document.createElement('li');

          const reminderContent = document.createElement('div');
          reminderContent.textContent = `Reminder for ${title}: ${localReminder}`;

          const editIcon = document.createElement('span');
          editIcon.innerHTML = '&#9998;';
          editIcon.className = 'action-icon';
          editIcon.addEventListener('click', function () {
              console.log('Edit clicked for', url, 'at', reminder);
          });

          const deleteIcon = document.createElement('span');
          deleteIcon.innerHTML = '&#128465;';
          deleteIcon.className = 'action-icon';
          deleteIcon.addEventListener('click', function () {
              ReminderManager.deleteReminder(url);
          });

          reminderContent.appendChild(editIcon);
          reminderContent.appendChild(deleteIcon);
          listItem.appendChild(reminderContent);
          reminderList.appendChild(listItem);
      });
  },

  updateTabHealthSection: function(tabsCount, duplicateTabsCount) {
    document.getElementById('tabsCount').textContent = tabsCount;
    document.getElementById('duplicateTabsCount').textContent = duplicateTabsCount;
  },
};

/******************************************************
* SECTION: Reminder Manager
* ----------------------------------------------------
* Description: Manages the loading, setting, and deleting of reminders.
******************************************************/
const ReminderManager = {
  setReminder: function() {
      const reminderDateTimeInput = document.getElementById('reminderDateTime');
      const reminderDateTime = reminderDateTimeInput.value;

      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          if (tabs.length > 0) {
              const currentTab = tabs[0];
              const url = currentTab.url;
              const title = currentTab.title;

              chrome.runtime.sendMessage({ action: 'setReminder', url, title, reminderDateTime }, function () {
                UIManager.loadReminders();
              });
          } else {
              console.error('No active tab found.');
          }
      });
  },

  deleteReminder: function(url) {
      chrome.runtime.sendMessage({ action: 'deleteReminder', url }, function () {
          UIManager.loadReminders();
      });
  }
};

/******************************************************
* SECTION: Tab Manager
* ----------------------------------------------------
* Description: Handles operations related to tab management, such as purging duplicates.
******************************************************/
const TabManager = {
  purgeDuplicateTabs: function() {
      chrome.tabs.query({}, function (tabs) {
          const tabsToClose = TabManager.findDuplicateTabs(tabs);
          TabManager.closeTabs(tabsToClose);
      });
  },

  findDuplicateTabs: function(tabs) {
      const seenUrls = new Map();
      const tabsToClose = [];
      let activeTabId = null;

      for (let i = 0; i < tabs.length; i++) {
          const tab = tabs[i];

          if (tab.active) {
              activeTabId = tab.id;
          }

          // Extract the URL path and query parameters (ignoring the fragment/hashtag)
          const url = new URL(tab.url);
          const urlWithoutHash = url.origin + url.pathname + url.search;

          if (seenUrls.has(urlWithoutHash)) {
              const existingTabId = seenUrls.get(urlWithoutHash);
              if (tab.id === activeTabId) {
                  tabsToClose.push(existingTabId);
                  seenUrls.set(urlWithoutHash, tab.id); // Update to keep the active tab
              } else {
                  tabsToClose.push(tab.id);
              }
          } else {
              seenUrls.set(urlWithoutHash, tab.id);
          }
      }

      return tabsToClose;
  },

  closeTabs: function(tabsToClose) {
      chrome.tabs.remove(tabsToClose, function () {
          const purgedCount = tabsToClose.length;
          TabManager.notifyTabsPurged(purgedCount);
          TabManager.recordPurgeDate();
      });
  },

  notifyTabsPurged: function(count) {
      chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Duplicate Tabs Purged',
          message: `Removed ${count} duplicate tab(s).`,
      });
  },

  recordPurgeDate: function() {
      const currentDate = new Date();
      localStorage.setItem('lastPurgeDate', currentDate.toISOString());
      TabManager.displayLastPurgeDate();
  },

  displayLastPurgeDate: function() {
      const lastPurgeDateElement = document.getElementById('lastPurgeDate');
      const lastPurgeDate = localStorage.getItem('lastPurgeDate');
      lastPurgeDateElement.textContent = lastPurgeDate ? new Date(lastPurgeDate).toLocaleString() : 'N/A';
  },

  // TODO: Optimize this so we can start tracking dupe tabs on load vs iterating it here and then also when we call purge dupes
  updateTabHealthReport: function() {
    chrome.tabs.query({}, function (tabs) {
        let duplicateTabsCount = 0;

        const seenUrls = new Map();
       
        for (let i = 0; i < tabs.length; i++) {
            const tab = tabs[i];

            const url = new URL(tab.url);
            const urlWithoutHash = url.origin + url.pathname + url.search;

            if (seenUrls.has(urlWithoutHash)) {
                duplicateTabsCount++;
            } else {
                seenUrls.set(urlWithoutHash, tab.id);
            }
        }

        UIManager.updateTabHealthSection(tabs.length, duplicateTabsCount);
    });
}
};

/******************************************************
* SECTION: Utility Functions
* ----------------------------------------------------
* Description: General helper functions for tasks like date formatting.
******************************************************/
const Utility = {
  formatDateTime: function(date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
};
