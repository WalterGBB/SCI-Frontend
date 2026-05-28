import '../styles/ModalConfirmacion.css'

const ModalConfirmacion = ({ mensaje, onConfirm, onCancel }) => {
    return (
        <div className="MoCo-overlay">
            <div className="modal-container">
                <h2>Confirmar acción</h2>
                <p className='msm'>{mensaje}</p>

                <div className="modal-buttons">
                    <button className="btn-cancel" onClick={onCancel}>
                        Cancelar
                    </button>

                    <button className="btn-confirm" onClick={onConfirm}>
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ModalConfirmacion