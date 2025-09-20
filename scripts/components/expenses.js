import { addExpense, updateExpense, deleteExpense } from '../database.js';
import { showNotification } from '../utilities.js';

// Expense-related functions
export function getSplitEntries(containerId = "splitRows") {
  const type = document.getElementById("expSplitType").value;
  const entries = [];
  const rows = document.querySelectorAll(`#${containerId} .split-row`);
  rows.forEach(r => {
    const pid = r.dataset.pid;
    const val = parseFloat(r.querySelector("input").value);
    entries.push({ participant_id: pid, value: isNaN(val) ? 0 : val });
  });
  return { type, entries };
}

export function refreshSplitRows(containerId = "splitRows", summaryId = "splitSummary", 
                                amountId = "expAmt", typeId = "expSplitType", participants = []) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  
  if (participants.length === 0) {
    container.innerHTML = '<div class="muted">Add participants first to configure expense splitting</div>';
    return;
  }
  
  const type = document.getElementById(typeId).value;
  
  participants.forEach(p => {
    const row = document.createElement("div");
    row.className = "split-row";
    row.dataset.pid = p.id;
    
    const label = document.createElement("label");
    label.textContent = p.name;
    
    let input = document.createElement("input");
    input.type = "number";
    input.step = "0.01";
    input.min = "0";
    
    switch(type) {
      case "equal":
        input.disabled = true;
        input.value = "1";
        input.placeholder = "Equal";
        break;
      case "shares":
        input.placeholder = "Shares (e.g., 2)";
        input.value = "1";
        break;
      case "percent":
        input.placeholder = "Percentage (e.g., 50)";
        break;
      case "exact":
        input.placeholder = "Exact amount";
        break;
    }
    
    row.appendChild(label);
    row.appendChild(input);
    container.appendChild(row);
  });
  updateSplitSummary(summaryId, amountId, containerId, participants);
}

export function updateSplitSummary(summaryId = "splitSummary", amountId = "expAmt", 
                                  containerId = "splitRows", participants = []) {
  const summary = document.getElementById(summaryId);
  const amt = parseFloat(document.getElementById(amountId).value || "0");
  const { type, entries } = getSplitEntries(containerId);
  
  if (participants.length === 0 || !amt) {
    summary.innerHTML = '<div class="muted">Enter an amount to see split details</div>';
    return;
  }

  let html = "";
  if (type === "equal") {
    const per = amt / participants.length;
    html = `<strong>Equal split:</strong> ${participants.length} people → <strong>${per.toFixed(2)}</strong> each`;
  } else if (type === "shares") {
    const sumShares = entries.reduce((s, e) => s + (e.value || 0), 0);
    if (sumShares <= 0) {
      html = '<span class="danger">Enter positive share weights.</span>';
    } else {
      const parts = entries.map(e => {
        const shareAmt = amt * (e.value / sumShares);
        const name = (participants.find(p => p.id === e.participant_id) || {}).name || "?";
        return `${name}: <strong>${shareAmt.toFixed(2)}</strong> (${e.value} share${e.value !== 1 ? 's' : ''})`;
      });
      html = `<strong>Shares total:</strong> ${sumShares}<br><strong>Allocations:</strong> ${parts.join(", ")}`;
    }
  } else if (type === "percent") {
    const sumPct = entries.reduce((s, e) => s + (e.value || 0), 0);
    const parts = entries.map(e => {
      const name = (participants.find(p => p.id === e.participant_id) || {}).name || "?";
      const v = e.value || 0;
      return `${name}: <strong>${(amt * v / 100).toFixed(2)}</strong> (${v.toFixed(2)}%)`;
    });
    html = `<strong>Percent total:</strong> ${sumPct.toFixed(2)}%<br><strong>Allocations:</strong> ${parts.join(", ")}`;
  } else if (type === "exact") {
    const sumAmt = entries.reduce((s, e) => s + (e.value || 0), 0);
    const diff = Math.abs(sumAmt - amt);
    const parts = entries.map(e => {
      const name = (participants.find(p => p.id === e.participant_id) || {}).name || "?";
      const v = e.value || 0;
      return `${name}: <strong>${v.toFixed(2)}</strong>`;
    });
    
    html = `<strong>Exact total:</strong> ${sumAmt.toFixed(2)}`;
    if (diff > 0.01) {
      html += ` <span class="danger">(Difference: ${diff.toFixed(2)})</span>`;
    }
    html += `<br><strong>Allocations:</strong> ${parts.join(", ")}`;
  }
  summary.innerHTML = html;
}

export async function handleAddExpense(tripId, expenseData, participants) {
  const { entries } = getSplitEntries();
  let splits = [];
  
  if (expenseData.split_type === "equal") {
    splits = participants.map(p => ({ participant_id: p.id, value: 1 }));
  } else {
    splits = entries;
  }

  // Validate splits
  if (expenseData.split_type === "percent") {
    const total = splits.reduce((s, x) => s + (x.value || 0), 0);
    if (Math.abs(total - 100) > 0.01) {
      showNotification("Percent split must total 100%", "error");
      return null;
    }
  }
  
  if (expenseData.split_type === "exact") {
    const total = splits.reduce((s, x) => s + (x.value || 0), 0);
    if (Math.abs(total - expenseData.amount) > 0.01) {
      showNotification("Exact amounts must sum to total amount", "error");
      return null;
    }
  }
  
  if (expenseData.split_type === "shares") {
    const total = splits.reduce((s, x) => s + (x.value || 0), 0);
    if (total <= 0) {
      showNotification("Shares must sum to a positive number", "error");
      return null;
    }
  }

  const completeExpenseData = {
    ...expenseData,
    splits,
    trip_id: tripId
  };

  return await addExpense(completeExpenseData);
}