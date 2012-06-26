L.MarkerCluster = L.Class.extend({
	initialize: function (group, a, apos, b, bpos) {
		this._group = group;

		this._markers = [a, b];

		this._minX = this._maxX = apos.x;
		this._minY = this._maxY = apos.y;
		this.center = apos.clone();

		this._recalculateCenter(bpos);
	},

	add: function (new1, pos) {
		this._markers.push(new1);

		this._recalculateCenter(pos);
	},

	//Make all the markers move to the center point
	startAnimation: function () {
		var markers = this._markers;

		var center = this.center._round()._subtract(this._group._map._initialTopLeftPoint);
		for (var i = 0; i < markers.length; i++) {
			var m = markers[i];

			//Only do it if the icon is still on the map
			if (m._icon) {
				//m.setOpacity(0.5); //Hack to see which is which
				m._setPos(center);
			}
		}
	},

	createCluster: function () {
		//TODO: animate creation
		var m = new L.Marker(this._group._map.layerPointToLatLng(this.center), { icon: new L.DivIcon({ innerHTML: this._markers.length, className: 'hax-icon', iconSize: new L.Point(20, 18) }) });
		this._group._map.addLayer(m);

		for (var i = 0; i < this._markers.length; i++) {
			this._group._map.removeLayer(this._markers[i]);
		}
	},

	_recalculateCenter: function (b) {

		if (b.x < this._minX) {
			this._minX = b.x;
			this.center.x = (this._minX + this._maxX) / 2;
		} else if (b.x > this._maxX) {
			this._maxX = b.x;
			this.center.x = (this._minX + this._maxX) / 2;
		}

		if (b.y < this._minY) {
			this._minY = b.y;
			this.center.y = (this._minY + this._maxY) / 2;
		} else if (b.y > this._maxY) {
			this._maxY = b.y;
			this.center.y = (this._minY + this._maxY) / 2;
		}
	},
});