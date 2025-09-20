import { supabase } from './auth.js';
import { showNotification } from './utilities.js';

// 🚀 Add a new trip
export async function addTrip(name, currency, userId) {
  try {
    const newTrip = {
      name,
      currency: currency || "INR",
      user_id: userId
    };

    const { data, error } = await supabase
      .from('trips')
      .insert(newTrip)
      .select()
      .single();

    if (error) throw error;

    showNotification(`Trip "${name}" created successfully`);
    return data;
  } catch (error) {
    showNotification("Error creating trip: " + error.message, "error");
    return null;
  }
}

// 🗑️ Delete a trip and its data
export async function deleteTrip(tripId) {
  try {
    await supabase.from('expenses').delete().eq('trip_id', tripId);
    await supabase.from('participants').delete().eq('trip_id', tripId);

    const { error } = await supabase.from('trips').delete().eq('id', tripId);
    if (error) throw error;

    showNotification("Trip deleted successfully");
    return true;
  } catch (error) {
    showNotification("Error deleting trip: " + error.message, "error");
    return false;
  }
}

// 👤 Add a participant
export async function addParticipant(tripId, name) {
  try {
    const newParticipant = {
      name: name.trim(),
      trip_id: tripId
    };

    const { data, error } = await supabase
      .from('participants')
      .insert(newParticipant)
      .select()
      .single();

    if (error) throw error;

    showNotification(`Participant "${name}" added successfully`);
    return data;
  } catch (error) {
    showNotification("Error adding participant: " + error.message, "error");
    return null;
  }
}

// ❌ Remove a participant
export async function removeParticipant(tripId, participantId) {
  try {
    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('id', participantId);

    if (error) throw error;

    showNotification("Participant removed successfully");
    return true;
  } catch (error) {
    showNotification("Error removing participant: " + error.message, "error");
    return false;
  }
}

// 💸 Add an expense
export async function addExpense(expenseData) {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expenseData)
      .select()
      .single();

    if (error) throw error;

    showNotification(`Expense "${expenseData.description}" added successfully`);
    return data;
  } catch (error) {
    showNotification("Error adding expense: " + error.message, "error");
    return null;
  }
}

// ✏️ Update an expense
export async function updateExpense(expenseId, expenseData) {
  try {
    const { error } = await supabase
      .from('expenses')
      .update(expenseData)
      .eq('id', expenseId);

    if (error) throw error;

    showNotification(`Expense "${expenseData.desc}" updated successfully`);
    return true;
  } catch (error) {
    showNotification("Error updating expense: " + error.message, "error");
    return false;
  }
}

// 🗑️ Delete an expense
export async function deleteExpense(expenseId) {
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) throw error;

    showNotification("Expense deleted successfully");
    return true;
  } catch (error) {
    showNotification("Error deleting expense: " + error.message, "error");
    return false;
  }
}

// 📦 Load all user data
export async function loadUserData(userId) {
  try {
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (tripsError) throw tripsError;

    const state = {
      trips: trips || []
    };

    for (const trip of state.trips) {
      const { data: participants, error: partsError } = await supabase
        .from('participants')
        .select('*')
        .eq('trip_id', trip.id)
        .order('created_at');

      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('trip_id', trip.id)
        .order('date', { ascending: false });

      state[trip.id] = {
        ...trip,
        participants: participants || [],
        expenses: expenses || []
      };
    }

    return state;
  } catch (error) {
    console.error("Error loading user data:", error);
    showNotification("Error loading data: " + error.message, "error");
    return {
      trips: []
    };
  }
}

