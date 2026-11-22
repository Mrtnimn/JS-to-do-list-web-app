/*
 * This application keeps task data in an array of objects. Every change to that
 * array is first saved to localStorage and then rendered as DOM elements.
 * Keeping state and rendering separate makes adding, completing, and deleting
 * tasks easier to understand and maintain.
 */

// Select all elements that JavaScript will read from or update.
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskMessage = document.getElementById("taskMessage");
const taskList = document.getElementById("taskList");
const taskCounter = document.getElementById("taskCounter");
const completedCounter = document.getElementById("completedCounter");
const clearAllButton = document.getElementById("clearAllButton");
const emptyState = document.getElementById("emptyState");

// localStorage uses a named key so task data can be found again after refresh.
const STORAGE_KEY = "javascript-todo-assignment.tasks";

// The let keyword is used because this array must change as tasks are managed.
let tasks = loadTasks();

/*
 * Load saved tasks from localStorage. The try/catch protects the app if browser
 * storage is unavailable or contains invalid JSON. Only valid task objects are
 * restored, preventing malformed saved data from breaking the interface.
 */
function loadTasks() {
    try {
        const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY));

        if (!Array.isArray(savedTasks)) {
            return [];
        }

        return savedTasks.filter((task) => {
            return task &&
                typeof task.id === "number" &&
                typeof task.text === "string" &&
                typeof task.completed === "boolean";
        });
    } catch (error) {
        return [];
    }
}

/*
 * Save the complete task array whenever it changes. JSON.stringify converts
 * JavaScript objects into text, which is the format required by localStorage.
 */
function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        showMessage("Tasks could not be saved in this browser.");
    }
}

// Create an ID for a new task without relying on external libraries.
function createTaskId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

/*
 * Add a task after validating and trimming the input. Trimming removes all
 * unnecessary spaces at the beginning and end while preserving text inside it.
 */
function addTask(taskText) {
    const cleanedText = taskText.trim();

    if (cleanedText === "") {
        showMessage("Please enter a task before adding it.");
        taskInput.focus();
        return;
    }

    const newTask = {
        id: createTaskId(),
        text: cleanedText,
        completed: false
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();

    taskInput.value = "";
    taskMessage.textContent = "";
    taskInput.focus();
}

/*
 * Render creates a fresh view from the current array. textContent is intentionally
 * used for task text so user-entered HTML is displayed as text, not executed.
 */
function renderTasks() {
    taskList.innerHTML = "";

    tasks.forEach((task) => {
        const listItem = document.createElement("li");
        listItem.className = "task-item";
        listItem.dataset.taskId = String(task.id);

        if (task.completed) {
            listItem.classList.add("completed");
        }

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-checkbox";
        checkbox.checked = task.completed;
        checkbox.setAttribute("aria-label", `Mark ${task.text} as ${task.completed ? "incomplete" : "complete"}`);

        const taskText = document.createElement("span");
        taskText.className = "task-text";
        taskText.textContent = task.text;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "btn delete-button";
        deleteButton.textContent = "Delete";
        deleteButton.setAttribute("aria-label", `Delete ${task.text}`);

        // An individual checkbox change updates only the matching task object.
        checkbox.addEventListener("change", () => {
            toggleTask(task.id);
        });

        // Event delegation is not needed here because each button gets its own listener.
        deleteButton.addEventListener("click", () => {
            deleteTask(task.id);
        });

        listItem.append(checkbox, taskText, deleteButton);
        taskList.appendChild(listItem);
    });

    updateCounters();
}

// Toggle the completed property of a task identified by its unique ID.
function toggleTask(taskId) {
    tasks = tasks.map((task) => {
        if (task.id === taskId) {
            return { ...task, completed: !task.completed };
        }

        return task;
    });

    saveTasks();
    renderTasks();
}

// Remove only the task whose ID matches the delete button that was clicked.
function deleteTask(taskId) {
    tasks = tasks.filter((task) => task.id !== taskId);
    saveTasks();
    renderTasks();
}

/*
 * Clear all tasks together, then immediately update storage and the interface.
 * The button is disabled in the empty state, but the guard prevents accidental
 * clearing if clearAllTasks is called again from elsewhere.
 */
function clearAllTasks() {
    if (tasks.length === 0) {
        return;
    }

    tasks = [];
    saveTasks();
    showMessage("");
    renderTasks();
}

// Update task totals and show or hide the empty state based on array length.
function updateCounters() {
    const totalCount = tasks.length;
    const completedCount = tasks.filter((task) => task.completed).length;

    taskCounter.textContent = `${totalCount} ${totalCount === 1 ? "task" : "tasks"}`;
    completedCounter.textContent = `${completedCount} completed`;

    emptyState.classList.toggle("hidden", totalCount > 0);
    clearAllButton.disabled = totalCount === 0;
}

// Display a validation or storage message without using an alert dialog.
function showMessage(message) {
    taskMessage.textContent = message;
}

// Submit handler provides validation and prevents the browser from reloading.
taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addTask(taskInput.value);
});

// Input feedback disappears as soon as the user begins correcting an empty input.
taskInput.addEventListener("input", () => {
    if (taskInput.value.trim() !== "") {
        showMessage("");
    }
});

// Clear-all listener calls the shared state-changing function above.
clearAllButton.addEventListener("click", clearAllTasks);

// Initial render restores saved tasks and correctly initializes counters/UI states.
renderTasks();
