// LocalStorage handling

class Storage {
    static STORAGE_KEY = 'taskflow_tasks';
    static SETTINGS_KEY = 'taskflow_settings';

    // Save tasks to localStorage
    static saveTasks(tasks) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
            this.updateLastSaved();
            this.updateStorageUsage(tasks);
            return true;
        } catch (error) {
            console.error('Error saving tasks:', error);
            Utils.showNotification('Error saving tasks!', 'error');
            return false;
        }
    }

    // Load tasks from localStorage
    static loadTasks() {
        try {
            const tasksJson = localStorage.getItem(this.STORAGE_KEY);
            if (!tasksJson) return [];
            
            const tasks = JSON.parse(tasksJson);
            
            // Validate loaded data
            if (!Array.isArray(tasks)) {
                console.warn('Invalid tasks data, returning empty array');
                return [];
            }
            
            // Ensure all tasks have required fields
            return tasks.map(task => ({
                id: task.id || Utils.generateId(),
                text: task.text || '',
                completed: Boolean(task.completed),
                createdAt: task.createdAt || new Date().toISOString(),
                updatedAt: task.updatedAt || new Date().toISOString(),
                priority: task.priority || 'medium',
                dueDate: task.dueDate || null,
                category: task.category || 'personal'
            }));
        } catch (error) {
            console.error('Error loading tasks:', error);
            Utils.showNotification('Error loading tasks!', 'error');
            return [];
        }
    }

    // Save settings to localStorage
    static saveSettings(settings) {
        try {
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    // Load settings from localStorage
    static loadSettings() {
        try {
            const settingsJson = localStorage.getItem(this.SETTINGS_KEY);
            if (!settingsJson) return {
                theme: 'light',
                sortBy: 'date-desc',
                showCompleted: true,
                confirmDelete: true
            };
            
            return JSON.parse(settingsJson);
        } catch (error) {
            console.error('Error loading settings:', error);
            return {
                theme: 'light',
                sortBy: 'date-desc',
                showCompleted: true,
                confirmDelete: true
            };
        }
    }

    // Clear all tasks from localStorage
    static clearTasks() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            this.updateLastSaved();
            Utils.showNotification('All tasks cleared!');
            return true;
        } catch (error) {
            console.error('Error clearing tasks:', error);
            Utils.showNotification('Error clearing tasks!', 'error');
            return false;
        }
    }

    // Update last saved time display
    static updateLastSaved() {
        const lastSavedEl = document.getElementById('lastSaved');
        if (lastSavedEl) {
            const now = new Date();
            lastSavedEl.textContent = `Last saved: ${Utils.formatTime(now)}`;
        }
    }

    // Update storage usage display
    static updateStorageUsage(tasks) {
        const storageUsageEl = document.getElementById('storageUsage');
        if (storageUsageEl) {
            const usage = Utils.calculateStorageUsage(tasks);
            storageUsageEl.textContent = `Storage: ${usage}`;
        }
    }

    // Get storage statistics
    static getStorageStats() {
        const tasks = this.loadTasks();
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const pending = total - completed;
        
        const today = new Date().toISOString().split('T')[0];
        const dueToday = tasks.filter(task => 
            task.dueDate && 
            !task.completed && 
            task.dueDate.split('T')[0] === today
        ).length;
        
        return {
            total,
            completed,
            pending,
            dueToday
        };
    }

    // Check if localStorage is available
    static isAvailable() {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            console.error('LocalStorage is not available:', error);
            Utils.showNotification('LocalStorage is not available!', 'error');
            return false;
        }
    }

    // Backup tasks
    static backupTasks() {
        const tasks = this.loadTasks();
        const backup = {
            tasks: tasks,
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };
        
        try {
            localStorage.setItem(`${this.STORAGE_KEY}_backup_${Date.now()}`, JSON.stringify(backup));
            return true;
        } catch (error) {
            console.error('Error creating backup:', error);
            return false;
        }
    }

    // Restore from backup
    static restoreFromBackup(backupKey) {
        try {
            const backupJson = localStorage.getItem(backupKey);
            if (!backupJson) return false;
            
            const backup = JSON.parse(backupJson);
            if (backup.tasks && Array.isArray(backup.tasks)) {
                this.saveTasks(backup.tasks);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error restoring from backup:', error);
            return false;
        }
    }
}