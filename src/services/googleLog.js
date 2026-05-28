import axios from 'axios'
const baseUrl = `${import.meta.env.VITE_API_URL}/api/login/google`

const loginWithGoogle = async (code) => {
    const response = await axios.post(baseUrl, { code })
    return response.data
}

export default { loginWithGoogle }
