L.DivIcon = L.Icon.extend({
	options: {
		iconSize: new L.Point(12, 12), // also can be set through CSS
		/*
		iconAnchor: (Point)
		popupAnchor: (Point)
		html: (String)
		bgPos: (Point)
		*/
		className: 'leaflet-div-icon'
	},

	createIcon: function () {
<<<<<<< HEAD
		var div = document.createElement('div'),
		    options = this.options;

		if (options.html) {
			div.innerHTML = options.html;
		}

		if (options.bgPos) {
			div.style.backgroundPosition =
					(-options.bgPos.x) + 'px ' + (-options.bgPos.y) + 'px';
		}

=======
		var div = document.createElement('div');
		if (this.options.innerHTML)
			div.innerHTML = this.options.innerHTML;
>>>>>>> Move MarkerCluster out to its own file. Hack DivIcon so I can show something useful in it. Remove Markers from the map after merging them.
		this._setIconStyles(div, 'icon');
		return div;
	},

	createShadow: function () {
		return null;
	}
});

L.divIcon = function (options) {
	return new L.DivIcon(options);
};
