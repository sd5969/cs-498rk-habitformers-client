var hfControllers = angular.module('hfControllers', ['chart.js']);

hfControllers.controller('NavController', ['$scope', 'Database', '$route', function($scope, Database, $route) {

	$scope.user;
	$scope.$route = $route;

	Database.getUser("57197fbc4f1daf85187fad00").success(function(data) { // need to see how this will be done
		$scope.user = data.data;
	})
	.error(function(data) {
		toastr.error(data.message);
	});

}]);

hfControllers.controller('MonthlyController', ['$scope', 'Database', function($scope, Database) {

	$scope.habits;
	$scope.days;
	$scope.date = new Date();
	$scope.month;
	$scope.sixWeeks = false;
	$scope.user;

	var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

	getData();

	function getData() {
		Database.getUser("57197fbc4f1daf85187fad00").success(function(data) { // need to see how this will be done
			$scope.user = data.data;
			Database.getHabitsByUser("57197fbc4f1daf85187fad00").success(function(data) { // need to see how this will be done
				$scope.habits = data.data;
				setMonth();
			})
			.error(function(data) {
				toastr.error(data.message);
			});
		})
		.error(function(data) {
			toastr.error(data.message);
		});
	}

	$scope.colorClass = function(index) {
		return "color-" + index;
	}

	$scope.prevMonth = function() {
		$scope.date.setMonth($scope.date.getMonth() - 1);
		setMonth();
	}

	$scope.nextMonth = function() {
		$scope.date.setMonth($scope.date.getMonth() + 1);
		setMonth();
	}

	$scope.currMonth = function() {
		$scope.date = new Date();
		setMonth();
	}

	$scope.clearAddHabitForm = function() {
		$scope.newStartDate = $scope.newEndDate = $scope.newName =
			$scope.newRepeat = $scope.newRepeatInterval = $scope.newEnterNum =
			$scope.newPickDays = $scope.newNotes = "";
		$scope.newDays = [];
	}

	$scope.clearAddHabitForm();

	$scope.submitAddHabitForm = function() {
		if(!$scope.newStartDate) {
			toastr.error("You must enter a start date");
			return;
		}
		if(!$scope.newEndDate) {
			toastr.error("You must enter an end date");
			return;
		}
		if(!$scope.newName) {
			toastr.error("You must enter a name");
			return;
		}
		if(!$scope.newRepeat) {
			toastr.error("You must select a repeat option");
			return;
		}
		if($scope.newRepeat % 2 == 1 && !$scope.newRepeatInterval) {
			toastr.error("You must enter a repeat interval");
			return;
		}
		if($scope.newRepeat >= 2 && $scope.newDays.every(function(elem) { return !elem; })) {
			toastr.error("You must select at least one day");
			return;
		}

		if($scope.newRepeat % 2 == 0) $scope.newRepeatInterval = 1;

		var repeat = {};

		if($scope.newRepeat <= 1) {
			var theDay = (new Date($scope.newStartDate)).getDay();
			repeat = {
				option: 0,
				days: [theDay],
				interval: $scope.newRepeatInterval
			};
		}
		else {
			var repeatDays = [];
			$scope.newDays.forEach(function(elem, i) {
				if(elem) repeatDays.push(i);
			});
			repeat = {
				option: 1,
				days: repeatDays,
				interval: $scope.newRepeatInterval
			};	
		}

		var habit = {
			name: $scope.newName,
			userId: $scope.user._id,
			repeat: repeat,
			start_date: $scope.newStartDate,
			end_date: $scope.newEndDate,
			note: $scope.newNotes
		};
		Database.addHabit(habit).success(function(data) {
			toastr.success("Successfully added new habit");
			getData();
			$('#newHabit').foundation('close');
			$scope.clearAddHabitForm();
		})
		.error(function(data) {
			toastr.error(data.message);
		});
	}

	$scope.changeCompletionStatus = function(oldHabit, currDay) {
		var toast = toastr.info('Marking habit progress...', {
		  timeOut: 0,
		  extendedTimeOut: 0
		});
		Database.getHabit(oldHabit.id).success(function(data) {
			var habit = data.data;
			var dayIndex = -1;
			if(habit.complete_days) {
				for(var i = 0; i < habit.complete_days.length; i++) {
					if((new Date(currDay.date)).toDateString() === (new Date(habit.complete_days[i].date)).toDateString()) dayIndex = i;
				}
				if(dayIndex > -1) habit.complete_days.splice(dayIndex, 1);
			}
			else {
				habit.complete_days = [];
			}
			habit.complete_days.push({date: currDay.date, completed: !(oldHabit.completed)});
			Database.updateHabit(habit).success(function(habit) {
				getData();
				toastr.clear(toast);
			})
			.error(function(data){
				toastr.error(data.message);
				toastr.clear(toast);
			});
		})
		.error(function(data) {
			toastr.error(data.message);
			toastr.clear(toast);
		});
	}

	$scope.editHabit = function(habit) {
		$scope.editStartDate = habit.start_date;
		$scope.editEndDate = habit.end_date;
		$scope.editName = habit.name;
		$scope.editNotes = habit.notes;
		$scope.editRepeat = 2 * habit.repeat.option + (habit.repeat.interval == 1 ? 0 : 1);
		$scope.editRepeatInterval = habit.repeat.interval;
		$scope.editEnterNum = ($scope.editRepeat % 2 == 1);
		$scope.editPickDays = ($scope.editRepeat >= 2);
		$scope.editDays = [0,0,0,0,0,0,0];
		if(habit.repeat.days) {
			habit.repeat.days.forEach(function(day) {
				$scope.editDays[day] = true;
			});
		}

		$('#editHabit').foundation('open');
	}

	$scope.clearEditHabitForm = function() {
		$scope.editStartDate = $scope.editEndDate = $scope.editName =
				$scope.editRepeat = $scope.editRepeatInterval = $scope.editEnterNum =
				$scope.editPickDays = $scope.editNotes = "";
		$scope.editDays = [];
	}

	$scope.clearEditHabitForm();

	$scope.showRepeatOptions = function() {
		$scope.newEnterNum = ($scope.newRepeat % 2 == 1);
		$scope.newPickDays = ($scope.newRepeat >= 2);
		$scope.editEnterNum = ($scope.editRepeat % 2 == 1);
		$scope.editPickDays = ($scope.editRepeat >= 2);
	}

	$scope.submitEditHabitForm = function() {
		$('#editHabit').foundation('close');
	}

	function setMonth() {
		$scope.month = $scope.date.toLocaleString("en-us", { month: "long" }) + ' ' + $scope.date.getFullYear();
		$scope.days = [];

		var firstDayDate = new Date($scope.date.getTime());
		firstDayDate.setDate(1);
		var firstDay = firstDayDate.getDay();
		var currDay = new Date();
		var today = new Date();

		var i = 0;
		while(i < firstDay) {
			currDay = new Date(firstDayDate.getTime());
			currDay.setTime(firstDayDate.getTime()-((firstDay - i)*24*3600000));
			$scope.days.push({
				date: currDay.toString(),
				dayNum: currDay.getDate(),
				dayName: days[currDay.getDay()],
				habits: [],
				past: true
			});
			i++;
		}

		currDay.setTime(firstDayDate.getTime());
		while(currDay.getMonth() == $scope.date.getMonth()) {
			if(currDay.getDate() == today.getDate() &&
				currDay.getMonth() == today.getMonth() &&
				currDay.getYear() == today.getYear()) {
				$scope.days.push({
					date: currDay.toString(),
					dayNum: currDay.getDate(),
					dayName: days[currDay.getDay()],
					habits: [],
					today: true
				});
			} else {
				$scope.days.push({
					date: currDay.toString(),
					dayNum: currDay.getDate(),
					dayName: days[currDay.getDay()],
					habits: []
				});
			}
			currDay.setTime(currDay.getTime()+(1*24*3600000));
		}

		while($scope.days.length % 7 != 0) {
			$scope.days.push({
				date: currDay.toString(),
				dayNum: currDay.getDate(),
				dayName: days[currDay.getDay()],
				habits: [],
				future: true
			});
			currDay.setTime(currDay.getTime()+(1*24*3600000));
		}

		if($scope.days.length / 7 > 5) {
			$scope.sixWeeks = true;
		} else {
			$scope.sixWeeks = false;
		}

		renderHabits();
	}

	function renderHabits() {
		$scope.habits.forEach(function(habit, i) {

			if(habit.repeat.option == 0) {

				var habitStartDate = new Date(habit.start_date);
				var timeIncrement = (((habit.repeat.days[0] - habitStartDate.getDay() + 7) % 7)*24*3600000);
				habitStartDate.setTime(habitStartDate.getTime() + timeIncrement - 60*60*1000*6);

				$scope.days.forEach(function(day, j) {
					if(habitStartDate > new Date(day.date)) return;
					if((new Date(habit.end_date)).setTime((new Date(habit.end_date)).getTime() + 60*60*1000*24) < new Date(day.date)) return;
					var thisDay = new Date(day.date);
					if((Math.round((thisDay - habitStartDate)/(1000*60*60*24)) % habit.repeat.interval) == 0) {
						$scope.days[j].habits.push({num: i, id: habit._id, completed: false});
					}
				});

			} else {

				$scope.days.forEach(function(day, j) {
					if(new Date(habit.start_date) > new Date(day.date)) return;
					if((new Date(habit.end_date)).setTime((new Date(habit.end_date)).getTime() + 60*60*1000*24) < new Date(day.date)) return;
					var thisDay = new Date(day.date);
					habit.repeat.days.forEach(function(day, k) {
						if(day == thisDay.getDay()) {
							$scope.days[j].habits.push({num: i, id: habit._id, completed: false});
						}
					});
				});

			}

			habit.complete_days.forEach(function(complete, l) {
				if((new Date(complete.date)) < (new Date($scope.days[0].date))) return;
				if((new Date(complete.date)) > (new Date($scope.days[$scope.days.length - 1].date))) return;

				var dayIndex = Math.round(((new Date(complete.date)).getTime() - (new Date($scope.days[0].date)).getTime())/(60*60*1000*24));
				var habitIndex = -1;
				if($scope.days[dayIndex].habits) {
					for(var m = 0; m < $scope.days[dayIndex].habits.length; m++) {
						if(habit._id === $scope.days[dayIndex].habits[m].id) {
							habitIndex = m;
						}
					}
					if(habitIndex > -1) $scope.days[dayIndex].habits.splice(habitIndex, 1);
				}
				$scope.days[dayIndex].habits.push({num: i, id: habit._id, completed: complete.completed});
			});
		});
	}

}]);


hfControllers.controller('WeeklyController', ['$scope', 'Database', '$routeParams', function($scope, Database, $routeParams) {
	$scope.id = $routeParams.id;
	$scope.alert = '';

	function displayError(msg) {
		$scope.alert = msg;
	}

	// run on controller load
	(function init() {
		getDays();
	})();

	/**
	 * Returns 7 days of the week and the tasks for those days
	 */
	function getDays() {
		$scope.weekRangeString = "August 20 - 26"
		$scope.days = [
			{
				date: 'Aug 20',
				tasks: []
			},
			{
				date: 'Aug 21',
				tasks: []
			},
			{
				date: 'Aug 22',
				tasks: []
			},
			{
				date: 'Aug 23',
				tasks: []
			},
			{
				date: 'Aug 24',
				tasks: []
			},
			{
				date: 'Aug 25',
				tasks: []
			},
			{
				date: 'Aug 26',
				tasks: []
			}
		]
	}
}]);

hfControllers.controller('SettingsController', ['$scope', 'Database', function($scope, Database) {
  // do stuff
}]);


hfControllers.controller('LoginController', ['$scope', 'Database', function($scope, Database) {
  // do stuff
   $scope.addUser = function(user){
       alert("LOGGIN IN");
   }
}]);

hfControllers.controller('SignUpController', ['$scope', 'Database', function($scope, Database) {
  // do stuff
}]);

hfControllers.controller('StatisticsController', ['$scope', 'Database', '$routeParams', function($scope, Database, $routeParams) {
	$scope.id = $routeParams.id;
	$scope.alert = '';

	function displayError(msg) {
		$scope.alert = msg;
	}


	// run on controller load
	(function init() {
		getEarnedBadges();
		getNextBadge();
		getDays();
	})();

	/**
	 * Returns a list of badge objects earned by the user.
	 */
	function getEarnedBadges() {
		/* What the real code should look like when the route is created
		Database.getBadges(id)
			.success(function(data) {
				$scope.badges = data.data;
			})
			.error(function(data) {
				displayMessage(data.message);
			});

		*/
		$scope.badges = [
			{
				name: "Habit Rabbit",
				description: "Completed 10 habits."
			},
			{
				name: "Big Hands",
				description: "Completed more than 7 habits in a week."
			},
			{
				name: "Habit Bronze Badge",
				description: "Completed 20 habits."
			}
		];
	}

	/**
	 * Returns the next badge a person can earn.
	 */
	function getNextBadge() {
		/* What the real code should look like when the route is created
		Database.getNextBadge(id)
			.success(function(data) {
				$scope.nextBadgeName = data.data.name;
				$scope.nextBadgeCount = data.data.count;
			})
			.error(function(data) {
				displayMessage(data.message);
			});
		*/
		$scope.nextBadgeName = "Habit Silver Badge"
		$scope.nextBadgeCount = "5";
		$scope.nextBadgeDesc = "Complete 30 habits.";
	}

	/**
	 * Returns 7 days of the week and the tasks for those days
	 */
	function getDays() {
		$scope.weekRangeString = "August 20 - 26"
		$scope.days = [
			{
				date: 'Aug 20',
				tasks: [{name: "yo"}, {name: "yo"}, {name: "yo"}]
			},
			{
				date: 'Aug 21',
				tasks: []
			},
			{
				date: 'Aug 22',
				tasks: []
			},
			{
				date: 'Aug 23',
				tasks: []
			},
			{
				date: 'Aug 24',
				tasks: []
			},
			{
				date: 'Aug 25',
				tasks: []
			},
			{
				date: 'Aug 26',
				tasks: []
			}
		]
	}

	$scope.labels = ["Brush my Teeth", "Do 100 pushups", "Write in journal"];
	$scope.data = [0.3, 0.5, 0.2];

}]);


hfControllers.controller('LandingController', ['$scope', 'Database', function($scope, Database) {

}]);
