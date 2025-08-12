// Conexión a Supabase
const SUPABASE_URL = "https://gsdsldjactyltkxwbdiw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZHNsZGphY3R5bHRreHdiZGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDUxNTcsImV4cCI6MjA3MDA4MTE1N30.1hLGHX44ipgsJDIpOPHM3mU3CgvC86VdJtFLyYGtlR0";
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
// Crear cliente Supabase
export const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Función para mostrar notificaciones tipo toast (usa SweetAlert2 para modernidad)
export function showToast(icon, title, timer = 2500) {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: icon,       // 'success', 'error', 'warning', 'info', 'question'
    title: title,
    showConfirmButton: false,
    timer: timer,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  });
}
