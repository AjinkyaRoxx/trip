import { login, register, logout, supabase } from './auth.js';
import { loadUserData, addTrip, deleteTrip, addParticipant } from './database.js';
import { showNotification } from './utilities.js';
import UI from './ui.js';

// Debug: verify imported function
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
  const today = new Date().toISOString().split('T')[0];
  document.getElementById("expDate").value = today;
  document.getElementById("editExpDate").value = today;

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      currentUser = session.user;
      UI.showAppUI();
      loadAndRenderUserData();
    } else {
      UI.showLoginUI();
    }
  });

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
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
  const userData = await loadUserData(currentUser.id);
  state = userData;
  refreshUI();
}

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
  document.getElementById('tripSelect').value = tripId;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  document.querySelector('[data-tab="overview"]').classList.add('active');
  document.getElementById('overview-tab').classList.add('active');
  refreshUI();
}

function setupEventListeners() {
  document.getElementById("loginBtn").addEventListener("click", handleLogin);
  document.getElementById("registerBtn").addEventListener("click", handleRegister);
  document.getElementById("showRegister").addEventListener("click", (e) => {
    e.preventDefault();
    UI.showRegisterForm();
  });
  document.getElementById("showLogin").addEventListener("click", (e) => {
    e.preventDefault();
    UI.showLoginForm();
  });
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);
  document.getElementById("addTripBtn").addEventListener("click", handleAddTrip);
  document.getElementById("deleteTripBtn").addEventListener("click", handleDeleteTrip);
  document.getElementById("addParticipantBtn").addEventListener("click", handleAddParticipant);
  document.getElementById("expSplitType").addEventListener("change", handleSplitTypeChange);
  document.getElementById("expAmt").addEventListener("input", handleAmountChange);
  document.getElementById("splitRows").addEventListener("input", handleSplitInput);
  document.getElementById("addExpenseBtn").addEventListener("click", handleAddExpense);
  document.getElementById("editExpSplitType").addEventListener("change", handleEditSplitTypeChange);
  document.getElementById("editExpAmt").addEventListener("input", handleEditAmountChange);
  document.getElementById("editSplitRows").addEventListener("input", handleEditSplitInput);
  document.getElementById("saveExpenseBtn").addEventListener("click", handleSaveExpense);
  document.getElementById("closeModalBtn").addEventListener("click", closeEditExpenseModal);
  document.querySelector(".modal-close").addEventListener("click", closeEditExpenseModal);

  window.addEventListener("click", (event) => {
    const modal = document.getElementById("editExpenseModal");
    if (event.target === modal) {
      closeEditExpenseModal();
    }
  });
}

async function handleLogin() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  currentUser = await login(email, password);
  if (currentUser) {
    loadAndRenderUserData();
  }
}

async function handleRegister() {
  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
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

async function handleAddTrip() {
  const name = document.getElementById("tripName").value.trim();
  const curr = document.getElementById("tripCurrency").value.trim() || "INR";
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

  if (confirm(`Are you sure you want to delete the trip "${trip.name}"? This action cannot be undone.`)) {
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
    showNotification("Please select or create a trip first", "error");
    return;
  }

  const name = document.getElementById("participantName").value.trim();
  if (!name) {
    showNotification("Please enter a participant name", "error");
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

// Initialize the app
init();
