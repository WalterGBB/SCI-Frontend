import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId="128267941937-p183gjnp80o79gngi79j18k44q97sjju.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
)
