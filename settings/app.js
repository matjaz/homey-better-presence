angular.module('betterPresence', [])
.controller('betterPresenceCtrl', function ($http, $q, $scope) {
  $scope.settings = {}

  Homey.get('serviceUrl', function (err, serviceUrl) {
    if (!err) {
      $scope.settings.serviceUrl = serviceUrl
    }
    presence('GET', '/.meta').then(function (data) {
      $scope.status = data
      $scope.selectTab('status')
      if (data.version && data.version.slice(0, 4) !== '1.5.') {
        Homey.alert(__('settings.incompatibleVersion'), 'error')
      }
    }).catch(function (error) {
      $scope.error = error && error.data || error || __('settings.Unknown error')
      $scope.selectTab('settings')
    })
  })

  $scope.saveSettings = function () {
    Homey.set('serviceUrl', $scope.settings.serviceUrl)
  }

  $scope.selectTab = function (id) {
    $scope.selTab = id
    if (id === 'providers') {
      loadProviders()
    }
  }

  $scope.selectProvider = function (provider) {
    $scope.selProvider = provider.id
    loadProvider(provider)
  }

  $scope.loadPresence = function () {
    presence('GET', '/').then(function (presence) {
      $scope.presence = presence
    })
  }

  function loadProviders () {
    if ($scope.providers) {
      return
    }
    presence('GET', '/providers').then(function (providers) {
      $scope.providers = providers
    })
  }

  function loadProvider (provider) {
    presence('GET', '/providers/' + provider.id).then(function (devices) {
      provider.devices = devices
    })
  }

  function presence (method, path, data) {
    var serviceUrl = $scope.settings.serviceUrl
    if (!serviceUrl) {
      return $q.reject(__('settings.missingAppUrl'))
    }
    $scope.error = null
    return $http({
      method: method,
      url: serviceUrl + path,
      data: data
    }).then(function (resp) {
      return resp.data
    })
  }

  Homey.ready()
})

window.onHomeyReady = function () {
  angular.bootstrap(document, ['betterPresence'])
}
