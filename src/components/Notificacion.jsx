import '../styles/Notificacion.css'

const Notificacion = ({ mensaje }) => {

    return (
        <div className="loading-overlay">
            <div className="loading-box">
                <div className="spinner"></div>
                <p>
                    {mensaje}
                </p>
            </div>
        </div>
    )
}

export default Notificacion