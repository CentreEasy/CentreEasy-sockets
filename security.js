/**
 * Login
 */
exports.login = function (UserModel, SocketAttribute) {
    return async function (io, socket, data) {

        // Parse params
        let params = exports.parseData(data);
        if (!params) return;

        // Get current user and save its socket ID
        let user = await UserModel.findOne({_id: params.id});
        if (user) {
            // The user is correct
            await exports.addSocketId(user, SocketAttribute, socket.id);
            console.log("A USER LOGGED IN2: " + user._id);
        }
    }
};

/**
 * Disconnects
 */
exports.disconnect  = function (UserModel, SocketAttribute) {
    return async function(io, socket) {
        // Disconnection
        let where = {};
        where[SocketAttribute] = socket.id;
        let user = await UserModel.findOne(where);
        if (user) {
            await exports.removeSocketId(user, SocketAttribute, socket.id);
            console.log("A USER DISCONNECTED: " + user._id);
        }
    }
};

/**
 * Parse Signal Data
 */
exports.parseData = function(data) {
    try {
        return data;
    } catch (e) {
        return false;
    }
};

// User must be mongoose user model
exports.addSocketId = async function (user, socketAttribute, socketId) {
    try {
        user[socketAttribute].push(socketId);
        return await user.save();
    } catch (e) {
        console.error(e);
        return false;
    }
};

// User must be mongoose user model
exports.removeSocketId = async function (user, socketAttribute, socketId) {
    try {
        user[socketAttribute].pull(socketId);
        return await user.save();
    } catch (e) {
        console.error(e);
        return false;
    }
};