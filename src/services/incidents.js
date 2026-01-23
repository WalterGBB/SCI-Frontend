// Importamos la librería axios para hacer peticiones HTTP al backend
import axios from 'axios'

// Definimos la URL base para acceder a los endpoints de incidents
const baseUrl = '/api/incidents'

// Variable para almacenar el token de autenticación
let token = null

// Función para configurar el token con el formato 'Bearer <token>'
const setToken = newToken => {
    token = `Bearer ${newToken}`
}

// Función asincrónica que obtiene todas las incidencias del backend
const getAll = async () => {
    const response = await axios.get(baseUrl)
    return response.data // Retorna los datos de la respuesta
}

// Función asincrónica que crea una nueva incidencia en el backend
// Recibe un objeto newIncident y lo envía junto con el token de autorización
const createIncident = async (newIncident) => {
    const config = {
        headers: { Authorization: token },
    }

    const response = await axios.post(baseUrl, newIncident, config)
    return response.data // Retorna la incidencia creada al frontend
}

// Función asincrónica que elimina una incidencia dado su id
// También requiere enviar el token de autorización
const deleteIncident = async (id) => {
    const config = {
        headers: { Authorization: token },
    }

    const response = await axios.delete(`${baseUrl}/${id}`, config)
    return response.status // Retorna solo el código de estado de la respuesta del backend
}

// Función asincrónica que actualiza una incidencia dado su id
// NOTA: Esta función no está recibiendo datos para actualizar, 
// lo que indica que posiblemente esté incompleta o necesita ajustes
const updatedIncident = async (id) => {
    const response = await axios.put(`${baseUrl}/${id}`)
    return response.data // Retorna la incidencia actualizada al frontend
}

// Exportamos todas las funciones para que puedan ser utilizadas en otros componentes
export default { getAll, setToken, createIncident, deleteIncident, updatedIncident }
