const SUPABASE_URL = "https://gsdsldjactyltkxwbdiw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZHNsZGphY3R5bHRreHdiZGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDUxNTcsImV4cCI6MjA3MDA4MTE1N30.1hLGHX44ipgsJDIpOPHM3mU3CgvC86VdJtFLyYGtlR0";
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function toggleForms() {
  document.getElementById("login-form").classList.toggle("hidden");
  document.getElementById("register-form").classList.toggle("hidden");
}

async function register() {
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;

  if (!email || !password) {
    showToast("⚠️ Completa todos los campos.", "warning");
    return;
  }

  const { error } = await client.auth.signUp({ email, password });

  if (error) {
    showToast("❌ " + error.message, "error");
  } else {
    showToast("✅ Registro exitoso. Revisa tu correo.", "success");
    toggleForms();
  }
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    showToast("⚠️ Completa todos los campos.", "warning");
    return;
  }

  const { error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    showToast("❌ " + error.message, "error");
  } else {
    showToast("✅ Sesión iniciada.", "success");
    window.location.href = "dashboard.html";
  }
}
