const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const chatButton = document.getElementById("chatButton");
const chatContainer = document.getElementById("chatContainer");
const minimizeBtn = document.getElementById("minimizeBtn");
const closeBtn = document.getElementById("closeBtn");
const chatOverlay = document.getElementById("chatOverlay");

const STORAGE_KEY = "petChatbotBookings";
const unavailableDates = [
  "2026-02-20",
  "2026-02-22",
  "2026-02-28",
  "2026-03-01",
];

// Widget state
let isWidgetOpen = false;

// Widget control functions
const openWidget = () => {
  isWidgetOpen = true;
  chatButton.classList.add("hidden");
  chatContainer.classList.add("open");
  chatOverlay.classList.add("active");
  messageInput.focus();
};

const closeWidget = () => {
  isWidgetOpen = false;
  chatButton.classList.remove("hidden");
  chatContainer.classList.remove("open");
  chatOverlay.classList.remove("active");
};

const minimizeWidget = () => {
  closeWidget();
};

// Event listeners for widget controls
chatButton.addEventListener("click", openWidget);
minimizeBtn.addEventListener("click", minimizeWidget);
closeBtn.addEventListener("click", closeWidget);
chatOverlay.addEventListener("click", closeWidget);

const state = {
  service: null,
  petName: "",
  petType: "",
  petSize: "",
  packageName: "",
  packagePrice: "",
  date: "",
  time: "",
  pickupDropService: "",
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
  chatForm.classList.toggle("chat-widget__input--hidden", !isVisible);
  messageInput.disabled = !isVisible;
  if (isVisible) {
    messageInput.focus();
  }
};

const scrollToBottom = () => {
  const lastMessage = chatWindow.lastElementChild;
  if (lastMessage) {
    const actions = lastMessage.querySelector(".message__actions");
    if (actions) {
      actions.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      lastMessage.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  } else {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
  setTimeout(() => {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }, 600);
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

  return { message, content, bubble };
};

const createTypingDots = () => {
  const dots = document.createElement("span");
  dots.className = "typing-dots";
  for (let i = 0; i < 3; i += 1) {
    const dot = document.createElement("span");
    dots.appendChild(dot);
  }
  return dots;
};

const addBotMessage = (text, options = {}) => {
  const { actions = [], extraContent = null, typing = true } = options;
  const { content, bubble } = createMessage("GroomBot", "", "bot");

  const finalize = () => {
    bubble.textContent = text;
    if (extraContent) {
      content.appendChild(extraContent);
    }
    addActions(content, actions);
  };

  if (typing) {
    bubble.textContent = "";
    bubble.appendChild(createTypingDots());
    setTimeout(finalize, 550);
  } else {
    finalize();
  }
};
const addUserMessage = (text) => createMessage("You", text, "user");

const addActions = (messageContent, actions) => {
  const filtered = actions.filter(Boolean);
  if (!filtered.length) return;
  const wrapper = document.createElement("div");
  wrapper.className = "message__actions fade-in";
  filtered.forEach((action) => wrapper.appendChild(action));
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

const createBookAnotherButton = () =>
  createButton(
    "Book Another Service",
    () => resetFlow("Let us book another service."),
    "action-btn action-btn--primary"
  );

const createViewBookingsButton = () =>
  createButton("View My Bookings", () => showBookingsList(), "action-btn");

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

const resetFlow = (message = "No problem. Let us start over.") => {
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
    pickupDropService: "",
  });
  currentStep = "service";
  if (message) {
    addBotMessage(message);
  }
  renderStep();
};

const buildSummaryCard = (booking) => {
  const summary = document.createElement("div");
  summary.className = "summary-card";

  const petIcon = booking.petType === "Cat" ? "🐱" : "🐶";
  const rows = [
    [petIcon, "Pet", booking.petName || booking.petType],
    ["✂️", "Service", booking.service],
    ["📅", "Date", new Date(booking.date).toDateString()],
    ["⏰", "Time", booking.time],
    ["💳", "Price", booking.packagePrice],
  ];

  rows.forEach(([icon, label, value]) => {
    const row = document.createElement("div");
    row.className = "summary-row";

    const key = document.createElement("span");
    key.className = "summary-key";
    const iconSpan = document.createElement("span");
    iconSpan.className = "summary-icon";
    iconSpan.textContent = icon;
    const labelSpan = document.createElement("span");
    labelSpan.textContent = label;
    key.append(iconSpan, labelSpan);

    const val = document.createElement("strong");
    val.textContent = value;
    row.append(key, val);
    summary.appendChild(row);
  });

  return summary;
};

const showBookingsList = () => {
  setInputVisible(false);
  const bookings = loadBookings();
  const today = getTodayIso();
  const upcoming = bookings.filter((booking) => booking.date >= today);

  if (!upcoming.length) {
    addBotMessage("You have no upcoming appointments yet.", {
      actions: [createBookAnotherButton()],
    });
    return;
  }

  const list = document.createElement("div");
  list.className = "summary-card";
  upcoming.forEach((booking) => {
    const card = buildSummaryCard(booking);
    card.classList.add("summary-card--compact");
    list.appendChild(card);
  });

  addBotMessage("Here are your upcoming appointments.", {
    extraContent: list,
    actions: [createBookAnotherButton()],
  });
};

const showBookingDetail = (booking) => {
  setInputVisible(false);
  const card = buildSummaryCard(booking);
  addBotMessage("Here is your booking.", {
    extraContent: card,
    actions: [createBookAnotherButton(), createViewBookingsButton()],
  });
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
    case "walkingPackage":
      askWalkingPackage();
      break;
    case "trainingPackage":
      askTrainingPackage();
      break;
    case "boardingLocation":
      askBoardingLocation();
      break;
    case "boardingFacility":
      askBoardingFacility();
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
    case "pickupDropService":
      askPickupDropService();
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
  const services = ["Grooming", "Walking", "Training", "Boarding"];
  const buttons = services.map((service) =>
    createButton(service, () => handleServiceSelect(service))
  );

  addBotMessage("Welcome! What service would you like to book today?", {
    actions: [...buttons, createViewBookingsButton(), createStartOverButton()],
  });
};

const handleServiceSelect = (service) => {
  addUserMessage(service);
  state.service = service;

  if (service === "Walking" || service === "Training" || service === "Boarding") {
    pushHistory("service");
    currentStep = "petName";
    renderStep();
    return;
  }

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
  addBotMessage("Great! What is your pet's name?", {
    actions: [createBackButton(), createStartOverButton()],
  });
};

const askPetType = () => {
  setInputVisible(false);
  addBotMessage("Is your pet a dog or a cat?", {
    actions: [
      createButton("Dog", () => setPetType("Dog")),
      createButton("Cat", () => setPetType("Cat")),
      createBackButton(),
      createStartOverButton(),
    ],
  });
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
  addBotMessage("What size is your pet?", {
    actions: [
      createButton("Small", () => setPetSize("Small")),
      createButton("Medium", () => setPetSize("Medium")),
      createButton("Large", () => setPetSize("Large")),
      createBackButton(),
      createStartOverButton(),
    ],
  });
};

const setPetSize = (value) => {
  addUserMessage(value);
  state.petSize = value;
  pushHistory("petSize");
  
  if (state.service === "Walking") {
    currentStep = "walkingPackage";
  } else if (state.service === "Training") {
    currentStep = "trainingPackage";
  } else if (state.service === "Boarding") {
    currentStep = "boardingLocation";
  } else {
    currentStep = "package";
  }
  
  renderStep();
};

const askWalkingPackage = () => {
  setInputVisible(false);
  const walkingPackages = [
    { name: "7 Days Walking", days: "7 days", price: "₹1,400" },
    { name: "15 Days Walking", days: "15 days", price: "₹3,000" },
    { name: "30 Days Walking", days: "30 days", price: "₹5,400" },
    { name: "180 Days Walking", days: "180 days", price: "₹27,000" },
    { name: "365 Days Walking", days: "365 days", price: "₹48,750" },
  ];

  const packageButtons = walkingPackages.map((item) => {
    const button = createButton("", () => setPackage(item), "action-btn action-card");
    
    const nameSpan = document.createElement("span");
    nameSpan.style.display = "block";
    nameSpan.textContent = item.name;
    
    const daysSpan = document.createElement("span");
    daysSpan.style.display = "block";
    daysSpan.style.fontSize = "0.85em";
    daysSpan.style.color = "rgba(107, 114, 128, 0.8)";
    daysSpan.textContent = item.days;
    
    const priceSpan = document.createElement("span");
    priceSpan.style.display = "block";
    priceSpan.style.marginTop = "4px";
    priceSpan.style.fontWeight = "bold";
    priceSpan.style.color = "#2f5ebc";
    priceSpan.textContent = item.price;
    
    button.textContent = "";
    button.append(nameSpan, daysSpan, priceSpan);
    return button;
  });

  packageButtons.push(createBackButton(), createStartOverButton());
  addBotMessage("Choose your walking plan. Track walking time and days with our walker.", { actions: packageButtons });
};

const askTrainingPackage = () => {
  setInputVisible(false);
  const trainingPackages = [
    { name: "Primary Training", duration: "3 months • 12 sessions", price: "₹12,000" },
    { name: "Advance Training", duration: "6 months • 24 sessions", price: "₹24,000" },
    { name: "Online Training Course", duration: "For Pet Parents • 30 hours", price: "₹3,500" },
  ];

  const packageButtons = trainingPackages.map((item) => {
    const button = createButton("", () => setPackage(item), "action-btn action-card");
    
    const nameSpan = document.createElement("span");
    nameSpan.style.display = "block";
    nameSpan.textContent = item.name;
    
    const durationSpan = document.createElement("span");
    durationSpan.style.display = "block";
    durationSpan.style.fontSize = "0.85em";
    durationSpan.style.color = "rgba(107, 114, 128, 0.8)";
    durationSpan.textContent = item.duration;
    
    const priceSpan = document.createElement("span");
    priceSpan.style.display = "block";
    priceSpan.style.marginTop = "4px";
    priceSpan.style.fontWeight = "bold";
    priceSpan.style.color = "#2f5ebc";
    priceSpan.textContent = item.price;
    
    button.textContent = "";
    button.append(nameSpan, durationSpan, priceSpan);
    return button;
  });

  packageButtons.push(createBackButton(), createStartOverButton());
  addBotMessage("Choose your training program.", { actions: packageButtons });
};

const askBoardingLocation = () => {
  setInputVisible(false);
  const mumbaiAreas = [
    "Andheri",
    "Bandra",
    "Worli",
    "Dadar",
    "Navi Mumbai",
    "Thane",
    "Malad",
    "Powai",
    "Vile Parle",
    "Juhu"
  ];

  const locationButtons = mumbaiAreas.map((area) =>
    createButton(area, () => setBoardingLocation(area))
  );

  locationButtons.push(createBackButton(), createStartOverButton());
  addBotMessage("Which area in Mumbai are you located in?", { actions: locationButtons });
};

const setBoardingLocation = (location) => {
  addUserMessage(location);
  state.packageName = location;
  pushHistory("boardingLocation");
  currentStep = "boardingFacility";
  renderStep();
};

const askBoardingFacility = () => {
  setInputVisible(false);
  const boardingFacilities = [
    { name: "Paws Haven", details: "Premium AC Villa • Daily updates", price: "₹1,200/night" },
    { name: "Pet Paradise", details: "Spacious Rooms • 24/7 Monitoring", price: "₹1,000/night" },
    { name: "The Bark House", details: "PlayArea Included • Expert Care", price: "₹1,400/night" },
    { name: "Happy Tails Boarding", details: "Home-like Environment • Grooming", price: "₹1,100/night" },
    { name: "Furry Friends Inn", details: "AC Kennels • Outdoor Play", price: "₹900/night" },
    { name: "Pet Resort Mumbai", details: "Luxury Suite • Swimming Pool", price: "₹1,600/night" },
  ];

  const facilityButtons = boardingFacilities.map((facility) => {
    const button = createButton("", () => setBoardingFacility(facility), "action-btn action-card");
    
    const nameSpan = document.createElement("span");
    nameSpan.style.display = "block";
    nameSpan.style.fontWeight = "600";
    nameSpan.textContent = facility.name;
    
    const detailsSpan = document.createElement("span");
    detailsSpan.style.display = "block";
    detailsSpan.style.fontSize = "0.85em";
    detailsSpan.style.color = "rgba(107, 114, 128, 0.8)";
    detailsSpan.textContent = facility.details;
    
    const priceSpan = document.createElement("span");
    priceSpan.style.display = "block";
    priceSpan.style.marginTop = "4px";
    priceSpan.style.fontWeight = "bold";
    priceSpan.style.color = "#2f5ebc";
    priceSpan.textContent = facility.price;
    
    button.textContent = "";
    button.append(nameSpan, detailsSpan, priceSpan);
    return button;
  });

  facilityButtons.push(createBackButton(), createStartOverButton());
  addBotMessage("Select a Pet Boarding Facility in " + state.packageName + ".", { actions: facilityButtons });
};

const setBoardingFacility = (facility) => {
  addUserMessage(`${facility.name} (${facility.price})`);
  state.packageName = facility.name;
  state.packagePrice = facility.price;
  pushHistory("boardingFacility");
  currentStep = "date";
  renderStep();
};

const askPackage = () => {
  setInputVisible(false);
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
  addBotMessage("Pick a grooming package.", { actions: packageButtons });
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

  addBotMessage("Choose a preferred date.", {
    actions: [
      dateInput,
      helperText,
      continueButton,
      createBackButton(),
      createStartOverButton(),
    ],
  });
};

const askTime = () => {
  setInputVisible(false);
  const times = ["9:00 AM", "11:30 AM", "2:00 PM", "4:30 PM"];
  const timeButtons = times.map((time) =>
    createButton(time, () => setTime(time))
  );
  timeButtons.push(createBackButton(), createStartOverButton());
  addBotMessage("Select a time slot.", { actions: timeButtons });
};

const setTime = (value) => {
  addUserMessage(value);
  state.time = value;
  pushHistory("time");
  
  if (state.service === "Boarding") {
    currentStep = "pickupDropService";
  } else {
    currentStep = "summary";
  }
  
  renderStep();
};

const askPickupDropService = () => {
  setInputVisible(false);
  const pickupDropOptions = [
    { label: "Pickup Only", value: "pickup_only" },
    { label: "Drop Only", value: "drop_only" },
    { label: "Pickup & Drop", value: "pickup_and_drop" },
    { label: "No Service", value: "none" },
  ];

  const serviceButtons = pickupDropOptions.map((option) =>
    createButton(option.label, () => setPickupDropService(option.value, option.label))
  );

  serviceButtons.push(createBackButton(), createStartOverButton());
  addBotMessage("Would you like a Pickup and/or Drop service?", { actions: serviceButtons });
};

const setPickupDropService = (value, label) => {
  addUserMessage(label);
  state.pickupDropService = value;
  pushHistory("pickupDropService");
  currentStep = "summary";
  renderStep();
};

const showSummary = () => {
  setInputVisible(false);
  const confirmButton = createButton(
    "Confirm Booking",
    () => confirmBooking(),
    "action-btn action-btn--primary"
  );

  const summary = buildSummaryCard({
    ...state,
    service: state.service,
  });

  addBotMessage("Here is your booking summary.", {
    extraContent: summary,
    actions: [confirmButton, createBackButton(), createStartOverButton()],
  });
};

const confirmBooking = () => {
  addUserMessage("Confirm Booking");
  const bookingNumber = `GB-${Math.floor(100000 + Math.random() * 900000)}`;
  const booking = {
    bookingNumber,
    ...state,
    createdAt: new Date().toISOString(),
  };
  saveBooking(booking);
  addBotMessage(
    `All set! Your booking is confirmed. Booking number: ${bookingNumber}.`,
    {
      actions: [
        createButton("View Booking", () => showBookingDetail(booking)),
        createBookAnotherButton(),
      ],
    }
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
    pickupDropService: "",
  });
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
