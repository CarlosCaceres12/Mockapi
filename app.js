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

// ============================
// CANVAS DE FONDO ESPACIAL
// ============================
const canvas = document.getElementById("spaceCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let stars = [];
let rockets = [];
let particlesArray = [];

// Crear estrellas
for(let i=0;i<150;i++){
    stars.push({
        x: Math.random()*canvas.width,
        y: Math.random()*canvas.height,
        r: Math.random()*2+1,
        speed: Math.random()*0.5+0.2
    });
}

// Partículas
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

// Cohetes
class Rocket {
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.vy = Math.random()*-4 -3;
        this.color = `hsl(${Math.random()*360},100%,50%)`;
        this.size = 6;
    }
    update(){ this.y += this.vy; this.vy *= 0.98; this.size *= 0.98; }
    draw(){
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x,this.y,this.size,0,Math.PI*2);
        ctx.fill();
    }
}

function animate(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Dibujar estrellas
    stars.forEach(s=>{
        s.y += s.speed;
        if(s.y>canvas.height) s.y=0;
        ctx.fillStyle="#fff";
        ctx.beginPath();
        ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fill();
    });

    // Dibujar partículas
    particlesArray.forEach((p,i)=>{
        p.update();
        p.draw();
        if(p.life<=0) particlesArray.splice(i,1);
    });

    // Dibujar cohetes
    rockets.forEach((r,i)=>{
        r.update();
        r.draw();
        if(r.size<0.5) rockets.splice(i,1);
    });

    requestAnimationFrame(animate);
}

animate();
window.addEventListener("resize",()=>{canvas.width=window.innerWidth; canvas.height=window.innerHeight;});

// ============================
// FUNCIONES DE TAREAS
// ============================
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

addBtn.addEventListener("click", async ()=>{
    const title = taskInput.value.trim();
    if(!title){ error.textContent="Write something first!"; return; }
    error.textContent="";
    const newTask = { title, completed:false };
    const res = await fetch(API_URL,{
        method:"POST",
        body: JSON.stringify(newTask),
        headers: {"Content-Type":"application/json"}
    });
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
        launchRocket(li);
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

// FILTROS
showAllBtn.addEventListener("click",()=>renderTasks(allTasks));
showPendingBtn.addEventListener("click",()=>renderTasks(allTasks.filter(t=>!t.completed)));
showCompletedBtn.addEventListener("click",()=>renderTasks(allTasks.filter(t=>t.completed)));

// SELECT ALL
selectAllCheckbox.addEventListener("change",()=>{
    document.querySelectorAll(".select-task").forEach(cb=>cb.checked=selectAllCheckbox.checked);
});

// DELETE SELECTED
deleteSelectedBtn.addEventListener("click", async ()=>{
    const selected = Array.from(document.querySelectorAll(".select-task:checked"));
    for(const cb of selected){
        const li = cb.parentElement;
        const id = li.dataset.id;
        await deleteTask(id, li);
    }
    selectAllCheckbox.checked = false;
});

// PARTICULAS Y COHETES
function explodeParticles(li){
    const rect = li.getBoundingClientRect();
    for(let i=0;i<15;i++){
        particlesArray.push(new Particle(rect.left+rect.width/2, rect.top+rect.height/2));
    }
}

function launchRocket(li){
    const rect = li.getBoundingClientRect();
    rockets.push(new Rocket(rect.left + rect.width/2, rect.top));
}

