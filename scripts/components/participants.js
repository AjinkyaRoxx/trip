import { addParticipant, removeParticipant } from '../database.js';
import { showNotification } from '../utilities.js';

// Participant-related functions
export function refreshParticipantsUI(participants, containerId = "participantsList", 
                                     payerSelectId = "expPayer", editPayerSelectId = "editExpPayer") {
  const ul = document.getElementById(containerId);
  const payerSel = document.getElementById(payerSelectId);
  const editPayerSel = document.getElementById(editPayerSelectId);

  ul.innerHTML = "";
  payerSel.innerHTML = "";
  editPayerSel.innerHTML = "";

  if (!participants || participants.length === 0) {
    ul.innerHTML = '<div class="muted">No participants added yet</div>';
    return;
  }

  participants.forEach(p => {
    if (!p.id || !p.name) {
      console.warn("Skipping invalid participant:", p);
      return;
    }

    const item = document.createElement("div");
    item.className = "participant-item";
    item.innerHTML = `
      <span>${p.name}</span>
      <button type="button" title="Remove participant" data-id="${p.id}">
        <i class="fas fa-times"></i>
      </button>
    `;

    const removeBtn = item.querySelector("button");
    removeBtn.onclick = async () => {
      if (!p.id) {
        console.warn("Missing participant ID for removal:", p);
        showNotification("Unable to remove participant: missing ID", "error");
        return;
      }

      const success = await removeParticipant(p.trip_id, p.id);
      if (!success) {
        showNotification("Failed to remove participant", "error");
      }
    };

    ul.appendChild(item);

    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    payerSel.appendChild(opt);

    const editOpt = document.createElement("option");
    editOpt.value = p.id;
    editOpt.textContent = p.name;
    editPayerSel.appendChild(editOpt);
  });
}
