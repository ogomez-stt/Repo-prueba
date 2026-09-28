# Módulo de Agendamiento — Diagramas de flujo

> Documento de referencia del flujo funcional del **módulo de Agendamiento** de
> NECTO (citas con profesionales). Refleja lo implementado hoy (mock/front-end).
> El canal de WhatsApp del cliente es externo; hoy el self-service del cliente
> aún no está construido en este módulo (ver "Pendientes").

Actores:
- **Cliente / paciente** — reserva/gestiona su cita (por WhatsApp u operador).
- **Profesional** — quien atiende (psicología, nutrición, fisioterapia...). Tiene
  su propia agenda y su propia **disponibilidad** (días/horario/duración de bloque).
  Ahora también **puede ingresar** (opción A): entra como un operador ligado a sí
  mismo y ve **solo su** agenda/calendario/citas y puede crear citas (ver sección 3b).
- **Operador / asesor** — ayudante ligado a uno o varios profesionales; solo ve y
  gestiona lo de **sus** profesionales. Además atiende la **bandeja de Chats** de
  clientes que piden hablar con un asesor (sección 12).
- **Administrador** — dueño; gestiona profesionales, disponibilidad, ve todo el
  negocio y configura el programa de fidelidad.

> **Diferencia clave admin vs operador:** el admin trabaja sobre **todo el negocio**
> (todos los profesionales y todos los clientes); el operador trabaja **acotado a
> sus profesionales asignados** (`profesionalIds`) y a los clientes de esos
> profesionales.

---

## 1. Arranque y selección de rol (post-login)

```mermaid
flowchart TD
  A(["Login /login"]) --> B{"¿Sesión configurada?"}
  B -- No --> C["/seleccionar: elegir módulos"]
  C --> D["Elegir rol"]
  D --> E{"Rol elegido"}
  E -- Administrador --> F["Entra a Agendamiento<br/>/agendamiento/inicio"]
  E -- Operador --> G{"¿Entrar o simular?"}
  G -- Entrar --> H["/operador/registro: solicitud al admin"]
  G -- Simular --> I["/operador/login:<br/>Operador o Profesional"]
  I -- Operador --> J["Modo simulación (operador)<br/>aplica sus profesionales y permisos"]
  I -- Profesional --> P["Modo simulación (profesional)<br/>ligado a sí mismo · solo su agenda"]
  J --> F
  P --> F
  B -- Sí --> F
```

Notas:
- El módulo se elige en `/seleccionar` (Turnos y/o Agendamiento).
- La **simulación de operador** aplica sus permisos: solo ve las secciones y los
  **profesionales** que el admin le asignó (ver diagrama 6).
- Desde `/operador/login` ahora se puede entrar como **Operador** o como
  **Profesional** (opción A; ver sección 3b).

---

## 2. Vistas del módulo por rol

```mermaid
flowchart LR
  subgraph Admin
    A1[Inicio / Dashboard GLOBAL\nKPIs, próximas citas, ocupación,\ngráficos y rendimiento de operadores]
    A2[Profesionales\nCRUD + disponibilidad]
    A3[Agenda\ntodos o por profesional]
    A4[Calendario\nMes / Día, todos o por profesional]
    A5[Agendar cita]
    A6[Analítica GLOBAL\nclientes, fidelidad, estado de citas]
    A7[Operadores\ngestión del equipo]
  end
  subgraph Operador
    O1[Inicio propio\nsus profesionales, citas de hoy\nsolo lo suyo]
    O2[Profesionales\nsolo los suyos, solo ver agenda]
    O3[Agenda\nsolo sus profesionales]
    O4[Calendario\nsolo sus profesionales]
    O5[Agendar cita\nsolo sus profesionales]
    O6[Analítica propia\nacotada a sus profesionales,\nsin fidelidad]
  end
```

El operador **no** ve: Operadores, ni el CRUD/disponibilidad de profesionales, ni
la configuración del programa de fidelidad, ni datos de profesionales ajenos.

---

## 3. Inicio: admin (global) vs operador (personal)

```mermaid
flowchart TD
  A[/agendamiento/inicio/] --> B{¿Operador simulado\nde Agendamiento?}
  B -- No (admin) --> C[Dashboard GLOBAL del negocio]
  B -- Sí --> D[Inicio personal del operador]

  C --> C1[KPIs: citas hoy, por confirmar,\nvirtuales hoy, tasa de inasistencia]
  C --> C2[Próximas citas de TODOS]
  C --> C3[Ocupación por profesional TODOS]
  C --> C4[Gráficos: tendencia, modalidad, ocupación]
  C --> C5[Rendimiento de operadores]
  C --> C6[Botón Exportar Reporte]

  D --> D1[Saludo + sus profesionales\nselector tabs si son varios]
  D --> D2[KPIs operativos: citas hoy,\npor confirmar, próxima cita]
  D --> D3[Citas de hoy de SUS profesionales\nconfirmar / WhatsApp]
  D --> D4[Accesos: ver agenda / agendar cita]
```

- El wrapper de la ruta decide qué vista renderizar según el rol.
- El inicio del operador es **operativo y sin analítica** (no le interesan las
  estadísticas de negocio).

---

## 3b. Acceso del profesional (opción A: operador ligado a sí mismo)

El profesional puede ingresar a NECTO para ver **su propia** agenda. Se modela
reutilizando el mecanismo de simulación: el profesional entra como un "operador
sintético" ligado únicamente a sí mismo, con permisos acotados.

```mermaid
flowchart TD
  A["/operador/login → pestaña Profesional"] --> B["Elegir profesional"]
  B --> C["simularProfesional(profId)"]
  C --> D["Operador sintético:<br/>profesionalIds = [su id]<br/>permisos = inicio, agenda, calendario, crear"]
  D --> E["/agendamiento/inicio (Mi agenda)"]
  E --> F["Ve SOLO sus citas, agenda y calendario<br/>y puede crear citas"]
  D -.no ve.-> X["Profesionales, Analítica, Operadores, Chats,<br/>ni datos de otros profesionales"]
```

- El profesional **ve**: su Inicio ("Mi agenda"), su Agenda, su Calendario y
  Agendar cita (para sí mismo).
- El profesional **no ve**: gestión de profesionales, analítica, operadores, la
  bandeja de Chats, ni nada de otros profesionales.
- En el header, el chip de identidad muestra **"Profesional · {nombre}"** (en vez
  de "Operando como").
- Internamente reutiliza `puedeVerProfesional` / `profesionalesVisiblesIds`: para
  un profesional esa lista es simplemente `[suId]`.

---

## 4. Profesionales y disponibilidad

```mermaid
flowchart TD
  A[Profesionales] --> B{Rol}
  B -- Admin --> C[CRUD: crear, editar, eliminar]
  C --> D[Configurar disponibilidad\npor profesional]
  D --> E[Días laborales + hora inicio/fin\n+ duración de bloque 30/60 min]
  A --> F[Ver agenda del profesional]
  B -- Operador --> G[Solo ve SUS profesionales]
  G --> F
  G -.no puede.-> C
  G -.no puede.-> D
```

- La **disponibilidad es por profesional** (cada uno define sus días y horario).
- El **calendario** y **Agendar cita** respetan esa disponibilidad: bloquean los
  días/horas en que el profesional no atiende.
- El operador solo puede **Ver agenda**; no crea, edita, elimina ni configura.

---

## 5. Agenda y Calendario — alcance por profesional

```mermaid
flowchart TD
  A[Agenda / Calendario] --> B{¿Cuántos profesionales\nvisibles?}
  B -- Uno solo --> C[Entra directo a ese profesional\nsin opción Todos]
  B -- Varios --> D[Selector con Todos + cada profesional]
  D --> E{Alcance}
  E -- Todos --> F[Citas de todos los profesionales\nvisibles admin=todos, operador=los suyos]
  E -- Un profesional --> G[Solo las citas de ese profesional]
```

### Calendario: toggle Mes / Día

```mermaid
flowchart LR
  M[Vista Mes] -->|clic en un día| S[Selecciona el día]
  M -->|doble clic / Ver día completo| D[Vista Día]
  D --> D1[Timeline en franjas de 30 min]
  D1 --> D2[Una cita ocupa tantas franjas\ncomo dure ej. 60 min = 2 franjas]
  D1 --> D3[Franja libre con profesional concreto\n= + Agendar a las HH:MM]
  M --> M1[Contador de citas por día\npastilla con el número]
  M --> M2[Días no laborales del profesional\nbloqueados no dejan abrir]
```

- **Mes**: cuadrícula con una **pastilla con el número** de citas por día (usa el
  color del profesional cuando hay uno concreto). Días no laborales del profesional
  quedan **bloqueados**.
- **Día**: **timeline por horas** en franjas de 30 min; una cita se dibuja como un
  card que abarca las franjas que dura.
- En modo "Todos" el operador ve solo las citas de **sus** profesionales.

---

## 6. Permisos: qué profesionales ve el operador

```mermaid
flowchart TD
  A[Operador simulado] --> B{¿Sección permitida?}
  B -- No --> X[Aviso: no tienes acceso]
  B -- Sí --> C[Carga la vista]
  C --> D{Filtrar profesionales}
  D --> E[Solo profesionales asignados\npor el admin profesionalIds]
  E --> F[Inicio, Profesionales, Agenda,\nCalendario, Agendar y Analítica\nmuestran solo esos profesionales y sus clientes]
  G[Administrador] --> H[Ve todos los profesionales\ny todos los clientes]
```

El admin define los profesionales de cada operador en **Operadores → perfil**.
El `?prof=` en la URL se valida contra los permisos: un operador no puede forzar
un profesional que no tiene asignado.

---

## 7. Ciclo de vida de una cita

```mermaid
stateDiagram-v2
  [*] --> Pendiente: cita creada\n(WhatsApp u operador)
  Pendiente --> Confirmada: confirmar
  Confirmada --> Completada: completar
  Pendiente --> Cancelada: cancelar
  Confirmada --> Cancelada: cancelar
  Confirmada --> NoAsistio: no se presentó
  Pendiente --> NoAsistio: no se presentó
  Completada --> [*]
  Cancelada --> [*]
  NoAsistio --> [*]
```

- Estados: **pendiente, confirmada, completada, cancelada, no asistió (noshow)**.
- Cada cita tiene una **modalidad** (presencial / virtual) y un **origen**
  (whatsapp / operador).

---

## 8. Crear cita (Agendar)

```mermaid
flowchart TD
  A[Agendar cita] --> B[Elegir profesional\nsolo los visibles al usuario]
  B --> C[Datos del cliente\nnombre, teléfono, servicio]
  C --> D[Elegir fecha]
  D --> E{¿Día laboral\ndel profesional?}
  E -- No --> F[Aviso: no atiende ese día\nelige otra fecha]
  E -- Sí --> G[Elegir hora\nselect con las franjas del profesional]
  G --> H{¿Franja ocupada?}
  H -- Sí --> I[Alerta: ya tiene cita a esa hora\nelige otra]
  H -- No --> J[Elegir modalidad + notas]
  J --> K[Crear cita → confirmación\ny aviso al cliente por WhatsApp]
```

- El selector de profesional solo ofrece los **visibles** para el usuario.
- Las horas se limitan a las **franjas del profesional** según su disponibilidad;
  las ocupadas se marcan y **avisan** si se eligen.

---

## 9. Analítica: admin (global) vs operador (acotada)

```mermaid
flowchart TD
  A[/agendamiento/analitica/] --> B{¿Operador simulado\nde Agendamiento?}
  B -- No (admin) --> C[Analítica GLOBAL]
  B -- Sí --> D[Analítica del operador]

  C --> C1[KPIs de TODOS los clientes]
  C --> C2[Gráficos: citas por semana, modalidad]
  C --> C3[Estado de las citas\nbarras + evolución]
  C --> C4[Programa de fidelidad + CONFIGURAR\ntiers, recompensas, en riesgo]
  C --> C5[Regularidad + ocupación]

  D --> D1[KPIs de SUS clientes]
  D --> D2[2 gráficas: citas por semana\npor estado + distribución por estado]
  D --> D3[Ocupación de SUS profesionales]
  D -.no incluye.-> C4
```

- La analítica del operador está **acotada** a sus profesionales y a los clientes
  de esos profesionales.
- El **programa de fidelidad** (y su configuración) es **exclusivo del admin**; el
  operador no lo ve.

---

## 10. Programa de fidelidad (solo admin)

```mermaid
flowchart TD
  A[Analítica → Programa de fidelidad] --> B[Niveles por regularidad\noro / plata / bronce / en riesgo]
  B --> C[Configurar umbrales y cupones\npor nivel]
  A --> D[Listos para recompensa\nofrecer por WhatsApp]
  A --> E[Clientes en riesgo\nreactivar por WhatsApp]
  A --> F[Tabla de regularidad de clientes]
```

- El nivel de cada cliente se deriva de su **regularidad** (citas completadas,
  inasistencias, tiempo sin volver), con umbrales configurables por el admin.

---

## 11. Mapa de rutas del módulo Agendamiento

| Ruta | Vista | Rol | Notas |
|------|-------|-----|-------|
| `/agendamiento/inicio` | Inicio | Admin / Operador | Admin: dashboard global. Operador: inicio personal. |
| `/agendamiento` | Agenda | Admin / Operador | Todos o por profesional; operador solo los suyos. |
| `/agendamiento/profesionales` | Profesionales | Admin / Operador | Admin: CRUD + disponibilidad. Operador: solo ver agenda de los suyos. |
| `/agendamiento/calendario` | Calendario | Admin / Operador | Toggle Mes/Día; operador solo sus profesionales. |
| `/agendamiento/crear` | Agendar cita | Admin / Operador | Operador solo para sus profesionales; respeta disponibilidad. |
| `/agendamiento/detalles` | Detalle de cita | Admin / Operador | Detalle de una cita (`?id=`). |
| `/agendamiento/chats` | Chats (bandeja de asesor) | Admin / Operador | Conversaciones de clientes que piden asesor; el operador las toma y responde. Sección `chats`. |
| `/agendamiento/analitica` | Analítica | Admin / Operador | Admin: global + fidelidad. Operador: acotada, sin fidelidad. |
| `/agendamiento/operadores` | Operadores | Solo admin | Gestión del equipo y asignación de profesionales. |
| `/operador/login` | Simular acceso | Demo | Entrar como Operador o como Profesional (opción A). |
| `/wa` | Simulador WhatsApp | Demo | Selector Turnos/Agendamiento; 4 chats guionizados por módulo. |

---

## 12. Canal del cliente por WhatsApp (simulado)

El canal de WhatsApp del cliente se **simula** en `/wa` (solo lectura). El
simulador tiene un selector **Turnos / Agendamiento**; para Agendamiento hay 4
conversaciones guionadas cliente ↔ bot.

```mermaid
sequenceDiagram
  actor C as Cliente
  participant B as Bot (WhatsApp)
  participant S as Sistema (agenda)
  participant O as Operador/Asesor

  C->>B: "Quiero agendar / reagendar / consultar"
  B->>C: Menú (profesional / servicio)
  C->>B: Elige profesional y horario
  B->>S: Crea / mueve / consulta la cita
  S-->>B: Confirmación (fecha, modalidad)
  B->>C: 🎫 Cita confirmada + recordatorio
  alt El cliente pide un asesor humano
    C->>B: "Quiero hablar con un asesor"
    B->>O: Transfiere la conversación a la bandeja de Chats
    O->>C: El asesor responde por el mismo chat
  end
```

Los 4 escenarios de Agendamiento en `/wa`:

| # | Contacto | Escenario |
|---|----------|-----------|
| 1 | Carlos Mendoza | Agenda una cita self-service (Psicología, virtual) |
| 2 | Laura Torres | Reagenda su cita de nutrición |
| 3 | Sofía Díaz | Consulta sus próximas citas |
| 4 | Marta Ruiz | Pide hablar con un asesor → alimenta la bandeja de Chats |

---

## 13. Bandeja de Chats de asesor

Cuando un cliente pide "hablar con un asesor" (chat 4), su conversación entra a
la **bandeja de Chats** (`/agendamiento/chats`). Un operador la toma, responde y
la marca como resuelta. Vista construida con el flujo Elements (ChatBox /
ChatSidebar / Tabs).

```mermaid
stateDiagram-v2
  [*] --> SinAsignar: cliente pide asesor (llega de WhatsApp)
  SinAsignar --> EnCurso: un operador "Toma el chat"
  EnCurso --> Resuelto: "Marcar resuelto"
  Resuelto --> EnCurso: "Reabrir"
  Resuelto --> [*]
  note right of EnCurso
    Al tomar/resolver se agrega
    un mensaje de sistema al hilo
    ("Chat asignado a…", "Resuelto")
  end note
```

```mermaid
flowchart LR
  subgraph Bandeja
    T1["Sin asignar (badge)"]
    T2["Míos (badge)"]
    T3["Resueltos (badge)"]
    L["Lista: avatar, nombre,<br/>último mensaje, hora, no leídos"]
  end
  subgraph Conversación
    H["Header: cliente, teléfono, estado<br/>+ Tomar / Marcar resuelto / Reabrir"]
    M["Hilo: cliente izq · asesor der<br/>· sistema centrado"]
    K["Composer (solo si en curso)<br/>· aviso 'Toma el chat' si sin asignar"]
  end
  T1 --> L
  T2 --> L
  T3 --> L
  L --> H --> M --> K
```

- Filtros por estado con contador: **Sin asignar**, **Míos**, **Resueltos**.
- **Tomar chat**: pasa a *en curso*, se asigna al asesor y se añade un mensaje de
  sistema; solo entonces se habilita el editor de respuesta.
- **Marcar resuelto** / **Reabrir**: cambian el estado y dejan traza en el hilo.
- El **profesional no ve** esta bandeja (no está en sus permisos); sí el operador
  (con permiso `chats`) y el admin.
- Estado persistido en `localStorage` (`necto.asesorChats`); el modo "desde 0" la
  vacía de forma reversible.

---

## Pendientes (fuera del alcance actual, ya conocidos)

- Integración real del bot de WhatsApp y de la bandeja de Chats (hoy simulados:
  `/wa` guionizado y la bandeja alimentada por seed + acciones locales).
- Login real del profesional (hoy se entra vía "Simular acceso → Profesional";
  cuando exista auth, el `profesionalId` se derivaría de su cuenta).
- Compartir el formulario de agendar con el cliente (vista pública + apartado de
  compartir en Crear cita) — en discusión.
- Backend real (hoy todo es mock + estado en memoria/localStorage).
- Datos del negocio (nombre, logo, giro) y catálogo de servicios por profesional.
- Configuración inicial (onboarding) del módulo de Agendamiento, equivalente al
  de Turnos.
