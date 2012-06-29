L.MarkerCluster = L.Marker.extend({
	initialize: function (group, a, b) {
		this._group = group;

		this._markers = [];
		this._childClusters = [];
		this._childCount = 0;

		this._addChild(a);
		if (b) {
			this._addChild(b);
		}
	},

	_baseInit: function () {
		L.Marker.prototype.initialize.call(this, this._latlng, { icon: new L.DivIcon({ innerHTML: this._childCount, className: 'hax-icon', iconSize: new L.Point(20, 18) }) });
	},

	_addChild: function (new1) {
		if (new1 instanceof L.MarkerCluster) {
			this._childClusters.push(new1);
			this._childCount += new1._childCount;
		} else {
			this._markers.push(new1);
			this._childCount++;
		}

		this._expandBounds(new1);
	},

	recursivelyAnimateChildrenIn: function (center, depth) {
		var markers = this._markers,
		    markersLength = markers.length,
		    childClusters = this._childClusters,
		    childClustersLength = childClusters.length;

		for (var i = 0; i < markersLength; i++) {
			var m = markers[i];

			//Only do it if the icon is still on the map
			if (m._icon) {
				//m.setOpacity(0.5); //Hack to see which is which
				m._setPos(center);
				//TODO Scale them down as they move? Fade them as they move?
			}
		}

		if (depth == 1) {
			for (var j = 0; j < childClustersLength; j++) {
				var cm = childClusters[j];
				if (cm._icon) {
					cm._setPos(center);
				}
			}
		} else {
			for (var j = 0; j < childClustersLength; j++) {
				childClusters[j].recursivelyAnimateChildrenIn(center, depth - 1);
			}
		}
	},

	recursivelyAddChildrenToMap: function (startPos, depth) {

		//Add its child markers (at startPos via HACK)
		for (var l = 0; l < this._markers.length; l++) {
			var nm = this._markers[l];
			nm._backupLatlng = nm.getLatLng();

			nm.setLatLng(startPos);
			L.FeatureGroup.prototype.addLayer.call(this._group, nm);
		}

		if (depth == 1) {

			//Add its child clusters at startPos
			for (var k = 0; k < this._childClusters.length; k++) {
				this._childClusters[k].addToMap(startPos);
			}


		} else {
			for (var k = 0; k < this._childClusters.length; k++) {
				this._childClusters[k].recursivelyAddChildrenToMap(startPos, depth - 1);
			}
		}
	},

	//Set our markers position as given and add it to the map (Will create marker if required)
	addToMap: function (startPos) {
		if (startPos) {
			this._backupLatlng = this._latlng;
			this.setLatLng(startPos);
		}
		L.FeatureGroup.prototype.addLayer.call(this._group, this);
	},

	recursivelyRepositionChildren: function (depth) {
		//Fix positions of child markers
		for (var l = 0; l < this._markers.length; l++) {
			var nm = this._markers[l];
			nm.setLatLng(nm._backupLatlng);
			delete nm._backupLatlng;
		}

		if (depth == 1) {
			//Reposition child clusters
			for (var k = 0; k < this._childClusters.length; k++) {
				this._childClusters[k].reposition();
			}
		} else {
			for (var k = 0; k < this._childClusters.length; k++) {
				this._childClusters[k].recursivelyRepositionChildren(depth - 1);
			}
		}
	},

	reposition: function () {
		this.setLatLng(this._backupLatlng);
		delete this._backupLatlng;
	},

	recursivelyRemoveChildrenFromMap: function (depth) {
		//markers
		for (var i = 0; i < this._markers.length; i++) {
			//TODO: animate removing
			L.FeatureGroup.prototype.removeLayer.call(this._group, this._markers[i]);
		}

		if (depth == 1) {
			//child clusters
			for (var j = 0; j < this._childClusters.length; j++) {
				//TODO: animate removing
				L.FeatureGroup.prototype.removeLayer.call(this._group, this._childClusters[j]);
			}
		} else {
			var childClusters = this._childClusters,
			    childClustersLength = childClusters.length;

			for (var j = 0; j < childClustersLength; j++) {
				childClusters[j].recursivelyRemoveChildrenFromMap(depth - 1);
			}
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
			this._latlng = new L.LatLng((this._minLat + this._maxLat) / 2, (this._minLng + this._maxLng) / 2);
			this.center = this._group._map.latLngToLayerPoint(this._latlng).round();
			this._positionChanged = true;
		}
	},
});