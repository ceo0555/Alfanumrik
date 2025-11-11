// A simple, lightweight event emitter for app-wide communication.

type EventHandler = (data?: any) => void;

class EventBus {
  private events: { [key: string]: EventHandler[] } = {};

  /**
   * Subscribes to an event.
   * @param event The name of the event.
   * @param callback The function to call when the event is emitted.
   */
  on(event: string, callback: EventHandler): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  /**
   * Unsubscribes from an event.
   * @param event The name of the event.
   * @param callback The function to remove.
   */
  off(event: string, callback: EventHandler): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  /**
   * Emits an event, calling all subscribed callbacks.
   * @param event The name of the event to emit.
   * @param data Optional data to pass to the callbacks.
   */
  emit(event: string, data?: any): void {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (e) {
        console.error(`Error in event handler for ${event}:`, e);
      }
    });
  }
}

export const appEventBus = new EventBus();
