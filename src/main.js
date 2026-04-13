// TODO revizar si esta función realmente es funcional
document.getElementById("passenger-submit").onclick = () => {
  const submitButton = document.getElementById("passenger-submit");
  submitButton.disabled = true;

  const passengerId = document.getElementById("passenger-id").value;
  // TODO bonus Promise.race()
  iniciarCheckIn(passengerId)
    .then((pase) => mostrarResultado(pase))
    .catch((error) => mostrarError(error.message))
    .finally(() => (submitButton.disabled = false));
};

function iniciarCheckIn(passengerId) {
  logEstado("Iniciando validaciones...");

  return Promise.all([
    validarPasaporte(passengerId),
    verificarRestriccionesVisa(passengerId),
  ])
    .then(() => {          
      logEstado("Pasaporte y visa verificados ✓");
      return asignarAsiento();
    })
    .then((asiento) => {
      logEstado(`Asiento asignado: ${asiento} ✓`);
      return generarPaseAbordar({ passengerId, asiento });
    });
}

function validarPasaporte(id) {
  return new Promise((resolve) => setTimeout(resolve, 1500)).then(() => {
    if (id % 2 === 1) {           
      logEstado("Pasaporte verificado ✓");
      return id;
    }
    throw new Error("El ID de pasaporte es inválido (número par)");
  });
}

function verificarRestriccionesVisa(id) {
  return new Promise((resolve) => setTimeout(resolve, 2000)).then(() => {
    if (Math.random() > 0.3) {
      logEstado("Visa verificada ✓");
      return id;
    }
    throw new Error("Visa no válida para el destino");
  });
}

function asignarAsiento() {
  const filas  = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const letras = ["A", "B", "C", "D", "E", "F"];
  const fila   = filas [Math.floor(Math.random() * filas.length)];
  const letra  = letras[Math.floor(Math.random() * letras.length)];

  return new Promise((resolve) =>
    setTimeout(() => resolve(`${fila}${letra}`), 1000)
  );
}

function generarPaseAbordar(datos) {
  // TODO
}
