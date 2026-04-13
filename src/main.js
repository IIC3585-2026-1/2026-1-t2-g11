import "./styles.css";

const seatRows = Object.freeze(Array.from({ length: 12 }, (_, index) => index + 1));
const seatLetters = Object.freeze(["A", "B", "C", "D", "E", "F"]);
const timeoutMs = 4000;
const emptyBoardingPassMessage =
  "El pase de abordar aparecerá aquí cuando el check-in termine correctamente.";
const requestSteps = Object.freeze([
  {
    key: "passport",
    label: "Pasaporte",
    pendingMessage: "Esperando validación",
  },
  {
    key: "visa",
    label: "Visa",
    pendingMessage: "Esperando validación",
  },
  {
    key: "seat",
    label: "Asiento",
    pendingMessage: "Pendiente de validaciones",
  },
  {
    key: "boardingPass",
    label: "Pase de abordar",
    pendingMessage: "Pendiente de asignación",
  },
]);
const sequenceClassNames = Object.freeze({
  pending: "idle",
  active: "info",
  success: "success",
  error: "error",
  blocked: "blocked",
});

const byId = (id) => document.getElementById(id);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomFrom = (list) => list[Math.floor(Math.random() * list.length)];

const toErrorMessage = (error) =>
  error && typeof error === "object" && "message" in error
    ? String(error.message)
    : String(error);

const createAppError = (message, reported = false) =>
  Object.assign(new Error(message), { reported });

const normalizePassengerId = (value) => Number.parseInt(String(value).trim(), 10);
const isValidPassengerId = (id) => Number.isInteger(id) && id > 0;
const createPassengerName = (passengerId) => `Pasajero ${passengerId}`;
const createSeatNumber = () => `${randomFrom(seatRows)}${randomFrom(seatLetters)}`;
const createSequenceUpdate = (step, status, message) => ({ step, status, message });

const createSequenceState = () =>
  requestSteps.reduce(
    (state, step) => ({
      ...state,
      [step.key]: {
        status: "pending",
        message: step.pendingMessage,
      },
    }),
    {},
  );

const createSequenceMarkup = (sequenceState) =>
  requestSteps
    .map((step, index) => {
      const currentStep = sequenceState[step.key];

      return `
        <li class="log-entry log-entry--${sequenceClassNames[currentStep.status]}">
          <span class="log-entry__meta">Paso ${index + 1} · ${step.label}</span>
          <p>${currentStep.message}</p>
        </li>
      `;
    })
    .join("");

const createEmptyBoardingPassMarkup = () => `
  <p>${emptyBoardingPassMessage}</p>
`;

const createBoardingPassMarkup = (boardingPass) => `
  <header class="boarding-pass__header">
    <div>
      <p class="boarding-pass__eyebrow">AsyncAir Boarding Pass</p>
      <h3>${boardingPass.passengerName}</h3>
      <p class="boarding-pass__subtitle">
        Check-in confirmado para el vuelo AA-${boardingPass.flightNumber}
      </p>
    </div>
    <strong class="boarding-pass__seat">${boardingPass.seat}</strong>
  </header>
  <div class="boarding-pass__grid">
    <article class="boarding-pass__field">
      <span>ID</span>
      <strong>${boardingPass.passengerId}</strong>
    </article>
    <article class="boarding-pass__field">
      <span>Puerta</span>
      <strong>${boardingPass.gate}</strong>
    </article>
    <article class="boarding-pass__field">
      <span>Zona</span>
      <strong>${boardingPass.zone}</strong>
    </article>
    <article class="boarding-pass__field">
      <span>Emitido</span>
      <strong>${boardingPass.issuedAt}</strong>
    </article>
  </div>
  <div class="boarding-pass__tags">
    <span class="boarding-pass__tag">Pasaporte verificado</span>
    <span class="boarding-pass__tag">Visa aprobada</span>
  </div>
`;

function validarPasaporte(id) {
  return delay(1500).then(() => {
    if (id % 2 === 0) {
      throw createAppError("El ID de pasaporte es inválido (número par)");
    }

    return { passengerId: id, status: "validado" };
  });
}

function verificarRestriccionesVisa(id) {
  return delay(2000).then(() => {
    if (Math.random() < 0.3) {
      throw createAppError("Visa no válida para el destino");
    }

    return { passengerId: id, status: "aprobada" };
  });
}

function asignarAsiento() {
  return delay(1000).then(createSeatNumber);
}

function generarPaseAbordar(datos) {
  return delay(500).then(() => ({
    passengerId: datos.passengerId,
    passengerName: createPassengerName(datos.passengerId),
    seat: datos.seat,
    gate: `A${(datos.passengerId % 8) + 1}`,
    zone: (datos.passengerId % 4) + 1,
    flightNumber: 700 + (datos.passengerId % 230),
    issuedAt: new Date().toLocaleTimeString("es-UY", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    passportStatus: datos.passport.status,
    visaStatus: datos.visa.status,
  }));
}

const toStepUpdates = (updates) => (Array.isArray(updates) ? updates : [updates]);

const applySequenceUpdates = (sequenceState, updates) =>
  toStepUpdates(updates).reduce(
    (nextState, update) => ({
      ...nextState,
      [update.step]: {
        ...nextState[update.step],
        status: update.status,
        message: update.message,
      },
    }),
    sequenceState,
  );

const createFailureUpdates = (sequenceState, message) =>
  requestSteps.flatMap((step) => {
    const currentStep = sequenceState[step.key];

    if (currentStep.status === "success" || currentStep.status === "error") {
      return [];
    }

    if (currentStep.status === "active") {
      return [createSequenceUpdate(step.key, "error", `Error: ${message}`)];
    }

    return [
      createSequenceUpdate(step.key, "blocked", "No ejecutado por un error previo."),
    ];
  });

const settleConcurrentStep = (promise, step, successMessage, notify) =>
  promise
    .then((value) => {
      notify(createSequenceUpdate(step, "success", successMessage));
      return { status: "fulfilled", value };
    })
    .catch((error) => {
      const appError = createAppError(toErrorMessage(error), true);
      notify(createSequenceUpdate(step, "error", `Error: ${appError.message}`));
      return { status: "rejected", reason: appError, step };
    });

const runSequenceStep = (promise, step, successMessage, notify) =>
  promise
    .then((value) => {
      notify(
        createSequenceUpdate(
          step,
          "success",
          typeof successMessage === "function" ? successMessage(value) : successMessage,
        ),
      );
      return value;
    })
    .catch((error) => {
      const appError = createAppError(toErrorMessage(error), true);
      notify(createSequenceUpdate(step, "error", `Error: ${appError.message}`));
      throw appError;
    });

const ensureNoFailures = (results) => {
  const failure = results.find((result) => result.status === "rejected");

  if (failure) {
    throw Object.assign(failure.reason, { step: failure.step });
  }

  return results.map((result) => result.value);
};

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    delay(ms).then(() => {
      throw createAppError("Tiempo de espera agotado");
    }),
  ]);

function iniciarCheckIn(passengerId, notify = () => {}) {
  notify([
    createSequenceUpdate("passport", "active", "Validando pasaporte..."),
    createSequenceUpdate("visa", "active", "Verificando visa..."),
  ]);

  const validations = Promise.all([
    settleConcurrentStep(
      validarPasaporte(passengerId),
      "passport",
      "Pasaporte verificado",
      notify,
    ),
    settleConcurrentStep(
      verificarRestriccionesVisa(passengerId),
      "visa",
      "Visa verificada",
      notify,
    ),
  ]).then(ensureNoFailures);

  const process = validations
    .then(([passport, visa]) => {
      notify(createSequenceUpdate("seat", "active", "Asignando asiento..."));
      return runSequenceStep(
        asignarAsiento(),
        "seat",
        (seat) => `Asiento asignado: ${seat}`,
        notify,
      ).then(
        (seat) => ({
          passengerId,
          passport,
          visa,
          seat,
        }),
      );
    })
    .then((data) => {
      notify(createSequenceUpdate("boardingPass", "active", "Generando pase de abordar..."));
      return runSequenceStep(
        generarPaseAbordar(data),
        "boardingPass",
        "Pase de abordar generado",
        notify,
      );
    });

  return withTimeout(process, timeoutMs);
}

const setStatus = (elements, state, label) => {
  elements.requestStatus.dataset.state = state;
  elements.requestStatus.textContent = label;
};

const setBusy = (elements, isBusy) => {
  elements.submitButton.disabled = isBusy;
  elements.submitButton.textContent = isBusy
    ? "Procesando..."
    : "Procesar check-in";
  elements.form.setAttribute("aria-busy", String(isBusy));
};

const clearError = (elements) => {
  elements.errorBanner.hidden = true;
  elements.errorBanner.textContent = "";
};

const renderError = (elements, message) => {
  elements.errorBanner.hidden = false;
  elements.errorBanner.textContent = `Error: ${message}`;
  setStatus(elements, "error", "Con error");
};

const renderSequence = (elements, sequenceState) => {
  elements.logSection.innerHTML = createSequenceMarkup(sequenceState);
};

const renderEmptyBoardingPass = (elements) => {
  elements.boardingPass.className = "boarding-pass boarding-pass--empty";
  elements.boardingPass.innerHTML = createEmptyBoardingPassMarkup();
};

const renderBoardingPass = (elements, boardingPass) => {
  elements.boardingPass.className = "boarding-pass";
  elements.boardingPass.innerHTML = createBoardingPassMarkup(boardingPass);
  setStatus(elements, "success", "Check-in listo");
};

const createElements = () => ({
  form: byId("checkin-form"),
  input: byId("passenger-id"),
  submitButton: byId("passenger-submit"),
  requestStatus: byId("request-status"),
  errorBanner: byId("error-banner"),
  logSection: byId("log-section"),
  boardingPass: byId("boarding-pass"),
});

const handleSubmit = (elements) => (event) => {
  event.preventDefault();

  let sequenceState = createSequenceState();
  const updateSequence = (updates) => {
    sequenceState = applySequenceUpdates(sequenceState, updates);
    renderSequence(elements, sequenceState);
  };

  const passengerId = normalizePassengerId(elements.input.value);

  clearError(elements);
  renderEmptyBoardingPass(elements);
  renderSequence(elements, sequenceState);

  if (!isValidPassengerId(passengerId)) {
    const message = "Ingresa un ID numérico mayor a 0.";

    updateSequence([
      createSequenceUpdate("passport", "error", `Error: ${message}`),
      createSequenceUpdate("visa", "blocked", "Pendiente de un ID válido."),
      createSequenceUpdate("seat", "blocked", "No ejecutado por un error previo."),
      createSequenceUpdate(
        "boardingPass",
        "blocked",
        "No ejecutado por un error previo.",
      ),
    ]);
    renderError(elements, message);
    return;
  }

  setBusy(elements, true);
  setStatus(elements, "processing", "Procesando");

  iniciarCheckIn(passengerId, updateSequence)
    .then((boardingPass) => {
      renderBoardingPass(elements, boardingPass);
    })
    .catch((error) => {
      const errorMessage = toErrorMessage(error);

      if (!error?.reported || errorMessage === "Tiempo de espera agotado") {
        updateSequence(createFailureUpdates(sequenceState, errorMessage));
      } else {
        updateSequence(createFailureUpdates(sequenceState, errorMessage));
      }

      renderError(elements, errorMessage);
    })
    .finally(() => {
      setBusy(elements, false);
    });
};

const initializeApp = () => {
  const elements = createElements();

  if (Object.values(elements).some((element) => !element)) {
    return;
  }

  renderEmptyBoardingPass(elements);
  renderSequence(elements, createSequenceState());
  setStatus(elements, "idle", "Listo");
  elements.form.addEventListener("submit", handleSubmit(elements));
};

initializeApp();
