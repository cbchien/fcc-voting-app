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

		$routeProvider.when('/polls/:id', {
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
	}

	app.controller('ProfileController', ProfileController);

	function ProfileController($location, $window, jwtHelper) {
		var vm = this;
		vm.title = "ProfileController";
		// vm.user = null;
		var token = $window.localStorage.token;
		var payload = jwtHelper.decodeToken(token).data;	
		if(payload){
			vm.user = payload;
			// console.log(payload);
		}

		vm.logOut = function() {
			delete $window.localStorage.token;
			vm.user = null;
			$location.path('/login');
		}
	}

	app.controller('PollsController', PollsController);

	function PollsController($location, $window, $http, jwtHelper) {
		var vm = this;
		var user = jwtHelper.decodeToken($window.localStorage.token);
		var id = user.data._id;
		vm.title = "PollsController"
		vm.polls = [];
		vm.poll = {
			options: [],
			name: '',
			user: id
		}

		vm.poll.options = [{
			name: '',
			votes: 0
		}]

		vm.addOption = function	(){
			vm.poll.options.push({
				name: '',
				votes: 0
			})
		}

		vm.getAllPoll = function(){
			$http.get('/api/polls')
				 .then(function(res){
				 	vm.polls = res.data;
				 }, function(err){
				 	console.log(err)
				 })
		}
		vm.getAllPoll();

		vm.addPoll = function(){
			if(!vm.poll){
				console.log('Invalid data')
				return;
			}
			$http.post('/api/polls', vm.poll)
				 .then(function(res){
				 	vm.poll = {};
				 	vm.getAllPoll();
				 }, function(err){
				 	vm.poll = {};
				 	console.log(err)
				 })
		}
	}

	app.controller('PollController', PollController);

	function PollController($location, $window) {
		var vm = this;
		vm.title = "PollController"
	}	


}())