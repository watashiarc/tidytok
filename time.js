export default class Time {
  static calculateNextHour() {
    const now = new Date();
    now.setHours(now.getHours() +1);
    return now.toLocaleString().slice(0, 16);
  }

  static calculateTomorrow() {
    const now = new Date();
    now.setDate(now.getDate() + 1);
    return now.toLocaleString().slice(0, 10) + "T12:00";
  }

  static calculateNextWeek() {
    const now = new Date();
    now.setDate(now.getDate() + 7);
    return now.toLocaleString().slice(0, 10) + "T12:00";
  }
}