export const ROLES = {
    administrador: 'Administrador',
    OTI: 'OTI',
    docente: 'Docente',
    administrativo: 'Administrativo',
    jefeLaboratorio: 'Jefe de Laboratorio'
}

export const PERMISOS = {
    resumen: [ROLES.administrador],
    nueva: [ROLES.administrador, ROLES.docente, ROLES.administrativo, ROLES.jefeLaboratorio],
    historial: [ROLES.administrador, ROLES.docente, ROLES.administrativo, ROLES.OTI, ROLES.jefeLaboratorio],
    estadisticas: [ROLES.administrador],
    reportes: [ROLES.administrador],
    usuarios: [ROLES.administrador]
}

export default PERMISOS
