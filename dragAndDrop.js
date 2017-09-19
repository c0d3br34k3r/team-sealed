(function() {
    
    var dragAndDrop = angular.module('dragAndDrop', []);
    
    var dragEvents = {
             drag: 'drag',
          dragend: 'dragend',
        dragenter: 'dragenter',
         dragexit: 'dragexit',
        dragleave: 'dragleave',
         dragover: 'dragover',
        dragstart: 'dragstart',
             drop: 'drop'};

    angular.forEach(Object.keys(dragEvents), function(eventName) {
        var directiveName = dragEvents[eventName];
        dragAndDrop.directive(directiveName, function($parse) {
            return {
                restrict: 'A',
                link: function (scope, element, attrs) {
                    var expr = $parse(attrs[directiveName]);
                    element[0].addEventListener(eventName, function(e) {
                        var callback = function() {
                            expr(scope, {$event: e});
                        };
                        scope.$apply(callback);
                    }, false);
                }
            };
        });
    });
    
})();

