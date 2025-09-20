import { login, register, logout, supabase } from './auth.js';
import { loadUserData, addTrip, deleteTrip, addParticipant } from './database.js';
import { showNotification } from './utilities.js';
import { handleAddExpense } from './components/expenses.js';
import UI from './ui.js';

console.log("Imported loadUserData from database.js:", loadUserData);

// Global state
let currentUser = null;
let currentTripId = null;
let editingExpenseId = null;
let state = {
  trips: [],
  participants: {},
  expenses: {}
};

// Initialize the app
function init() {
  console.log("Initializing app...");

  const today = new Date().toISOString().split('T')[0];
  const expDate = document.getElementById("expDate");
  const editExpDate = document.getElementById("editExpDate");
  if (expDate) expDate.value = today;
  if (editExpDate) editExpDate.value = today;

  if (!supabase) {
    console.error("Supabase not initialized");
    showNotification("Supabase client not available", "error");
    return;
  }

  supabase.auth.getSession().then(({ data: { session } }) => {
    console.log("Session check:", session);
    if (session?.user) {
      currentUser = session.user;
      UI.showAppUI();
      loadAndRenderUserData();
    } else {
      UI.showLoginUI();
    }
  });

  supabase.auth.onAuthStateChange((event, session) => {
    console.log("Auth state changed:", event, session);
    if (event === 'SIGNED_IN' && session?.user) {
      currentUser = session.user;
      UI.showAppUI();
      loadAndRenderUserData();
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      UI.showLoginUI();
    }
  });

  setupEventListeners();
  UI.setupTabNavigation();
}

// Load user data and refresh UI
async function loadAndRenderUserData() {
  if (!currentUser) return;
  try {
    console.log("Loading user data for:", currentUser.id);
    const userData = await loadUserData(currentUser.id);
    state = userData;
    refreshUI();
  } catch (err) {
    console.error("Failed to load user data:", err);
    showNotification("Error loading user data", "error");
  }
}

// Refresh UI
function refreshUI() {
  currentTripId = UI.refreshTripSelect(state.trips, currentTripId, handleTripChange);
  UI.refreshTripsUI(state.trips, handleTripSelect);

  if (currentTripId && state[currentTripId]) {
    const currentTrip = state[currentTripId];
    UI.refreshParticipantsUI(currentTrip.participants);
    UI.refreshSplitRows("splitRows", "splitSummary", "expAmt", "expSplitType", currentTrip.participants);
    UI.refreshExpensesUI(currentTrip.expenses, currentTrip.participants);
    UI.refreshBalancesUI(currentTripId, currentTrip.participants, currentTrip.expenses);
    UI.refreshOverview(currentTripId, currentTrip.expenses, currentTrip.participants);
  }
}

function handleTripChange(tripId) {
  currentTripId = tripId;
  refreshUI();
}

function handleTripSelect(tripId) {
  currentTripId = tripId;
  refreshUI();
}

// Event listeners
function setupEventListeners() {
  const bind = (id, event, handler) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  };

  bind("loginBtn", "click", handleLogin);
  bind("registerBtn", "click", handleRegister);
  bind("showRegister", "click", e => { e.preventDefault(); UI.showRegisterForm(); });
  bind("showLogin", "click", e => { e.preventDefault(); UI.showLoginForm(); });
  bind("logoutBtn", "click", handleLogout);
  bind("addTripBtn", "click", handleAddTrip);
  bind("deleteTripBtn", "click", handleDeleteTrip);
  bind("addParticipantBtn", "click", handleAddParticipant);
  bind("expSplitType", "change", handleSplitTypeChange);
  bind("expAmt", "input", handleAmountChange);
  bind("splitRows", "input", handleSplitInput);
  bind("addExpenseBtn", "click", handleAddExpenseClick);
  bind("editExpSplitType", "change", handleEditSplitTypeChange);
  bind("editExpAmt", "input", handleEditAmountChange);
  bind("editSplitRows", "input", handleEditSplitInput);
  bind("saveExpenseBtn", "click", handleSaveExpense);
  bind("closeModalBtn", "click", closeEditExpenseModal);

  const modalClose = document.querySelector(".modal-close");
  if (modalClose) modalClose.addEventListener("click", closeEditExpenseModal);

  window.addEventListener("click", event => {
    const modal = document.getElementById("editExpenseModal");
    if (event.target === modal) closeEditExpenseModal();
  });
}

// Auth handlers
async function handleLogin() {
  console.log("Login button clicked");

  const email = document.getElementById("loginEmail")?.value;
  const password = document.getElementById("loginPassword")?.value;

  if (!email || !password) {
    showNotification("Please enter both email and password", "error");
    return;
  }

  try {
    currentUser = await login(email, password);
    console.log("Login result:", currentUser);

    if (currentUser) {
      UI.showAppUI();
      loadAndRenderUserData();
    } else {
      showNotification("Login failed. Please check your credentials.", "error");
    }
  } catch (err) {
    console.error("Login error:", err);
    showNotification("An error occurred during login.", "error");
  }
}

async function handleRegister() {
  const name = document.getElementById("registerName")?.value;
  const email = document.getElementById("registerEmail")?.value;
  const password = document.getElementById("registerPassword")?.value;

  if (!name || !email || !password) {
    showNotification("Please fill all registration fields", "error");
    return;
  }

  currentUser = await register(name, email, password);
}

async function handleLogout() {
  const success = await logout();
  if (success) {
    currentUser = null;
    state = { trips: [], participants: {}, expenses: {} };
    UI.showLoginUI();
  }
}

// Trip handlers
async function handleAddTrip() {
  const name = document.getElementById("tripName")?.value.trim();
  const curr = document.getElementById("tripCurrency")?.value.trim() || "INR";

  if (!name) {
    showNotification("Please enter a trip name", "error");
    return;
  }

  const newTrip = await addTrip(name, curr, currentUser.id);
  if (newTrip) {
    state[newTrip.id] = { ...newTrip, participants: [], expenses: [] };
    state.trips.push(newTrip);
    refreshUI();
    document.getElementById("tripName").value = "";
    document.getElementById("tripCurrency").value = "";
  }
}

async function handleDeleteTrip() {
  if (!currentTripId) return;
  const trip = state.trips.find(t => t.id === currentTripId);
  if (!trip) return;

  if (confirm(`Delete trip "${trip.name}"? This cannot be undone.`)) {
    const success = await deleteTrip(currentTripId);
    if (success) {
      state.trips = state.trips.filter(t => t.id !== currentTripId);
      delete state[currentTripId];
      currentTripId = state.trips[0]?.id || null;
      refreshUI();
    }
  }
}

async function handleAddParticipant() {
  if (!currentTripId) {
    showNotification("Select or create a trip first", "error");
    return;
  }

  const name = document.getElementById("participantName")?.value.trim();
  if (!name) {
    showNotification("Enter a participant name", "error");
    return;
  }

  const newParticipant = await addParticipant(currentTripId, name);
  if (newParticipant) {
    state[currentTripId].participants.push(newParticipant);
    UI.refreshParticipantsUI(state[currentTripId].participants);
    UI.refreshSplitRows("splitRows", "splitSummary", "expAmt", "expSplitType", state[currentTripId].participants);
    UI.refreshBalancesUI(currentTripId, state[currentTripId].participants, state[currentTripId].expenses);
    UI.refreshOverview(currentTripId, state[currentTripId].expenses, state[currentTripId].participants);
    document.getElementById("participantName").value = "";
  }
}

// Expense handlers
function handleSplitTypeChange() {
  if (!currentTripId) return;
  UI.refreshSplitRows("splitRows", "splitSummary", "expAmt", "expSplitType", state[currentTripId].participants);
}

function handleAmountChange() {
  UI.updateSplitSummary("splitSummary", "expAmt", "splitRows", state[currentTripId].participants);
}

function handleSplitInput() {
  UI.updateSplitSummary("splitSummary", "expAmt", "splitRows", state[currentTripId].participants);
}

// Placeholder for modal expense editing
async function handleAddExpenseClick() {
  if (!currentTripId || !state[currentTripId]) {
    showNotification("Select a trip before adding expenses", "error");
    return;
  }

  const trip = state[currentTripId];
  const desc = document.getElementById("expDesc")?.value.trim();
  const amt = parseFloat(document.getElementById("expAmt")?.value || "0");
  const date = document.getElementById("expDate")?.value;
  const payer = document.getElementById("expPayer")?.value;
  const type = document.getElementById("expSplitType")?.value;
  const category = document.getElementById("expCategory")?.value.trim();
  const note = document.getElementById("expNote")?.value.trim();

  if (!desc || !amt || !date || !payer || !type) {
    showNotification("Please fill all required expense fields", "error");
    return;
  }

  const expenseData = {
    desc,
    amount: amt,
    date,
    payer_id: payer,
    split_type: type,
    category,
    note
  };

  const newExpense = await handleAddExpense(currentTripId, expenseData, trip.participants);
  if (newExpense) {
    trip.expenses.unshift(newExpense);
    refreshUI();

    // Clear form
    document.getElementById("expDesc").value = "";
    document.getElementById("expAmt").value = "";
    document.getElementById("expDate").value = new Date().toISOString().split("T")[0];
    document.getElementById("expCategory").value = "";
    document.getElementById("expNote").value = "";
  }
}


function handleEditSplitTypeChange() {}
function handleEditAmountChange() {}
function handleEditSplitInput() {}
function handleSaveExpense() {}
function closeEditExpenseModal() {}

// Start the app
init();




