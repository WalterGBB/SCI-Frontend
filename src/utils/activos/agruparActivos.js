import ACTIVOS from '../../constants/activos'

const agruparActivosPorCategoria = (activos = []) => {

    return activos.reduce((acc, activo) => {

        const activoCode =
            typeof activo === 'string'
                ? activo
                : activo.code

        const data = ACTIVOS[activoCode]

        if (!data) return acc

        const categoria = data.categoria || 'Otros'

        if (!acc[categoria]) {
            acc[categoria] = []
        }

        acc[categoria].push({
            ...(typeof activo === 'object' ? activo : {}),
            code: activoCode,
            data
        })

        return acc

    }, {})
}

export default agruparActivosPorCategoria