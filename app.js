'use strict'

var os = require('os')
var http = require('http.min')
var state = {}

var hookInterval = 30000
var retryTime = 5000

exports.init = function () {
  var baseHomeyUrl = 'http://' + getLocalIP()
  loadState()
  registerWebHook('present', baseHomeyUrl + '/api/app/info.matjaz.presence/hooks/present')
  registerWebHook('absent', baseHomeyUrl + '/api/app/info.matjaz.presence/hooks/absent')

  Homey.manager('flow').on('trigger.presenceChanged', onFlowTriggerPresenceChanged)
  Homey.log('Presence ready')
}

exports.setPresence = function (id, isPresent) {
  if (state[id] === isPresent) {
    return
  }
  state[id] = isPresent
  Homey.manager('flow').trigger('presenceChanged', {
    isPresent: isPresent
  }, {
    id: id
  })
  Homey.manager('flow').trigger('presenceChangedAny', {
    id: id,
    isPresent: isPresent
  })
}

function loadState () {
  var serviceUrl = Homey.manager('settings').get('serviceUrl')
  if (!serviceUrl) {
    return
  }
  return http.json(serviceUrl).then(function (resp) {
    if (typeof resp === 'object') {
      for (var id in resp) {
        state[id] = true
      }
    }
    return resp
  })
}

function registerWebHook (event, options) {
  var serviceUrl = Homey.manager('settings').get('serviceUrl')
  if (!serviceUrl) {
    return
  }
  // Homey.log(event, options)
  http.post({
    uri: serviceUrl + '/hooks',
    json: {
      event: event,
      options: options
    }
  }).then(function (result) {
    // Homey.log(result.data)
    var id = result.data.id
    var interval = setInterval(function () {
      http.get(serviceUrl + '/hooks/' + id).then(function (result) {
        // Homey.log(result.data)
        if (result.response.statusCode === 404) {
          clearInterval(interval)
          interval = null
          // re-register webhook
          Homey.error('Hook not found: ' + id)
          registerWebHook(event, options)
        }
      }).catch(function (err) {
        Homey.error(err)
      })
    }, hookInterval)
  })
  .catch(function (err) {
    Homey.error(err)
    setTimeout(function () {
      registerWebHook(event, options)
    }, retryTime)
  })
}

function onFlowTriggerPresenceChanged (callback, args, state) {
  callback(null, args.id === state.id)
}

function getLocalIP () {
  var i = os.networkInterfaces()['wlan0'].filter(function (i) {
    return i.family === 'IPv4'
  })[0]
  return i && i.address
}
