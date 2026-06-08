import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''
const baseUrl = `${API_URL}/api/login/google`

const loginWithGoogle = async (code) => {
    const response = await axios.post(baseUrl, { code })
    return response.data
}

export default { loginWithGoogle }
