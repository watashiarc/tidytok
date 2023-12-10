document.addEventListener('DOMContentLoaded', function () {
  const setReminderButton = document.getElementById('setReminder');
  const reminderList = document.getElementById('reminderList');
  const reminderDateTimeInput = document.getElementById('reminderDateTime');

  // Set the default value for the datetime-local input to the current date and time in local format
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');

  const defaultDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
  reminderDateTimeInput.value = defaultDateTime;

  // Add click event listener for setting a reminder
  setReminderButton.addEventListener('click', function () {
    const reminderDateTime = reminderDateTimeInput.value;
   
    // Use chrome.tabs.query to get information about the current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      // Check if there is at least one tab
      if (tabs.length > 0) {
        const currentTab = tabs[0];
        const url = currentTab.url;
        const title = currentTab.title;

        // Send a message to the background script to set the reminder
        chrome.runtime.sendMessage({ action: 'setReminder', url, title, reminderDateTime }, function () {
          // Reload the list of reminders
          loadReminders();
        });
      } else {
        console.error('No active tab found.');
      }
    });
  });

  // Load reminders when the popup is opened
  loadReminders();

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

  function deleteReminder(url) {
    // Send a message to the background script to delete the reminder
    chrome.runtime.sendMessage({ action: 'deleteReminder', url }, function () {
      // Reload the list of reminders
      loadReminders();
    });
  }

   // Add click event listener for purging duplicate tabs
   const purgeButton = document.getElementById('purgeDuplicates');
   purgeButton.addEventListener('click', purgeDuplicateTabs);
 
   // Load last purge date from local storage and display it
   const lastPurgeDateElement = document.getElementById('lastPurgeDate');
   const lastPurgeDate = localStorage.getItem('lastPurgeDate');
   lastPurgeDateElement.textContent = lastPurgeDate ? new Date(lastPurgeDate).toLocaleString() : 'N/A';
 
   // Function to purge duplicate tabs
   function purgeDuplicateTabs() {
     chrome.tabs.query({}, function (tabs) {
       // Sort tabs based on their index
       tabs.sort(function (a, b) {
         return a.index - b.index;
       });
 
       const seenUrls = {};
       const tabsToClose = [];
 
       // Iterate over tabs and identify duplicates
       tabs.forEach(function (tab) {
         if (seenUrls[tab.url]) {
           tabsToClose.push(tab.id);
         } else {
           seenUrls[tab.url] = true;
         }
       });
 
       // Close duplicate tabs
       chrome.tabs.remove(tabsToClose, function () {
         // Send a notification for the number of purged tabs
         const purgedCount = tabsToClose.length;
         chrome.notifications.create({
           type: 'basic',
           iconUrl: 'icons/icon48.png',
           title: 'Duplicate Tabs Purged',
           message: `Removed ${purgedCount} duplicate tab(s).`,
         });
 
         // Record the last purge date in local storage
         const currentDate = new Date();
         localStorage.setItem('lastPurgeDate', currentDate.toISOString());
         lastPurgeDateElement.textContent = currentDate.toLocaleString();
       });
     });
   }
});
