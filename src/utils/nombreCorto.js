export const nombreCorto = (fullName, menuName) => {
    if (!fullName) return ''

    // Normalizar y limpiar espacios de más
    const partes = fullName
        .toLowerCase()
        .split(' ')
        .filter(Boolean)

    if (partes.length === 0) return ''

    const capitalizar = (txt) =>
        txt ? txt.charAt(0).toUpperCase() + txt.slice(1) : ''

    // Capitalizamos todas las palabras del array de una sola vez
    const p = partes.map(capitalizar)

    // Si solo viene una palabra, la devolvemos capitalizada
    if (p.length === 1) return p[0]

    let nombres = ''
    let apellidos = ''

    // Evaluamos dinámicamente según la cantidad de palabras
    if (p.length === 4) {
        // Ejemplo: "Enzo Aldo Bravo Burgos"
        apellidos = `${p[0]} ${p[1]}`
        nombres = `${p[2]} ${p[3]}`
    } else if (p.length === 3) {
        // Ejemplo: "Jaime Meza Huamán"
        nombres = p[0]
        apellidos = `${p[1]} ${p[2]}`
    } else {
        // Ejemplo: "Juan Pérez" (2 palabras) o casos raros de más de 4
        nombres = p[0]
        apellidos = p.slice(1).join(' ')
    }

    // Retorno según lo que necesite la interfaz
    if (menuName === true) {
        // Para el menú queremos algo corto: "PrimerNombre PrimerApellido"
        // Si son 4 palabras el primer apellido está en p[2], si son menos está en p[1]
        const primerApellido = p.length === 4 ? p[2] : p[1]
        return `${p[0]} ${primerApellido}`.trim()
    } else {
        // Formato solicitado: "Nombres, Apellidos"
        return `${nombres},\n${apellidos}`.trim()
    }
}