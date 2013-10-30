/* 
 * Copyright 2013 Alexander Ivanov
 * Licensed under the MIT License
 */

/*
 *	TODO
 * 
 *	Adaptive triggers based on screen size
 * 	Move in-screen scrolling to slide transition
 *	Carosuels
 *		Fader
 *	Paralax
 *	Transformables
 *	Test in FF/IE/O/S/Mobile
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
	
	var create = function( structure, map ) {
		var element = document.createDocumentFragment();
		
		for( var key in structure ) {
			var tmp = document.createElement( structure[key].tag );
			
			for( var attr in structure[key] ) {
				if( attr == 'children' ) {
					tmp.appendChild( create( structure[key][attr], map ) );
				} else if( attr == 'content') {
					if( map ) {
						var text = structure[key][attr];
						for( var magic in map) {
							text = text.replace(magic, map[magic]);
						}
					}
					$(tmp).text( text );
				} else if( attr != 'tag' ) {
					tmp.setAttribute( attr, structure[key][attr] );
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
		
		if( this.options.loadingScreen ) {
			this.initProgress();
		} else {
			this.onload();
		}
		
		if( this.options.pageTransitions && this.options.pageLinks.length>1 ) {
			this.initTransitions();
		}
		
		if( this.options.carosuel.length ) {
			this.initCarosuel();
		}
		
		return this;
	}
	
	Present.prototype.options = {
		loadingScreen: true,
		loadingStructure: [{tag:'div',id:'loading',children:[{tag:'div',id:'loading_bar'}]}],
		loadingProgressBar: '#loading_bar',
		loadingContainer: '#loading',
 
		paging: true,
		pageTransitions: 'snap',
		pageLinks: $(),
		pageLinksClass: 'active',
 
		screenClass: 'active',
 
		scrolling: true,
		fullHeight: true,
 
		carosuel: [],
		carosuelDefaultEffect: 'slide',
 
		onpage: function(){},
		onpagebefore: function(){},
		onpageafter: function(){},
		onload: function(){},
		onimage: function(){}
	};
	
	Present.prototype.transitions = {};
	
	Present.prototype.transitions.snap = {
		init: function( self ) {
			document.body.style.overflow = 'hidden';
			self.shuttle.css({position: 'relative'});
		},
		transition: function( page, callback, self ) {
			var animation = {};
			
			if( self.options.fullHeight ) {
				var index = this.screens.index(page);
				animation.top = (-index*100).toString()+'%';
			} else {
				var offset = page.offset().top;
				animation.top = (offset > 0 ? '-' : '+' ) + '=' + Math.abs( offset ).toString() + 'px';
			}
			
			this.shuttle.animate( animation, callback );
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
			page.animate({
				top: '0px'
			}, function(){
				self.screens.not(page).css({zIndex: 1});
				page.css({zIndex: 2});
				
				callback();
			});
		}
	}
	
	Present.prototype.effects = {};
	
	Present.prototype.effects.slide = {
		init: function( config, self ) {
			config.options = $.extend( this.defaults, config.options );
			config.effect = this;
			config.index = 0;
			
			config.container.css({overflow: 'hidden'});
			
			config.width = config.container.width();
			config.height = config.container.height();
			
			if( !config.elements ) {
				config.elements = $(config.container).children();
			}
			
			config.shuttle = $(config.container[0].appendChild( document.createElement('div') ));
			
			config.elements.each(function( elementIndex ){
				if( config.pagingStructure ) {
					config.pagingContainer[0].appendChild( create(config.pagingStructure, {NUM: elementIndex + 1 }) );
					config.paging = config.pagingContainer.children();
				}
				
				config.shuttle[0].appendChild( config.container[0].removeChild( this ));
				var $this = $(this);
				
				if( config.options.direction == 'horizontal' ) {
					$this.css({float: 'left'});
				}
				
				$this.css({
					width: config.width,
					height: config.height
				});
			});
			
			if( config.options.direction == 'horizontal' ) {
				config.shuttle.css({
					height: '100%',
					width: (100*config.elements.length).toString()+'%'
				});
			} else {
				config.shuttle.css({
					width: '100%',
					height: (100*config.elements.length).toString()+'%'
				});
			}
			
			if( config.paging ) {
				config.paging.click(function(){	
					var index = config.paging.index( this );
					config.effect.transition( index, config, self );
				});
			}
			
			config.left.click(function(){
				config.effect.transition( config.index-1, config, self )
			});
			config.right.click(function(){
				config.effect.transition( config.index+1, config, self )
			});
			
			if( config.options.autoplay ) {
				this.setTimeout( config );
			}
			
			if( config.options.waitOnMouse ) {
				config.container.mouseover(function(){
					config.effect.clearTimeout( config );
				});
				config.container.mouseout(function(){
					config.effect.setTimeout( config, self );
				});
			}
		},
		defaults: {
			interval: 2000,
			duration: 500,
			autoplay: true,
			waitOnMouse: true,
			direction: 'horizontal',
		},
		transition: function( index, config, self ) {
			if( config.playing ) return;
			config.playing = true;
			
			this.clearTimeout( config );
			
			if( index === false ) index = config.index + 1;
				
			if( index < 0 ) index = config.elements.length-1;
			else if( index >= config.elements.length ) index = 0;
 
			config.index = index;
 
			var animation = config.options.direction == 'horizontal' ? {marginLeft: (-config.width*index).toString()+'px'} : {marginTop: (-config.height*index).toString()+'px'};
			config.shuttle.animate( animation, config.options.duration, function(){
				config.playing = false;
				
				config.effect.setTimeout( config, self );
			} );
		},
		clearTimeout: function( config ) {
			if( config.timeout ) {
				clearTimeout( config.timeout );
				config.timeout = false;
			}
		},
		setTimeout: function( config, self ) {
			if( config.options.autoplay ) {
				config.timeout = setTimeout( function(){
					config.effect.transition( config.index + 1, config, self );
				}, config.options.interval );
			}
		}
	}
	
	Present.prototype.goToPage = function( page ) {
		if ( this.moving || page == this.currentPage ) return;
		var self = this;

		var index = this.getPageIndex( page );
		
		if( index !== false ) {
			this.onpagebefore();
			
			var screen = this.screens.find('a[name='+page.replace('#','')+']').parent();
			this.moving = true;
			this.currentPage = page;
			
			this.onpage();
			
			this.transition( screen, function(){
				window.location.hash = page;
				self.moving = false;
				
				self.onpageafter();
			}, self );
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
		var self = this;
		var images = getImages();
			
		var totalImages = images.length;
		var loadedImages = 0;
			
		if( !totalImages ) {
			this.setProgress( 1 );
		}
			
		for( var index in images ) {
			$('<img>').on('error load', function(){
				++loadedImages;
				
				self.onimage( loadedImages/totalImages, this.src );
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
		});
	}
	
	Present.prototype.initPaging = function() {
		var self = this;
		
		this.screens.find('a[name]').css({position:'absolute'});
		
		this.goToPage( window.location.hash != '' ? window.location.hash : this.options.pageLinks.eq(0).attr('href') );
			
		$('a').click(function() {				
			if( this.getAttribute('href').substring(0, 1) == '#' ) {
				self.goToPage( this.getAttribute('href') );
			
				return false;
			}
		});
		
		if ( 'onhashchange' in window ) {
			window.onhashchange = function() {
				if( !self.moving ) self.goToPage( window.location.hash );
			}
		}
	}
	
	Present.prototype.initCarosuel = function() {
		for( var index in this.options.carosuel ) {
			var effect = this.options.carosuel[index].effect ? this.options.carosuel[index].effect : this.options.carosuelDefaultEffect;
			
			this.effects[ effect ].init( this.options.carosuel[index] , this );
		}
	}
	
	Present.prototype.bindScroll = function() {
		var self = this;
		
		$(document).bind('mousewheel DOMMouseScroll', function(event) {
			event.preventDefault();
			var direction = event.originalEvent.wheelDelta || -event.originalEvent.detail;
			
			
			var page = self.getCurrentScreen();
			
			if(
				!self.options.fullHeight && (
				( direction < 0 && page.offset().top + page.height() > $(document.body).height() ) || 
				( direction > 0 && page.offset().top != 0 )) 
			) {
				if( self.moving ) {
					return false;
				}
				self.moving = true;
				
				direction = Math.round( ( direction/Math.abs(direction) ) * $(document.body).height() * 0.75 );
				
				if( page.offset().top + direction > 0 ) {
					direction = -page.offset().top;
				} else if( page.height() + page.offset().top + direction < $(document.body).height() ) {
					direction = $(document.body).height() - (page.height() + page.offset().top);
				}
				
				self.shuttle.animate({
					top: (direction < 0 ? '-' : '+' ) + '=' + Math.abs( direction ).toString() + 'px'
				}, function(){
					self.moving = false;
				});
			} else {
				if( direction < 0 ) {
					self.goPageDown();
				} else {
					self.goPageUp();
				}
			}
		});
	}
	
	Present.prototype.getLink = function( page ) {
		return this.options.pageLinks.filter('[href='+page+'],[href=#'+page+']');
	}
	
	Present.prototype.getCurrentLink = function() {
		return this.getLink( this.currentPage );
	}
	
	Present.prototype.getScreen = function( page ) {
		return this.screens.find('a[name='+page.replace('#','')+']').parent();
	}
	
	Present.prototype.getCurrentScreen = function() {
		return this.getScreen( this.currentPage );
	}
	
	Present.prototype.onpage = function() {
		if ( this.options.paging ) {
			if( this.options.pageLinksClass ) {
				this.options.pageLinks.removeClass( this.options.pageLinksClass );
				this.options.pageLinks.filter('[href='+this.currentPage+']').addClass( this.options.pageLinksClass );
			}
			if( this.options.screenClass ) {
				this.screens.removeClass( this.options.screenClass );
				this.screens.find('a[name='+this.currentPage.replace('#', '')+']').parent().addClass( this.options.screenClass );
			}
		}
		
		this.options.onpage( this.currentPage, this );
	}
	
	Present.prototype.onload = function() {
		this.options.onload( this );
	}
	
	Present.prototype.onpagebefore = function() {
		this.options.onpagebefore( this.currentPage, this );
	}
	
	Present.prototype.onpageafter = function() {
		this.options.onpageafter( this.currentPage, this );
	}
	Present.prototype.onimage = function( percent, image ) {
		this.setProgress( percent );
		this.options.onimage( percent, image, this );
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