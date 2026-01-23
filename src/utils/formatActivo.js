export const formatActivo = (activo) => {
    if (activo === "pcD") return "PC Docente"
    if (typeof activo === "number") return `PC${activo}`
    return activo
}