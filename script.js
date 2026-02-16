const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");

const STORAGE_KEY = "petChatbotBookings";
const unavailableDates = [
  "2026-02-20",
  "2026-02-22",
  "2026-02-28",
  "2026-03-01",
];

const state = {
  service: null,
  petName: "",
  petType: "",
  petSize: "",
  packageName: "",
  packagePrice: "",
  date: "",
  time: "",
};

const historyStack = [];
let currentStep = "service";

const getTodayIso = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const loadBookings = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const saveBooking = (booking) => {
  const bookings = loadBookings();
  bookings.push(booking);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
};

const setInputVisible = (isVisible) => {
  chatForm.classList.toggle("chat__input--hidden", !isVisible);
  messageInput.disabled = !isVisible;
  if (isVisible) {
    messageInput.focus();
  }
};

const scrollToBottom = () => {
  chatWindow.scrollTop = chatWindow.scrollHeight;
};

const createMessage = (author, text, tone) => {
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
  scrollToBottom();

  return { message, content };
};

const addBotMessage = (text) => createMessage("GroomBot", text, "bot");
const addUserMessage = (text) => createMessage("You", text, "user");

const addActions = (messageContent, actions) => {
  if (!actions.length) return;
  const wrapper = document.createElement("div");
  wrapper.className = "message__actions fade-in";
  actions.forEach((action) => wrapper.appendChild(action));
  messageContent.appendChild(wrapper);
  scrollToBottom();
};

const createButton = (label, onClick, className = "action-btn") => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
};

const createBackButton = () =>
  createButton("Go Back", () => goBack(), "action-btn action-btn--ghost");

const createStartOverButton = () =>
  createButton("Start Over", () => resetFlow(), "action-btn action-btn--ghost");

const pushHistory = (step) => {
  historyStack.push({ step, data: { ...state } });
};

const goBack = () => {
  const previous = historyStack.pop();
  if (!previous) return;
  Object.assign(state, previous.data);
  currentStep = previous.step;
  addBotMessage("Okay, going back a step.");
  renderStep();
};

const resetFlow = () => {
  historyStack.length = 0;
  Object.assign(state, {
    service: null,
    petName: "",
    petType: "",
    petSize: "",
    packageName: "",
    packagePrice: "",
    date: "",
    time: "",
  });
  currentStep = "service";
  addBotMessage("No problem. Let us start over.");
  renderStep();
};

const renderStep = () => {
  switch (currentStep) {
    case "service":
      showServiceOptions();
      break;
    case "petName":
      askPetName();
      break;
    case "petType":
      askPetType();
      break;
    case "petSize":
      askPetSize();
      break;
    case "package":
      askPackage();
      break;
    case "date":
      askDate();
      break;
    case "time":
      askTime();
      break;
    case "summary":
      showSummary();
      break;
    default:
      break;
  }
};

const showServiceOptions = () => {
  setInputVisible(false);
  const { content } = addBotMessage(
    "Welcome! What service would you like to book today?"
  );

  const services = ["Grooming", "Walking", "Training", "Boarding"];
  const buttons = services.map((service) =>
    createButton(service, () => handleServiceSelect(service))
  );

  addActions(content, [...buttons, createStartOverButton()]);
};

const handleServiceSelect = (service) => {
  addUserMessage(service);
  state.service = service;

  if (service !== "Grooming") {
    state.service = null;
    addBotMessage("That service is coming soon. Want to book grooming instead?");
    currentStep = "service";
    renderStep();
    return;
  }

  pushHistory("service");
  currentStep = "petName";
  renderStep();
};

const askPetName = () => {
  setInputVisible(true);
  messageInput.value = state.petName;
  messageInput.placeholder = "Enter your pet's name";
  const { content } = addBotMessage("Great! What is your pet's name?");
  addActions(content, [createBackButton(), createStartOverButton()]);
};

const askPetType = () => {
  setInputVisible(false);
  const { content } = addBotMessage("Is your pet a dog or a cat?");
  addActions(content, [
    createButton("Dog", () => setPetType("Dog")),
    createButton("Cat", () => setPetType("Cat")),
    createBackButton(),
    createStartOverButton(),
  ]);
};

const setPetType = (value) => {
  addUserMessage(value);
  state.petType = value;
  pushHistory("petType");
  currentStep = "petSize";
  renderStep();
};

const askPetSize = () => {
  setInputVisible(false);
  const { content } = addBotMessage("What size is your pet?");
  addActions(content, [
    createButton("Small", () => setPetSize("Small")),
    createButton("Medium", () => setPetSize("Medium")),
    createButton("Large", () => setPetSize("Large")),
    createBackButton(),
    createStartOverButton(),
  ]);
};

const setPetSize = (value) => {
  addUserMessage(value);
  state.petSize = value;
  pushHistory("petSize");
  currentStep = "package";
  renderStep();
};

const askPackage = () => {
  setInputVisible(false);
  const { content } = addBotMessage("Pick a grooming package.");

  const packages = [
    { name: "Fresh & Fluffy", price: "$45" },
    { name: "Spa Deluxe", price: "$65" },
    { name: "Full Groom", price: "$85" },
  ];

  const packageButtons = packages.map((item) => {
    const button = createButton("", () => setPackage(item), "action-btn action-card");
    button.textContent = item.name;
    const price = document.createElement("span");
    price.textContent = item.price;
    button.appendChild(price);
    return button;
  });

  packageButtons.push(createBackButton(), createStartOverButton());
  addActions(content, packageButtons);
};

const setPackage = (item) => {
  addUserMessage(`${item.name} (${item.price})`);
  state.packageName = item.name;
  state.packagePrice = item.price;
  pushHistory("package");
  currentStep = "date";
  renderStep();
};

const askDate = () => {
  setInputVisible(false);
  const { content } = addBotMessage("Choose a preferred date.");

  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.className = "date-picker";
  dateInput.value = state.date;
  dateInput.min = getTodayIso();

  const helperText = document.createElement("p");
  helperText.className = "helper-text";
  helperText.textContent =
    "Unavailable dates: Feb 20, Feb 22, Feb 28, Mar 1.";

  const continueButton = createButton("Continue", () => {
    if (!dateInput.value) {
      addBotMessage("Please pick a date to continue.");
      return;
    }
    if (unavailableDates.includes(dateInput.value)) {
      addBotMessage("That date is unavailable. Please choose another.");
      return;
    }
    state.date = dateInput.value;
    addUserMessage(new Date(state.date).toDateString());
    pushHistory("date");
    currentStep = "time";
    renderStep();
  }, "action-btn action-btn--primary");

  addActions(content, [
    dateInput,
    helperText,
    continueButton,
    createBackButton(),
    createStartOverButton(),
  ]);
};

const askTime = () => {
  setInputVisible(false);
  const { content } = addBotMessage("Select a time slot.");
  const times = ["9:00 AM", "11:30 AM", "2:00 PM", "4:30 PM"];
  const timeButtons = times.map((time) =>
    createButton(time, () => setTime(time))
  );
  timeButtons.push(createBackButton(), createStartOverButton());
  addActions(content, timeButtons);
};

const setTime = (value) => {
  addUserMessage(value);
  state.time = value;
  pushHistory("time");
  currentStep = "summary";
  renderStep();
};

const showSummary = () => {
  setInputVisible(false);
  const { content } = addBotMessage("Here is your booking summary.");

  const summary = document.createElement("div");
  summary.className = "summary-card";
  const rows = [
    ["Service", state.service],
    ["Pet Name", state.petName],
    ["Pet Type", state.petType],
    ["Size", state.petSize],
    ["Package", `${state.packageName} (${state.packagePrice})`],
    ["Date", new Date(state.date).toDateString()],
    ["Time", state.time],
  ];

  rows.forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "summary-row";
    const key = document.createElement("span");
    key.textContent = label;
    const val = document.createElement("strong");
    val.textContent = value;
    row.append(key, val);
    summary.appendChild(row);
  });

  content.appendChild(summary);

  const confirmButton = createButton(
    "Confirm Booking",
    () => confirmBooking(),
    "action-btn action-btn--primary"
  );

  addActions(content, [confirmButton, createBackButton(), createStartOverButton()]);
};

const confirmBooking = () => {
  addUserMessage("Confirm Booking");
  const bookingNumber = `GB-${Math.floor(100000 + Math.random() * 900000)}`;
  saveBooking({
    bookingNumber,
    ...state,
    createdAt: new Date().toISOString(),
  });
  addBotMessage(
    `All set! Your booking is confirmed. Booking number: ${bookingNumber}.`
  );
  currentStep = "service";
  historyStack.length = 0;
  Object.assign(state, {
    service: null,
    petName: "",
    petType: "",
    petSize: "",
    packageName: "",
    packagePrice: "",
    date: "",
    time: "",
  });
  setTimeout(() => {
    renderStep();
  }, 400);
};

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;
  if (currentStep !== "petName") return;

  addUserMessage(text);
  state.petName = text;
  messageInput.value = "";
  pushHistory("petName");
  currentStep = "petType";
  renderStep();
});

renderStep();
