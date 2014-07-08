/**
 * restful-app
 * @version v0.0.1 - 2014-07-08
 * @link 
 * @author  <>
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
'use strict';
angular.module('restfulApp', [
  'angularFileUpload',
  'ngPrettyJson'
], function ($httpProvider) {
  // Use x-www-form-urlencoded Content-Type
  $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
  /**
     * The workhorse; converts an object to x-www-form-urlencoded serialization.
     * @param {Object} obj
     * @return {String}
     */
  var param = function (obj) {
    var query = '', name, value, fullSubName, subName, subValue, innerObj, i;
    for (name in obj) {
      value = obj[name];
      if (value instanceof Array) {
        for (i = 0; i < value.length; ++i) {
          subValue = value[i];
          fullSubName = name + '[' + i + ']';
          innerObj = {};
          innerObj[fullSubName] = subValue;
          query += param(innerObj) + '&';
        }
      } else if (value instanceof Object) {
        for (subName in value) {
          subValue = value[subName];
          fullSubName = name + '[' + subName + ']';
          innerObj = {};
          innerObj[fullSubName] = subValue;
          query += param(innerObj) + '&';
        }
      } else if (value !== undefined && value !== null)
        query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
    }
    return query.length ? query.substr(0, query.length - 1) : query;
  };
  // Override $http service's default transformRequest
  $httpProvider.defaults.transformRequest = [function (data) {
      var result = angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
      return result;
    }];
});
'use strict';
angular.module('restfulApp').controller('MainCtrl', [
  '$scope',
  'DrupalSettings',
  'ArticlesResource',
  'FileUpload',
  function ($scope, DrupalSettings, ArticlesResource, FileUpload) {
    $scope.data = DrupalSettings.getData('article');
    $scope.serverSide = {};
    /**
     * Submit form (even if not valildated via client).
     */
    $scope.submitForm = function () {
      ArticlesResource.createArticle($scope.data).success(function (data, status, headers, config) {
        $scope.serverSide.data = data;
        $scope.serverSide.status = status;
      }).error(function (data, status, headers, config) {
        $scope.serverSide.data = data;
        $scope.serverSide.status = status;
      });
      ;
    };
    $scope.onFileSelect = function ($files) {
      //$files: an array of files selected, each file has name, size, and type.
      for (var i = 0; i < $files.length; i++) {
        var file = $files[i];
        FileUpload.upload(file).then(function (data) {
          $scope.data.image = data.data.list[0].id;
          $scope.serverSide.image = data.data.list[0];
        });
      }
    };
  }
]);
'use strict';
angular.module('restfulApp').service('ArticlesResource', [
  'DrupalSettings',
  '$http',
  '$log',
  function (DrupalSettings, $http, $log) {
    /**
     * Create a new article.
     *
     * @param data
     *   The data object to POST.
     *
     * @returns {*}
     *   JSON of the newley created article.
     */
    this.createArticle = function (data) {
      var config = {
          withCredentials: true,
          headers: {
            'X-CSRF-Token': DrupalSettings.getCsrfToken(),
            'X-Restful-Minor-Version': 5
          }
        };
      return $http.post(DrupalSettings.getBasePath() + 'api/v1/articles', data, config);
    };
  }
]);
'use strict';
angular.module('restfulApp').service('DrupalSettings', [
  '$window',
  function ($window) {
    var self = this;
    /**
     * Wraps inside AngularJs Drupal settings global object.
     *
     * @type {Drupal.settings}
     */
    this.settings = $window.Drupal.settings;
    /**
     * Get the base path of the Drupal installation.
     */
    this.getBasePath = function () {
      return angular.isDefined(self.settings.restfulExample.basePath) ? self.settings.restfulExample.basePath : undefined;
    };
    /**
     * Get the base path of the Drupal installation.
     */
    this.getCsrfToken = function () {
      return angular.isDefined(self.settings.restfulExample.csrfToken) ? self.settings.restfulExample.csrfToken : undefined;
    };
    /**
     * Return the form schema.
     *
     * @param int id
     *   The form ID.
     *
     * @returns {*}
     *   The form schema if exists, or an empty object.
     */
    this.getData = function (id) {
      return angular.isDefined(self.settings.restfulExample.data[id]) ? self.settings.restfulExample.data[id] : {};
    };
  }
]);
'use strict';
angular.module('restfulApp').service('FileUpload', [
  'DrupalSettings',
  '$upload',
  '$log',
  function (DrupalSettings, $upload, $log) {
    /**
     * Upload file.
     *
     * @param file
     *   The file to upload.
     *
     * @returns {*}
     *   The uplaoded file JSON.
     */
    this.upload = function (file) {
      return $upload.upload({
        url: DrupalSettings.getBasePath() + 'api/file-upload',
        method: 'POST',
        file: file,
        withCredentials: true,
        headers: { 'X-CSRF-Token': DrupalSettings.getCsrfToken() }
      });
    };
  }
]);