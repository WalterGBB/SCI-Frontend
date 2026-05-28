import ACTIVOS from '../../constants/activos'

export const formatActivo = (activo) => {

    if (!activo) return ''

    // PCs dinámicas
    if (typeof activo === 'string' && activo.startsWith('PC_')) {

        if (activo === 'PC_DOCENTE') {
            return 'PC Docente'
        }

        return activo.replace('_', ' ')
    }

    // Activos normales del catálogo
    return ACTIVOS[activo]?.nombre || activo
}