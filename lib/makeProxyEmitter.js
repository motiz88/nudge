var EventEmitter = require('events').EventEmitter;
var makeHandler = require('./makeHandler');

function makeProxyEmitter(emitter, eventSpecs) {
	'use strict';

	var proxy = new EventEmitter();

	// Disable max listeners warning on the proxy.
	proxy.setMaxListeners(0);

	var messageHistory = [];
	
	proxy.on('newListener', function(event, listener) {
		if (event === 'data') {
			var startEventId = 0;
			if (listener.hasOwnProperty('lastEventId'))
			{
				var lastEventId = parseInt(listener.lastEventId, 10);
				if (Number.isFinite(lastEventId)) {
					startEventId = lastEventId + 1;
				}
			}
				
			for (var id=startEventId; id<messageHistory.length; ++id)
			{
				listener(messageHistory[id]);
			}
		}
	});

	var serverCurrentID = 0;
	
	function write(string) {
		proxy.emit('data', string);
	}
	
	function writeSavingID(string) {
		var id = serverCurrentID++;
		write(messageHistory[id] = ('id: ' + id + '\n' + string));
	}
	
	Object.keys(eventSpecs).forEach(function (eventName) {
		var handler = makeHandler(eventName, eventSpecs[eventName], writeSavingID);
		
		emitter.on(eventName, handler);
	});

	return proxy;
}

module.exports = makeProxyEmitter;
