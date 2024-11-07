const STORAGE_KEY = "noteMasterPro";
const AUTOSAVE_DELAY = 1000;

let notes = [];
let currentNoteId = null;

const elements = {
  notesList: document.getElementById("notes-list"),
  titleInput: document.getElementById("note-title"),
  contentInput: document.getElementById("note-content"),
  notification: document.getElementById("notification"),
  syncIndicator: document.querySelector(".sync-indicator"),
  syncStatus: document.querySelector(".sync-status span"),
};

// Initialize the application
async function initApp() {
  try {
    await loadNotes();
    if (notes.length > 0) {
      selectNote(notes[0].id);
    }
    showNotification("Notes loaded successfully", "success");
  } catch (error) {
    showNotification("Error loading notes", "error");
  }

  setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
  document
    .getElementById("new-note-btn")
    .addEventListener("click", createNewNote);
  document.getElementById("save-note-btn").addEventListener("click", saveNote);
  document
    .getElementById("delete-note-btn")
    .addEventListener("click", deleteNote);

  const debouncedSave = debounce(saveNote, AUTOSAVE_DELAY);
  elements.titleInput.addEventListener("input", debouncedSave);
  elements.contentInput.addEventListener("input", debouncedSave);
}

// Storage Operations
async function loadNotes() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const savedNotes = localStorage.getItem(STORAGE_KEY);
      notes = savedNotes ? JSON.parse(savedNotes) : [];
      renderNotesList();
      resolve();
    }, 1000);
  });
}

async function saveNotesToStorage() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
        sessionStorage.setItem("lastEditedNote", currentNoteId);
        resolve();
      } catch (error) {
        reject(error);
      }
    }, 500);
  });
}

// Note Operations
function createNewNote() {
  const newNote = {
    id: Date.now(),
    title: "Untitled Note",
    content: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  notes.unshift(newNote);
  currentNoteId = newNote.id;
  renderNotesList();
  displayNote(newNote);
  saveNote();
}

async function saveNote() {
  if (!currentNoteId) return;

  const noteIndex = notes.findIndex((note) => note.id === currentNoteId);
  if (noteIndex === -1) return;

  setSyncStatus("syncing");

  const updatedNote = {
    ...notes[noteIndex],
    title: elements.titleInput.value,
    content: elements.contentInput.value,
    updatedAt: new Date().toISOString(),
  };

  notes[noteIndex] = updatedNote;

  try {
    await saveNotesToStorage();
    setSyncStatus("saved");
    renderNotesList();
    showNotification("Note saved successfully", "success");
  } catch (error) {
    setSyncStatus("error");
    showNotification("Error saving note", "error");
  }
}

async function deleteNote() {
  if (!currentNoteId) return;
  const noteIndex = notes.findIndex((note) => note.id === currentNoteId);
  if (noteIndex === -1) return;

  notes.splice(noteIndex, 1);

  try {
    await saveNotesToStorage();
    currentNoteId = notes.length > 0 ? notes[0].id : null;
    renderNotesList();

    if (currentNoteId) {
      displayNote(notes[0]);
    } else {
      clearEditor();
    }

    showNotification("Note deleted successfully", "success");
  } catch (error) {
    showNotification("Error deleting note", "error");
  }
}

// UI Operations
function selectNote(noteId) {
  const note = notes.find((n) => n.id === noteId);
  if (note) {
    currentNoteId = noteId;
    displayNote(note);
  }
}

function displayNote(note) {
  elements.titleInput.value = note.title;
  elements.contentInput.value = note.content;
  currentNoteId = note.id;
  renderNotesList();
}

function clearEditor() {
  elements.titleInput.value = "";
  elements.contentInput.value = "";
  currentNoteId = null;
  renderNotesList();
}

function renderNotesList() {
  elements.notesList.innerHTML = notes
    .map(
      (note) => `
        <li class="note-item ${note.id === currentNoteId ? "active" : ""}"
            onclick="selectNote(${note.id})">
            <strong>${note.title}</strong>
            <br>
            <small>${new Date(note.updatedAt).toLocaleDateString()}</small>
        </li>
    `
    )
    .join("");
}

// Utility Functions
function showNotification(message, type) {
  elements.notification.textContent = message;
  elements.notification.className = `notification ${type} show`;
  setTimeout(() => {
    elements.notification.classList.remove("show");
  }, 3000);
}

function setSyncStatus(status) {
  switch (status) {
    case "syncing":
      elements.syncIndicator.classList.add("syncing");
      elements.syncStatus.textContent = "Syncing changes...";
      break;
    case "saved":
      elements.syncIndicator.classList.remove("syncing");
      elements.syncStatus.textContent = "All changes saved";
      break;
    case "error":
      elements.syncIndicator.classList.remove("syncing");
      elements.syncStatus.textContent = "Error saving changes";
      break;
  }
}

function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Initialize the app
initApp();
