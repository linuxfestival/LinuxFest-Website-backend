function checkPermission(admin, perm, res) {
    console.log(admin.permissions.filter(permission => permission.permission === perm));
    if (!admin.permissions.filter(permission => permission.permission === perm).length) {
        res.status(400).send({ error: "You don't have permission to do that" });
        return false;
    } else {
        return true;
    }
}

module.exports = {
    checkPermission
}