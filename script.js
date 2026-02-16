const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const promptChips = document.getElementById("promptChips");

const cannedReplies = [
  "Make sure fresh water is always available, and introduce new food gradually.",
  "Positive reinforcement works best. Short sessions and treats help a lot.",
  "If you notice lethargy or loss of appetite, consult a vet promptly.",
  "For most pets, a consistent routine keeps stress levels down.",
  "Grooming schedules vary, but weekly brushing is a good baseline.",
];

const addMessage = (author, text, tone = "bot") => {
  const message = document.createElement("div");
  message.className = `message message--${tone}`;

  const meta = document.createElement("div");
  meta.className = "message__meta";
  meta.textContent = author;

  const bubble = document.createElement("div");
  bubble.className = "message__bubble";
  bubble.textContent = text;

  message.append(meta, bubble);
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
};

const mockBotReply = () => {
  const pick = cannedReplies[Math.floor(Math.random() * cannedReplies.length)];
  setTimeout(() => addMessage("PetBot", pick, "bot"), 450);
};

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  addMessage("You", text, "user");
  messageInput.value = "";
  mockBotReply();
});

promptChips.addEventListener("click", (event) => {
  if (event.target.matches(".chip")) {
    messageInput.value = event.target.textContent;
    messageInput.focus();
  }
});
