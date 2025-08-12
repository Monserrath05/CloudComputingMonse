const SUPABASE_URL = "https://gsdsldjactyltkxwbdiw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZHNsZGphY3R5bHRreHdiZGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDUxNTcsImV4cCI6MjA3MDA4MTE1N30.1hLGHX44ipgsJDIpOPHM3mU3CgvC86VdJtFLyYGtlR0";
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


let idEnEdicion = null; // ID para editar estudiante

// Toasts para notificaciones no bloqueantes
function toast(mensaje, tipo = "info") {
  const toastContainer = document.getElementById("toast-container");
  if (!toastContainer) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${tipo}`;
  toast.textContent = mensaje;

  toastContainer.appendChild(toast);

  // Aparece y desaparece
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 600);
  }, 3000);
}

// Escapar texto para evitar inyección
function escapeHTML(text) {
  return text.replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

// Limpiar formulario estudiante
function limpiarFormulario() {
  document.getElementById("nombre").value = "";
  document.getElementById("correo").value = "";
  document.getElementById("clase").value = "";
  idEnEdicion = null;
  btnAgregarActualizar.textContent = "Agregar";
}

// Cargar lista de estudiantes y mostrarlos
async function cargarEstudiantes() {
  const { data, error } = await client
    .from("estudiantes")
    .select("*")
    .order("created_at", { ascending: false });

  const lista = document.getElementById("lista-estudiantes");
  lista.innerHTML = "";

  if (error) {
    toast("Error al cargar estudiantes: " + error.message, "error");
    return;
  }

  if (!data || data.length === 0) {
    lista.innerHTML = "<li>No hay estudiantes registrados.</li>";
    return;
  }

  data.forEach((est) => {
    const item = document.createElement("li");
    item.classList.add("lista-estudiantes-item");
    item.innerHTML = `
      <span>${est.nombre} (${est.clase})</span>
      <div>
        <button onclick="editarEstudiante('${est.id}', '${escapeHTML(est.nombre)}', '${escapeHTML(est.correo)}', '${escapeHTML(est.clase)}')">✏</button>
        <button onclick="eliminarEstudiante('${est.id}')">🗑</button>
      </div>
    `;
    lista.appendChild(item);
  });
}

// Cargar select de estudiantes para subir archivo
async function cargarEstudiantesSelect() {
  const { data, error } = await client
    .from("estudiantes")
    .select("id, nombre")
    .order("nombre", { ascending: true });

  const select = document.getElementById("estudiante");
  select.innerHTML = "";

  if (error) {
    toast("Error al cargar estudiantes para selección: " + error.message, "error");
    return;
  }

  data.forEach((est) => {
    const option = document.createElement("option");
    option.value = est.id;
    option.textContent = est.nombre;
    select.appendChild(option);
  });
}

// Agregar o actualizar estudiante
async function agregarOActualizarEstudiante() {
  const nombre = document.getElementById("nombre").value.trim();
  const correo = document.getElementById("correo").value.trim();
  const clase = document.getElementById("clase").value.trim();

  if (!nombre || !correo || !clase) {
    toast("Por favor completa todos los campos.", "error");
    return;
  }

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    toast("No estás autenticado.", "error");
    return;
  }

  if (idEnEdicion) {
    // Actualizar
    const { error } = await client
      .from("estudiantes")
      .update({ nombre, correo, clase })
      .eq("id", idEnEdicion);

    if (error) {
      toast("Error al actualizar: " + error.message, "error");
    } else {
      toast("Estudiante actualizado correctamente", "success");
      limpiarFormulario();
      cargarEstudiantes();
      cargarEstudiantesSelect();
    }
  } else {
    // Agregar nuevo
    const { error } = await client.from("estudiantes").insert({
      nombre,
      correo,
      clase,
      user_id: user.id,
    });

    if (error) {
      toast("Error al agregar: " + error.message, "error");
    } else {
      toast("Estudiante agregado correctamente", "success");
      limpiarFormulario();
      cargarEstudiantes();
      cargarEstudiantesSelect();
    }
  }
}

// Preparar formulario para editar
function editarEstudiante(id, nombre, correo, clase) {
  document.getElementById("nombre").value = nombre;
  document.getElementById("correo").value = correo;
  document.getElementById("clase").value = clase;
  idEnEdicion = id;
  btnAgregarActualizar.textContent = "Actualizar";
}

// Eliminar estudiante
async function eliminarEstudiante(id) {
  if (!confirm("¿Seguro que quieres eliminar este estudiante?")) return;

  const { error } = await client.from("estudiantes").delete().eq("id", id);

  if (error) {
    toast("Error al eliminar: " + error.message, "error");
  } else {
    toast("Estudiante eliminado", "success");
    cargarEstudiantes();
    cargarEstudiantesSelect();
  }
}

// Subir archivo asociado a estudiante
async function subirArchivo() {
  const archivoInput = document.getElementById("archivo");
  const archivo = archivoInput.files[0];

  if (!archivo) {
    toast("Selecciona un archivo primero.", "error");
    return;
  }

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    toast("Sesión no válida.", "error");
    return;
  }

  const estudianteSeleccionado = document.getElementById("estudiante").value;
  if (!estudianteSeleccionado) {
    toast("Selecciona un estudiante para subir el archivo.", "error");
    return;
  }

  const nombreRuta = `${user.id}/${estudianteSeleccionado}/${archivo.name}`;
  const { error } = await client.storage
    .from("tareas")
    .upload(nombreRuta, archivo, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    toast("Error al subir archivo: " + error.message, "error");
  } else {
    toast("Archivo subido correctamente", "success");
    archivoInput.value = ""; // Limpiar input
    listarArchivos();
  }
}

// Listar archivos subidos del usuario
async function listarArchivos() {
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    toast("Sesión no válida.", "error");
    return;
  }

  const { data: archivos, error: listarError } = await client.storage
    .from("tareas")
    .list(user.id, { limit: 100, offset: 0 });

  const lista = document.getElementById("lista-archivos");
  lista.innerHTML = "";

  if (listarError) {
    lista.innerHTML = "<li>Error al listar archivos</li>";
    console.error("Error al listar archivos:", listarError.message);
    return;
  }

  if (!archivos || archivos.length === 0) {
    lista.innerHTML = "<li>No hay archivos subidos.</li>";
    return;
  }

  for (const archivo of archivos) {
    const { data: signedUrlData, error: signedUrlError } = await client.storage
      .from("tareas")
      .createSignedUrl(`${user.id}/${archivo.name}`, 60);

    if (signedUrlError) {
      console.error("Error al generar URL firmada:", signedUrlError.message);
      continue;
    }

    const publicUrl = signedUrlData.signedUrl;
    const item = document.createElement("li");

    if (/\.(jpg|jpeg|png|gif)$/i.test(archivo.name)) {
      item.innerHTML = `
        <strong>${archivo.name}</strong><br>
        <a href="${publicUrl}" target="_blank" rel="noopener noreferrer">
          <img src="${publicUrl}" width="150" style="border:1px solid #ccc; margin:5px; border-radius:6px;" />
        </a>
      `;
    } else if (/\.pdf$/i.test(archivo.name)) {
      item.innerHTML = `
        <strong>${archivo.name}</strong><br>
        <a href="${publicUrl}" target="_blank" rel="noopener noreferrer">Ver PDF</a>
      `;
    } else {
      item.innerHTML = `<a href="${publicUrl}" target="_blank" rel="noopener noreferrer">${archivo.name}</a>`;
    }

    lista.appendChild(item);
  }
}

// Cerrar sesión
async function cerrarSesion() {
  const { error } = await client.auth.signOut();

  if (error) {
    toast("Error al cerrar sesión: " + error.message, "error");
  } else {
    localStorage.removeItem("token");
    toast("Sesión cerrada.", "success");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  }
}

// Botón agregar/actualizar
const btnAgregarActualizar = document.getElementById("btnAgregarActualizar");
btnAgregarActualizar.addEventListener("click", agregarOActualizarEstudiante);

// Inicialización al cargar página
document.addEventListener("DOMContentLoaded", () => {
  cargarEstudiantes();
  cargarEstudiantesSelect();
  listarArchivos();
  suscribirseCambios();
});

// Suscripción a cambios en la tabla estudiantes para actualización en tiempo real
function suscribirseCambios() {
  client
    .channel("public:estudiantes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "estudiantes" },
      (payload) => {
        cargarEstudiantes();
        cargarEstudiantesSelect();
        toast(`Datos actualizados: ${payload.event}`, "info");
      }
    )
    .subscribe();
}
