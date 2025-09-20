import { refreshSplitRows, updateSplitSummary } from './components/expenses.js';
import { refreshParticipantsUI } from './components/participants.js';
import { refreshTripSelect, refreshTripsUI } from './components/trips.js';
import { refreshBalancesUI } from './components/settlements.js';
import { computeBalances } from './utilities.js';

// UI management functions
export function showLoginUI() {
  document.getElementById("loginSection").style.display = "block";
  document.getElementById("registerSection").style.display = "none";
  document.getElementById("appContent").style.display = "none";
  document.getElementById("logoutBtn").style.display = "none";
}

export function showAppUI() {
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("registerSection").style.display = "none";
  document.getElementById("appContent").style.display = "block";
  document.getElementById("logoutBtn").style.display = "block";
}

export function showLoginForm() {
  document.getElementById("loginSection").style.display = "block";
  document.getElementById("registerSection").style.display = "none";
}

export function showRegisterForm() {
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("registerSection").style.display = "block";
}

export function refreshExpensesUI(expenses, participants, containerId = "expensesTbody", recentContainerId = "recent-expenses") {
  const tbody = document.getElementById(containerId);
  const recentTbody = document.getElementById(recentContainerId);
  tbody.innerHTML = "";
  recentTbody.innerHTML = "";

  if (!expenses || expenses.length === 0) {
    tbody.innerHTML = "<tr><td colspan='6' style='text-align: center;'>No expenses yet</td></tr>";
    recentTbody.innerHTML = "<tr><td colspan='6' style='text-align: center;'>No expenses yet</td></tr>";
    return;
  }

  const recentExpenses = [...expenses].slice(0, 5);
  recentExpenses.forEach(e => {
    const payer = participants.find(p => p.id === e.payer_id)?.name || "Unknown";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.date || ""}</td>
      <td>${e.description}</td>
      <td>${e.amount.toFixed(2)}</td>
      <td>${payer}</td>
      <td><span class="pill ${e.split_type}">${e.split_type}</span></td>
      <td class="action-buttons">
        <button class="btn-icon secondary edit-expense" data-id="${e.id}"><i class="fas fa-edit"></i></button>
        <button class="btn-icon danger delete-expense" data-id="${e.id}"><i class="fas fa-trash"></i></button>
      </td>
    `;
    recentTbody.appendChild(tr);
  });

  expenses.forEach(e => {
    const payer = participants.find(p => p.id === e.payer_id)?.name || "Unknown";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.date || ""}</td>
      <td>${e.description}</td>
      <td>${e.amount.toFixed(2)}</td>
      <td>${payer}</td>
      <td><span class="pill ${e.split_type}">${e.split_type}</span></td>
      <td class="action-buttons">
        <button class="btn-icon secondary edit-expense" data-id="${e.id}"><i class="fas fa-edit"></i></button>
        <button class="btn-icon danger delete-expense" data-id="${e.id}"><i class="fas fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // ✅ Attach handlers after rendering
  document.querySelectorAll(".edit-expense").forEach(btn => {
    btn.addEventListener("click", () => {
      const expenseId = btn.getAttribute("data-id");
      const expense = expenses.find(e => e.id === expenseId);
      if (expense) {
        window.editingExpenseId = expense.id;
        window.openEditExpenseModal(expense);
      }
    });
  });

  document.querySelectorAll(".delete-expense").forEach(btn => {
    btn.addEventListener("click", async () => {
      const expenseId = btn.getAttribute("data-id");
      if (confirm("Delete this expense?")) {
        const success = await window.deleteExpense(expenseId);
        if (success) {
          const trip = window.state[window.currentTripId];
          trip.expenses = trip.expenses.filter(e => e.id !== expenseId);
          window.refreshUI();
        }
      }
    });
  });
}

export function refreshOverview(tripId, expenses, participants, 
                               totalExpensesId = "total-expenses", 
                               participantsCountId = "participants-count", 
                               outstandingAmountId = "outstanding-amount", 
                               expensesCountId = "expenses-count") {
  if (!tripId) {
    document.getElementById(totalExpensesId).textContent = "0.00";
    document.getElementById(participantsCountId).textContent = "0";
    document.getElementById(outstandingAmountId).textContent = "0.00";
    document.getElementById(expensesCountId).textContent = "0 expenses";
    return;
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  document.getElementById(totalExpensesId).textContent = totalExpenses.toFixed(2);
  document.getElementById(expensesCountId).textContent = `${expenses.length} expense${expenses.length !== 1 ? 's' : ''}`;
  document.getElementById(participantsCountId).textContent = participants.length;

  const { bal } = computeBalances(tripId, participants, expenses);
  const outstanding = bal.reduce((sum, b) => b > 0 ? sum + b : sum, 0);
  document.getElementById(outstandingAmountId).textContent = outstanding.toFixed(2);
}

export function setupTabNavigation() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      const tabId = btn.getAttribute("data-tab");
      document.getElementById(`${tabId}-tab`).classList.add("active");
    });
  });
}

// Export all UI functions for use in app.js
export default {
  showLoginUI,
  showAppUI,
  showLoginForm,
  showRegisterForm,
  refreshExpensesUI,
  refreshOverview,
  refreshSplitRows,
  updateSplitSummary,
  refreshParticipantsUI,
  refreshTripSelect,
  refreshTripsUI,
  refreshBalancesUI,
  setupTabNavigation
};
