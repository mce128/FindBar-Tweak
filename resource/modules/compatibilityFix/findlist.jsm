Modules.VERSION = '1.0.1';

this.overrideFindlistWidth = function() {
	Prefs.fieldWidth = Prefs.findFieldWidth;
	initFindBar('findlistFix',
		function(bar) {
			bar.getElement('findbar-textbox').style.width = Prefs.fieldWidth+'px';
		},
		function(bar) {
			bar.getElement('findbar-textbox').style.width = '';
		},
		true
	);
};

Modules.LOADMODULE = function() {
	Prefs.setDefaults({ fieldWidth: 150 }, 'findlist');
	
	Prefs.listen('findFieldWidth', overrideFindlistWidth);
	overrideFindlistWidth();
};

Modules.UNLOADMODULE = function() {
	Prefs.unlisten('findFieldWidth', overrideFindlistWidth);
	
	deinitFindbar('findlistFix');
};
