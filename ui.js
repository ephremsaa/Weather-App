// DOM manipulation and UI rendering

class UI {
    constructor(taskManager) {
        this.taskManager = taskManager;
        this.init();
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.render();
        this.initDatePicker();
        this.loadSettings();
    }

    cacheDOM() {
        this.taskInput = document.getElementById('taskInput');
        this.addTaskBtn = document.getElementById('addTaskBtn');
        this.prioritySelect = document.getElementById('prioritySelect');
        this.dueDate = document.getElementById('dueDate');
        this.categorySelect = document.getElementById('categorySelect');
        this.tasksList = document.getElementById('tasksList');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.searchInput = document.getElementById('searchInput');
        this.sortSelect = document.getElementById('sortSelect');
        this.markAllCompleteBtn = document.getElementById('markAllComplete');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        this.themeToggleBtn = document.getElementById('themeToggle');
        this.exportBtn = document.getElementById('exportBtn');
        this.importBtn = document.getElementById('importBtn');
        this.importFile = document.getElementById('importFile');
        this.tasksTitle = document.getElementById('tasksTitle');
    }

    bindEvents() {
        // Add task events
        this.addTaskBtn.addEventListener('click', () => this.handleAddTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAddTask();
        });

        // Filter events
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilterChange(e));
        });

        // Search events
        this.searchInput.addEventListener('input', 
            Utils.debounce(() => this.handleSearch(), 300)
        );

        // Sort events
        this.sortSelect.addEventListener('change', () => this.handleSortChange());

        // Bulk action events
        this.markAllCompleteBtn.addEventListener('click', () => this.handleMarkAllComplete());
        this.clearCompletedBtn.addEventListener('click', () => this.handleClearCompleted());

        // Theme toggle
        this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());

        // Export/Import
        this.exportBtn.addEventListener('click', () => this.taskManager.exportTasks());
        this.importBtn.addEventListener('click', () => this.importFile.click());
        this.importFile.addEventListener('change', (e) => this.handleImport(e));

        // Event delegation for dynamic elements
        this.tasksList.addEventListener('click', (e) => this.handleTaskAction(e));
        this.tasksList.addEventListener('dblclick', (e) => this.handleTaskEdit(e));
        this.tasksList.addEventListener('keydown', (e) => this.handleEditKeydown(e));
        this.tasksList.addEventListener('focusout', (e) => this.handleEditBlur(e));
    }

    initDatePicker() {
        if (window.flatpickr) {
            flatpickr(this.dueDate, {
                dateFormat: "Y-m-d",
                minDate: "today",
                altInput: true,
                altFormat: "F j, Y",
                position: "auto",
                onChange: (selectedDates) => {
                    if (selectedDates.length > 0) {
                        this.dueDate.dataset.selected = selectedDates[0].toISOString().split('T')[0];
                    }
                }
            });
        }
    }

    loadSettings() {
        const settings = Storage.loadSettings();
        
        // Load theme
        if (settings.theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            this.updateThemeButton('dark');
        }

        // Load sort
        if (settings.sortBy) {
            this.sortSelect.value = settings.sortBy;
        }
    }

    handleAddTask() {
        const text = this.taskInput.value.trim();
        if (!text) {
            Utils.showNotification('Please enter a task!', 'error');
            this.taskInput.focus();
            return;
        }

        const priority = this.prioritySelect.value;
        const dueDate = this.dueDate.dataset.selected || null;
        const category = this.categorySelect.value;

        this.taskManager.createTask(text, priority, dueDate, category);
        this.render();
        
        // Reset form
        this.taskInput.value = '';
        this.dueDate.value = '';
        delete this.dueDate.dataset.selected;
        this.taskInput.focus();
    }

    handleFilterChange(e) {
        const filter = e.currentTarget.dataset.filter;
        
        // Update active filter button
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        // Update tasks title
        const titles = {
            'all': 'All Tasks',
            'active': 'Active Tasks',
            'completed': 'Completed Tasks',
            'today': 'Due Today'
        };
        this.tasksTitle.textContent = titles[filter] || 'All Tasks';

        // Apply filter
        this.taskManager.setFilter(filter);
        this.render();
    }

    handleSearch() {
        const query = this.searchInput.value.trim();
        this.taskManager.setSearchQuery(query);
        this.render();
    }

    handleSortChange() {
        const sortBy = this.sortSelect.value;
        this.taskManager.setSort(sortBy);
        this.render();
    }

    async handleMarkAllComplete() {
        await this.taskManager.markAllComplete();
        this.render();
    }

    async handleClearCompleted() {
        await this.taskManager.clearCompleted();
        this.render();
    }

    async handleTaskAction(e) {
        const target = e.target.closest('.task-btn');
        if (!target) return;

        const taskItem = target.closest('.task-item');
        const taskId = taskItem.dataset.id;
        const action = target.dataset.action;

        switch (action) {
            case 'delete':
                await this.taskManager.deleteTask(taskId);
                this.render();
                break;
                
            case 'complete':
                this.taskManager.toggleTaskCompletion(taskId);
                this.render();
                break;
                
            case 'edit':
                this.enterEditMode(taskItem);
                break;
        }
    }

    handleTaskEdit(e) {
        const taskText = e.target.closest('.task-text');
        if (taskText) {
            const taskItem = taskText.closest('.task-item');
            this.enterEditMode(taskItem);
        }
    }

    handleEditKeydown(e) {
        if (e.key === 'Escape') {
            this.cancelEditMode(e.target.closest('.task-item'));
        } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.saveEditMode(e.target.closest('.task-item'));
        }
    }

    handleEditBlur(e) {
        const editInput = e.target.closest('.edit-input');
        if (editInput) {
            const taskItem = editInput.closest('.task-item');
            this.saveEditMode(taskItem);
        }
    }

    async handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const success = await this.taskManager.importTasks(file);
        if (success) {
            this.render();
        }

        // Reset file input
        e.target.value = '';
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        this.updateThemeButton(newTheme);
        
        // Save theme preference
        const settings = Storage.loadSettings();
        settings.theme = newTheme;
        Storage.saveSettings(settings);
    }

    updateThemeButton(theme) {
        const icon = this.themeToggleBtn.querySelector('i');
        const text = this.themeToggleBtn.querySelector('span');
        
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
            text.textContent = 'Light Mode';
        } else {
            icon.className = 'fas fa-moon';
            text.textContent = 'Dark Mode';
        }
    }

    enterEditMode(taskItem) {
        // Exit if already in edit mode
        if (taskItem.classList.contains('editing')) return;

        const taskId = taskItem.dataset.id;
        const task = this.taskManager.getTask(taskId);
        if (!task) return;

        // Save original text
        taskItem.dataset.originalText = task.text;

        // Replace text with input
        const taskTextEl = taskItem.querySelector('.task-text');
        const originalText = taskTextEl.textContent;
        
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'edit-input';
        editInput.value = originalText;
        
        taskTextEl.replaceWith(editInput);
        taskItem.classList.add('editing');
        
        // Focus and select all text
        editInput.focus();
        editInput.select();
    }

    saveEditMode(taskItem) {
        const taskId = taskItem.dataset.id;
        const editInput = taskItem.querySelector('.edit-input');
        const newText = editInput.value.trim();

        if (!newText) {
            // If empty, cancel edit
            this.cancelEditMode(taskItem);
            return;
        }

        // Update task
        this.taskManager.updateTask(taskId, { text: newText });
        
        // Restore text display
        const taskTextEl = document.createElement('div');
        taskTextEl.className = 'task-text';
        taskTextEl.textContent = newText;
        
        editInput.replaceWith(taskTextEl);
        taskItem.classList.remove('editing');
        delete taskItem.dataset.originalText;
    }

    cancelEditMode(taskItem) {
        const editInput = taskItem.querySelector('.edit-input');
        const originalText = taskItem.dataset.originalText;
        
        // Restore original text
        const taskTextEl = document.createElement('div');
        taskTextEl.className = 'task-text';
        taskTextEl.textContent = originalText || '';
        
        editInput.replaceWith(taskTextEl);
        taskItem.classList.remove('editing');
        delete taskItem.dataset.originalText;
    }

    render() {
        const tasks = this.taskManager.getTasks();
        
        if (tasks.length === 0) {
            this.renderEmptyState();
            return;
        }

        this.tasksList.innerHTML = '';
        
        tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            this.tasksList.appendChild(taskElement);
        });
    }

    renderEmptyState() {
        let message = '';
        let icon = 'fas fa-clipboard-list';
        
        if (this.taskManager.searchQuery) {
            message = 'No tasks found matching your search';
            icon = 'fas fa-search';
        } else if (this.taskManager.currentFilter === 'active') {
            message = 'No active tasks - great job!';
            icon = 'fas fa-check-circle';
        } else if (this.taskManager.currentFilter === 'completed') {
            message = 'No completed tasks yet';
            icon = 'fas fa-check-circle';
        } else if (this.taskManager.currentFilter === 'today') {
            message = 'No tasks due today';
            icon = 'fas fa-calendar-day';
        } else {
            message = 'No tasks yet - add your first task above!';
        }
        
        this.tasksList.innerHTML = `
            <div class="empty-state">
                <i class="${icon} empty-icon"></i>
                <h3>${message}</h3>
                ${!this.taskManager.searchQuery && this.taskManager.currentFilter === 'all' ? 
                    '<p>Click the "+" button or press Enter to add a task</p>' : ''}
            </div>
        `;
    }

    createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskElement.dataset.id = task.id;
        
        const priorityClass = Utils.getPriorityClass(task.priority);
        const priorityLabel = Utils.getPriorityLabel(task.priority);
        
        // Format dates
        const createdDate = Utils.formatDate(task.createdAt);
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        let dueDateText = '';
        
        if (dueDate) {
            if (Utils.isToday(dueDate)) {
                dueDateText = 'Today';
            } else if (Utils.isTomorrow(dueDate)) {
                dueDateText = 'Tomorrow';
            } else {
                dueDateText = dueDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                });
            }
        }
        
        taskElement.innerHTML = `
            <div class="task-checkbox">
                <input 
                    type="checkbox" 
                    ${task.completed ? 'checked' : ''}
                    data-action="complete"
                    aria-label="${task.completed ? 'Mark as incomplete' : 'Mark as complete'}"
                >
            </div>
            <div class="task-content">
                <div class="task-text">${this.escapeHtml(task.text)}</div>
                <div class="task-meta">
                    <span class="task-meta-item">
                        <i class="far fa-calendar"></i>
                        ${createdDate}
                    </span>
                    ${task.priority !== 'medium' ? `
                        <span class="priority-badge ${priorityClass}">
                            <i class="fas fa-flag"></i>
                            ${priorityLabel}
                        </span>
                    ` : ''}
                    ${task.category ? `
                        <span class="category-badge">
                            <i class="fas fa-tag"></i>
                            ${task.category}
                        </span>
                    ` : ''}
                    ${dueDate ? `
                        <span class="task-meta-item ${Utils.isToday(dueDate) ? 'due-today' : ''}">
                            <i class="fas fa-clock"></i>
                            Due: ${dueDateText}
                        </span>
                    ` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="task-btn edit" data-action="edit" aria-label="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-btn delete" data-action="delete" aria-label="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        return taskElement;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}