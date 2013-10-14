/* 
 * Copyright 2013 Alexander Ivanov
 * Licensed under the MIT License
 */

/*
 *	TODO
 * 
 *	Loaders
 *	Paging
 *	Page transitions
 *		Snap
 *		Deck
 *	Carosuels
 *	Paralax
 *	Transformables
 */
	
(function(window){
	var $ = window.jQuery;
	var instance = false;
	
	var defaultLoadingStructure = {
		div: {
			id: 'loading',
			children: {
				div: { id: 'loading_bar' }
			}
		}
	};
	
	var defaultPresentOptions = {
		loadingScreen: true,
		loadingStructure: defaultLoadingStructure,
		loadingObject: 'loading_bar',
		paging: true,
		pageTransitions: 'snap'
	};
	
	var extend = function( a, b ) {
		for( var key in b ) a[key] = b[key];
		return a;
	}
	
	var create = function( structure ) {
		var element = window.document.createDocumentFragment();
		
		for( var key in structure ) {
			var tmp = window.document.createElement( key );
			
			for( var attr in structure[key] ) {
				if( attr != 'children' ) {
					tmp.setAttribute( attr, structure[key][attr] );
				} else {
					tmp.appendChild( create( structure[key][attr] ) );
				}
			}
			
			element.appendChild( tmp );
		}
		
		return element;
	}
	
	var Present = function( object, options ) {
		this.container = object;
		this.options = extend( defaultPresentOptions, options );
		
		if( this.options.loadingScreen ) {
			window.document.body.appendChild( create( this.options.loadingStructure ) );
		}
		
		return this;
	}
	
	$.fn.Present = function( options ) {
		if( instance && window.console ) {
			window.console.warn('Present.js was already instantiated!');
		} else if( !instance ) {
			instance = new Present( this, options );
		}
		
		return instance;
	}
	
})(window);