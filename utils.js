// Utility functions

class Utils {
    // Generate unique ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Format date to readable string
    static formatDate(date) {
        const now = new Date();
        const taskDate = new Date(date);
        const diffInHours = Math.floor((now - taskDate) / (1000 * 60 * 60));
        
        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${diffInHours} hours ago`;
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return taskDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: taskDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }
    }

    // Format time
    static formatTime(date) {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Check if date is today
    static isToday(date) {
        const today = new Date();
        const checkDate = new Date(date);
        return today.toDateString() === checkDate.toDateString();
    }

    // Check if date is tomorrow
    static isTomorrow(date) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const checkDate = new Date(date);
        return tomorrow.toDateString() === checkDate.toDateString();
    }

    // Debounce function for search
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Validate task text
    static validateTask(text) {
        return text.trim().length > 0 && text.trim().length <= 1000;
    }

    // Get priority color class
    static getPriorityClass(priority) {
        switch (priority) {
            case 'high': return 'high';
            case 'medium': return 'medium';
            case 'low': return 'low';
            default: return 'medium';
        }
    }

    // Get priority label
    static getPriorityLabel(priority) {
        switch (priority) {
            case 'high': return 'High';
            case 'medium': return 'Medium';
            case 'low': return 'Low';
            default: return 'Medium';
        }
    }

    // Calculate storage usage
    static calculateStorageUsage(tasks) {
        const data = JSON.stringify(tasks);
        const size = new Blob([data]).size;
        return (size / 1024).toFixed(2) + 'KB';
    }

    // Show notification
    static showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const messageEl = notification.querySelector('.notification-message');
        
        // Set icon based on type
        const icon = notification.querySelector('i');
        icon.className = type === 'success' ? 'fas fa-check-circle' : 
                        type === 'error' ? 'fas fa-exclamation-circle' : 
                        'fas fa-info-circle';
        
        messageEl.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Confirm action
    static confirmAction(message) {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmationModal');
            const messageEl = document.getElementById('modalMessage');
            const cancelBtn = modal.querySelector('.cancel-btn');
            const confirmBtn = modal.querySelector('.confirm-btn');
            
            messageEl.textContent = message;
            modal.classList.add('show');
            
            const handleCancel = () => {
                modal.classList.remove('show');
                resolve(false);
                removeListeners();
            };
            
            const handleConfirm = () => {
                modal.classList.remove('show');
                resolve(true);
                removeListeners();
            };
            
            const removeListeners = () => {
                cancelBtn.removeEventListener('click', handleCancel);
                confirmBtn.removeEventListener('click', handleConfirm);
            };
            
            cancelBtn.addEventListener('click', handleCancel);
            confirmBtn.addEventListener('click', handleConfirm);
        });
    }

    // Export tasks to JSON file
    static exportToJson(tasks) {
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `tasks_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        Utils.showNotification('Tasks exported successfully!');
    }

    // Import tasks from JSON file
    static importFromJson(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const tasks = JSON.parse(event.target.result);
                    resolve(tasks);
                } catch (error) {
                    reject(new Error('Invalid JSON file'));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Error reading file'));
            };
            
            reader.readAsText(file);
        });
    }
}