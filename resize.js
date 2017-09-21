angular.directive('resizer', function($document) {

	return function($scope, $element, $attrs) {

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