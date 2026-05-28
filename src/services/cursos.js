import axios from 'axios'

const baseUrl = '/api/cursos'

// Reutilizamos tu lógica de extracción de token del localStorage
const getConfig = () => {
    const loggedUser = JSON.parse(localStorage.getItem('loggedUser'))

    if (!loggedUser?.token) return {}

    return {
        headers: {
            Authorization: `Bearer ${loggedUser.token}`
        }
    }
}

// Obtener todos los cursos (Útil para el select de Nueva Incidencia y la tabla de Admin)
const getAll = async () => {
    const response = await axios.get(baseUrl)
    return response.data
}

// Obtener solo los cursos activos (Opcional, si el backend filtra por query)
// Ejemplo: /api/courses?active=true
// const getActive = async (id) => {
//     const response = await axios.get(`${baseUrl}?active=true`)
//     return response.data
// }

// Obtener curso por ID
// const getById = async (id) => {
//     const response = await axios.get(`${baseUrl}/${id}`)
//     return response.data
// }

// Activar/Desactivar un curso (Requiere Token)
// En lugar de eliminar físicamente, cambiamos su estado active
const toggleActive = async (id, nuevoEstado) => {
    const response = await axios.put(`${baseUrl}/${id}`, nuevoEstado, getConfig())
    return response.data
}

// Crear un nuevo curso (Requiere Token)
const create = async (newCourse) => {
    const response = await axios.post(baseUrl, newCourse, getConfig())
    return response.data
}

// Actualizar nombre de un curso
const updateName = async (id, newName) => {
    const response = await axios.put(`${baseUrl}/${id}/edit`, newName, getConfig())
    return response.data
}

// Eliminar físicamente un curso (Úsalo con precaución, mejor usa el updateName para desactivar)
const remove = async (id) => {
    const response = await axios.delete(`${baseUrl}/${id}`, getConfig())
    return response.status
}

export default {
    getAll,
    // getById,
    // getActive,
    create,
    toggleActive,
    updateName,
    remove
}