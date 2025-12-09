const API_URL = "https://69383fd24618a71d77cf88f0.mockapi.io/tasks";

const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const error = document.getElementById("error");
const sound = document.getElementById("taskSound");


// ================== LOAD TASKS ==================
async function loadTasks() {
    const res = await fetch(API_URL);
    const tasks = await res.json();
    tasks.forEach(addTaskToDOM);
}
loadTasks();


// ================== ADD TASK ==================
addBtn.addEventListener("click", async () => {
    const title = taskInput.value.trim();

    if (!title) {
        error.textContent = "Write something first!";
        return;
    }

    error.textContent = "";

    const newTask = { title, completed: false };

    const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(newTask),
        headers: { "Content-Type": "application/json" }
    });

    const savedTask = await res.json();
    addTaskToDOM(savedTask);

    taskInput.value = "";
});


// ================== ADD TASK TO DOM ==================
function addTaskToDOM(task) {
    const li = document.createElement("li");
    li.dataset.id = task.id;

    li.innerHTML = `
        <span class="check ${task.completed ? "completed" : ""}">
            ${task.completed ? "✔" : "○"}
        </span>

        <span class="title-task" 
              style="text-decoration:${task.completed ? "line-through" : "none"};">
            ${task.title}
        </span>

        <span class="delete">🗑</span>
    `;

    li.querySelector(".check").addEventListener("click", () => toggleTask(task, li));
    li.querySelector(".delete").addEventListener("click", () => deleteTask(task.id, li));

    taskList.appendChild(li);
}


// ================== UPDATE TASK ==================
async function toggleTask(task, li) {

    const updated = { ...task, completed: !task.completed };

    await fetch(`${API_URL}/${task.id}`, {
        method: "PUT",
        body: JSON.stringify(updated),
        headers: { "Content-Type": "application/json" }
    });

    const check = li.querySelector(".check");
    const text = li.querySelector(".title-task");

    if (updated.completed) {
        check.textContent = "✔";
        check.classList.add("completed");
        text.style.textDecoration = "line-through";

        sound.currentTime = 0;
        sound.play();
    } else {
        check.textContent = "○";
        check.classList.remove("completed");
        text.style.textDecoration = "none";
    }

    task.completed = updated.completed;
}


// ================== DELETE TASK ==================
async function deleteTask(id, li) {
    li.style.opacity = "0";
    li.style.transform = "translateX(20px)";

    setTimeout(async () => {
        await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        li.remove();
    }, 300);
}
