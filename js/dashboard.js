// Conexión a Supabase
const SUPABASE_URL = "https://gsdsldjactyltkxwbdiw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZHNsZGphY3R5bHRreHdiZGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDUxNTcsImV4cCI6MjA3MDA4MTE1N30.1hLGHX44ipgsJDIpOPHM3mU3CgvC86VdJtFLyYGtlR0";
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Verificar sesión y cargar datos
async function verificarSesion() {
  const { data: { session }, error } = await client.auth.getSession();
  if (error || !session) {
    showToast("Debes iniciar sesión para acceder.", "error");
    setTimeout(() => window.location.href = "index.html", 1500);
    return;
  }
  cargarEstudiantes();
  listarArchivos();
}

// Agregar estudiante
async function agregarEstudiante() {
  const nombre = document.getElementById("nombre").value.trim();
  const correo = document.getElementById("correo").value.trim();
  const clase = document.getElementById("clase").value.trim();

  if (!nombre || !correo || !clase) {
    showToast("Completa todos los campos.", "error");
    return;
  }

  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    showToast("No estás autenticado.", "error");
    return;
  }

  const { error } = await client.from("estudiantes").insert([{ nombre, correo, clase, user_id: user.id }]);
  if (error) {
    showToast("Error al agregar: " + error.message, "error");
  } else {
    showToast("Estudiante agregado correctamente.", "success");
    cargarEstudiantes();
  }
}

// Cargar estudiantes
async function cargarEstudiantes() {
  const { data, error } = await client.from("estudiantes").select("*").order("created_at", { ascending: false });
  const lista = document.getElementById("lista-estudiantes");
  const select = document.getElementById("estudiante");
  lista.innerHTML = "";
  select.innerHTML = "<option value=''>Seleccione un estudiante</option>";

  if (error) {
    showToast("Error al cargar estudiantes: " + error.message, "error");
    return;
  }

  data.forEach(est => {
    const item = document.createElement("li");
    item.innerHTML = `
      <strong>${est.nombre} (${est.clase})</strong>
      <button class="btn-editar" onclick="editarEstudiante(${est.id}, '${est.nombre}', '${est.correo}', '${est.clase}')">✏️</button>
      <button class="btn-eliminar" onclick="eliminarEstudiante(${est.id})">🗑️</button>
    `;
    lista.appendChild(item);

    const option = document.createElement("option");
    option.value = est.id;
    option.textContent = est.nombre;
    select.appendChild(option);
  });
}

// Editar estudiante
async function editarEstudiante(id, nombreActual, correoActual, claseActual) {
  const nuevoNombre = prompt("Nuevo nombre:", nombreActual);
  const nuevoCorreo = prompt("Nuevo correo:", correoActual);
  const nuevaClase = prompt("Nueva clase:", claseActual);

  if (!nuevoNombre || !nuevoCorreo || !nuevaClase) {
    showToast("Todos los campos son obligatorios.", "error");
    return;
  }

  const { error } = await client.from("estudiantes").update({ nombre: nuevoNombre, correo: nuevoCorreo, clase: nuevaClase }).eq("id", id);

  if (error) {
    showToast("Error al actualizar: " + error.message, "error");
  } else {
    showToast("Estudiante actualizado correctamente.", "success");
    cargarEstudiantes();
  }
}

// Eliminar estudiante
async function eliminarEstudiante(id) {
  if (!confirm("¿Seguro que quieres eliminar este estudiante?")) return;

  const { error } = await client.from("estudiantes").delete().eq("id", id);

  if (error) {
    showToast("Error al eliminar: " + error.message, "error");
  } else {
    showToast("Estudiante eliminado correctamente.", "success");
    cargarEstudiantes();
  }
}

// Subir archivo
async function subirArchivo() {
  const archivoInput = document.getElementById("archivo");
  const archivo = archivoInput.files[0];
  const estudianteId = document.getElementById("estudiante").value;

  if (!archivo || !estudianteId) {
    showToast("Selecciona un estudiante y un archivo.", "error");
    return;
  }

  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    showToast("Sesión no válida.", "error");
    return;
  }

  const nombreRuta = `${user.id}/${archivo.name}`;
  const { error } = await client.storage.from("tareas").upload(nombreRuta, archivo, { cacheControl: "3600", upsert: false });

  if (error) {
    showToast("Error al subir: " + error.message, "error");
  } else {
    showToast("Archivo subido correctamente.", "success");
    listarArchivos();
  }
}

// Listar archivos
async function listarArchivos() {
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    showToast("Sesión no válida.", "error");
    return;
  }

  const { data: archivos, error } = await client.storage.from("tareas").list(user.id, { limit: 20 });
  const lista = document.getElementById("lista-archivos");
  lista.innerHTML = "";

  if (error) {
    lista.innerHTML = "<li>Error al listar archivos</li>";
    return;
  }

  archivos.forEach(async archivo => {
    const { data: signedUrlData } = await client.storage.from("tareas").createSignedUrl(`${user.id}/${archivo.name}`, 60);
    const publicUrl = signedUrlData.signedUrl;
    const item = document.createElement("li");
    const esImagen = archivo.name.match(/\.(jpg|jpeg|png|gif)$/i);
    const esPDF = archivo.name.match(/\.pdf$/i);

    if (esImagen) {
      item.innerHTML = `<strong>${archivo.name}</strong>
        <button class="btn-eliminar" onclick="eliminarArchivo('${archivo.name}')">🗑️</button><br>
        <a href="${publicUrl}" target="_blank">
          <img src="${publicUrl}" width="150" style="border:1px solid #ccc; margin:5px;" />
        </a>`;
    } else if (esPDF) {
      item.innerHTML = `<strong>${archivo.name}</strong>
        <button class="btn-eliminar" onclick="eliminarArchivo('${archivo.name}')">🗑️</button><br>
        <a href="${publicUrl}" target="_blank">Ver PDF</a>`;
    } else {
      item.innerHTML = `<a href="${publicUrl}" target="_blank">${archivo.name}</a>
        <button class="btn-eliminar" onclick="eliminarArchivo('${archivo.name}')">🗑️</button>`;
    }

    lista.appendChild(item);
  });
}

// Eliminar archivo
async function eliminarArchivo(nombreArchivo) {
  if (!confirm("¿Seguro que quieres eliminar este archivo?")) return;

  const { data: { user } } = await client.auth.getUser();
  const { error } = await client.storage.from("tareas").remove([`${user.id}/${nombreArchivo}`]);

  if (error) {
    showToast("Error al eliminar archivo: " + error.message, "error");
  } else {
    showToast("Archivo eliminado correctamente.", "success");
    listarArchivos();
  }
}

// Cerrar sesión
async function cerrarSesion() {
  const { error } = await client.auth.signOut();

  if (error) {
    showToast("Error al cerrar sesión: " + error.message, "error");
  } else {
    showToast("Sesión cerrada.", "success");
    setTimeout(() => window.location.href = "index.html", 1000);
  }
}

// Iniciar
verificarSesion();
