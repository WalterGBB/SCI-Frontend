import axios from 'axios'

// Capturamos la variable de entorno. Si no existe (en local), usamos string vacío.
const API_URL = import.meta.env.VITE_API_URL || ''
const baseUrl = `${API_URL}/api/users`

// Función para almacenar el token de autenticación, inicialmente es null
const getConfig = () => {
    const loggedUser = JSON.parse(localStorage.getItem('loggedUser'))

    if (!loggedUser?.token) return {}

    return {
        headers: {
            Authorization: `Bearer ${loggedUser.token}`
        }
    }
}

const getAll = async () => {
    const response = await axios.get(baseUrl, getConfig())
    return response.data
}

const update = async (id, updatedUser) => {
    const response = await axios.put(
        `${baseUrl}/${id}`,
        updatedUser,
        getConfig()
    )
    return response.data
}

const remove = async id => {
    await axios.delete(`${baseUrl}/${id}`, getConfig())
}

export default {
    getAll,
    update,
    remove,
}
