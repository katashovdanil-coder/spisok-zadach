"use strict";

const storageKey = "spisok-zadach:v1";
const form = document.querySelector("#add-task");
const title = document.querySelector("#task-title");
const list = document.querySelector("#tasks");
const template = document.querySelector("#task-template");
const count = document.querySelector("#count");
const progress = document.querySelector("#progress");
const empty = document.querySelector("#empty");
const error = document.querySelector("#error");

document.querySelector("#today").textContent = new Intl.DateTimeFormat("ru", {
  weekday: "long", day: "numeric", month: "long",
}).format(new Date());

function showError(message) {
  error.textContent = message;
  error.hidden = false;
}

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    if (Array.isArray(saved)) {
      return saved.filter(task => task && typeof task.title === "string" &&
        task.title.trim() && typeof task.done === "boolean");
    }
  } catch {
    showError("Не удалось загрузить сохранённые задачи.");
  }
  return [];
}

let tasks = loadTasks();

function saveTasks(nextTasks) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(nextTasks));
  } catch {
    showError("Не удалось сохранить изменения. Проверьте доступ к хранилищу браузера.");
    return false;
  }

  tasks = nextTasks;
  error.hidden = true;
  updateSummary();
  return true;
}

function updateSummary() {
  const done = tasks.filter(task => task.done).length;
  count.textContent = `Выполнено ${done} из ${tasks.length}`;
  progress.max = tasks.length || 1;
  progress.value = done;
  empty.hidden = tasks.length > 0;
}

function appendTask(initialTask) {
  let task = initialTask;
  const row = template.content.firstElementChild.cloneNode(true);
  const checkbox = row.querySelector("input");
  const remove = row.querySelector("button");

  row.querySelector("span").textContent = task.title;
  checkbox.checked = task.done;
  remove.setAttribute("aria-label", `Удалить задачу «${task.title}»`);

  checkbox.addEventListener("change", () => {
    const updated = { ...task, done: checkbox.checked };
    if (saveTasks(tasks.map(item => item === task ? updated : item))) {
      task = updated;
    } else {
      checkbox.checked = task.done;
    }
  });

  remove.addEventListener("click", () => {
    if (!saveTasks(tasks.filter(item => item !== task))) return;
    const neighbor = row.nextElementSibling ?? row.previousElementSibling;
    row.remove();
    (neighbor?.querySelector("button") ?? title).focus();
  });

  list.append(row);
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const value = title.value.trim();
  if (!value) {
    title.setCustomValidity("Введите название задачи.");
    title.reportValidity();
    return;
  }

  const task = { title: value, done: false };
  if (saveTasks([...tasks, task])) {
    appendTask(task);
    form.reset();
    title.focus();
  }
});

title.addEventListener("input", () => title.setCustomValidity(""));
tasks.forEach(appendTask);
updateSummary();
