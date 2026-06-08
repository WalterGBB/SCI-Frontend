import axios from 'axios'

// Capturamos la variable de entorno. Si no existe (en local), usamos string vacío.
const API_URL = import.meta.env.VITE_API_URL || ''
const baseUrl = `${API_URL}/api/login`

const login = async credentials => {
    const response = await axios.post(baseUrl, credentials)
    return response.data
}

export default { login }