const SUPABASE_URL = "https://gsdsldjactyltkxwbdiw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZHNsZGphY3R5bHRreHdiZGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDUxNTcsImV4cCI6MjA3MDA4MTE1N30.1hLGHX44ipgsJDIpOPHM3mU3CgvC86VdJtFLyYGtlR0";
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let idEnEdicion = null;

const btnAgregarActualizar = document.getElementById("btnAgregarActualizar");
btnAgregarActualizar.addEventListener("click", agregarOActualizarEstudiante);

async function agregarOActualizarEstudiante() {
  const nombre = document.getElementById("nombre").value.trim();
  const correo = document.getElementById("correo").value.trim();
  const clase = document.getElementById("clase").value.trim();

  if (!nombre || !correo || !clase) {
    alert("Por favor completa todos los campos.");
    return;
  }

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    alert("No estás autenticado.");
    return;
  }

  if (idEnEdicion) {
    const { error } = await client
      .from("estudiantes")
      .update({ nombre, correo, clase })
      .eq("id", idEnEdicion);

    if (error) {
      alert("Error al actualizar: " + error.message);
    } else {
      alert("Estudiante actualizado");
      limpiarFormulario();
    }
  } else {
    const { error } = await client.from("estudiantes").insert({
      nombre,
      correo,
      clase,
      user_id: user.id,
    });

    if (error) {
      alert("Error al agregar: " + error.message);
    } else {
      alert("Estudiante agregado");
      limpiarFormulario();
    }
  }
}

// Limpia formulario y reinicia estado edición
function limpiarFormulario() {
  document.getElementById("nombre").value = "";
  document.getElementById("correo").value = "";
  document.getElementById("clase").value = "";
  idEnEdicion = null;
  btnAgregarActualizar.textContent = "Agregar";
  document.querySelector("#form-estudiante h2").textContent = "Registrar estudiante";
}

// Carga estudiantes y actualiza UI
async function cargarEstudiantes() {
  const { data, error } = await client
    .from("estudiantes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    alert("Error al cargar estudiantes: " + error.message);
    return;
  }

  const lista = document.getElementById("lista-estudiantes");
  lista.innerHTML = "";

  data.forEach((est) => {
    const item = document.createElement("li");
    item.innerHTML = `
      ${escapeHTML(est.nombre)} (${escapeHTML(est.clase)})
      <div>
        <button onclick="editarEstudiante('${est.id}', '${escapeHTML(est.nombre)}', '${escapeHTML(est.correo)}', '${escapeHTML(est.clase)}')">✏</button>
        <button onclick="eliminarEstudiante('${est.id}')">🗑</button>
      </div>
    `;
    lista.appendChild(item);
  });
}

// Evita inyección en HTML
function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function editarEstudiante(id, nombre, correo, clase) {
  document.getElementById("nombre").value = nombre;
  document.getElementById("correo").value = correo;
  document.getElementById("clase").value = clase;
  idEnEdicion = id;
  btnAgregarActualizar.textContent = "Actualizar";
  document.querySelector("#form-estudiante h2").textContent = "Editar estudiante";
}

async function eliminarEstudiante(id) {
  if (!confirm("¿Seguro que quieres eliminar este estudiante?")) return;

  const { error } = await client.from("estudiantes").delete().eq("id", id);

  if (error) {
    alert("Error al eliminar: " + error.message);
  } else {
    alert("Estudiante eliminado");
  }
}

async function cargarEstudiantesSelect() {
  const { data, error } = await client
    .from("estudiantes")
    .select("id, nombre")
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error al cargar estudiantes para select:", error.message);
    return;
  }

  const select = document.getElementById("estudiante");
  select.innerHTML = "";

  data.forEach((est) => {
    const option = document.createElement("option");
    option.value = est.id;
    option.textContent = est.nombre;
    select.appendChild(option);
  });
}

async function cerrarSesion() {
  const { error } = await client.auth.signOut();

  if (error) {
    alert("Error al cerrar sesión: " + error.message);
  } else {
    localStorage.removeItem("token");
    alert("Sesión cerrada.");
    window.location.href = "index.html";
  }
}

// ** SUSCRIPCIÓN EN TIEMPO REAL para actualizar lista automáticamente **
function suscribirseCambios() {
  client
    .from('estudiantes')
    .on('INSERT', payload => {
      console.log('Estudiante agregado:', payload.new);
      cargarEstudiantes();
      cargarEstudiantesSelect();
    })
    .on('UPDATE', payload => {
      console.log('Estudiante actualizado:', payload.new);
      cargarEstudiantes();
      cargarEstudiantesSelect();
    })
    .on('DELETE', payload => {
      console.log('Estudiante eliminado:', payload.old);
      cargarEstudiantes();
      cargarEstudiantesSelect();
    })
    .subscribe();
}

// Inicialización al cargar página
document.addEventListener("DOMContentLoaded", () => {
  cargarEstudiantes();
  cargarEstudiantesSelect();
  suscribirseCambios();
});
