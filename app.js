const API_URL = "https://69383fd24618a71d77cf88f0.mockapi.io/tasks";

const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const error = document.getElementById("error");
const sound = document.getElementById("taskSound");

const showAllBtn = document.getElementById("showAll");
const showPendingBtn = document.getElementById("showPending");
const showCompletedBtn = document.getElementById("showCompleted");

const selectAllCheckbox = document.getElementById("selectAll");
const deleteSelectedBtn = document.getElementById("deleteSelected");

let allTasks = [];

// Canvas de fondo espacial
const canvas = document.getElementById("spaceCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particlesArray = [];
class Particle {
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.size = Math.random()*3 + 1;
        this.speedX = Math.random()*4-2;
        this.speedY = Math.random()*4-2;
        this.color = "#00ffcc";
        this.life = 60;
    }
    update(){ this.x+=this.speedX; this.y+=this.speedY; this.life--; }
    draw(){ ctx.fillStyle=this.color; ctx.beginPath(); ctx.arc(this.x,this.y,this.size,0,Math.PI*2); ctx.fill(); }
}
function animateParticles(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particlesArray.forEach((p,i)=>{
        p.update();
        p.draw();
        if(p.life<=0) particlesArray.splice(i,1);
    });
    requestAnimationFrame(animateParticles);
}
animateParticles();

window.addEventListener("resize",()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight;});

// Cargar tareas
async function loadTasks(){
    const res = await fetch(API_URL);
    allTasks = await res.json();
    renderTasks(allTasks);
}
loadTasks();

function renderTasks(tasks){
    taskList.innerHTML="";
    tasks.forEach(addTaskToDOM);
}

// Agregar tarea
addBtn.addEventListener("click", async ()=>{
    const title = taskInput.value.trim();
    if(!title){ error.textContent="Write something first!"; return; }
    error.textContent="";
    const newTask = { title, completed:false };
    const res = await fetch(API_URL,{method:"POST",body:JSON.stringify(newTask),headers:{"Content-Type":"application/json"}});
    const savedTask = await res.json();
    allTasks.push(savedTask);
    addTaskToDOM(savedTask);
    taskInput.value="";
});

function addTaskToDOM(task){
    const li = document.createElement("li");
    li.dataset.id = task.id;
    li.innerHTML = `
        <input type="checkbox" class="select-task">
        <span class="check ${task.completed ? "completed" : ""}">${task.completed ? "✔" : "○"}</span>
        <span class="title-task" style="text-decoration:${task.completed ? "line-through" : "none"};">${task.title}</span>
        <span class="edit">✏️</span>
        <span class="delete">🗑</span>
    `;
    li.querySelector(".check").addEventListener("click",()=>toggleTask(task,li));
    li.querySelector(".delete").addEventListener("click",()=>deleteTask(task.id,li));
    li.querySelector(".edit").addEventListener("click",()=>editTask(task,li));
    taskList.appendChild(li);
}

async function toggleTask(task, li){
    const updated = {...task, completed: !task.completed};
    await fetch(`${API_URL}/${task.id}`,{method:"PUT",body:JSON.stringify(updated),headers:{"Content-Type":"application/json"}});
    task.completed = updated.completed;
    const check = li.querySelector(".check");
    const titleEl = li.querySelector(".title-task");
    if(task.completed){
        check.textContent = "✔";
        check.classList.add("completed");
        titleEl.style.textDecoration="line-through";
        sound.currentTime = 0; sound.play();
        explodeParticles(li);
    }else{
        check.textContent = "○";
        check.classList.remove("completed");
        titleEl.style.textDecoration="none";
    }
}

async function deleteTask(id, li){
    explodeParticles(li);
    li.remove();
    await fetch(`${API_URL}/${id}`,{method:"DELETE"});
    allTasks = allTasks.filter(t=>t.id != id);
}

function editTask(task, li){
    const titleEl = li.querySelector(".title-task");
    const input = document.createElement("input");
    input.type = "text";
    input.value = task.title;
    input.style.flex="1";
    li.replaceChild(input,titleEl);
    input.focus();
    input.addEventListener("keypress",async e=>{
        if(e.key==="Enter"){
            const newTitle = input.value.trim();
            if(newTitle==="") return;
            const updatedTask = {...task,title:newTitle};
            await fetch(`${API_URL}/${task.id}`,{method:"PUT",body:JSON.stringify(updatedTask),headers:{"Content-Type":"application/json"}});
            task.title = newTitle;
            titleEl.textContent = newTitle;
            li.replaceChild(titleEl,input);
        }
    });
    input.addEventListener("blur",()=>{ li.replaceChild(titleEl,input); });
}

// Filtros
showAllBtn.addEventListener("click",()=>renderTasks(allTasks));
showPendingBtn.addEventListener("click",()=>renderTasks(allTasks.filter(t=>!t.completed)));
showCompletedBtn.addEventListener("click",()=>renderTasks(allTasks.filter(t=>t.completed)));

// Seleccionar todas
selectAllCheckbox.addEventListener("change",()=>{
    document.querySelectorAll(".select-task").forEach(cb=>cb.checked=selectAllCheckbox.checked);
});

// Borrar seleccionadas
deleteSelectedBtn.addEventListener("click", async ()=>{
    const selected = Array.from(document.querySelectorAll(".select-task:checked"));
    for(const cb of selected){
        const li = cb.parentElement;
        const id = li.dataset.id;
        await deleteTask(id, li);
    }
    selectAllCheckbox.checked = false;
});

// Explosión de partículas
function explodeParticles(li){
    const rect = li.getBoundingClientRect();
    for(let i=0;i<15;i++){
        particlesArray.push(new Particle(rect.left+rect.width/2, rect.top+rect.height/2));
    }
}
