// utils/tiempoPromedio.js

/**
 * Calcula el tiempo promedio de respuesta a incidencias
 * @param {Array} incidents - Lista de incidencias (debe contener estado, fechaRegistro y fechaResolucion)
 * @returns {string} Tiempo promedio formateado ("Xd", "Xh", "Xm" o "Sin datos")
 */
export const calcularTiempoPromedio = (incidents) => {
    // Solo incidencias resueltas y con fechas válidas
    const incidenciasResueltas = incidents.filter(i =>
        i.estado === true &&
        i.fechaRegistro &&
        i.fechaResolucion
    )

    if (incidenciasResueltas.length === 0) return "Sin datos"

    // Diferencia en milisegundos
    const tiemposRespuesta = incidenciasResueltas.map(i => {
        const inicio = new Date(i.fechaRegistro)
        const fin = new Date(i.fechaResolucion)
        return fin - inicio
    })

    const promedioMs = tiemposRespuesta.reduce((acc, t) => acc + t, 0) / tiemposRespuesta.length

    // Conversión
    const minutos = promedioMs / (1000 * 60)
    const horas = minutos / 60
    const dias = horas / 24

    if (dias >= 1) return `${dias.toFixed(1)} d`
    if (horas >= 1) return `${horas.toFixed(2)} h`
    return `${minutos.toFixed(0)} m`
}
