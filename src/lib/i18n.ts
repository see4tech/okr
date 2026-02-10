/**
 * Spanish UI strings and label maps for DB values (keys stay in English in DB).
 */

export const ui = {
  loading: 'Cargando…',
  all: 'Todos',
  cancel: 'Cancelar',
  save: 'Guardar',
  delete: 'Eliminar',
  add: 'Añadir',
  post: 'Publicar',
  create: 'Crear',
  creating: 'Creando…',
  saving: 'Guardando…',
  saveUpdate: 'Guardar actualización',
  unknown: 'Desconocido',
  none: 'Ninguno.',
  failed: 'Error',
  goHome: 'Ir al inicio',
  pageNotFound: 'Página no encontrada.',
  signOut: 'Cerrar sesión',
  signIn: 'Iniciar sesión',
  signUp: 'Registrarse',
  alreadyHaveAccount: '¿Ya tienes cuenta? Iniciar sesión',
  needAccount: '¿Necesitas cuenta? Registrarse',
  authFailed: 'Error de autenticación',
  checkEmail: 'Revisa tu correo para confirmar el registro, o inicia sesión si ya lo confirmaste.',
  email: 'Correo electrónico',
  password: 'Contraseña',
  team: 'Equipo',
  selectTeam: 'Seleccionar equipo…',
  title: 'Título',
  status: 'Estado',
  objective: 'Objetivo',
  targetFrom: 'Fecha desde',
  targetTo: 'Fecha hasta',
  targetDate: 'Fecha objetivo',
  lastUpdate: 'Última actualización',
  nextStep: 'Siguiente paso',
  owner: 'Responsable',
  blockers: 'Bloqueos',
  help: 'Ayuda',
  openBlockers: 'Bloqueos abiertos',
  openHelp: 'Solicitudes de ayuda abiertas',
  statusReason: 'Motivo del estado',
  blockersSummary: 'Resumen de bloqueos',
  helpNeededSummary: 'Resumen de ayuda necesaria',
  addBlocker: 'Añadir bloqueo',
  addRequest: 'Añadir solicitud',
  addComment: 'Añadir un comentario…',
  detail: 'Detalle',
  eta: 'ETA',
  noBlockers: 'Sin bloqueos.',
  noHelpRequests: 'Sin solicitudes de ayuda.',
  noComments: 'Sin comentarios.',
  noUpdatesYet: 'Sin actualizaciones aún.',
  backToBoard: '← Volver al tablero',
  edit: 'Editar',
  helpRequests: 'Solicitudes de ayuda',
  comments: 'Comentarios',
  updates: 'Actualizaciones',
  activity: 'Actividad',
  activityComment: 'Comentario',
  activityUpdate: 'Actualización de estado',
  expandDetails: 'Ver detalles y comentarios',
  collapseDetails: 'Ocultar detalles',
  detailsAndComments: 'Detalles y comentarios',
  openDetail: 'Abrir ítem',
  createItem: 'Crear ítem',
  createItemHint: 'Solo necesitas equipo y título. Después de crear, podrás completar estado, siguiente paso, fecha objetivo, bloqueos y comentarios en la página del ítem.',
  teamAndTitleRequired: 'Equipo y título obligatorios',
  createItemPermissionDenied: 'No tienes permiso para crear ítems en este equipo. Solo miembros y gestores pueden crear ítems; si eres solo espectador, pide que te asignen el rol de miembro.',
  noItem: 'Sin ítem',
  deleteItemConfirm: '¿Eliminar este ítem? Esta acción no se puede deshacer.',
  exportCsv: 'Exportar CSV',
  csvHeaders: {
    title: 'Título',
    status: 'Estado',
    owner: 'Responsable',
    openBlockers: 'Bloqueos abiertos',
    openHelp: 'Ayuda abierta',
    nextStep: 'Siguiente paso',
    targetDate: 'Fecha objetivo',
    lastUpdate: 'Última actualización',
  },
  home: 'Inicio',
  teamBoard: 'Tablero de equipos',
  director: 'Director',
  appName: 'Okrit',
  directorDashboard: 'Panel de director',
  itemsWithoutUpdate14: 'Ítems sin actualización (14 días)',
  targetDatesNext30: 'Fechas objetivo (próximos 30 días)',
  itemsPausedOrAtRisk: 'Ítems pausados o en riesgo',
  openBlockersBySeverity: 'Bloqueos abiertos por severidad',
  openBlockersByTeam: 'Bloqueos abiertos por equipo',
  openHelpByType: 'Solicitudes de ayuda abiertas por tipo',
  openHelpByTeam: 'Solicitudes de ayuda abiertas por equipo',
  upcomingTargets: 'Fechas objetivo próximas (30 / 60 / 90 días)',
  next30Days: 'Próximos 30 días',
  days31to60: '31–60 días',
  days61to90: '61–90 días',
  itemNotFound: 'Ítem no encontrado.',
  accessDeniedDirector: 'Acceso denegado. El panel de director es solo para administradores.',
  target: 'Objetivo',
  adminTeams: 'Administrar equipos',
  manageTeamMembers: 'Miembros del equipo',
  addMember: 'Añadir al equipo',
  selectUser: 'Seleccionar usuario…',
  memberRole: 'Rol en el equipo',
  removeMember: 'Quitar del equipo',
  accessDeniedAdmin: 'Acceso denegado. Solo administradores pueden gestionar equipos.',
  noMembersYet: 'Aún no hay miembros en este equipo.',
  memberAdded: 'Usuario añadido al equipo.',
  memberRemoved: 'Usuario quitado del equipo.',
  roleUpdated: 'Rol actualizado.',
  createTeam: 'Crear equipo',
  editTeam: 'Editar equipo',
  deleteTeam: 'Eliminar equipo',
  deleteTeamConfirm: '¿Eliminar este equipo y todos sus datos? Esta acción no se puede deshacer.',
  teamName: 'Nombre del equipo',
  teamIcon: 'Icono',
  tabTeams: 'Equipos',
  tabMembers: 'Miembros',
  uploadImage: 'Subir imagen',
  orUploadImage: 'o sube una imagen',
  changeImage: 'Cambiar',
} as const

export const itemStatusLabels: Record<string, string> = {
  discovery: 'Descubrimiento',
  design: 'Diseño',
  execution: 'Ejecución',
  validation: 'Validación',
  ready_to_deploy: 'Listo para desplegar',
  deploying: 'Desplegando',
  in_production: 'En producción',
  paused: 'Pausado',
  at_risk: 'En riesgo',
}

export const blockerSeverityLabels: Record<string, string> = {
  low: 'Bajo',
  medium: 'Medio',
  high: 'Alto',
  critical: 'Crítico',
}

export const blockerStatusLabels: Record<string, string> = {
  open: 'Abierto',
  in_progress: 'En progreso',
  resolved: 'Resuelto',
  wont_do: 'No se hará',
}

export const helpRequestTypeLabels: Record<string, string> = {
  decision: 'Decisión',
  escalation: 'Escalación',
  budget: 'Presupuesto',
  alignment: 'Alineación',
  resource: 'Recurso',
  other: 'Otro',
}

export const helpRequestStatusLabels: Record<string, string> = {
  open: 'Abierto',
  in_progress: 'En progreso',
  done: 'Hecho',
}

export const teamMemberRoleLabels: Record<string, string> = {
  manager: 'Gestor',
  member: 'Miembro',
  viewer: 'Espectador',
}

export function formatDate(s: string | null, locale = 'es'): string {
  if (!s) return '—'
  return new Date(s).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(s: string, locale = 'es'): string {
  return new Date(s).toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function itemStatusLabel(key: string): string {
  return itemStatusLabels[key] ?? key
}

export function blockerSeverityLabel(key: string): string {
  return blockerSeverityLabels[key] ?? key
}

export function blockerStatusLabel(key: string): string {
  return blockerStatusLabels[key] ?? key
}

export function helpRequestTypeLabel(key: string): string {
  return helpRequestTypeLabels[key] ?? key
}

export function helpRequestStatusLabel(key: string): string {
  return helpRequestStatusLabels[key] ?? key
}
