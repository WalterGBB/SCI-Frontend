import axios from 'axios'
const baseUrl = '/api/login/google'

const loginWithGoogle = async (code) => {
    const response = await axios.post(baseUrl, { code })
    return response.data
}

export default { loginWithGoogle }
