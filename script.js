const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");

const cannedReplies = [
  "Golden retrievers do best with brushing 3-4 times a week to reduce shedding.",
  "For short coats, a rubber curry brush once a week keeps them shiny.",
  "Trim nails every 3-4 weeks, or when you hear clicking on hard floors.",
  "Baths every 4-6 weeks are typical, unless your pet gets extra muddy.",
  "Use a slicker brush for tangles, then finish with a comb for smoothness.",
];

const addMessage = (author, text, tone = "bot") => {
  const message = document.createElement("article");
  message.className = `message message--${tone} message--new`;

  const avatar = document.createElement("span");
  avatar.className = "message__avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = tone === "user" ? "👤" : "🐾";

  const content = document.createElement("div");

  const name = document.createElement("p");
  name.className = "message__name";
  name.textContent = author;

  const bubble = document.createElement("p");
  bubble.className = "message__bubble";
  bubble.textContent = text;

  content.append(name, bubble);
  message.append(avatar, content);
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
};

const mockBotReply = () => {
  const pick = cannedReplies[Math.floor(Math.random() * cannedReplies.length)];
  setTimeout(() => addMessage("GroomBot", pick, "bot"), 450);
};

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  addMessage("You", text, "user");
  messageInput.value = "";
  mockBotReply();
});
