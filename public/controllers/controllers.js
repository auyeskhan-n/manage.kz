angular.module('MyApp')
  .controller('LoginCtrl', ['$http','$scope','$state','Auth',function($http,$scope,$state,Auth) {
    $scope.login = function() {
      Auth.login({
        email: $scope.email,
        password: $scope.password
      });
    };
    $scope.check=false;
    $scope.checkis = function(){
      $http.post('api/checkis',{email:$scope.email})
      .success(function(data){
        $scope.check=data;
        console.log($scope.check);
      })
    }
  }])
  .controller('RegisCtrl', ['$http','$scope','$state','Auth',function($http,$scope,$state,Auth) {
    $scope.signup = function() {
      Auth.signup({
        name:$scope.name,
        surname:$scope.surname,
        email: $scope.email,
        password: $scope.password
      });
    };
    $scope.check=false;
    $scope.checkunique = function(){
      $http.post('api/checkunique',{email:$scope.email})
      .success(function(data){
        $scope.check=data;
        console.log($scope.check);
      })
    }
  }])
  .controller('ManagerAddCtrl', ['$scope','$state','$cookieStore','Auth','$rootScope','$alert',function($scope,$state,$cookieStore,Auth,$rootScope,$alert) {
    $scope.category = "Выберите категорию";
    $scope.selectCategory = function(category){
      $scope.category = category;
    }
    $scope.addLead = function(){
      if($scope.category!='Выберите категорию' && $scope.cost != undefined && $scope.description != undefined){
        var fullname = $rootScope.currentUser.name + ' ' +$rootScope.currentUser.surname;
        Auth.addLead({
          description:$scope.description,
          cost:$scope.cost,
          category:$scope.category,
          manager:fullname,
          email:$rootScope.currentUser.email
        });
      }else{
      $alert({
           title: 'Заполните все поля',
           content: '<i class="icon-cross" style="float:left;color:rgba(231,76,60,1);margin-right:5px;"></i>',
           animation: 'fadeZoomFadeDown',
           type: 'danger',
           duration: 5
         });
      }
    }
  }])
  .controller('NavCtrl', ['$scope','$state','Auth','$rootScope','MySocket',function($scope,$state,Auth,$rootScope,MySocket) {
    $scope.isUser=false;
    $scope.isAdmin=false;
    $scope.isJust=false;
    $rootScope.$watch('currentUser',function(){
      if($rootScope.currentUser){
        MySocket.emit('join',$rootScope.currentUser);
        $scope.isUser=true;
        if($rootScope.currentUser.role){
          $scope.isAdmin=true;
        }else{
          $scope.isJust=true;
        }
      }else{
        $scope.isUser=false;
      }
      $scope.logout=function(){
        Auth.logout();
        $scope.isAdmin=false;
        $scope.isJust=false;
      }
    })
  }])
  .controller('AdminAllLeadsCtrl', ['$http','$scope','$state','Auth','$rootScope',function($http,$scope,$state,Auth,$rootScope) {
      console.log('AdminLeadsHistoryCtrl');
      $http.post('http://localhost:3000/api/get-leads-history')
      .success(function(leads){
        $scope.leads = leads;
        console.log(leads);
      })
      .error(function(data,status){
        console.log(data);
        console.log(status);
      });
      $scope.forDate=true;
      $scope.forManager=true;
      $scope.forCategory=true;
      $scope.forCost=true;
      $scope.varForFilter='-date';
      $scope.checkFunctionDownDate = function(){
        $scope.forDate=false;
        $scope.forManager=true;
        $scope.forCategory=true;
        $scope.forCost=true;
        $scope.varForFilter='date';
      }
      $scope.checkFunctionUpDate = function(){
        $scope.forDate=true;
        $scope.forManager=true;
        $scope.forCategory=true;
        $scope.forCost=true;
        $scope.varForFilter = '-date';
      }
      $scope.checkFunctionDownManager = function(){
        $scope.forManager=false;
        $scope.forDate=true;
        $scope.forCategory=true;
        $scope.forCost=true;
        $scope.varForFilter='manager';
      }
      $scope.checkFunctionUpManager = function(){
        $scope.forManager=true;
        $scope.forDate=true;
        $scope.forCategory=true;
        $scope.forCost=true;
        $scope.varForFilter='-manager';
      }
      $scope.checkFunctionDownCategory =function(){
        $scope.forCategory=false;
        $scope.forDate=true;
        $scope.forManager=true;
        $scope.forCost=true;
        $scope.varForFilter='category';
      }
      $scope.checkFunctionUpCategory =function(){
        $scope.forCategory=true;
        $scope.forDate=true;
        $scope.forManager=true;
        $scope.forCost=true;
        $scope.varForFilter='-category';
      }
      $scope.checkFunctionDownCost = function(){
        $scope.forCost=false;
        $scope.forCategory=true;
        $scope.forDate=true;
        $scope.forManager=true;
        $scope.varForFilter='cost';
      }
      $scope.checkFunctionUpCost = function(){
        $scope.forCost=true;
        $scope.forCategory=true;
        $scope.forDate=true;
        $scope.forManager=true; 
        $scope.varForFilter='-cost';
      }

  }])
  .controller('AdminLeadsCtrl', ['$http','$scope','$state','Auth','$rootScope','MySocket','$alert',function($http,$scope,$state,Auth,$rootScope,MySocket,$alert) {
      console.log('AdminLeadsCtrl');
      

      $http.get('http://localhost:3000/api/get-leads')
      .success(function(leads){
        $scope.leads = leads;
      })
      .error(function(data,status){
        console.log(data);
        console.log(status);
      });
    
      MySocket.forward('adminsec',$scope);
        $scope.$on('socket:adminsec',function(ev,data){
        $scope.leads.splice(0,0,data.msg);
      });
    $scope.btnAcceptLead = function(lead){

      var data = {
        ID: lead._id,
        Email:lead.email
      }

      $http.post('http://localhost:3000/api/accept-lead',data)
        .success(function(response){
          $alert({
                     title: 'Заявка одобрена',
                     content: '<i class="icon-check" style="float:left;color:rgb(99,190,212);margin-right:5px;"></i>',
                     animation: 'fadeZoomFadeDown',
                     type: 'danger',
                     duration: 1.5
                   });
            MySocket.emit('accept-socket', {old:lead});
            $scope.leads.splice($scope.leads.indexOf(lead),1);
        })
        .error(function(response,status){
            $alert({
                     title: 'Операция не удалась',
                     content: '<i class="icon-cross" style="float:left;color:rgba(231,76,60,1);margin-right:5px;"></i>',
                     animation: 'fadeZoomFadeDown',
                     type: 'danger',
                     duration: 5
                   });
            console.log(status);
        });
    };


    $scope.btnDeclineLead = function(lead){
      var data = {
        ID:lead._id,
        Email:lead.email
      }

      $http.post('http://localhost:3000/api/decline-lead',data)
        .success(function(response){
            MySocket.emit('decline-socket', {old:lead});
            $alert({
                     title: 'Заявка не одобрена',
                     content: '<i class="icon-check" style="float:left;color:rgb(99,190,212);margin-right:5px;"></i>',
                     animation: 'fadeZoomFadeDown',
                     type: 'danger',
                     duration: 1.5
                   });
            $scope.leads.splice($scope.leads.indexOf(lead),1);
        })
        .error(function(response,status){
            $alert({
                     title: 'Операция не удалась',
                     content: '<i class="icon-cross" style="float:left;color:rgba(231,76,60,1);margin-right:5px;"></i>',
                     animation: 'fadeZoomFadeDown',
                     type: 'danger',
                     duration: 5
                   });
        });

    };

    $scope.forDate=true;
      $scope.forManager=true;
      $scope.forCategory=true;
      $scope.forCost=true;
      $scope.varForFilter='-date';
      $scope.checkFunctionDownDate = function(){
        $scope.forDate=false;
        $scope.forManager=true;
        $scope.forCategory=true;
        $scope.forCost=true;
        $scope.varForFilter='date';
      }
      $scope.checkFunctionUpDate = function(){
        $scope.forDate=true;
        $scope.forManager=true;
        $scope.forCategory=true;
        $scope.forCost=true;
        $scope.varForFilter = '-date';
      }
      $scope.checkFunctionDownManager = function(){
        $scope.forManager=false;
        $scope.forDate=true;
        $scope.forCategory=true;
        $scope.forCost=true;
        $scope.varForFilter='manager';
      }
      $scope.checkFunctionUpManager = function(){
        $scope.forManager=true;
        $scope.forDate=true;
        $scope.forCategory=true;
        $scope.forCost=true;
        $scope.varForFilter='-manager';
      }
      $scope.checkFunctionDownCategory =function(){
        $scope.forCategory=false;
        $scope.forDate=true;
        $scope.forManager=true;
        $scope.forCost=true;
        $scope.varForFilter='category';
      }
      $scope.checkFunctionUpCategory =function(){
        $scope.forCategory=true;
        $scope.forDate=true;
        $scope.forManager=true;
        $scope.forCost=true;
        $scope.varForFilter='-category';
      }
      $scope.checkFunctionDownCost = function(){
        $scope.forCost=false;
        $scope.forCategory=true;
        $scope.forDate=true;
        $scope.forManager=true;
        $scope.varForFilter='cost';
      }
      $scope.checkFunctionUpCost = function(){
        $scope.forCost=true;
        $scope.forCategory=true;
        $scope.forDate=true;
        $scope.forManager=true; 
        $scope.varForFilter='-cost';
      }

  }])
  .controller('UsersLeadsCtrl', ['$http','$scope','$state','Auth','$rootScope','MySocket',function($http,$scope,$state,Auth,$rootScope,MySocket) {
      var data = {
        Email:$rootScope.currentUser.email
      }
      
      $http.post('http://localhost:3000/api/get-users-leads',data)
      .success(function(leads){
        $scope.leads = leads;
      })
      .error(function(data,status){
        console.log(data);
        console.log(status);
      });

      MySocket.forward('adminthird',$scope);
      $scope.$on('socket:adminthird',function(ev,data){
          $scope.leads=data.updateLeads;
      });

      MySocket.forward('adminfourth',$scope);
      $scope.$on('socket:adminfourth',function(ev,data){
        if(data.msg.old.email==$rootScope.currentUser.email){
          $scope.leads=data.updateLeads;
        }
      });
      $scope.forDate=true;
      $scope.forCost=true;
      $scope.varForFilter='-date';
      $scope.checkFunctionDownDate = function(){
        $scope.forDate=false;
        $scope.forCost=true;
        $scope.varForFilter='date';
      }
      $scope.checkFunctionUpDate = function(){
        $scope.forDate=true;
        $scope.forCost=true;
        $scope.varForFilter = '-date';
      }
      $scope.checkFunctionDownCost = function(){
        $scope.forCost=false;
        $scope.forDate=true;
        $scope.varForFilter='cost';
      }
      $scope.checkFunctionUpCost = function(){
        $scope.forCost=true;
        $scope.forDate=true;
        $scope.varForFilter='-cost';
      }
  }])
  .controller('UsersListCtrl', ['$http','$scope','$state','Auth','$rootScope','MySocket','$alert',function($http,$scope,$state,Auth,$rootScope,MySocket,$alert) {
    $http.get('http://localhost:3000/api/get-users')
      .success(function(users){
        $scope.users = users;
      })
      .error(function(data,status){
        console.log(data);
        console.log(status);
      });
        MySocket.forward('admin',$scope);
        $scope.$on('socket:admin',function(ev,data){
        console.log(data.msg);
        $scope.users.splice(0,0,data.msg);
      });

    $scope.btnAcceptUser = function(user){
      
      var data = {
        ID: user._id,
        Email:user.email
      }
      $http.post('http://localhost:3000/api/accept-user',data)
        .success(function(response){
            $alert({
                     title: 'Пользователь одобрен',
                     content: '<i class="icon-check" style="float:left;color:rgb(99,190,212);margin-right:5px;"></i>',
                     animation: 'fadeZoomFadeDown',
                     type: 'danger',
                     duration: 1.5
                   });
            console.log(user.isChecked);
            console.log(user.isAccepted);
            user.isAccepted=true;
            user.isChecked=true;
        })
        .error(function(response,status){
            $alert({
                     title: 'Операция не удалась',
                     content: '<i class="icon-cross" style="float:left;color:rgba(231,76,60,1);margin-right:5px;"></i>',
                     animation: 'fadeZoomFadeDown',
                     type: 'danger',
                     duration: 5
                   });
        });
    };


    $scope.btnDeclineUser = function(user){
      var data = {
        ID:user._id,
        Email:user.email
      }

      $http.post('http://localhost:3000/api/decline-user',data)
        .success(function(response){
          $alert({
                     title: 'Пользователь не одобрен',
                     content: '<i class="icon-check" style="float:left;color:rgb(99,190,212);margin-right:5px;"></i>',
                     animation: 'fadeZoomFadeDown',
                     type: 'danger',
                     duration: 1.5
                   });
          user.isAccepted=false;
          user.isChecked=true;
        })
        .error(function(response,status){
            $alert({
                     title: 'Операция не удалась',
                     content: '<i class="icon-cross" style="float:left;color:rgba(231,76,60,1);margin-right:5px;"></i>',
                     animation: 'fadeZoomFadeDown',
                     type: 'danger',
                     duration: 5
                   });
        });

    }
  }])
  .controller('StatisticsCtrl', ['$http','$scope','$state','Auth','$rootScope',function($http,$scope,$state,Auth,$rootScope) {
      console.log('StatisticsCtrl');
      $scope.categories = {};
      $scope.managers = {};
      $scope.dayByDay = {};
      $http.get('http://localhost:3000/api/statistic/get-categories')
      .success(function(leads){
        $scope.leads = leads;

        var categories = [];
        for (var i = 0; i < $scope.leads.length; i++) {
            categories.push({label: $scope.leads[i]["_id"], value: $scope.leads[i]["total"]});
        }
        $scope.categories =
        {
            "chart": {
                "caption": "По категориям",
                "numberPrefix": "$",
                "paletteColors": "#0075c2,#1aaf5d,#f2c500",
                "bgColor": "#ffffff",
                "showBorder": "0",
                "borderAlpha": "20",
                "use3DLighting": "0",
                "showShadow": "0",
                "enableSmartLabels": "0",
                "startingAngle": "310",
                "showLabels": "0",
                "showPercentValues": "1",
                "showLegend": "1",
                "legendShadow": "0",
                "legendBorderAlpha": "0",
                "decimals": "0",
                "captionFontSize": "14",
                "subcaptionFontSize": "14",
                "subcaptionFontBold": "0",
                "toolTipColor": "#ffffff",
                "toolTipBorderThickness": "0",
                "toolTipBgColor": "#000000",
                "toolTipBgAlpha": "80",
                "toolTipBorderRadius": "2",
                "toolTipPadding": "3",
                "useDataPlotColorForLabels": "1"
            },
            "data": categories
        };
      })
      .error(function(data,status){
      });

      $http.get('http://localhost:3000/api/statistic/get-by-day')
      .success(function(leads){
        $scope.leads = leads;
        var byDay = [];
        for (var i = 0; i < $scope.leads.length; i++) {
            byDay.push({label: ($scope.leads[i]["_id"]["day"]+"/"+$scope.leads[i]["_id"]["month"]+"/"+$scope.leads[i]["_id"]["year"]),
                        value: $scope.leads[i]["totalCost"]});
            // byDay.push({label: 123, value: 123546});
        }
        $scope.dayByDay =
        {
            chart: {
                "caption": "Общая сумма сделок по дням",
                // "subCaption": "Manager.kz",
                "xAxisName": "Дни",
                "yAxisName": "сумма в тенге",
                "numberSuffix": " ₸",
                "paletteColors": "#0075c2",
                "bgColor": "#ffffff",
                "borderAlpha": "0",
                "canvasBorderAlpha": "0",
                "usePlotGradientColor": "0",
                "plotBorderAlpha": "10",
                "placevaluesInside": "1",
                "rotatevalues": "1",
                "valueFontColor": "#ffffff",
                "showXAxisLine": "1",
                "xAxisLineColor": "#999999",
                "divlineColor": "#999999",
                "divLineIsDashed": "1",
                "showAlternateHGridColor": "0",
                "subcaptionFontBold": "0",
                "subcaptionFontSize": "14"
            },
            data: byDay
        };
      })
      .error(function(data,status){
          console.log(data);
          console.log(status);
      });

      $http.get('http://localhost:3000/api/statistic/get-managers')
      .success(function(leads){
        $scope.leads = leads;
        var managers = [];
        for (var i = 0; i < $scope.leads.length; i++) {
            managers.push({label: $scope.leads[i]["_id"], value: $scope.leads[i]["totalCost"]});
        }
        $scope.managers =
        {
            chart: {
                "caption": "Заявки с каждого менеджара на месяц",
                "xAxisName": "Менеджеры",
                "yAxisName": "сумма в тенге",
                "numberSuffix": " ₸",
                "paletteColors": "#0075c2",
                "bgColor": "#ffffff",
                "borderAlpha": "0",
                "canvasBorderAlpha": "0",
                "usePlotGradientColor": "0",
                "plotBorderAlpha": "10",
                "placevaluesInside": "1",
                "rotatevalues": "1",
                "valueFontColor": "#ffffff",
                "showXAxisLine": "1",
                "xAxisLineColor": "#999999",
                "divlineColor": "#999999",
                "divLineIsDashed": "1",
                "showAlternateHGridColor": "0",
                "subcaptionFontBold": "0",
                "subcaptionFontSize": "14"
            },
            data: managers
        };
      })
      .error(function(data,status){
      });
  }]);





  