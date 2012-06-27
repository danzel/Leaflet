L.MarkerCluster = L.Class.extend({
	initialize: function (group, a, b) {
		this._group = group;

		this._markers = [a, b];

		var aLatLng = a.getLatLng();
		this._minLat = this._maxLat = aLatLng.lat;
		this._minLng = this._maxLng = aLatLng.lng;
		this.center = new L.LatLng(aLatLng.lat, aLatLng.lng);

		this._recalculateCenter(b.getLatLng());

		if (a instanceof L.MarkerCluster || b instanceof L.MarkerCluster) {
			this._hasChildCluster = true;
		}
	},

	add: function (new1, pos) {
		this._markers.push(new1);
		if (new1 instanceof L.MarkerCluster) {
			this._hasChildCluster = true;
		}

		this._recalculateCenter(pos);
	},

	getLatLng : function() {
		return this._latLng;
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

		//Expand out contained markers
		if (this._hasChildCluster) {
			this._hasChildCluster = false;

			for (var j = 0; j < this._markers.length; j++) {
				var m = this._markers[j];
				if (m instanceof L.MarkerCluster) {
					this._group._map.removeLayer(this._markers[j]._marker);
					for (var k = 0; k < m._markers.length; k++) {
						this._markers.push(m._markers[k]);
					}

					this._markers.splice(j, 1);
					j--;
				}
			}
		}

		//Remove existing markers from map
		for (var i = 0; i < this._markers.length; i++) {
			this._group._map.removeLayer(this._markers[i]);
		}


		//TODO: animate creation
		if (!this._marker) {
			var m = new L.Marker(this._latLng, { icon: new L.DivIcon({ innerHTML: this._markers.length, className: 'hax-icon', iconSize: new L.Point(20, 18) }) });
			this._group._map.addLayer(m);
			this._marker = m;
		} else {
			this._marker._icon.innerHTML = this._markers.length;

			if (this._positionChanged) {
				this._positionChanged = false;
				this._marker.setLatLng(this._latLng);
			}
		}

	},

	recalculateCenter: function () {
		//Recalculate min/max X/Y

		var p = this._markers[0].getLatLng();
		this._minLat = this._maxLat = p.lat;
		this._minLng = this._maxLng = p.lng;
		for (var i = 1; i < this._markers.length; i++) {
			this._recalculateCenter(this._group._map.latLngToLayerPoint(this._markers[i].getLatLng()));
		}
		this._positionChanged = false;
	},

	_recalculateCenter: function (b) {
		
		var latChanged = true, lngChanged = true;

		if (b.lat < this._minLat) {
			this._minLat = b.lat;
		} else if (b.lat > this._maxLat) {
			this._maxLat = b.lat;
		} else {
			latChanged = false;
		}

		if (b.lng < this._minLng) {
			this._minLng = b.lng;
		} else if (b.lng > this._maxLng) {
			this._maxLng = b.lng;
		} else {
			lngChanged = false;
		}
		if (latChanged || lngChanged) {
			this._latLng = new L.LatLng((this._minLat + this._maxLat) / 2, (this._minLng + this._maxLng) / 2);
			this.center = this._group._map.latLngToLayerPoint(this._latLng).round();
			this._positionChanged = true;
			//Recalc center
		}
	},
});