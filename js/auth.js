const SUPABASE_URL = "https://gsdsldjactyltkxwbdiw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZHNsZGphY3R5bHRreHdiZGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDUxNTcsImV4cCI6MjA3MDA4MTE1N30.1hLGHX44ipgsJDIpOPHM3mU3CgvC86VdJtFLyYGtlR0";
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function register() {
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value.trim();

  if (!email || !password) {
    showToast('warning', 'Por favor completa todos los campos');
    return;
  }

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    showToast('error', error.message);
  } else {
    showToast('success', 'Registro exitoso. Revisa tu correo para confirmar.');
    toggleForms();
  }
}

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    showToast('warning', 'Por favor completa todos los campos');
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    showToast('error', error.message);
  } else {
    showToast('success', 'Sesión iniciada');
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1500);
  }
}

function toggleForms() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  loginForm.classList.toggle('active');
  registerForm.classList.toggle('active');
}
V