L.MarkerCluster = L.Class.extend({
	initialize: function (group, a, b) {
		this._group = group;

		this._markers = [a, b];

		this._expandBounds(a);
		this._expandBounds(b);

		if (a instanceof L.MarkerCluster || b instanceof L.MarkerCluster) {
			this._hasChildCluster = true;
		}
	},

	add: function (new1) {
		this._markers.push(new1);
		this._expandBounds(new1);

		if (new1 instanceof L.MarkerCluster) {
			this._hasChildCluster = true;
		}
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
			} else if (m._marker) {
				m._marker._setPos(this.center);
			}
		}
	},

	//startPos is optional
	createCluster: function (startPos) {

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
			//TODO: animate removing
			//this._markers[i]._icon.style.opacity = 0.3;
			this._group._map.removeLayer(this._markers[i]);
		}


		//Create our point or update/move as required
		//TODO: animate creation
		if (!this._marker) {
			var m = new L.Marker(startPos || this._latLng, { icon: new L.DivIcon({ innerHTML: this._markers.length, className: 'hax-icon', iconSize: new L.Point(20, 18) }) });
			this._group._map.addLayer(m);
			if (startPos) { //To animate it
				console.log(startPos + " -> " + this._latLng);
				var l = this._latLng;
				setTimeout(function () {
					m.setLatLng(l);
				}, 0);
			}
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

		this._hasBounds = false;
		for (var i = 0; i < this._markers.length; i++) {
			this._expandBounds(this._markers[i]);
		}
		this._positionChanged = false;
	},

	_expandBounds: function (marker) {
		if (marker instanceof L.MarkerCluster) {
			for (var i = 0; i < marker._markers.length; i++) {
				this._expandBounds(marker._markers[i]);
			}
			return;
		}

		var latLng = marker.getLatLng();

		var latChanged = true, lngChanged = true;

		if (!this._hasBounds) {
			this._minLat = this._maxLat = latLng.lat;
			this._minLng = this._maxLng = latLng.lng;
			this._hasBounds = true;
		}
		else {
			if (latLng.lat < this._minLat) {
				this._minLat = latLng.lat;
			} else if (latLng.lat > this._maxLat) {
				this._maxLat = latLng.lat;
			} else {
				latChanged = false;
			}

			if (latLng.lng < this._minLng) {
				this._minLng = latLng.lng;
			} else if (latLng.lng > this._maxLng) {
				this._maxLng = latLng.lng;
			} else {
				lngChanged = false;
			}
		}

		if (latChanged || lngChanged) {
			//Recalc center
			this._latLng = new L.LatLng((this._minLat + this._maxLat) / 2, (this._minLng + this._maxLng) / 2);
			this.center = this._group._map.latLngToLayerPoint(this._latLng).round();
			this._positionChanged = true;
		}
	},
});