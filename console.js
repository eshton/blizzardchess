var MyConsole = function() {
	
	var loaderImg = $('#activity_console_loader');
	var consoleDiv = $('#activity_console');
	
	var time = function() {
		var c = new Date();
		return c.getHours() + ":" + c.getMinutes() + ":" + c.getSeconds();
	}
	
	var write = function(text) {
		var e = $('<div>');
		e.append(time() + " - " + text);
		consoleDiv.prepend(e);
	}
	
	var clear = function() {consoleDiv.html('');}
	var toggleLoader = function() {loaderImg.toggle();}
	var hideLoader = function() {loaderImg.hide();}
	var divider = function() {consoleDiv.append('<hr/>')};
	
	return {
		write:write,
		clear:clear,
		toggleLoader:toggleLoader,
		hideLoader:hideLoader,
		divider:divider
	}
}