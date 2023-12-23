export default class LinkOpener {
    static scheduleOpen(url, time) {
        setTimeout(() => {
            chrome.tabs.create({ url });
        }, time);
    }
}
