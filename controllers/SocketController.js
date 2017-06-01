var SocketController = module.exports = {

  isAuthed (socket, args, next) {
    var client = socket.sock,
      event = args[0]

    if (!client.user) {
      log.verbose('SocketController::isAuthed not authed')
      return client.emit('unauth', 'need auth')
    }
    next()
  },

  auth (socket, args) {
    var tokenService = app.services.token,
      token = args[1] || ''
    client = socket.sock

    tokenService.verifyAccessToken(token)
      .then(function (decoded) {
        client.user = decoded.user
        client.join(client.user)
        client.emit('auth:success', decoded.user)
      })
      .catch(function (err) {
        log.verbose('SocketController::auth fail', err.message)
        client.emit('auth:fail', err.message)
      })
  },

  message (socket, args) {
    var Message = app.models.Message,
      msg = args[1] || {},
      client = socket.sock

    msg.sender = client.user
    msg.time = Date.now()

    Message.create(msg)
      .then(function (message) {
        client.emit('message:success', message.toObject())
      })
      .catch(function (err) {
        log.verbose('SocketController::message fail', err.message)
        client.emit('message:fail', err.message)
      })
  },

  receive (socket) {
    var Message = app.models.Message,
      client = socket.sock

    Message.find({ receiver: client.user })
      .lean()
      .then(function (messages) {
        client.emit('message', messages)
      })
  },

  ack (socket, args) {
    var Message = app.models.Message,
      acks = args[1] || {},
      client = socket.sock

    Message.remove({
      receiver: client.user,
      _id: { $in: acks },
    })
      .then(function (rst) {
        client.emit('ack:success', rst)
      })
      .catch(function (err) {
        log.verbose('SocketController::ack fail', err.message)
        client.emit('ack:fail', err.message)
      })
  },

}
