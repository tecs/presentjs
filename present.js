(function(window){
	var $ = window.jQuery;
	var instance = false;
	
	var Present = function( options ) {
		return this;
	}
	
	$.fn.Present = function( options ) {
		if(instance) {
			if (window.console) window.console.warn('Present.js is already instantiated!');
			return instance;
		} else {
			return instance = new Present( options );
		}
	}
	
})(window);