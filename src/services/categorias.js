import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''
const baseUrl = `${API_URL}/api/categorias`

const getConfig = () => {
    const loggedUser = JSON.parse(localStorage.getItem('loggedUser'))

    if (!loggedUser?.token) return {}

    return {
        headers: {
            Authorization: `Bearer ${loggedUser.token}`
        }
    }
}

/* MÉTODOS PARA CATEGORÍAS PRINCIPALES */

const getAll = async () => {
    const response = await axios.get(baseUrl)
    return response.data
}

const create = async (newCategory) => {
    const response = await axios.post(baseUrl, newCategory, getConfig())
    return response.data
}

const updateName = async (id, newName) => {
    const response = await axios.put(`${baseUrl}/${id}/edit`, newName, getConfig())
    return response.data
}

const remove = async (id) => {
    const response = await axios.delete(`${baseUrl}/${id}`, getConfig())
    return response.status
}

/* MÉTODOS PARA SUBCATEGORÍAS */

// Añadir una subcategoría a una categoría existente
const addSubcategoria = async (categoriaId, newSubcategoria) => {
    const response = await axios.post(`${baseUrl}/${categoriaId}/subcategorias`, newSubcategoria, getConfig())
    return response.data
}

// Editar el nombre de una subcategoría específica
const updateSubcategoriaName = async (categoriaId, subcategoriaId, newName) => {
    const response = await axios.put(`${baseUrl}/${categoriaId}/subcategorias/${subcategoriaId}`, newName, getConfig())
    return response.data
}

// Eliminar una subcategoría específica
const removeSubcategoria = async (categoriaId, subcategoriaId) => {
    const response = await axios.delete(`${baseUrl}/${categoriaId}/subcategorias/${subcategoriaId}`, getConfig())
    return response.data // Retornamos la data en caso de que el backend devuelva la categoría actualizada
}

export default {
    getAll,
    create,
    updateName,
    remove,
    addSubcategoria,
    updateSubcategoriaName,
    removeSubcategoria
}