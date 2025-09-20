import { addParticipant, removeParticipant } from '../database.js';

// Participant-related functions
export function refreshParticipantsUI(participants, containerId = "participantsList", 
                                     payerSelectId = "expPayer", editPayerSelectId = "editExpPayer") {
  const ul = document.getElementById(containerId);
  const payerSel = document.getElementById(payerSelectId);
  const editPayerSel = document.getElementById(editPayerSelectId);
  
  ul.innerHTML = "";
  payerSel.innerHTML = "";
  editPayerSel.innerHTML = "";
  
  if (participants.length === 0) {
    ul.innerHTML = '<div class="muted">No participants added yet</div>';
    return;
  }
  
  participants.forEach(p => {
    const item = document.createElement("div");
    item.className = "participant-item";
    item.innerHTML = `
      <span>${p.name}</span>
      <button type="button" title="Remove participant">
        <i class="fas fa-times"></i>
      </button>
    `;
    item.querySelector("button").onclick = () => removeParticipant(p.id);
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