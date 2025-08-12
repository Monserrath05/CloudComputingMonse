// Conexión a Supabase
const SUPABASE_URL = "https://gsdsldjactyltkxwbdiw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZHNsZGphY3R5bHRreHdiZGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDUxNTcsImV4cCI6MjA3MDA4MTE1N30.1hLGHX44ipgsJDIpOPHM3mU3CgvC86VdJtFLyYGtlR0";
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function verificarSesion() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    showToast('error', 'Debes iniciar sesión para acceder');
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
    return;
  }
  cargarEstudiantes();
  listarArchivos();
}

async function agregarEstudiante() {
  const nombre = document.getElementById("nombre").value.trim();
  const correo = document.getElementById("correo").value.trim();
  const clase = document.getElementById("clase").value.trim();

  if (!nombre || !correo || !clase) {
    showToast('warning', 'Completa todos los campos');
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    showToast('error', 'No estás autenticado');
    return;
  }

  const { error } = await supabase.from("estudiantes").insert([{ nombre, correo, clase, user_id: user.id }]);

  if (error) {
    showToast('error', error.message);
  } else {
    showToast('success', 'Estudiante agregado');
    cargarEstudiantes();
  }
}

async function cargarEstudiantes() {
  const { data, error } = await supabase.from("estudiantes").select("*").order("created_at", { ascending: false });

  const lista = document.getElementById("lista-estudiantes");
  const select = document.getElementById("estudiante");
  lista.innerHTML = "";
  select.innerHTML = "<option value=''>Seleccione un estudiante</option>";

  if (error) {
    showToast('error', 'Error al cargar estudiantes');
    return;
  }

  data.forEach(est => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${est.nombre} (${est.clase})
      <button class="edit-btn" onclick="editarEstudiante(${est.id}, '${est.nombre}', '${est.correo}', '${est.clase}')">✏️</button>
      <button class="delete-btn" onclick="eliminarEstudiante(${est.id})">🗑️</button>
    `;
    lista.appendChild(li);

    const option = document.createElement("option");
    option.value = est.id;
    option.textContent = est.nombre;
    select.appendChild(option);
  });
}

async function editarEstudiante(id, nombreActual, correoActual, claseActual) {
  const nuevoNombre = prompt("Nuevo nombre:", nombreActual);
  const nuevoCorreo = prompt("Nuevo correo:", correoActual);
  const nuevaClase = prompt("Nueva clase:", claseActual);

  if (!nuevoNombre || !nuevoCorreo || !nuevaClase) {
    showToast('warning', 'Todos los campos son obligatorios');
    return;
  }

  const { error } = await supabase.from("estudiantes").update({ nombre: nuevoNombre, correo: nuevoCorreo, clase: nuevaClase }).eq("id", id);

  if (error) {
    showToast('error', error.message);
  } else {
    showToast('success', 'Estudiante actualizado');
    cargarEstudiantes();
  }
}

async function eliminarEstudiante(id) {
  if (!confirm("¿Seguro que quieres eliminar este estudiante?")) return;

  const { error } = await supabase.from("estudiantes").delete().eq("id", id);

  if (error) {
    showToast('error', error.message);
  } else {
    showToast('success', 'Estudiante eliminado');
    cargarEstudiantes();
  }
}

async function subirArchivo() {
  const archivoInput = document.getElementById("archivo");
  const archivo = archivoInput.files[0];
  const estudianteId = document.getElementById("estudiante").value;

  if (!archivo || !estudianteId) {
    showToast('warning', 'Selecciona un estudiante y un archivo');
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    showToast('error', 'Sesión no válida');
    return;
  }

  const nombreRuta = `${user.id}/${archivo.name}`;
  const { error } = await supabase.storage.from("tareas").upload(nombreRuta, archivo, { cacheControl: "3600", upsert: false });

  if (error) {
    showToast('error', error.message);
  } else {
    showToast('success', 'Archivo subido correctamente');
    listarArchivos();
  }
}

async function listarArchivos() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    showToast('error', 'Sesión no válida');
    return;
  }

  const { data: archivos, error } = await supabase.storage.from("tareas").list(user.id, { limit: 20 });

  const lista = document.getElementById("lista-archivos");
  lista.innerHTML = "";

  if (error) {
    lista.innerHTML = "<li>Error al listar archivos</li>";
    return;
  }

  for (const archivo of archivos) {
    const { data: signedUrlData, error: urlError } = await supabase.storage.from("tareas").createSignedUrl(`${user.id}/${archivo.name}`, 60);
    if (urlError) continue;
    const publicUrl = signedUrlData.signedUrl;

    const li = document.createElement("li");
    const esImagen = /\.(jpg|jpeg|png|gif)$/i.test(archivo.name);
    const esPDF = /\.pdf$/i.test(archivo.name);

    if (esImagen) {
      li.innerHTML = `<strong>${archivo.name}</strong>
        <button class="delete-btn" onclick="eliminarArchivo('${archivo.name}')">🗑️</button><br/>
        <a href="${publicUrl}" target="_blank">
          <img src="${publicUrl}" width="150" style="border:1px solid #ccc; margin-top:5px; border-radius:8px;" />
        </a>`;
    } else if (esPDF) {
      li.innerHTML = `<strong>${archivo.name}</strong>
        <button class="delete-btn" onclick="eliminarArchivo('${archivo.name}')">🗑️</button><br/>
        <a href="${publicUrl}" target="_blank">Ver PDF</a>`;
    } else {
      li.innerHTML = `<a href="${publicUrl}" target="_blank">${archivo.name}</a>
        <button class="delete-btn" onclick="eliminarArchivo('${archivo.name}')">🗑️</button>`;
    }
    lista.appendChild(li);
  }
}

async function eliminarArchivo(nombreArchivo) {
  if (!confirm("¿Seguro que quieres eliminar este archivo?")) return;

  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.storage.from("tareas").remove([`${user.id}/${nombreArchivo}`]);

  if (error) {
    showToast('error', error.message);
  } else {
    showToast('success', 'Archivo eliminado');
    listarArchivos();
  }
}

async function cerrarSesion() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    showToast('error', error.message);
  } else {
    showToast('success', 'Sesión cerrada');
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  }
}

// Inicia la verificación al cargar
verificarSesion();
