const hasAccess = (rol, allowedRoles = []) => {
    return allowedRoles.includes(rol)
}

export default hasAccess
