import { useState } from 'react'
import '../styles/ModalResolucion.css'
import toast from 'react-hot-toast'

const ModalResolucion = ({ onClose, onConfirm }) => {
    const [solucion, setSolucion] = useState('')

    const handleSubmit = () => {
        if (!solucion.trim()) {
            toast.error('Debe registrar la solución aplicada.')
            return
        }

        onConfirm(solucion)
        toast.success('Se ha cerrado la incidencia')
    }

    return (
        <div className="MoRe-overlay">
            <div className="modal-container">
                <h3>Documentar solución</h3>

                <textarea
                    placeholder="Describe la solución aplicada..."
                    value={solucion}
                    onChange={(e) => setSolucion(e.target.value)}
                    maxLength={1000}
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
