const sortActivos = (set) => {

    return Array.from(set).sort((a, b) => {

        const aEsPC = a.startsWith('PC_')
        const bEsPC = b.startsWith('PC_')

        // 1. Los NO PC van primero
        if (!aEsPC && bEsPC) return -1
        if (aEsPC && !bEsPC) return 1

        // 2. Ambos NO PC → orden alfabético
        if (!aEsPC && !bEsPC) {
            return a.localeCompare(b)
        }

        // 3. PC_DOCENTE siempre primero entre PCs
        if (a === 'PC_DOCENTE') return -1
        if (b === 'PC_DOCENTE') return 1

        // 4. Extraer número de PCs dinámicas
        const numA = parseInt(a.replace('PC_', ''))
        const numB = parseInt(b.replace('PC_', ''))

        return numA - numB
    })
}

export default sortActivos