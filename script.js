var app = angular.module('app', ['dragAndDrop']);

app.controller('Controller', ['$scope', '$http', function ($scope, $http) {

	$scope.percent = 60;
	$scope.cardSize = 1;
	$scope.popup = null;
	$scope.flip = false;
	$scope.pool = new CardList(poolCompare);
	$scope.decks = [
		new CardList(deckCompare, 'deck 1'), 
		new CardList(deckCompare, 'deck 2'), 
		new CardList(deckCompare, 'deck 3')];
	$scope.junk = new CardList(poolCompare, 'junk');
	
	$scope.currentDeck = $scope.decks[0];

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
					loadSession(JSON.parse(e1.target.result));
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
		$scope.pool.contents = pool;
		$scope.pool.sort();
	}
	
	function loadSession(state) {
		$scope.pool.contents = state.pool;
		for (var i = 0; i < 3; i++) {
			$scope.decks[i].contents = state.decks[i];
		}
		$scope.junk.contents = state.junk;
	}
	
	function formatDeck() {
		var deckList = toMultiset($scope.currentDeck.contents.map(function(card) {
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

	function sessionDump() {
		return JSON.stringify({
			pool: $scope.pool.contents,
			decks: $scope.decks.map(function(list) { return list.contents; }),
			junk: $scope.junk.contents
		});
	}

	$scope.getImageName = function(card) {
		return $scope.flip && card.flip ? card.flipImageName : card.imageName;
	};

	$scope.moveCard = function(listFrom, listTo, index) {
		listTo.insert(listFrom.contents.splice(index, 1)[0]);
	};

	$scope.hideDeckList = function() {
		$scope.popup = null;
	};
	
	function showPopup(type, text) {
		if ($scope.popup == type) {
			$scope.popup = null;
		} else {
			$scope.popup = type;
			$scope.popupText = text;
		}
	}

	$scope.shortcut =  function(e) {
		switch (e.key) {
			case 'f': $scope.flip ^= true; break;
			case '1': 
			case '2':
			case '3': $scope.currentDeck = $scope.decks[Number(e.key) - 1]; break;
			case 'j': $scope.currentDeck = $scope.junk; break;
			case 'x': showPopup('deck', formatDeck()); break;
			case 's': showPopup('dump', sessionDump()); break;
			case '=': $scope.cardSize = Math.max($scope.cardSize - 1, 0); break;
			case '-': $scope.cardSize = Math.min($scope.cardSize + 1, 2); break;
			case 'Escape': $scope.hideDeckList(); break;
			default:
		}
    };
}]);

app.directive('slider', function($document) {
    return function(scope, element, attrs) {
		$element.on('mousedown', function(event) {
			event.preventDefault();
			$document.on('mousemove', mousemove);
			$document.on('mouseup', mouseup);
		});
		
		function mousemove(event) {
			var x = event.pageX;
			if ($attrs.resizerMax && x > $attrs.resizerMax) {
				x = parseInt($attrs.resizerMax);
			}
			$element.css({
				left: x + 'px'
			});
			$($attrs.resizerLeft).css({
				width: x + 'px'
			});
			$($attrs.resizerRight).css({
				left: (x + parseInt($attrs.resizerWidth)) + 'px'
			});
		}

		function mouseup() {
			$document.unbind('mousemove', mousemove);
			$document.unbind('mouseup', mouseup);
		}
	};
});



function CardList(comparator, name) {
    this.contents = [];
	this.name = name;
	this.comparator = comparator;
} 

CardList.prototype.sort = function() {
	this.contents.sort(this.comparator);
}

CardList.prototype.insert = function(card) {
	insertSorted(this.contents, card, this.comparator);
}

function poolCompare(card1, card2) {
	return comparisonChain()
			.compare(COLOR_ORDER[card1.color],  COLOR_ORDER[card2.color])
			.compare(!card1.type, !card2.type)
			.compare(card1.manaCost || 100, card2.manaCost || 100)
			.compare(card1.name, card2.name)
			.result;
}

function deckCompare(card1, card2) {
	return comparisonChain()
			.compare(card1.color == 'L', card2.color == 'L')
			.compare(!card1.type, !card2.type)
			.compare(card1.manaCost || 100, card2.manaCost || 100)
			.compare(COLOR_ORDER[card1.color], COLOR_ORDER[card2.color])
			.compare(card1.name, card2.name)
			.result;
}

function insertSorted(array, card, compareMethod) {
	array.splice(insertionIndex(array, card, compareMethod), 0, card);
}

function insertionIndex(array, card, compareMethod) {
	var low = 0;
	var high = array.length - 1;
	while (low <= high) {
		var mid = Math.floor((low + high) / 2);
		var cmp = compareMethod(card, array[mid]);
		if (cmp > 0) {
			low = mid + 1;
		} else if (cmp < 0) {
			high = mid - 1;
		} else {
			return mid;
		}
	}
	return low;
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
