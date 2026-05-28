// utils/tiempoPromedio.js

/**
 * Calcula el tiempo promedio de respuesta a incidencias
 * @param {Array} incidents - Lista de incidencias (debe contener estado, fechaRegistro y fechaResolucion)
 * @returns {string} Tiempo promedio formateado ("Xd", "Xh", "Xm" o "Sin datos")
 */
// utils/tiempoPromedio.js

export const calcularTiempoPromedio = (incidents) => {

    const incidenciasResueltas = incidents.filter(i =>
        (i.estado === 'Resuelta' || i.estado === 'Cerrada') &&
        i.fechaRegistro &&
        i.fechaResolucion
    )

    if (incidenciasResueltas.length === 0) return "Sin datos"

    const tiemposValidos = incidenciasResueltas
        .map(i => {
            const inicio = new Date(i.fechaRegistro)
            const fin = new Date(i.fechaResolucion)

            const diferencia = fin - inicio

            return diferencia > 0 ? diferencia : null
        })
        .filter(Boolean)

    if (tiemposValidos.length === 0) return "Sin datos"

    const promedioMs =
        tiemposValidos.reduce((acc, t) => acc + t, 0) / tiemposValidos.length

    const minutos = promedioMs / (1000 * 60)
    const horas = minutos / 60
    const dias = horas / 24

    if (dias >= 1) return `${Math.floor(dias)} d`; // Retorna el entero hacia abajo
    if (horas >= 1) return `${horas.toFixed(2)} h`
    return `${Math.round(minutos)} m`
}

export const calcularUbicacionMayor = (incidents) => {
    if (incidents.length === 0) return "Sin datos"

    // Contar incidencias por procedencia
    const contadorProcedencia = {}
    incidents.forEach(incidencia => {
        const procedencia = incidencia.procedencia
        contadorProcedencia[procedencia] = (contadorProcedencia[procedencia] || 0) + 1
    })

    // Encontrar la ubicación con más incidencias
    const ubicacionMayor = Object.keys(contadorProcedencia).reduce((a, b) =>
        contadorProcedencia[a] > contadorProcedencia[b] ? a : b
    )

    return ubicacionMayor
}
