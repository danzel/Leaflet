L.MarkerCluster = L.Class.extend({
	initialize: function (group, a, b) {
		this._group = group;

		this._markers = [];
		this._childClusters = [];
		this._childCount = 0;

		this.add(a);
		this.add(b);
	},

	add: function (new1) {
		if (new1 instanceof L.MarkerCluster) {
			this._childClusters.push(new1);
			this._childCount += new1._childCount;
		} else {
			this._markers.push(new1);
			this._childCount++;
		}

		this._expandBounds(new1);
	},

	getLatLng : function() {
		return this._latLng;
	},

	//Make all the markers move to the center point
	startAnimation: function () {
		var markers = this._markers,
			markersLength = markers.length,
			childClusters = this._childClusters,
			childClustersLength = childClusters.length;

		for (var i = 0; i < markersLength; i++) {
			var m = markers[i];

			//Only do it if the icon is still on the map
			if (m._icon) {
				//m.setOpacity(0.5); //Hack to see which is which
				m._setPos(this.center);
				//TODO Scale them down as they move? Fade them as they move?
			}
		}
		for (var j = 0; j < childClustersLength; j++) {
			var cm = childClusters[j]._marker;
			if (cm._icon) {
				cm._setPos(this.center);
			}
		}
	},

	//startPos is optional
	createCluster: function (startPos) {

		//Remove existing markers from map
		for (var i = 0; i < this._markers.length; i++) {
			//TODO: animate removing
			//this._markers[i]._icon.style.opacity = 0.3;
			this._group._map.removeLayer(this._markers[i]);
		}
		//remove existing child clusters
		for (var j = 0; j < this._childClusters.length; j++) {
			//TODO: animate removing
			//this._markers[j]._icon.style.opacity = 0.3;
			this._group._map.removeLayer(this._childClusters[j]._marker);
		}

		//Create our point or update/move as required
		//TODO: animate creation
		if (!this._marker) {
			this._marker = new L.Marker(startPos || this._latLng, { icon: new L.DivIcon({ innerHTML: this._childCount, className: 'hax-icon', iconSize: new L.Point(20, 18) }) });
		} else if (startPos) {
			this._marker.setLatLng(startPos);
		}

		this._group._map.addLayer(this._marker);
		this._marker._icon.innerHTML = this._childCount;
		
		if (startPos) { //To animate it
			console.log(startPos + " -> " + this._latLng);
			var l = this._latLng;
			var m = this._marker;
			setTimeout(function () {
				m.setLatLng(l);
			}, 0);
		}

		if (this._positionChanged) {
			this._positionChanged = false;
			this._marker.setLatLng(this._latLng);
		}
	},

	recalculateCenter: function () {
		//Recalculate min/max X/Y

		this._hasBounds = false;
		for (var i = 0; i < this._markers.length; i++) {
			this._expandBounds(this._markers[i]);
		}
		for (var j = 0; j < this._childClusters.length; j++) {
			this._expandBounds(this._childClusters[j]);
		}
		this._positionChanged = false;
	},

	_expandBounds: function (marker) {
		var minLatLng = marker.getLatLng(),
			maxLatLng = marker.getLatLng();

		if (marker instanceof L.MarkerCluster) {
			minLatLng = new L.LatLng(marker._minLat, marker._minLng);
			maxLatLng = new L.LatLng(marker._maxLat, marker._maxLng);
		}

		var boundsChanged = false;

		if (!this._hasBounds) {
			this._minLat = minLatLng.lat;
			this._maxLat = maxLatLng.lat;
			this._minLng = minLatLng.lng;
			this._maxLng = maxLatLng.lng;
			this._hasBounds = true;
			boundsChanged = true;
		}
		else {
			if (minLatLng.lat < this._minLat) {
				this._minLat = minLatLng.lat;
				boundsChanged = true;
			}
			if (maxLatLng.lat > this._maxLat) {
				this._maxLat = maxLatLng.lat;
				boundsChanged = true;
			}

			if (minLatLng.lng < this._minLng) {
				this._minLng = minLatLng.lng;
				boundsChanged = true;
			}
			if (maxLatLng.lng > this._maxLng) {
				this._maxLng = maxLatLng.lng;
				boundsChanged = true;
			}
		}

		if (boundsChanged) {
			//Recalc center
			this._latLng = new L.LatLng((this._minLat + this._maxLat) / 2, (this._minLng + this._maxLng) / 2);
			this.center = this._group._map.latLngToLayerPoint(this._latLng).round();
			this._positionChanged = true;
		}
	},
});