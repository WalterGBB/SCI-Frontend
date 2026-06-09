export const nombreCorto = (fullName, menuName) => {
    if (!fullName) return ''

    // Normalizar
    const partes = fullName
        .toLowerCase()
        .split(' ')
        .filter(Boolean)

    if (partes.length === 0) return ''
    if (partes.length === 1) return fullName

    // 1. CORRECCIÓN: Hacemos la función totalmente segura ante elementos undefined o null
    const capitalizar = (txt) =>
        txt ? txt.charAt(0).toUpperCase() + txt.slice(1) : ''

    if (menuName === true) {
        // Si el nombre es corto (ej: 2 palabras "Juan Perez"), partes[2] no existirá.
        // Usamos un condicional dinámico para rescatar el nombre correcto.
        const nombre = partes[2] ? capitalizar(partes[2]) : capitalizar(partes[0])
        const apellido = partes[2] ? capitalizar(partes[0]) : (partes[1] ? capitalizar(partes[1]) : '')

        return `${nombre} ${apellido}`.trim()
    } else {
        // 2. CORRECCIÓN: Si faltan partes, enviamos un string vacío en lugar de undefined
        const p0 = capitalizar(partes[0] || '')
        const p1 = capitalizar(partes[1] || '')
        const p2 = capitalizar(partes[2] || '')
        const p3 = capitalizar(partes[3] || '')

        const apellidos = `${p0} ${p1}`.trim()
        const nombres = `${p2} ${p3}`.trim()

        // Si no hay nombres (porque solo ingresó 2 palabras), devolvemos solo lo que haya
        return nombres ? `${apellidos}, ${nombres}`.trim() : apellidos
    }
}