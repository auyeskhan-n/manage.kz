angular.module('MyApp')
  .factory('Auth', ['$http','$state', '$rootScope', '$cookieStore','MySocket','$alert',
    function($http,$state, $rootScope, $cookieStore,MySocket,$alert) {
      $rootScope.currentUser = $cookieStore.get('user');
      return {
        login: function(user) {
          console.log("Он зашел");
          return $http.post('/api/login', user)
            .success(function(data) {
              $rootScope.currentUser = data;
              if($rootScope.currentUser.email=="admin@gmail.com"){
                $state.go('users-list',{reload: true})
              }else{
                $state.go('manager-add',{reload: true});
              }
            })
            .error(function() {
              $alert({
                     title: 'Ваши данные не верны',
                     content: '<i class="icon-cross" style="float:left;color:rgba(231,76,60,1);margin-right:5px;"></i>',
                     animation: 'fadeZoomFadeDown',
                     type: 'danger',
                     duration: 5
                   });
            });
        },
        signup: function(user) {
          return $http.post('/api/signup', user)
            .success(function(response) {
              MySocket.emit('signup', response);
              $alert({
                     title: 'Регистрация оформлена,ожидайте подтверждения',
                     content: '<i class="icon-check" style="float:left;color:rgb(99,190,212);margin-right:5px;"></i>',
                     animation: 'fadeZoomFadeDown',
                     type: 'danger',
                     duration: 5
                   });
              $state.go('log');
            })
            .error(function(response) {
              alert('Пользователь с такой почтой уже существует.');
            });
        },
        logout: function() {
          return $http.get('/api/logout')
          .success(function() {
            $rootScope.currentUser = null;
            $cookieStore.remove('user');
            $state.go('log');
          })
          .error(function(response){
            $location.path('manager-add');
          });
        },
        addLead: function(lead) {
          return $http.post('/api/add-leads', lead)
            .success(function(response) {
              MySocket.emit('addleads', response);
            $alert({
                     title: 'Заявка отправлена',
                     content: '<i class="icon-check" style="float:left;color:rgb(99,190,212);margin-right:5px;"></i>',
                     animation: 'fadeZoomFadeDown',
                     type: 'danger',
                     duration: 5
                   });
              $state.go('users-leads',{reload: true});
            })
            .error(function(response) {
              alert("Не удалость отправить заявку.");
            });
        }
      };
    }]);
