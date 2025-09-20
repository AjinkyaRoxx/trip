import { showNotification } from './utilities.js';

// Supabase configuration
const SUPABASE_URL = 'https://vydqnginpfmbufpboqgb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZHFuZ2lucGZtYnVmcGJvcWdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNzg5MjQsImV4cCI6MjA3Mzg1NDkyNH0.wi8vjgmYgbcxfLyplZ2yDeeWQatoIcTIBIjg0PpvzKM';

// ✅ Correct Supabase client initialization
export const supabase = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_KEY);

// ✅ Fallback: log if Supabase is not initialized
if (!supabase) {
  console.error('Supabase client not initialized. Check if supabase-js is loaded correctly.');
}

// ✅ Global error fallback
window.onerror = function(message, source, lineno, colno, error) {
  console.error("Global error:", message, "at", source + ":" + lineno + ":" + colno);
};

// 🔐 Login function
export async function login(email, password) {
  if (!supabase) return showNotification("Supabase not initialized", "error");

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) throw error;

    showNotification("Login successful!");
    return data.user;
  } catch (error) {
    console.error("Login error:", error);
    showNotification(error.message || "Login failed", "error");
    return null;
  }
}

// 🆕 Register function
export async function register(name, email, password) {
  if (!supabase) return showNotification("Supabase not initialized", "error");

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name }
      }
    });

    if (error) throw error;

    showNotification("Registration successful! Please check your email.");
    return data.user;
  } catch (error) {
    console.error("Registration error:", error);
    showNotification(error.message || "Registration failed", "error");
    return null;
  }
}

// 🚪 Logout function
export async function logout() {
  if (!supabase) return showNotification("Supabase not initialized", "error");

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    showNotification("Logged out successfully");
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    showNotification(error.message || "Logout failed", "error");
    return false;
  }
}
