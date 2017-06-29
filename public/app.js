//code orginal from Theodore Anderson @andersontr15

(function(){

	var app = angular.module('app', ['ngRoute', 'angular-jwt']);

	app.run(function($http, $rootScope, $location, $window) {
		$http.defaults.headers.common.Authorization = 'Bearer ' + $window.localStorage.token;

		$rootScope.$on('$routeChangeStart', function(event, nextRoute, currentRoute){
			if(nextRoute.access !== undefined && nextRoute.access.restricted === true && !$window.localStorage.token) {
				event.preventDefault();
				$location.path('/login');
			}
			// 
			if($window.localStorage.token && nextRoute.access.restricted === true){
				$http.post('/api/verify', {token: $window.localStorage.token})
					 .then(function(res){
					 	console.log('Your token is valid')
					 }, function(err){
					 	delete $window.localStorage.token;
					 	$location.path('/login')
					 })
			}
		});
	})
	
	app.config(function($routeProvider, $locationProvider){
		$locationProvider.html5Mode(true);

		$routeProvider.when('/', {
			templateUrl: './templates/main.html',
			controller: 'MainController',
			controllerAs: 'vm',
			access: {
				restricted: false}
		});

		$routeProvider.when('/login', {
			templateUrl: './templates/login.html',
			controller: 'LoginController',
			controllerAs: 'vm',
			access: {
				restricted: false}
		});		

		$routeProvider.when('/polls', {
			templateUrl: './templates/polls.html',
			controller: 'PollsController',
			controllerAs: 'vm',
			access: {
				restricted: false}
		});

		$routeProvider.when('/poll/:id', {
			templateUrl: './templates/poll.html',
			controller: 'PollController',
			controllerAs: 'vm',
			access: {
				restricted: false}
		});

		$routeProvider.when('/register', {
			templateUrl: './templates/register.html',
			controller: 'RegisterController',
			controllerAs: 'vm',
			access: {
				restricted: false}
		});

		$routeProvider.when('/profile', {
			templateUrl: './templates/profile.html',
			controller: 'ProfileController',
			controllerAs: 'vm',
			access: {
				restricted: true}
		});

		$routeProvider.otherwise('/');

	});

	app.controller('MainController', MainController);

	function MainController($location, $window) {
		var vm = this;
		vm.title = "MainController"
	}

	app.controller('LoginController', LoginController);

	function LoginController($location, $window, $http) {
		var vm = this;
		vm.title = "LoginController";
		vm.error = '';
		vm.login = function() {
			if(vm.user) {
				$http.post('/api/login', vm.user)
					 .then(function(res){
					 	console.log(res);
					 	$window.localStorage.token = res.data;
					 	$location.path('/profile'); 
					 	console.log('log in successful');
					 }, function(err){
					 	vm.error = err;
					 });
			}else{
				console.log('No username/password');
			}
		}
	}

	app.controller('RegisterController', RegisterController);

	function RegisterController($location, $window, $http) {
		var vm = this;
		vm.title = "RegisterController"
		vm.error = ''

		vm.register = function() {
			// console.log(vm.user);
			if(!vm.user) {
				console.log('Invalid credentials');
				return;
			}
			$http.post('/api/register', vm.user)
				 .then(function(res){
					console.log(res);
					$window.localStorage.token = res.data;
					$location.path('/profile'); 
			}, function(err){
				vm.error = err.data.errmsg;
			});
		}
		var onSuccess = function(res) {
            $window.localStorage.token = res.data;
            $location.path('/profile');
        }

        var onError = function(err){
            if(err.data.code === 11000) {
                vm.error = "This user already exists";
            }
            vm.user = null;
            $location.path('/register');
        }
	}

	app.controller('ProfileController', ProfileController);

	function ProfileController($location, $window, jwtHelper, $http, $timeout) {
		var vm = this;
		vm.title = "ProfileController";
		vm.currentUser = null;
		vm.polls = [];
		var token = $window.localStorage.token;
		// var payload = jwtHelper.decodeToken(token).data;	
		// if(payload){
		// 	vm.user = payload;
		// 	// console.log(payload);
		// }

		vm.getPollsByUser = function() {
            $http.get('/api/user-polls/'+ vm.currentUser.name)
                 .then(function(res) {
                     console.log(res);
                     vm.polls = res.data;
                 }, function(err) {
                     console.log(err)
                 })
        }

        vm.deletePoll = function(id) {
            if(id !== null) {
                $http.delete('/api/polls/' + id).then(function(res) {
                    vm.getPollsByUser();
                }, function(err) {
                    console.log(err)
                })
                     
            }
            else {
                return false;
            }
        }

        if(token) {
           vm.currentUser = jwtHelper.decodeToken(token).data;
           console.log(vm.currentUser + ' app.js 189')
           console.log(token + ' app.js 190')
           console.log(vm.currentUser.name + ' app.js 191')
           if(vm.currentUser !== null )  {
               vm.getPollsByUser();
           }
        }

        vm.logOut = function() {
            $window.localStorage.removeItem('token');
            vm.message = 'Logging you out...'
            $timeout(function() {
                vm.message = '';
                 $location.path('/');
            }, 2000)
        }
	}

	app.controller('PollsController', PollsController);

	function PollsController($location, $window, $http, jwtHelper) {
		var vm = this;
		// var user = jwtHelper.decodeToken($window.localStorage.token);
		// var id = user.data._id;
		vm.title = "PollsController"
		vm.polls = [];
		vm.poll = {
			name: '',
			// user: id,
			options: [{
				name: '',
				votes: 0
			}]
		}


		vm.isLoggedIn = function() {
            if(!$window.localStorage.token) {
                return false;
            }
            if(jwtHelper.decodeToken($window.localStorage.token)) {
                return true;
            }
            return false;   
        }
        vm.isLoggedIn();


		vm.getAllPoll = function(){
			$http.get('/api/polls')
				 .then(function(res){
				 	vm.polls = res.data;
				 }, function(err){
				 	console.log(err)
				 })
		}
		vm.getAllPoll();

		vm.addOption = function() {
            vm.poll.options.push({
                name: '',
                votes: 0
            })
        }

        vm.addPoll = function() {
            if(!$window.localStorage.token) {
                alert('Cannot create a poll without an account');
                return;
            }
            if(vm.poll) {
                var payload = {
                    owner: jwtHelper.decodeToken($window.localStorage.token).data.name || null,
                    name: vm.poll.name,
                    options: vm.poll.options,
                    token: $window.localStorage.token
                }
                $http.post('/api/polls', payload).then(onSuccess, onError);
            }   
            else {
                console.log('No poll data supplied');
            }
        }

        var onSuccess = function(response) {
            console.log(response.data)
            vm.poll = {};
            vm.getAllPoll();
        }
        var onError = function(err) {
            console.error(err)
        }
	}

	app.controller('PollController', PollController);

    function PollController($http, $routeParams, $window, $location) {
        var vm = this;
        vm.title = "PollController";
        vm.poll;
        vm.data;
        vm.link = 'http://localhost:8000/' + $location.path();

        vm.getPoll  = function() {
            var id = $routeParams.id;
            $http.get('/api/poll/' + id)
                 .then(function(res) {
                    vm.id = res.data._id;
                    // vm.owner = res.data.owner;
                    vm.poll = res.data.options;
                    console.log(vm.poll);
                    vm.data = res.data;
                    google.charts.load('current', {'packages':['corechart']});
                    google.charts.setOnLoadCallback(drawChart);
                 }, function(err) {
                    $location.path('/polls');
                 })
        }
        vm.getPoll();

        vm.addOption = function() {
            if(vm.option) {
                $http.put('/api/polls/add-option', { option: vm.option, id: $routeParams.id })
                     .then(function() {
                    	vm.poll.push({
                        name: vm.option,
                        votes: 0
                    })
                    vm.option = null;
                    vm.getPoll();
                });
            }
            // vm.option = null;
        }

        function drawChart() {
        var chartArray = [];
        chartArray.push(['Name', 'Votes']);
        for(var i = 0; i < vm.data.options.length; i++){
            chartArray.push([vm.data.options[i].name, vm.data.options[i].votes ])
        }
        console.log(chartArray);
        var data = google.visualization.arrayToDataTable(chartArray);
        var options = {
          title: vm.data.name
        };
        var chart = new google.visualization.PieChart(document.getElementById('piechart'));
        chart.draw(data, options);
      }

      	vm.vote = function() {
          if(vm.selected) {
                console.log(vm.selected, vm.poll);
                $http.put('/api/polls', { id: $routeParams.id, vote: vm.selected  })
                   .then(function(response) {
                       vm.getPoll();
                   }, function(err) {
                       console.log(err)
                   })
                drawChart();
          }
          else {
              console.log('No poll selected');
          }
          drawChart();
      	}

    }


}())