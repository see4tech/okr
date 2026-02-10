export const ITEM_STATUSES = [
  'discovery',
  'design',
  'execution',
  'validation',
  'ready_to_deploy',
  'deploying',
  'in_production',
  'paused',
  'at_risk',
] as const
export type ItemStatus = (typeof ITEM_STATUSES)[number]

export const BLOCKER_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const
export type BlockerSeverity = (typeof BLOCKER_SEVERITIES)[number]

export const BLOCKER_STATUSES = ['open', 'in_progress', 'resolved', 'wont_do'] as const
export type BlockerStatus = (typeof BLOCKER_STATUSES)[number]

export const HELP_REQUEST_TYPES = [
  'decision',
  'escalation',
  'budget',
  'alignment',
  'resource',
  'other',
] as const
export type HelpRequestType = (typeof HELP_REQUEST_TYPES)[number]

export const HELP_REQUEST_STATUSES = ['open', 'in_progress', 'done'] as const
export type HelpRequestStatus = (typeof HELP_REQUEST_STATUSES)[number]

export const PROFILE_ROLES = ['admin', 'manager', 'member', 'viewer'] as const
export type ProfileRole = (typeof PROFILE_ROLES)[number]

export const MEMBER_ROLES = ['manager', 'member', 'viewer'] as const
export type MemberRole = (typeof MEMBER_ROLES)[number]

export const TEAM_ICONS = [
  // Oficina / empresa
  '🏢', '🏛️', '🏗️', '🏭', '🏠', '🏦',
  // Tecnologia
  '💻', '🖥️', '📱', '⌨️', '🖨️', '💾',
  // Ciencia / laboratorio
  '🧪', '🔬', '🧬', '⚗️', '🔭', '🧫',
  // Transporte / logistica
  '✈️', '🚀', '🚢', '🚁', '🚂', '🛩️',
  // Salud
  '🏥', '💊', '🩺', '🧬', '❤️', '🩻',
  // Herramientas / ingenieria
  '🔧', '🛠️', '⚙️', '🔩', '🪛', '🔨',
  // Datos / analisis
  '📊', '📈', '📉', '🗂️', '📋', '🗄️',
  // Objetivos / estrategia
  '🎯', '🏆', '⭐', '🥇', '🏅', '🎖️',
  // Comunicacion / colaboracion
  '🤝', '💬', '📣', '📢', '🗣️', '📧',
  // Seguridad / proteccion
  '🛡️', '🔑', '🔒', '🔐', '🚨', '🧯',
  // Energia / innovacion
  '⚡', '💡', '🔋', '☀️', '🌱', '♻️',
  // Finanzas / negocios
  '💰', '💳', '🪙', '📦', '🏷️', '🧾',
  // Educacion / cultura
  '📚', '🎓', '✏️', '📝', '🎨', '🎭',
  // General
  '🌐', '🗺️', '⏱️', '📅', '🔔', '💎',
] as const
