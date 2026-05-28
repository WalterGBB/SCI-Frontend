import { useState } from 'react'
import '../styles/ModalResolucion.css'

const ModalResolucion = ({ onClose, onConfirm }) => {
    const [solucion, setSolucion] = useState('')

    const handleSubmit = () => {
        if (!solucion.trim()) {
            alert('Debe ingresar la solución.')
            return
        }

        onConfirm(solucion)
    }

    return (
        <div className="MoRe-overlay">
            <div className="modal-container">
                <h3>Documentar solución</h3>

                <textarea
                    placeholder="Describe la solución aplicada..."
                    value={solucion}
                    onChange={(e) => setSolucion(e.target.value)}
                />

                <div className="modal-buttons">
                    <button className="btn-cancel" onClick={onClose}>
                        Cancelar
                    </button>

                    <button className="btn-confirm" onClick={handleSubmit}>
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ModalResolucion
