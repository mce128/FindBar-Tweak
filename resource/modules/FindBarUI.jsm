Modules.VERSION = '1.7.0';

this.__defineGetter__('findButton', function() {
	var node = $('find-button');
	
	// If the node is in the menu-panel for instance, it won't be found on startup, until the panel is opened once so it is built
	if(!node && !viewSource && !FITFull) {
		var widget = CustomizableUI.getWidget('find-button');
		if(widget.areaType) {
			node = widget.forWindow(window).node;
		}
	}
	
	return node;
});

this.doOpenOptions = function() {
	openOptions();
};

this.alwaysFindNormal = function(e) {
	// If opening normal Find bar when quick find is already opened, make sure we trigger the change
	if(!gFindBar.hidden && e.detail == gFindBar.FIND_NORMAL && gFindBar._findMode != gFindBar.FIND_NORMAL && Prefs.FAYTmode != 'alwaysquick') {
		e.preventDefault();
		e.stopPropagation();
		gFindBar._findMode = gFindBar.FIND_NORMAL;
		gFindBar.open(gFindBar.FIND_NORMAL);
		return;
	}
	
	// If typing when Find bar is already opened in normal mode, use that instead of "reopening" as quick find mode
	if(!gFindBar.hidden && gFindBar._findMode == gFindBar.FIND_NORMAL && e.detail == gFindBar.FIND_TYPEAHEAD) {
		e.preventDefault();
		e.stopPropagation();
		return;
	}
	
	// If opening findbar when QuickFind bar is already opened and we're supposed to keep QuickFind, make sure we do
	if(!gFindBar.hidden && Prefs.FAYTmode == 'alwaysquick' && (!e.detail || e.detail == gFindBar.FIND_NORMAL)) {
		e.preventDefault();
		e.stopPropagation();
		gFindBar.open(gFindBar.FIND_TYPEAHEAD);
		gFindBar._setFindCloseTimeout();
		return;
	}
	
	// If the FindBar is already open do nothing and keep opening, this prevents the hangup when triggering the QuickFind bar when Find bar is open
	if(!gFindBar.hidden) { return; }
	
	// FAYT: option to force normal mode over quick find mode
	if(e.detail == gFindBar.FIND_TYPEAHEAD && Prefs.FAYTmode == 'normal') {
		e.preventDefault();
		e.stopPropagation();
		gFindBar.open(gFindBar.FIND_NORMAL);
		return;
	}
	
	// Option to force quick find mode over normal mode
	if((!e.detail || e.detail == gFindBar.FIND_NORMAL) && Prefs.FAYTmode == 'alwaysquick') {
		e.preventDefault();
		e.stopPropagation();
		gFindBar.open(gFindBar.FIND_TYPEAHEAD);
		gFindBar._setFindCloseTimeout();
		return;
	}
};

this.triggerUIChange = function(bar) {
	// there's no need to send this for every single findbar element in the window
	Timers.init('triggerUIChange', () => {
		dispatch(bar, { type: 'FindBarUIChanged', cancelable: false });
	}, 0);
};

// Handler for Ctrl+F, it closes the findbar if it is already opened
this.toggleFindBar = function() {
	if(gFindBar.hidden) {
		openFindBar();
	} else {
		gFindBar.close();
	}
};

this.openFindBar = function() {
	gFindBar.onFindCommand();
	if(findQuery && (findQuery != findWord || !documentHighlighted)) {
		gFindBar._setHighlightTimeout();
	}
};

this.toggleButtonState = function() {
	toggleAttribute(findButton, 'checked', (gFindBarInitialized && !gFindBar.hidden));
};

this.overrideButtonCommand = function(e) {
	if(e.originalTarget && e.originalTarget.id == 'find-button' && !e.defaultPrevented) {
		e.preventDefault(); // Don't do the default command
		e.stopPropagation();
		toggleFindBar();
	}
};

this.setFindButton = function() {
	if(findButton) {
		// I really don't like setting this listener on window, but setting it on findButton the event will be at phase AT_TARGET, and can't be cancelled there.
		Listeners.add(window, 'command', overrideButtonCommand, true);
		toggleButtonState();
	}
};

this.unsetFindButton = function() {
	if(findButton) {
		Listeners.remove(window, 'command', overrideButtonCommand, true);
		removeAttribute(findButton, 'checked');
	}
};

// This is in case the button is added when a toolbar is created for example
this.setButtonListener = {
	onWidgetAdded: function(aId) {
		if(!customizing && aId == 'find-button') { setFindButton(); }
	},
	onAreaNodeRegistered: function() {
		if(!customizing) { setFindButton(); }
	}
};

this.toggleClose = function() {
	initFindBar('toggleClose',
		function(bar) {
			toggleAttribute(bar, 'noClose', Prefs.hideClose);
			triggerUIChange(bar);
		},
		function(bar) {
			removeAttribute(bar, 'noClose');
		},
		true
	);
};

this.toggleLabels = function() {
	initFindBar('toggleLabels',
		function(bar) {
			toggleAttribute(bar, 'hideLabels', Prefs.hideLabels);
			triggerUIChange(bar);
		},
		function(bar) {
			removeAttribute(bar, 'hideLabels');
		},
		true
	);
};

this.toggleMoveToTop = function() {
	Modules.loadIf('moveToTop', Prefs.movetoTop);
};

this.toggleMoveToRight = function(startup) {
	initFindBar('toggleMoveToRight',
		function(bar) {
			toggleAttribute(bar, 'movetoright', Prefs.movetoRight);
		},
		function(bar) {
			removeAttribute(bar, 'movetoright');
		},
		true
	);
};

this.toggleKeepButtons = function(startup) {
	initFindBar('toggleKeepButtons',
		function(bar) {
			toggleAttribute(bar, 'keepButtons', Prefs.keepButtons);
		},
		function(bar) {
			removeAttribute(bar, 'keepButtons');
		},
		true
	);
};

Modules.LOADMODULE = function() {
	// For the case-sensitive button
	Prefs.setDefaults({ casesensitive: 0 }, 'typeaheadfind', 'accessibility');
	
	Overlays.overlayURI('chrome://browser/content/browser.xul', 'findbar');
	Overlays.overlayURI('chrome://global/content/viewSource.xul', 'findbar');
	Overlays.overlayURI('chrome://global/content/viewPartialSource.xul', 'findbar');
	
	Prefs.listen('hideClose', toggleClose);
	Prefs.listen('hideLabels', toggleLabels);
	Prefs.listen('movetoRight', toggleMoveToRight);
	
	Modules.load('resizeTextbox');
	
	toggleClose();
	toggleLabels();
	toggleMoveToRight();
	
	if(!FITFull) {
		if(!viewSource) {
			Listeners.add(window, 'beforecustomization', unsetFindButton);
			Listeners.add(window, 'aftercustomization', setFindButton);
			CustomizableUI.addListener(setButtonListener);
			
			if(!customizing) {
				setFindButton();
			}
		}
		
		initFindBar('contextMenu',
			function(bar) { setAttribute(bar, 'context', objPathString+'_findbarMenu'); },
			function(bar) { removeAttribute(bar, 'context'); }
		);
		
		Prefs.listen('movetoTop', toggleMoveToTop);
		Prefs.listen('keepButtons', toggleKeepButtons);
		
		Listeners.add(window, 'WillOpenFindBar', alwaysFindNormal, true);
		Listeners.add(window, 'OpenedFindBar', toggleButtonState);
		Listeners.add(window, 'ClosedFindBar', toggleButtonState);
		
		if(!viewSource) {
			Listeners.add(gBrowser.tabContainer, "TabSelect", toggleButtonState);
		}
		
		Modules.load('ctrlF');
		toggleMoveToTop();
		toggleKeepButtons();
	}
};

Modules.UNLOADMODULE = function() {
	if(!FITFull) {
		Prefs.unlisten('movetoTop', toggleMoveToTop);
		Prefs.unlisten('keepButtons', toggleKeepButtons);
		
		Modules.unload('moveToTop');
		Modules.unload('ctrlF');
		
		deinitFindBar('toggleKeepButtons');
		
		Listeners.remove(window, 'WillOpenFindBar', alwaysFindNormal, true);
		Listeners.remove(window, 'OpenedFindBar', toggleButtonState);
		Listeners.remove(window, 'ClosedFindBar', toggleButtonState);
		
		if(!viewSource) {
			Listeners.remove(gBrowser.tabContainer, "TabSelect", toggleButtonState);
		}
		deinitFindBar('contextMenu');
	
		if(!viewSource) {
			Listeners.remove(window, 'beforecustomization', unsetFindButton);
			Listeners.remove(window, 'aftercustomization', setFindButton);
			CustomizableUI.removeListener(setButtonListener);
			
			unsetFindButton();
		}
	}
		
	Prefs.unlisten('hideClose', toggleClose);
	Prefs.unlisten('hideLabels', toggleLabels);
	Prefs.unlisten('movetoRight', toggleMoveToRight);
	
	Modules.unload('resizeTextbox');
	
	deinitFindBar('toggleClose');
	deinitFindBar('toggleLabels');
	deinitFindBar('toggleMoveToRight');
	
	if(UNLOADED) {
		Overlays.removeOverlayURI('chrome://browser/content/browser.xul', 'findbar');
		Overlays.removeOverlayURI('chrome://global/content/viewSource.xul', 'findbar');
		Overlays.removeOverlayURI('chrome://global/content/viewPartialSource.xul', 'findbar');
	}
};
