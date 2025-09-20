import { computeBalances, greedySettlements } from '../utilities.js';

// Settlement-related functions
export function refreshBalancesUI(tripId, participants, expenses, balancesListId = "balancesList", 
                                settlementCardsId = "settlementCards") {
  const ulB = document.getElementById(balancesListId);
  const settlementCards = document.getElementById(settlementCardsId);
  ulB.innerHTML = "";
  settlementCards.innerHTML = "";
  
  if (!tripId) {
    ulB.innerHTML = "<li class='muted'>No trip selected</li>";
    settlementCards.innerHTML = "<div class='muted'>No trip selected</div>";
    return;
  }
  
  if (participants.length === 0) {
    ulB.innerHTML = "<li class='muted'>Add participants to see balances</li>";
    settlementCards.innerHTML = "<div class='muted'>Add participants to see settlements</div>";
    return;
  }
  
  const { bal } = computeBalances(tripId, participants, expenses);
  
  participants.forEach((p, i) => {
    const li = document.createElement("li");
    li.className = "balance-item";
    
    const balanceClass = bal[i] > 0 ? "balance-positive" : bal[i] < 0 ? "balance-negative" : "";
    const sign = bal[i] > 0 ? "+" : "";
    
    li.innerHTML = `
      <strong>${p.name}:</strong> 
      <span class="${balanceClass}">${sign}${bal[i].toFixed(2)}</span>
    `;
    ulB.appendChild(li);
  });
  
  const names = participants.map(p => p.name);
  const settlements = greedySettlements(bal.slice(), names);
  
  if (settlements.length === 0) {
    settlementCards.innerHTML = "<div class='muted'>All balances are settled</div>";
    return;
  }
  
  settlements.forEach(settlement => {
    const card = document.createElement("div");
    card.className = "settlement-card";
    
    // Get first letters for avatars
    const fromInitial = settlement.from.charAt(0).toUpperCase();
    const toInitial = settlement.to.charAt(0).toUpperCase();
    
    card.innerHTML = `
      <div class="settlement-header">
        <div class="settlement-title">Settlement</div>
        <div class="settlement-amount">${settlement.amount}</div>
      </div>
      <div class="settlement-parties">
        <div class="settlement-from">
          <div class="party-avatar">${fromInitial}</div>
          <div class="party-name">${settlement.from}</div>
        </div>
        <div class="settlement-arrow">
          <i class="fas fa-arrow-right"></i>
        </div>
        <div class="settlement-to">
          <div class="party-avatar">${toInitial}</div>
          <div class="party-name">${settlement.to}</div>
        </div>
      </div>
      <div class="settlement-footer">
        <i class="fas fa-info-circle"></i> ${settlement.from} pays ${settlement.to} ${settlement.amount}
      </div>
    `;
    settlementCards.appendChild(card);
  });
}