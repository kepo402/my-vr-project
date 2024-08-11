// settings.js

export class EmulatorSettings {
    static instance = new EmulatorSettings();

    constructor() {
        // Initialize settings
        this.stereoOn = false; // Default value
    }

    // Method to save settings, e.g., to localStorage or a backend
    write() {
        // Example: Save to localStorage
        localStorage.setItem('stereoOn', JSON.stringify(this.stereoOn));
    }

    // Method to load settings, e.g., from localStorage or a backend
    load() {
        // Example: Load from localStorage
        const storedStereoOn = localStorage.getItem('stereoOn');
        if (storedStereoOn !== null) {
            this.stereoOn = JSON.parse(storedStereoOn);
        }
    }
}

// Initialize settings from storage
EmulatorSettings.instance.load();
