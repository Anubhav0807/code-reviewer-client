const API_URL = "https://code-reviewer-server.onrender.com";

// Send a wake up call to the API to initiate cold start
fetch(API_URL); // Need not wait or store

let editorInstance;

// ✅ Initialize Monaco Editor
require.config({
  paths: {
    vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs",
  },
});
require(["vs/editor/editor.main"], function () {
  editorInstance = monaco.editor.create(document.getElementById("editor"), {
    value: "// Start coding...",
    language: "javascript",
    theme: "vs-dark",
  });
});

// ✅ Fetch Saved Codes
async function fetchCodes() {
  const response = await fetch(API_URL + '/codes');
  const data = await response.json();
  const list = document.getElementById("savedCodesList");

  list.innerHTML = "";
  data.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.title} - ${item.language}`;
    list.appendChild(li);
  });
}

// ✅ Save Code to Backend
async function saveCode() {
  const codeContent = editorInstance.getValue();
  const response = await fetch(API_URL + '/codes', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "My Code",
      content: codeContent,
      language: "javascript",
    }),
  });

  if (response.ok) {
    alert("Code saved!");
    fetchCodes();
  } else {
    alert("Error saving code.");
  }
}

// ✅ Send the Code along with a promt to Backend (which will be forwaded to Gemini)
async function promptAI(prompt) {
  const codeContent = editorInstance.getValue();
  const response = await fetch(API_URL + '/codes/prompt_ai', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "My Code",
      content: codeContent,
      language: "javascript",
      prompt: prompt,
    }),
  });

  if (response.ok) {
    const data = await response.json();
    editorInstance.setValue(data.code);
    appendMessage(data.explanation);
  } else {
    appendMessage("I couldn't process that request. Please try again.");
  }
}

// ✅ Run JavaScript Code
function runCode() {
  try {
    // The eval() method evaluates or executes an argument.
    // If the argument is an expression, eval() evaluates the expression.
    // If the argument is one or more JavaScript statements, eval() executes the statements.
    eval(editorInstance.getValue());
  } catch (error) {
    console.error("Error:", error);
  }
}

// ✅ Chat Functions (by Adityaraj)
function appendMessage(message, isUser = false) {
  const chatContainer = document.getElementById("chatContainer");
  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${isUser ? 'user-message' : 'ai-message'}`;
  messageDiv.innerHTML = `
    <div class="message-content">
      <span class="message-icon">${isUser ? '👤' : '🤖'}</span>
      <div>${isUser ? message : marked.parse(message)}</div>
    </div>
  `;
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function sendMessage() {
  const userInput = document.getElementById("userInput");
  const message = userInput.value.trim();
  if (!message) return;

  // Display user message
  appendMessage(message, true);
  userInput.value = '';

  // Prompt the actual AI
  promptAI(message);
}

// Add event listener for Enter key in textarea
document.getElementById("userInput").addEventListener("keypress", function(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});