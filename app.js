// Main application logic

class TodoApp {
    constructor() {
        this.taskManager = null;
        this.ui = null;
        this.init();
    }

    init() {
        // Check for localStorage support
        if (!Storage.isAvailable()) {
            this.showStorageError();
            return;
        }

        // Initialize components
        this.taskManager = new TaskManager();
        this.ui = new UI(this.taskManager);

        // Add sample data if empty (for demo purposes)
        if (this.taskManager.tasks.length === 0) {
            this.addSampleTasks();
        }

        // Initialize keyboard shortcuts
        this.initKeyboardShortcuts();

        // Show welcome message
        setTimeout(() => {
            Utils.showNotification('Welcome to TaskFlow! Your tasks are loaded and ready.');
        }, 1000);
    }

    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N: Focus on new task input
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                document.getElementById('taskInput').focus();
            }
            
            // Ctrl/Cmd + F: Focus on search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }
            
            // Esc: Clear search or cancel edit
            if (e.key === 'Escape') {
                const searchInput = document.getElementById('searchInput');
                if (document.activeElement === searchInput && searchInput.value) {
                    searchInput.value = '';
                    this.ui.handleSearch();
                }
            }
        });
    }

    addSampleTasks() {
        const sampleTasks = [
            {
                text: "Welcome to TaskFlow! Click me to edit",
                priority: "high",
                category: "work",
                completed: false
            },
            {
                text: "Double-click to edit tasks",
                priority: "medium",
                category: "personal",
                completed: false
            },
            {
                text: "Try filtering by Active/Completed",
                priority: "low",
                category: "learning",
                completed: true
            },
            {
                text: "Set due dates and priorities",
                priority: "medium",
                category: "work",
                dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                completed: false
            },
            {
                text: "Export your tasks as JSON",
                priority: "low",
                category: "personal",
                completed: false
            }
        ];

        sampleTasks.forEach(task => {
            this.taskManager.createTask(
                task.text,
                task.priority,
                task.dueDate || null,
                task.category
            );
            
            if (task.completed) {
                const lastTask = this.taskManager.tasks[0];
                this.taskManager.toggleTaskCompletion(lastTask.id);
            }
        });
    }

    showStorageError() {
        const appContainer = document.querySelector('.app-container');
        appContainer.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>Storage Not Available</h2>
                <p>Your browser doesn't support localStorage or it's disabled.</p>
                <p>Please enable localStorage to use TaskFlow.</p>
                <button onclick="location.reload()" class="retry-btn">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
        
        // Add error styles
        const style = document.createElement('style');
        style.textContent = `
            .error-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                padding: 2rem;
                text-align: center;
                color: var(--text-primary);
            }
            
            .error-state i {
                font-size: 4rem;
                color: var(--danger-color);
                margin-bottom: 1.5rem;
            }
            
            .error-state h2 {
                font-family: 'Poppins', sans-serif;
                margin-bottom: 1rem;
                color: var(--danger-color);
            }
            
            .retry-btn {
                margin-top: 2rem;
                padding: 1rem 2rem;
                background: var(--primary-color);
                color: white;
                border: none;
                border-radius: var(--radius-md);
                cursor: pointer;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new TodoApp();
    
    // Make app available globally for debugging
    window.todoApp = app;
    
    // Log initialization
    console.log('TaskFlow initialized successfully!');
    console.log('Tasks loaded:', app.taskManager.tasks.length);
});