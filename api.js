module.exports = [{
  path: '/hooks/:type',
  method: 'POST',
  description: 'Presence hooks',
  requires_authorization: false,
  fn: function (callback, args) {
    try {
      var present = args.params.type === 'present'
      args.body.data.forEach(function (presence) {
        Homey.app.setPresence(presence.id, present)
      })
      callback(null, true)
    } catch (e) {
      Homey.error(e)
      callback(e)
    }
  }
}]
