import { addTrip, deleteTrip } from '../database.js';

// Trip-related functions
export function refreshTripSelect(trips, currentTripId, onTripChange) {
  const sel = document.getElementById("tripSelect");
  sel.innerHTML = "";
  
  trips.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = `${t.name} (${t.currency})`;
    sel.appendChild(opt);
  });
  
  if (trips.length) {
    if (!currentTripId || !trips.find(t => t.id === currentTripId)) {
      currentTripId = trips[0].id;
    }
    sel.value = currentTripId;
  } else {
    currentTripId = null;
  }
  
  sel.onchange = (e) => {
    currentTripId = e.target.value;
    if (onTripChange) onTripChange(currentTripId);
  };
  
  return currentTripId;
}

export function refreshTripsUI(trips, onTripSelect) {
  const container = document.getElementById("tripsList");
  container.innerHTML = "";
  
  if (trips.length === 0) {
    container.innerHTML = '<div class="muted">No trips yet. Create your first trip above.</div>';
    return;
  }
  
  trips.forEach(trip => {
    const card = document.createElement("div");
    card.className = "trip-card";
    card.innerHTML = `
      <div class="trip-card-header">
        <div class="trip-card-name">${trip.name}</div>
        <div class="trip-card-currency">${trip.currency}</div>
      </div>
      <div class="trip-card-details">
        <div class="trip-card-stat">
          <div class="trip-card-value">${trip.expenses?.length || 0}</div>
          <div class="trip-card-label">Expenses</div>
        </div>
        <div class="trip-card-stat">
          <div class="trip-card-value">${trip.participants?.length || 0}</div>
          <div class="trip-card-label">People</div>
        </div>
        <div class="trip-card-stat">
          <div class="trip-card-value">${(trip.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0).toFixed(2)}</div>
          <div class="trip-card-label">Total</div>
        </div>
      </div>
    `;
    
    card.addEventListener('click', () => {
      if (onTripSelect) onTripSelect(trip.id);
    });
    
    container.appendChild(card);
  });
}