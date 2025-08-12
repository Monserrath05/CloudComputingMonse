const SUPABASE_URL = "https://gsdsldjactyltkxwbdiw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZHNsZGphY3R5bHRreHdiZGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDUxNTcsImV4cCI6MjA3MDA4MTE1N30.1hLGHX44ipgsJDIpOPHM3mU3CgvC86VdJtFLyYGtlR0";
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


let idEnEdicion = null; // ID para editar

// Elementos
const btnAgregarActualizar = document.getElementById("btnAgregarActualizar");
const listaEstudiantes = document.getElementById("lista-estudiantes");
const selectEstudiante = document.getElementById("estudiante");
const listaArchivos = document.getElementById("lista-archivos");

btnAgregarActualizar.addEventListener("click", agregarOActualizarEstudiante);

async function agregarOActualizarEstudiante() {
  const nombre = document.getElementById("nombre").value.trim();
  const correo = document.getElementById("correo").value.trim();
  const clase = document.getElementById("clase").value.trim();

  if (!nombre || !correo || !clase) {
    alert("Por favor completa todos los campos.");
    return;
  }

  const { data: { user }, error: userError } = await client.auth.getUser();
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
      idEnEdicion = null;
      btnAgregarActualizar.textContent = "Agregar";
      limpiarFormulario();
      cargarEstudiantes();
      cargarEstudiantesSelect();
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
      cargarEstudiantes();
      cargarEstudiantesSelect();
    }
  }
}

function limpiarFormulario() {
  document.getElementById("nombre").value = "";
  document.getElementById("correo").value = "";
  document.getElementById("clase").value = "";
}

async function cargarEstudiantes() {
  const { data, error } = await client
    .from("estudiantes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    alert("Error al cargar estudiantes: " + error.message);
    return;
  }

  listaEstudiantes.innerHTML = "";

  data.forEach((est) => {
    const item = document.createElement("li");
    item.innerHTML = `
      ${est.nombre} (${est.clase})
      <div>
        <button onclick="editarEstudiante('${est.id}', '${escapeHTML(est.nombre)}', '${escapeHTML(est.correo)}', '${escapeHTML(est.clase)}')">✏</button>
        <button onclick="eliminarEstudiante('${est.id}')">🗑</button>
      </div>
    `;
    listaEstudiantes.appendChild(item);
  });
}

function escapeHTML(text) {
  return text.replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

function editarEstudiante(id, nombre, correo, clase) {
  document.getElementById("nombre").value = nombre;
  document.getElementById("correo").value = correo;
  document.getElementById("clase").value = clase;
  idEnEdicion = id;
  btnAgregarActualizar.textContent = "Actualizar";
}

async function eliminarEstudiante(id) {
  if (!confirm("¿Seguro que quieres eliminar este estudiante?")) return;

  const { error } = await client.from("estudiantes").delete().eq("id", id);

  if (error) {
    alert("Error al eliminar: " + error.message);
  } else {
    alert("Estudiante eliminado");
    cargarEstudiantes();
    cargarEstudiantesSelect();
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

  selectEstudiante.innerHTML = `<option value="">Selecciona un estudiante</option>`;

  data.forEach((est) => {
    const option = document.createElement("option");
    option.value = est.id;
    option.textContent = est.nombre;
    selectEstudiante.appendChild(option);
  });
}

async function subirArchivo() {
  const archivoInput = document.getElementById("archivo");
  const archivo = archivoInput.files[0];

  if (!archivo) {
    alert("Selecciona un archivo primero.");
    return;
  }

  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) {
    alert("Sesión no válida.");
    return;
  }

  const estudianteSeleccionado = selectEstudiante.value;
  if (!estudianteSeleccionado) {
    alert("Selecciona un estudiante para subir el archivo.");
    return;
  }

  const nombreRuta = `${user.id}/${estudianteSeleccionado}/${Date.now()}_${archivo.name}`;

  const { error } = await client.storage.from("tareas").upload(nombreRuta, archivo, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    alert("Error al subir: " + error.message);
  } else {
    alert("Archivo subido correctamente.");
    archivoInput.value = "";
    listarArchivosPorEstudiante(estudianteSeleccionado);
  }
}

async function listarArchivosPorEstudiante(estudianteId) {
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) {
    alert("Sesión no válida.");
    return;
  }

  listaArchivos.innerHTML = "";

  const carpeta = `${user.id}/${estudianteId}`;
  const { data: archivos, error: listarError } = await client.storage.from("tareas").list(carpeta);

  if (listarError) {
    listaArchivos.innerHTML = "<li>Error al listar archivos</li>";
    return;
  }

  if (archivos.length === 0) {
    listaArchivos.innerHTML = "<li>No hay archivos para este estudiante.</li>";
    return;
  }

  for (const archivo of archivos) {
    const rutaArchivo = `${carpeta}/${archivo.name}`;
    const { data: signedUrlData, error: signedUrlError } = await client.storage.from("tareas").createSignedUrl(rutaArchivo, 60);

    if (signedUrlError) {
      console.error("Error al generar URL firmada para", rutaArchivo, ":", signedUrlError.message);
      continue;
    }

    const publicUrl = signedUrlData.signedUrl;
    const item = document.createElement("li");

    const esImagen = archivo.name.match(/\.(jpg|jpeg|png|gif)$/i);
    const esPDF = archivo.name.match(/\.pdf$/i);

    if (esImagen) {
      item.innerHTML = `
        <strong>${archivo.name}</strong><br>
        <a href="${publicUrl}" target="_blank">
          <img src="${publicUrl}" width="150" style="border:1px solid #ccc; margin:5px;" />
        </a>
      `;
    } else if (esPDF) {
      item.innerHTML = `
        <strong>${archivo.name}</strong><br>
        <a href="${publicUrl}" target="_blank">Ver PDF</a>
      `;
    } else {
      item.innerHTML = `<a href="${publicUrl}" target="_blank">${archivo.name}</a>`;
    }

    listaArchivos.appendChild(item);
  }
}

// Cuando cambies de estudiante en el select, listar sus archivos
selectEstudiante.addEventListener("change", (e) => {
  const estudianteId = e.target.value;
  if (estudianteId) {
    listarArchivosPorEstudiante(estudianteId);
  } else {
    listaArchivos.innerHTML = "";
  }
});

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

// Al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  cargarEstudiantes();
  cargarEstudiantesSelect();
});
