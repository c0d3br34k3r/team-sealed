var app = angular.module('app', ['dragAndDrop']);

app.controller('Controller', ['$scope', '$http', function ($scope, $http) {

	$scope.percent = 60;
	$scope.cardSize = 1;
	$scope.showDeckList = false;

	function startup() {
		$scope.flip = false;
		$scope.deckNumber = 0;
		$scope.pool = [];
		$scope.decks = [[], [], []];
		$scope.junk = [];
	}
	
	startup();

	$scope.test = function(e) {
		$scope.percent = e.clientY;
	};

	// window.onbeforeunload = function(e) {
		// if ($scope.pool.length) {
			// return 'Warning! Your current session will be lost.';
		// }
		// return null;
	// };

	// $http.get('./XLN.json', {responseType: 'json'}).then(function(result) {
		// xlnCallback(result.data);
	// });

	$scope.handleFileSelect = function(e) {
		e.stopPropagation();
		e.preventDefault();
		var file = e.dataTransfer.files[0];
		if (!file) {
			return;
		}
		var reader = new FileReader();
		if (file.name == 'state.json') {
			reader.onload = function(e1) {
				$scope.$apply(function() {
					startup();
					var state = JSON.parse(e1.target.result);
					$scope.pool = state.pool;
					$scope.decks = state.decks;
				});
			};
		} else {
			reader.onload = function(e1) {
				$scope.$apply(function() {
					loadCards(e1.target.result.split(/\r?\n/));
				});
			};
		}
		reader.readAsText(file, 'UTF-8');
	};

	$scope.handleDragOver = function(e) {
		e.stopPropagation();
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';
	};
	
	function loadCards(cardNames) {
		var pool = [];
		for (var cardName of cardNames) {
			var fixedName = removeDiacritics(cardName.trim()).toLowerCase();
			if (fixedName && !fixedName.startsWith('#')) {
				var card = lookup[fixedName];
				if (card) {
					pool.push(card);
				} else {
					console.log('Bad card: ' + cardName.trim());
				}
			}
		}
		pool.sort(compareCards);
		startup();
		$scope.pool = pool;
	}
	
	function formatDeck() {
		var deckList = toMultiset($scope.currentDeck().map(function(card) {
			return card.name;
		}));
		var buffer = [];
		for (var key of Object.keys(deckList)) {
			buffer.push(deckList[key] + ' ' + key);
		}
		return buffer.join('\n');
	}
	
	function toMultiset(cards) {
		var multiset = {};
		for (var card of cards) {
			multiset[card] = (multiset[card] || 0) + 1
		}
		return multiset;
	}
	
	$scope.getImageName = function(card) {
		return $scope.flip && card.flip ? card.flipImageName : card.imageName;
	}

	$scope.shortcut =  function(e) {
		switch (e.key) {
			case 'f':
				$scope.flip ^= true;
				break;
			case '1':
			case '2':
			case '3':
				$scope.deckNumber = Number(e.key) - 1;
				break;
			case 'x':
				$scope.showDeckList ^= true;
				$scope.paste = formatDeck();
				break;
			case 's':
				$scope.showDeckList ^= true;
				$scope.paste = JSON.stringify({
					pool: $scope.pool,
					decks: $scope.decks
				});
				break;
			case '=':
				$scope.cardSize = Math.max($scope.cardSize - 1, 0)
				break;
			case '-':
				$scope.cardSize = Math.min($scope.cardSize + 1, 2)
				break;
			default:
		}
    };

	$scope.currentDeck = function() {
		return $scope.decks[$scope.deckNumber];
	}
	
	$scope.rotateDeck = function() {
		$scope.deckNumber = ($scope.deckNumber + 1) % 3;
	};
	
	$scope.moveCard = function(locFrom, locTo, index) {
		locTo.push(locFrom.splice(index, 1)[0]);
		locTo.sort(compareCards);
	};
	
	$scope.hideDeckList = function() {
		$scope.showDeckList = false;
	}
	
}]);

function cardGroup(sortMethod) {
	return {
		cards: [],
		sort: function() {
			this.cards.sort(sortMethod);
		}
	};
}

function compareCards(card1, card2) {
	return comparisonChain()
			.compare(COLOR_ORDER[card1.color],  COLOR_ORDER[card2.color])
			.compare(!card1.type, !card2.type)
			.compare(card1.manaCost || 100, card2.manaCost || 100)
			.compare(card1.name, card2.name)
			.result;
}

function compareCards2(card1, card2) {
	return comparisonChain()
			.compare(card1.color == 'L', card2.color == 'L')
			.compare(!card1.type, !card2.type)
			.compare(card1.manaCost || 100, card2.manaCost || 100)
			.compare(COLOR_ORDER[card1.color], COLOR_ORDER[card2.color])
			.compare(card1.name, card2.name)
			.result;
}

var lookup = {};

function loadLookup(cards) {
	for (var card of cards) {
		card.imageName = toImageName(card.name);
		if (card.flip) {
			card.flipImageName = toImageName(card.flip);
		}
		lookup[card.name.toLowerCase()] = card;
	}
}
	
function toImageName(cardName) {
	return cardName.toLowerCase().replace(/[- ]/g, '_').replace(/[^a-z0-9_]/g, '');
}

var COLOR_ORDER = {
	'W' : 0,
	'U' : 1,
	'B' : 2,
	'R' : 3,
	'G' : 4,
	'C' : 5,
	'M' : 6,
	'L' : 7
}

// function utf8ToBase64(str) {
	// return btoa(unescape(encodeURIComponent(str)));
// }

var ACTIVE = {
	compare: function(a, b) {
		return (a < b) ? LESS : (a > b) ? GREATER : ACTIVE;
	},
	classify: function(cmp) {
		return (result < 0) ? LESS : (result > 0) ? GREATER : ACTIVE;
	},
	result: 0
};

var LESS = {
	compare: function(a, b) {
		return this;
	},
	classify: function(cmp) {
		return this;
	},
	result: -1
};

var GREATER = {
	compare: function(a, b) {
		return this;
	},
	classify: function(cmp) {
		return this;
	},
	result: 1
};

function comparisonChain() {
	return ACTIVE;
}
