var socket = require('socket.io');
var Security = require('./security');
var Utils = require('./utils');
var Middleware = require('./middleware');

module.exports = {

    /**
     * Attributes
     */

    // The IO object
    io: null,

    // The mongoose model to store sockets ids
    UserModel: null,

    // The attribute where to store sockets ids
    SocketAttribute: "socket",


    /**
     * Functions
     */

    // Configure the mongoose model to store socket connection
    configure: function (model, attribute = null){
        this.UserModel = model;
        if (attribute) {
            this.SocketAttribute = attribute;
        }
    },

    // Connect to the socket
    connect: function(server, options){
        this.io = socket(server, options);
    },

    // Clean the sockets ids in BdD
    clean: async function() {
        let unSetter = {};
        unSetter[this.SocketAttribute] = null;
        return await this.UserModel.updateMany({}, {$unset: unSetter});
    },

    getUserSockets: function (user) {
        let socketIds = [];
        if (user[this.SocketAttribute] && user[this.SocketAttribute].length > 0) {
            for (let socketId of user[this.SocketAttribute]) {
                socketIds.push(socketId);
            }
        }
        return socketIds;
    },

    // Better function emit
    emit: function(signal, data, socketIds = null) {
        // Emit to socket Id
        let emitToSocketId = (signal, data, socketId) => {
            if (this.io.sockets.connected[socketId]) {
                console.log("++++ Emiting")
                this.io.sockets.connected[socketId].emit(signal, data);
            } else {
                console.log("++++ ERROR Emiting")
            }
        };

        if (!this.io) {
            console.error("IO has not been connected!");
            return false;
        }
        if (!socketIds) {
            // Emit to all
            this.io.emit(signal, data);
        } else if (socketIds instanceof String){
            // Emit to a specific socket
            if (this.io.sockets.connected.hasOwnProperty(socketIds)) {
                this.io.sockets.connected[socketIds].emit(signal, data);
            }
        } else if (socketIds instanceof Array) {
            // Emit to an array of something
            for (let socketId of socketIds) {
                if (socketId instanceof Object) {
                    // Emit to user
                    let socketsList = this.getUserSockets(socketId);
                    for (let socketId of socketsList) {
                        if (this.io.sockets.connected.hasOwnProperty(socketId)) {
                            this.io.sockets.connected[socketId].emit(signal, data);
                        }
                    }
                } else {
                    // Emit to socket
                    if (this.io.sockets.connected.hasOwnProperty(socketId)) {
                        this.io.sockets.connected[socketId].emit(signal, data);
                    }
                }
            }
        } else if (socketIds instanceof Object){
            // Emit to a User object
            let socketsList = this.getUserSockets(socketIds);
            for (let socketId of socketsList) {
                if (this.io.sockets.connected.hasOwnProperty(socketId)) {
                    this.io.sockets.connected[socketId].emit(signal, data);
                }
            }
        }
    },

    // Listen to connection and initiate it
    onConnection: function(options, callback) {
        this.io.on('connection', (socket) => {

            // Improve socket on signals
            Utils.improveSocket(this.UserModel, this.SocketAttribute, this.io, socket);

            if (options.manageUsers) {

                // login
                socket.on('LOGIN', Security.login(this.UserModel, this.SocketAttribute));

                // disconnect / logout
                socket.on('disconnect', Security.disconnect(this.UserModel, this.SocketAttribute));
                socket.on('LOGOUT', Security.disconnect(this.UserModel, this.SocketAttribute));
            }

            // Callback connection
            callback(socket);
        });
    },


    /**
     * Some util middleware
     */

    middleware: Middleware

};
