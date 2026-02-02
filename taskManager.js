// Task CRUD operations

class TaskManager {
    constructor() {
        this.tasks = Storage.loadTasks();
        this.currentFilter = 'all';
        this.currentSort = 'date-desc';
        this.searchQuery = '';
        this.isLoading = false;
        this.init();
    }

    init() {
        // Load settings
        const settings = Storage.loadSettings();
        this.currentSort = settings.sortBy || 'date-desc';
        
        // Update stats
        this.updateStats();
        
        // Update storage info
        Storage.updateStorageUsage(this.tasks);
    }

    // Create a new task
    createTask(text, priority = 'medium', dueDate = null, category = 'personal') {
        if (!Utils.validateTask(text)) {
            Utils.showNotification('Task text is invalid!', 'error');
            return null;
        }

        const task = {
            id: Utils.generateId(),
            text: text.trim(),
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            priority: priority,
            dueDate: dueDate,
            category: category
        };

        this.tasks.unshift(task); // Add to beginning for newest first
        this.save();
        this.updateStats();
        
        Utils.showNotification('Task added successfully!');
        return task;
    }

    // Read tasks with filtering and sorting
    getTasks() {
        let filteredTasks = [...this.tasks];

        // Apply search filter
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filteredTasks = filteredTasks.filter(task =>
                task.text.toLowerCase().includes(query) ||
                task.category.toLowerCase().includes(query)
            );
        }

        // Apply status filter
        switch (this.currentFilter) {
            case 'active':
                filteredTasks = filteredTasks.filter(task => !task.completed);
                break;
            case 'completed':
                filteredTasks = filteredTasks.filter(task => task.completed);
                break;
            case 'today':
                filteredTasks = filteredTasks.filter(task =>
                    task.dueDate && Utils.isToday(task.dueDate)
                );
                break;
            case 'all':
            default:
                // No status filter
                break;
        }

        // Apply sorting
        switch (this.currentSort) {
            case 'date-asc':
                filteredTasks.sort((a, b) =>
                    new Date(a.createdAt) - new Date(b.createdAt)
                );
                break;
            case 'priority':
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                filteredTasks.sort((a, b) => {
                    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
                    if (priorityDiff !== 0) return priorityDiff;
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
                break;
            case 'due-date':
                filteredTasks.sort((a, b) => {
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });
                break;
            case 'date-desc':
            default:
                filteredTasks.sort((a, b) =>
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
                break;
        }

        return filteredTasks;
    }

    // Get task by ID
    getTask(id) {
        return this.tasks.find(task => task.id === id);
    }

    // Update task
    updateTask(id, updates) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        
        if (taskIndex === -1) {
            Utils.showNotification('Task not found!', 'error');
            return false;
        }

        const task = this.tasks[taskIndex];
        const updatedTask = {
            ...task,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        if (updates.text && !Utils.validateTask(updates.text)) {
            Utils.showNotification('Task text is invalid!', 'error');
            return false;
        }

        this.tasks[taskIndex] = updatedTask;
        this.save();
        this.updateStats();
        
        Utils.showNotification('Task updated successfully!');
        return true;
    }

    // Delete task
    async deleteTask(id) {
        const task = this.getTask(id);
        if (!task) return false;

        const settings = Storage.loadSettings();
        if (settings.confirmDelete) {
            const confirmed = await Utils.confirmAction(
                `Are you sure you want to delete "${task.text.substring(0, 30)}${task.text.length > 30 ? '...' : ''}"?`
            );
            if (!confirmed) return false;
        }

        const taskIndex = this.tasks.findIndex(task => task.id === id);
        this.tasks.splice(taskIndex, 1);
        this.save();
        this.updateStats();
        
        Utils.showNotification('Task deleted successfully!');
        return true;
    }

    // Toggle task completion
    toggleTaskCompletion(id) {
        const task = this.getTask(id);
        if (!task) return false;

        return this.updateTask(id, { completed: !task.completed });
    }

    // Mark all tasks as complete
    async markAllComplete() {
        const incompleteTasks = this.tasks.filter(task => !task.completed);
        
        if (incompleteTasks.length === 0) {
            Utils.showNotification('All tasks are already completed!');
            return false;
        }

        const confirmed = await Utils.confirmAction(
            `Mark all ${incompleteTasks.length} tasks as complete?`
        );
        
        if (!confirmed) return false;

        this.tasks = this.tasks.map(task => ({
            ...task,
            completed: true,
            updatedAt: new Date().toISOString()
        }));
        
        this.save();
        this.updateStats();
        Utils.showNotification('All tasks marked as complete!');
        return true;
    }

    // Clear completed tasks
    async clearCompleted() {
        const completedTasks = this.tasks.filter(task => task.completed);
        
        if (completedTasks.length === 0) {
            Utils.showNotification('No completed tasks to clear!');
            return false;
        }

        const confirmed = await Utils.confirmAction(
            `Clear ${completedTasks.length} completed tasks? This action cannot be undone.`
        );
        
        if (!confirmed) return false;

        this.tasks = this.tasks.filter(task => !task.completed);
        this.save();
        this.updateStats();
        Utils.showNotification('Completed tasks cleared!');
        return true;
    }

    // Set filter
    setFilter(filter) {
        this.currentFilter = filter;
        return this.getTasks();
    }

    // Set sort order
    setSort(sortBy) {
        this.currentSort = sortBy;
        
        // Save to settings
        const settings = Storage.loadSettings();
        settings.sortBy = sortBy;
        Storage.saveSettings(settings);
        
        return this.getTasks();
    }

    // Set search query
    setSearchQuery(query) {
        this.searchQuery = query;
        return this.getTasks();
    }

    // Update statistics
    updateStats() {
        const stats = Storage.getStorageStats();
        
        // Update UI elements
        document.getElementById('totalTasks').textContent = stats.total;
        document.getElementById('completedTasks').textContent = stats.completed;
        document.getElementById('pendingTasks').textContent = stats.pending;
        document.getElementById('todayTasks').textContent = stats.dueToday;
        
        // Update filtered count
        const filteredTasks = this.getTasks();
        document.getElementById('filteredCount').textContent = filteredTasks.length;
    }

    // Save tasks to storage
    save() {
        Storage.saveTasks(this.tasks);
    }

    // Export tasks
    exportTasks() {
        Utils.exportToJson(this.tasks);
    }

    // Import tasks
    async importTasks(file) {
        try {
            const importedTasks = await Utils.importFromJson(file);
            
            if (!Array.isArray(importedTasks)) {
                throw new Error('Invalid tasks format');
            }

            const confirmed = await Utils.confirmAction(
                `Import ${importedTasks.length} tasks? This will replace your current tasks.`
            );
            
            if (!confirmed) return false;

            this.tasks = importedTasks.map(task => ({
                id: task.id || Utils.generateId(),
                text: task.text || '',
                completed: Boolean(task.completed),
                createdAt: task.createdAt || new Date().toISOString(),
                updatedAt: task.updatedAt || new Date().toISOString(),
                priority: task.priority || 'medium',
                dueDate: task.dueDate || null,
                category: task.category || 'personal'
            }));
            
            this.save();
            this.updateStats();
            Utils.showNotification('Tasks imported successfully!');
            return true;
        } catch (error) {
            console.error('Error importing tasks:', error);
            Utils.showNotification('Error importing tasks: ' + error.message, 'error');
            return false;
        }
    }

    // Get tasks by category
    getTasksByCategory(category) {
        return this.tasks.filter(task => task.category === category);
    }

    // Get tasks by priority
    getTasksByPriority(priority) {
        return this.tasks.filter(task => task.priority === priority);
    }

    // Get overdue tasks
    getOverdueTasks() {
        const now = new Date();
        return this.tasks.filter(task => 
            !task.completed && 
            task.dueDate && 
            new Date(task.dueDate) < now
        );
    }
}