const toggleActivo = (setState, activoId) => {

    setState((prev) => {

        const upd = new Set(prev)

        if (upd.has(activoId)) {
            upd.delete(activoId)
        } else {
            upd.add(activoId)
        }

        return upd
    })
}

export default toggleActivo