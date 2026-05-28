// Importamos la librería axios para hacer peticiones HTTP al backend
import axios from 'axios'

// Definimos la URL base para acceder a los endpoints de incidents
const baseUrl = `${import.meta.env.VITE_API_URL}/api/incidents`

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

// Función asincrónica que obtiene todas las incidencias del backend
const getAll = async () => {
    const response = await axios.get(baseUrl)
    return response.data // Retorna los datos de la respuesta
}

const getIncident = async (id) => {
    const response = await axios.get(`${baseUrl}/${id}`)
    return response.data // Retorna los datos de la incidencia específica
}

// Función asincrónica que crea una nueva incidencia en el backend
// Recibe un objeto newIncident y lo envía junto con el token de autorización
const createIncident = async (newIncident) => {
    const response = await axios.post(baseUrl, newIncident, getConfig())
    return response.data // Retorna la incidencia creada al frontend
}

// Función asincrónica que elimina una incidencia dado su id
// También requiere enviar el token de autorización
const deleteIncident = async (id) => {
    const response = await axios.delete(`${baseUrl}/${id}`, getConfig())
    return response.status // Retorna solo el código de estado de la respuesta del backend
}

// Función asincrónica que actualiza una incidencia dado su id
// NOTA: Esta función no está recibiendo datos para actualizar, 
// lo que indica que posiblemente esté incompleta o necesita ajustes
const updatedIncident = async (id, updatedData) => {
    const response = await axios.put(
        `${baseUrl}/${id}`,
        updatedData,
        getConfig()
    )

    return response.data
}

const updateIncidentData = async (id, updatedData) => {
    const response = await axios.put(
        `${baseUrl}/${id}/edit`,
        updatedData,
        getConfig()
    )

    return response.data
}

// Exportamos todas las funciones para que puedan ser utilizadas en otros componentes
export default {
    getAll,
    getIncident,
    createIncident,
    deleteIncident,
    updatedIncident,
    updateIncidentData
}
