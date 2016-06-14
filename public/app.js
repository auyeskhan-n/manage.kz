angular.module('MyApp', ['ui.router','ngCookies','btford.socket-io', 'ngMessages','mgcrea.ngStrap','ng-fusioncharts'])
  .config(['$locationProvider','$urlRouterProvider', '$stateProvider' ,function($locationProvider,$urlRouterProvider,$stateProvider) {
    $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise('/');
    $stateProvider
      .state('any', {
        url: '/',
        templateUrl: 'views/log.html',
        controller: function($rootScope,$state){
          if($rootScope.currentUser){
            if($rootScope.currentUser.role){
              $state.go('admin-leads');
            }else{
              $state.go('manager-add');
            }
          }else{
            $state.go('log');
          }
        }
      })
      .state('log', {
        url: '/log',
        templateUrl: 'views/log.html',
        controller: 'LoginCtrl'
      })
      
      .state('reg',{
        url:'/reg',
        templateUrl:'views/reg.html',
        controller:'RegisCtrl'
      })
      .state('manager-add',{
        url:'/manager-add',
        templateUrl:'views/manager-add.html',
        controller:'ManagerAddCtrl'
      })
      .state('users-leads',{
        url:'/users-leads',
        templateUrl:'views/users-leads.html',
        controller:'UsersLeadsCtrl'
      })
      .state('leads-history',{
        url:'/leads-history',
        templateUrl:'views/leads-history.html',
        controller:'AdminAllLeadsCtrl'
      })
      .state('admin-leads',{
        url:'/admin-leads',
        templateUrl:'views/admin-leads.html',
        controller:'AdminLeadsCtrl'
      })
      
      .state('users-list',{
        url:'/users-list',
        templateUrl:'views/users-list.html',
        controller:'UsersListCtrl'
      }).state('statistics',{
        url:'/statistics',
        templateUrl:'views/statistics.html',
        controller:'StatisticsCtrl'
      });
  }]);

