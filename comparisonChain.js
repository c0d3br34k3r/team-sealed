var comparisonChain = (function() {
	
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

	return {
		function() {
			return ACTIVE;
		}
	}

})();
