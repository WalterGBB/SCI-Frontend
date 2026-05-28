import axios from 'axios'

const baseUrl = `${import.meta.env.VITE_API_URL}/api/ambientes`

const getConfig = () => {
    const loggedUser = JSON.parse(localStorage.getItem('loggedUser'))

    if (!loggedUser?.token) return {}

    return {
        headers: {
            Authorization: `Bearer ${loggedUser.token}`
        }
    }
}

/* MÉTODOS PARA AMBIENTES */

const getAll = async () => {
    const response = await axios.get(baseUrl)
    return response.data
}

const create = async (newAmbiente) => {
    const response = await axios.post(baseUrl, newAmbiente, getConfig())
    return response.data
}

const update = async (id, updatedAmbiente) => {
    const response = await axios.put(`${baseUrl}/${id}/edit`, updatedAmbiente, getConfig())
    return response.data
}

const remove = async (id) => {
    const response = await axios.delete(`${baseUrl}/${id}`, getConfig())
    return response.status
}

export default {
    getAll,
    create,
    update,
    remove,
}