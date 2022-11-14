
/**
 * Improve the socket on function adding middlewares and loading user
 */
exports.improveSocket = function (model, attribute, io, socket) {
    var middlewares = [];
    socket.onReal = socket.on;
    socket.on = (signal, ...methods) => {
        // Get the methods to execute
        let methodsToExecute = middlewares.concat(methods);

        // If signal is * save for next signal declaration
        if (signal === "*") {
            middlewares = methodsToExecute;
            return;
        }

        // Execute the array of methods
        socket.onReal(signal, async (data) => {
            // console.log("SOCKET " + signal);
            let keepGoing = true;
            for (let method of methodsToExecute) {
                if (!keepGoing) break;
                keepGoing = false;
                socket.user = await exports.getUserBySocketId(model, attribute, socket.id);
                socket.isAuthenticated = function() {return socket.user !== null};
                await method(io, socket, data, function(){ keepGoing = true; })
            }
        });
    };
};

/**
 * Get user by socket id
 */
exports.getUserBySocketId = async function (model, socketAttribute, socketId) {
    let where = {};
    where[socketAttribute] = socketId;
    try {
        return await model.findOne(where);
    } catch (e) {
        return null;
    }
};