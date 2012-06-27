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

		for (var i = 0; i < markers.length; i++) {
			var m = markers[i];

			//Only do it if the icon is still on the map
			if (m._icon) {
				//m.setOpacity(0.5); //Hack to see which is which
				m._setPos(this.center);
				//TODO Scale them down as they move? Fade them as they move?
			}
		}
	},

	createCluster: function () {
		this.center._round();

		//TODO: animate creation
		if (!this._marker) {
			var m = new L.Marker(this._group._map.layerPointToLatLng(this.center), { icon: new L.DivIcon({ innerHTML: this._markers.length, className: 'hax-icon', iconSize: new L.Point(20, 18) }) });
			m._isCluster = true;
			this._group._map.addLayer(m);
			this._marker = m;
		} else {
			this._marker._icon.innerHTML = this._markers.length;

			if (this._centerChanged) {
				this._centerChanged = false;
				this._marker.setLatLng(this._group._map.layerPointToLatLng(this.center));
			}
			//this._marker._setPos(this.center);
			//
		}

		for (var i = 0; i < this._markers.length; i++) {
			this._group._map.removeLayer(this._markers[i]);
		}
	},

	recalculateCenter: function () {
		//Recalculate min/max X/Y

		var p = this._group._map.latLngToLayerPoint(this._markers[0]._latlng);
		this._minX = this._maxX = p.x;
		this._minY = this._maxY = p.y;
		for (var i = 1; i < this._markers.length; i++) {
			this._recalculateCenter(this._group._map.latLngToLayerPoint(this._markers[i]._latlng));
		}
		this._centerChanged = false;
		this.center._round();
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
		this._centerChanged = true;
	},
});