// TODO revizar si esta función realmente es funcional
document.getElementById("passenger-submit").onclick = () => {
  const submitButton = document.getElementById("passenger-submit");
  submitButton.disabled = true;

  const passengerId = document.getElementById("passenger-id").value;
  // TODO bonus Promise.race()
  iniciarCheckIn(passengerId)
    .then(/* TODO show data */)
    .catch(/* TODO handle errors */)
    .finally(() => (submitButton.disabled = false));
};

function iniciarCheckIn(passengerId) {
  return Promise.all([
    validarPasaporte(passengerId),
    verificarRestriccionesVisa(passengerId),
  ])
    .then(asignarAsiento)
    .then(generarPaseAbordar);
}

function validarPasaporte(id) {
  // TODO
}

function verificarRestriccionesVisa(id) {
  // TODO
}

function asignarAsiento() {
  // TODO
}

function generarPaseAbordar(datos) {
  // TODO
}
