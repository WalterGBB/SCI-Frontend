/**
 * Ordena un arreglo de objetos alfabéticamente (A-Z)
 * @param {Array} array
 * @param {string} property
 * @returns {Array}
 */
export const sortAlphabetically = (array, property) => {
    return [...array].sort((a, b) =>
        a[property].localeCompare(b[property], 'es', {
            sensitivity: 'base',
        })
    )
}