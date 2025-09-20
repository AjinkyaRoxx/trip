// Utility functions
export function showNotification(message, type = "success") {
  const notification = document.getElementById("notification");
  notification.className = `notification ${type}`;
  notification.querySelector(".notification-content").textContent = message;
  
  const icon = notification.querySelector("i");
  icon.className = type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle";
  
  notification.classList.add("show");
  
  setTimeout(() => {
    notification.classList.remove("show");
  }, 3000);
}

export function id() { 
  return Math.random().toString(36).slice(2, 10); 
}

export function computeAllocationsForExpense(tripId, e, participants) {
  const people = participants || [];
  const n = people.length || 1;
  const alloc = new Map(people.map(p => [p.id, 0]));
  const type = e.split_type;

  if (type === "equal") {
    const per = e.amount / n;
    people.forEach(p => alloc.set(p.id, per));
  } else if (type === "shares") {
    const sumShares = (e.splits || []).reduce((s, x) => s + (x.value || 0), 0);
    const denom = sumShares > 0 ? sumShares : n;
    (e.splits || []).forEach(x => {
      alloc.set(x.participant_id, e.amount * ((x.value || 0) / denom));
    });
  } else if (type === "percent") {
    (e.splits || []).forEach(x => {
      alloc.set(x.participant_id, e.amount * ((x.value || 0) / 100));
    });
  } else if (type === "exact") {
    (e.splits || []).forEach(x => {
      alloc.set(x.participant_id, (x.value || 0));
    });
  }

  return alloc;
}

export function computeBalances(tripId, participants, expenses) {
  const people = participants || [];
  const idx = new Map(people.map((p, i) => [p.id, i]));
  const bal = Array(people.length).fill(0);

  expenses.forEach(e => {
    const payerIndex = idx.get(e.payer_id);
    if (payerIndex == null) return;
    const alloc = computeAllocationsForExpense(tripId, e, people);
    // Credit payer by amount paid; debit each participant by their allocation
    people.forEach((p, i) => {
      const owed = alloc.get(p.id) || 0;
      bal[i] -= owed;
    });
    bal[payerIndex] += e.amount;
  });

  return { participants: people, bal };
}

// Greedy settlement: match largest debtor to largest creditor
export function greedySettlements(bal, names) {
  const eps = 1e-6;
  const creditors = [];
  const debtors = [];
  bal.forEach((v, i) => {
    if (v > eps) creditors.push({ i, v });
    else if (v < -eps) debtors.push({ i, v: -v });
  });
  creditors.sort((a, b) => b.v - a.v);
  debtors.sort((a, b) => b.v - a.v);

  const res = [];
  let ci = 0, di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const give = Math.min(creditors[ci].v, debtors[di].v);
    res.push({
      from: names[debtors[di].i],
      to: names[creditors[ci].i],
      amount: give.toFixed(2)
    });
    creditors[ci].v -= give;
    debtors[di].v -= give;
    if (creditors[ci].v <= eps) ci++;
    if (debtors[di].v <= eps) di++;
  }
  return res;
}