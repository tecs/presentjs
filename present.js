/* 
 * Copyright 2013 Alexander Ivanov
 * Licensed under the MIT License
 */

/*
 *	TODO
 * 
 *	Carosuels
 *		Slider
 *		Fader
 *	Paralax
 *	Transformables
 *	Test in FF/IE/O
 *	Events
 *		onpageafter
 *		onpagebefore
 *	Helper functions
 *		getLink
 *		getScreen
 *		getCurrentLink
 *		getCurrentScreen
 */
	
(function(window){
	var $ = window.jQuery;
	var document = window.document;
	var instance = false;
	
	var getImages = function() {			
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
		
		return images;
	}
	
	var create = function( structure ) {
		var element = document.createDocumentFragment();
		
		for( var key in structure ) {
			var tmp = document.createElement( key );
			
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
	
	var Present = function( screens, options ) {
		this.screens = screens;
		this.shuttle = screens.parent();
		this.options = $.extend( this.options, options );
		this.moving = false;
		this.currentPage = window.location.hash;
		
		if( this.options.loadingScreen ) {
			this.initProgress();
		} else {
			this.onload();
		}
		
		if( this.options.pageTransitions && this.options.pageLinks.length>1 ) {
			this.initTransitions();
		}
		
		return this;
	}
	
	Present.prototype.options = {
		loadingScreen: true,
		loadingStructure: {div:{id:'loading',children:{div:{id:'loading_bar'}}}},
		loadingProgressBar: '#loading_bar',
		loadingContainer: '#loading',
 
		paging: true,
		pageTransitions: 'snap',
		pageLinks: $(),
		pageLinksActive: 'active',
 
		screenActive: 'active',
 
		scrolling: true,

		onpage: function(){},
		onload: function(){}
	};
	
	Present.prototype.transitions = {};
	
	Present.prototype.transitions.snap = {
		init: function( self ) {
			document.body.style.overflow = 'hidden';
			self.shuttle.css({position: 'relative'});
		},
		transition: function( page, callback ) {
			var index = this.screens.index(page);
			
			this.shuttle.animate({
				top: (-index*100).toString()+'%'
			}, callback );
		}
	}
	
	Present.prototype.transitions.deck = {
		init: function( self ) {
			document.body.style.overflow = 'hidden';
			self.shuttle.css({position: 'absolute', top: '0px', left: '0px', width: '100%', height: '100%', zIndex: 0});
			self.screens.css({position: 'absolute', top: '0px', left: '0px', zIndex: 1});
		},
		transition: function( page, callback ) {
			var self = this;
			page.css({top: '100%',zIndex: 3});
						console.log(page)
			page.animate({
				top: '0px'
			}, function(){
				self.screens.not(page).css({zIndex: 1});
				page.css({zIndex: 2});
				
				callback();
			});
		}
	}
	
	Present.prototype.goToPage = function( page ) {
		if ( this.moving ) return;
		var self = this;

		var index = this.getPageIndex( page );
		
		if( index !== false ) {
			var screen = this.screens.find('a[name='+page.replace('#','')+']').parent();
			this.moving = true;
			this.currentPage = page;
			this.onpage();
			this.transition( screen, function(){
				window.location.hash = page;
				self.moving = false;
			});
		}
	}
	
	Present.prototype.goPageUp = function() {
		var index = this.getPageIndex( this.currentPage ) - 1;
		
		if( index >= 0 ) this.goToPage( this.pages[index] );	
	}
	
	Present.prototype.goPageDown = function() {
		var index = this.getPageIndex( this.currentPage ) + 1;
		
		if( index < this.pages.length ) this.goToPage( this.pages[index] );
	}
	
	Present.prototype.getPageIndex = function ( page ) {
		for( var index in this.pages ) {
			if( page == this.pages[index] ) return parseInt(index);
		}
		
		return false;
	}
	
	Present.prototype.initProgress = function() {
		var progressScreen = create( this.options.loadingStructure );
		document.body.appendChild( progressScreen );
		this.progressBar = $( this.options.loadingProgressBar );
		
		this.preloadImages();
	}
	
	Present.prototype.hideProgress = function() {
		$( this.options.loadingContainer ).fadeOut();
		this.onload();
	}
	
	Present.prototype.setProgress = function( progress ) {
		var percent = (progress*100).toString();
		var self = this;
		
		this.progressBar.stop()
						.animate({
							width: percent+'%'
						}, function() {
							if( progress == 1 ) {
								self.hideProgress();
							}
						}
					);	
	}
	
	Present.prototype.preloadImages = function() {
		var images = getImages();
			
		var totalImages = images.length;
		var loadedImages = 0;
			
		if( !totalImages ) {
			this.setProgress( 1 );
		}
			
		for( var index in images ) {
			$('<img>').on('error load', function(){
				++loadedImages;
					
				self.setProgress( loadedImages/totalImages );
			}).attr('src', images[index]);
		}
	}
	
	Present.prototype.initTransitions = function() {
		this.transitions[ this.options.pageTransitions ].init( this );
		this.transition = this.transitions[ this.options.pageTransitions ].transition;

		this.initPages();
		
		if( this.options.scrolling ) {
			this.bindScroll();
		}
		
		if( this.options.paging ) {
			this.initPaging();
		}
	}
	
	Present.prototype.initPages = function() {
		var self = this;
		this.pages = [];
		
		this.options.pageLinks.each(function(){
			var href = this.getAttribute('href');
			self.pages.push( href );
			
			if( self.currentPage == '' ) self.currentPage = href;
		});
	}
	
	Present.prototype.initPaging = function() {
		var self = this;
		
		this.goToPage( this.currentPage );
			
		this.options.pageLinks.click(function() {				
			self.goToPage( this.getAttribute('href') );
			
			return false;
		});
	}
	
	Present.prototype.bindScroll = function() {
		var self = this;
		
		$(document).bind('mousewheel DOMMouseScroll', function(event) {
			event.preventDefault();
			var direction = event.originalEvent.wheelDelta || -event.originalEvent.detail;
			if( direction < 0 ) {
				self.goPageDown();
			} else {
				self.goPageUp();
			}
		});
	}
	
	Present.prototype.onpage = function() {
		if ( this.options.paging ) {
			if( this.options.pageLinksActive ) {
				this.options.pageLinks.removeClass( this.options.pageLinksActive );
				this.options.pageLinks.filter('[href='+this.currentPage+']').addClass( this.options.pageLinksActive );
			}
			if( this.options.screenActive ) {
				this.screens.removeClass( this.options.screenActive );
				this.screens.find('a[name='+this.currentPage.replace('#', '')+']').parent().addClass( this.options.screenActive );
			}
		}
		
		this.options.onpage( this.currentPage );
	}
	
	Present.prototype.onload = function() {
		this.options.onload();
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