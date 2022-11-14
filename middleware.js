
/**
 * Force Logged In
 */
exports.onlyLoggedIn = function (io, socket, data, next) {
    if (socket.isAuthenticated()) {
        next();
    }
};