import { forwardRef, useState, useEffect } from 'react'
import '../styles/Users.css'
import toast from 'react-hot-toast'
import Notificacion from './Notificacion'

import userService from '../services/users'
import { nombreCorto } from '../utils/nombreCorto'

const ROLES = [
    'Docente',
    'Administrativo',
    'OTI',
    'Directivo',
    'Administrador'
]

const Users = forwardRef(({ id, users, setUsers, loading }, ref) => {

    const [editingUser, setEditingUser] = useState(null)
    const [newName, setNewName] = useState('')
    const [newRol, setNewRol] = useState('')
    const [adminPassword, setAdminPassword] = useState('')
    const [saving, setSaving] = useState(false)

    const handleDelete = async (user) => {
        if (user.rol === 'Administrador') return

        const confirm = window.confirm(
            `¿Desea eliminar al usuario ${user.name}?`
        )
        if (!confirm) return

        try {
            await userService.remove(user.id)
            setUsers(users.filter(u => u.id !== user.id))
            toast.success('Usuario eliminado correctamente')
        } catch (error) {
            toast.error(
                error?.response?.data?.error ||
                'Error al eliminar el usuario'
            )
        }
    }

    const handleEdit = (user) => {
        if (!user) return

        try {
            setEditingUser(user)
            setNewName(user.name)
            setNewRol(user.rol)
            setAdminPassword('')
        } catch (error) {
            toast.error(
                error?.response?.data?.error ||
                'Error al iniciar edición del usuario'
            )
        }
    }

    const handleSave = async () => {
        if (!editingUser) return

        const requierePasswordAdmin =
            editingUser.rol === 'Administrador' ||
            newRol === 'Administrador'

        if (requierePasswordAdmin && !adminPassword) {
            toast.error('Debe ingresar la contraseña del administrador')
            return
        }

        try {
            setSaving(true)

            const updatedUser = await userService.update(editingUser.id, {
                name: newName,
                rol: newRol,
                adminPassword: requierePasswordAdmin ? adminPassword : undefined
            })
            toast.success('Datos de usuario editados correctamente')

            setUsers(users.map(u =>
                u.id === updatedUser.id ? updatedUser : u
            ))

            setEditingUser(null)
        } catch (error) {
            toast.error(
                error?.response?.data?.error ||
                'Error al actualizar el usuario'
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <section className="users-container" ref={ref} id={id}>
            <h1>USUARIOS</h1>

            <div className="users-grid">
                {users.map(user => {
                    const isEditing = editingUser?.id === user.id
                    const requierePasswordAdmin =
                        isEditing &&
                        (user.rol === 'Administrador' || newRol === 'Administrador')

                    return (
                        <div
                            key={user.id}
                            className={`user-card ${user.rol === 'Administrador' ? 'admin' : ''}`}
                        >
                            <div className="user-avatar">
                                <img
                                    src={user.picture}
                                    alt="avatar"
                                    referrerPolicy="no-referrer"
                                />
                            </div>

                            {!isEditing ? (
                                <>
                                    <h3>{nombreCorto(user.name)}</h3>
                                    <p className="user-email">{user.email}</p>

                                    <span className="user-role">
                                        {user.rol}
                                        {user.rol === 'Administrador' && (
                                            <img src='https://res.cloudinary.com/francode/image/upload/v1778545747/admin-logo_o3mk8z.png' alt="admin-logo" />
                                        )}
                                    </span>
                                </>
                            ) : (
                                <div className="edit-panel">
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                    />

                                    <select
                                        value={newRol}
                                        onChange={(e) => setNewRol(e.target.value)}
                                    >
                                        {ROLES.map(r => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>

                                    {requierePasswordAdmin && (
                                        <input
                                            type="password"
                                            placeholder="Contraseña del administrador"
                                            value={adminPassword}
                                            onChange={(e) => setAdminPassword(e.target.value)}
                                        />
                                    )}

                                    <div className="edit-actions">
                                        <button onClick={handleSave} disabled={saving}>
                                            Guardar
                                        </button>
                                        <button
                                            className="cancel"
                                            onClick={() => setEditingUser(null)}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="user-actions">
                                {!isEditing && (
                                    <button
                                        className="btn-edit"
                                        onClick={() => handleEdit(user)}
                                    >
                                        <img src='https://res.cloudinary.com/francode/image/upload/v1778545789/editar-icon_dvhgdo.png' alt="editar" />
                                    </button>
                                )}

                                {!isEditing && user.rol !== 'Administrador' && (
                                    <button
                                        className="btn-delete"
                                        onClick={() => handleDelete(user)}
                                    >
                                        <img src='https://res.cloudinary.com/francode/image/upload/v1778545797/eliminarU_jztooh.png' alt="eliminar" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
            {
                loading && (
                    <Notificacion mensaje="Cargando Usuarios" />
                )
            }
        </section>
    )
})

export default Users