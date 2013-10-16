/* 
 * Copyright 2013 Alexander Ivanov
 * Licensed under the MIT License
 */

/*
 *	TODO
 * 
 *	Refactor code		*
 *	Paging				*
 *	Page transitions	*
 *		Snap			*
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
		loadingProgressBar: '#loading_bar',
		loadingContainer: '#loading',
		paging: true,
		pageTransitions: 'snap',
		onpage: function(){},
		onload: function(){}
	};
	
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
	
	var unique = function( arr, value ) {
		for( var key in arr ) {
			if( arr[key] == value ) return arr;
		}
		arr.push( value );
		return arr;
	}
	
	var extract = function( data, path ) {
		var matches = data.match(/url\(.+?\)/g);
		var arr = [];
		
		for( var key in matches ) {
			var url = matches[key].replace( /(^url\(|\)$|['"])/g, '' );
			
			if( url.substring( 0, 1 ) != '/' && url.substring( 0, 5 ) != 'http:' && url.substring( 0, 6 ) != 'https:' ) url = path + url;
				
			arr = unique( arr, url );
		}
		return arr;
	}
	
	var Present = function( shuttle, options ) {
		this.shuttle = shuttle;
		this.options = $.extend( defaultPresentOptions, options );
		this.moving = false;
		
		if( this.options.loadingScreen ) {
			window.document.body.appendChild( create( this.options.loadingStructure ) );
			
			var images = [];
			var path = window.location.href.split('/');
			path.pop();
			path = path.join('/') + '/';
			
			$('link[rel=stylesheet]').each(function(){
				var path = this.href.split('/');
				path.pop();
				path = path.join('/') + '/';
				
				$.ajax({
					async: false,
					dataType: 'text',
					url: this.href,
					success: function( data ){
						images = images.concat( extract( data, path ) );
					}
				});
			});
			$('style').each(function(){
				images = images.concat( extract( $(this).html(), path ) );
			});
			$('img').each(function(){
				images = unique( images, this.src );
			});
			
			var totalImages = images.length;
			var loadedImages = 0;
			
			var progressBar = $( this.options.loadingProgressBar );
			var container = $( this.options.loadingContainer );
			var done = this.options.onload;
			
			if( totalImages == 0 ) {
				progressBar.animate({width: '100%'}, function(){
					container.fadeOut();
					done();
				});	
			}
			
			for( var index in images ) {
				$('<img>').on('error load', function(){
					++loadedImages;
					
					var percent = (loadedImages/totalImages)*100;
					progressBar
						.stop()
						.animate({
							width: percent.toString()+'%'
						}, function() {
							if( loadedImages == totalImages ) {
								container.fadeOut();
								done();
							}
						}
					);					
				}).attr('src', images[index]);
			}
		} else {
			done();
		}
		
		if( this.options.pageTransitions ) {
			window.document.body.style.overflow = 'hidden';
			this.shuttle.css({position: 'relative'});
			
			var move = this.goToPage;
			var that = this;
			
			$(window.document).bind('mousewheel DOMMouseScroll', function(event) {
				event.preventDefault();
				var direction = event.originalEvent.wheelDelta || -event.originalEvent.detail;
				move( direction < 0, that )
			});
		}
		
		return this;
	}
	
	Present.prototype.goToPage = function( page, that ) {
		if ( that.moving ) return;

		that.moving = true;
		
		that.shuttle.animate({
			top: (-page*100).toString()+'%'
		}, function(){
			that.moving = false;
		});
	}
	
	Present.prototype.goPageUp = function() {
		
	}
	
	Present.prototype.goPageDown = function() {
		
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