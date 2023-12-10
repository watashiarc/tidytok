# TidyTok Chrome Extension

A Chrome extension that helps you manage your tabs better.

## Features

- Set reminders to revisit a web page in 1 hour, tomorrow, or next week.
- View a list of your active reminders.

## Installation

1. Clone this repository or download the ZIP file.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable "Developer mode" in the top right.
4. Click on "Load unpacked" and select the folder containing the extension files.

## Usage

1. Right-click on a webpage.
2. Select "Remind Me" and choose a time option.
3. The page will be saved, and a reminder will open the page at the specified time.

## Your Reminders

- The "Your Reminders" section in the extension popup displays a list of your active reminders.

## TODO

- **Management Options for Reminders**
  - [ ] Open the link associated with a reminder
  - [ ] Edit/reschedule a reminder
  - [ ] Paginate through reminders (put a limit on number of reminders per page)
  - [ ] Search through reminders
  - [ ] Open all reminders from a certain domain
  - [ ] Reminder groups (?)
  - [ ] Auto-remind (background auto-reminding -> tabs get closed and set to be reminded). Then have the ability to suggest reminders saved based on current browsing interest.
  - [ ] Export reminder data (maybe go cloud?)
  - [ ] Kill duplicate tabs and maybe have a setting to do this when dup tab is opened?

- **Better UX**
  - [ ] Improve the styling of the popup for better user experience.
  - [ ] Provide visual feedback when a reminder is successfully set.

- **Disable "Remind Me" Option**
  - [ ] If a reminder already exists for a page, disable the "Remind Me" option. Or show something to indicate it's already saved. Also do not send notification.
  - [ ] Instead, provide a right-click option to manage the existing reminder.

- **Notifications**
  - [ ] Send notification after some time (in case there's multiple remind mes to avoid spam)
  - [ ] Provide a setting to configure notifications
