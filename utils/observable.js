class Observable {
    constructor(initialValue) {
        this._value = initialValue;
        this._subscribers = new Map(); // Using Map to store subscriber callbacks with their IDs
        this._nextId = 0; // For generating unique subscription IDs
    }

    // Get the current value
    get value() {
        return this._value;
    }

    // Set a new value and notify all subscribers
    set value(newValue) {
        this._value = newValue;
        this._notifySubscribers();
    }

    // Subscribe to changes - returns a subscription ID that can be used to unsubscribe
    subscribe(callback) {
        const id = this._nextId++;
        this._subscribers.set(id, callback);

        // Immediately call the callback with the current value
        // callback(this._value);

        // Return an unsubscribe function
        return {
            unsubscribe: () => this.unsubscribe(id),
        };
    }

    // Unsubscribe from changes
    unsubscribe(id) {
        return this._subscribers.delete(id);
    }

    // Notify all subscribers with the current value
    _notifySubscribers() {
        for (const callback of this._subscribers.values()) {
            callback(this._value);
        }
    }
}
