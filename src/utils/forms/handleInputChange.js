const handleInputChange = ({
    e,
    setFormData,
    setActivosReportados = null
}) => {

    const { id, value } = e.target

    // Resetear activos al cambiar procedencia
    if (id === 'procedencia' && setActivosReportados) {
        setActivosReportados(new Set())
    }

    setFormData((prev) => {

        const newState = {
            ...prev,
            [id]: value
        }

        // Limpiar subcategoría al cambiar categoría
        if (id === 'categoria') {
            newState.subcategoria = ''
        }

        return newState
    })
}

export default handleInputChange