import React, { useEffect, useState, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as turf from "@turf/turf";

mapboxgl.accessToken = "pk.eyJ1IjoibWltaS1tYXAiLCJhIjoiY21iemgwNW1uMDdraDJzc2Y3YjVyNDA0YSJ9.0QsED_8gPux1MRlzVFe_6A";

export default function RadioMap() {
  const [stations, setStations] = useState([]);
  const [filter, setFilter] = useState("");
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    fetch("/radio_stations.json")
      .then((res) => res.json())
      .then((data) => setStations(data));
  }, []);

  useEffect(() => {
    if (map.current || stations.length === 0) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [19.1451, 51.9194],
      zoom: 5,
    });

    map.current.on('load', () => {
      map.current.addSource('stations', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: stations.map(s => ({
            type: 'Feature',
            properties: { ...s },
            geometry: { type: 'Point', coordinates: [s.longitude, s.latitude] }
          }))
        },
        cluster: true,
        clusterRadius: 50
      });

      // clusters >=5
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'stations',
        filter: ['all', ['has', 'point_count'], ['>=', ['get', 'point_count'], 5]],
        paint: {
          'circle-color': '#51bbd6',
          'circle-radius': ['step', ['get', 'point_count'], 15, 10, 20, 30, 25]
        }
      });

      // cluster labels
      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'stations',
        filter: ['all', ['has', 'point_count'], ['>=', ['get', 'point_count'], 5]],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 12
        }
      });

      // unclustered and small clusters (<5) as pin
      map.current.loadImage('https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png', (error, image) => {
        if (error) throw error;
        if (!map.current.hasImage('custom-pin')) {
          map.current.addImage('custom-pin', image);
        }
        map.current.addLayer({
          id: 'unclustered-point',
          type: 'symbol',
          source: 'stations',
          filter: ['any', ['!', ['has', 'point_count']], ['all', ['has', 'point_count'], ['<', ['get', 'point_count'], 5]]],
          layout: {
            'icon-image': 'custom-pin',
            'icon-size': 0.5,
            'icon-offset': [0, -15]
          }
        });
      });

      // range source/layers
      map.current.addSource('range-circle', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.current.addLayer({ id: 'range-fill', type: 'fill', source: 'range-circle', paint: { 'fill-color': '#888', 'fill-opacity': 0.2 } });
      map.current.addLayer({ id: 'range-line', type: 'line', source: 'range-circle', paint: { 'line-color': '#555', 'line-width': 2 } });

      // click unclustered
      map.current.on('click', 'unclustered-point', (e) => {
        const feature = e.features[0];
        const props = feature.properties;
        const coords = feature.geometry.coordinates;
        map.current.flyTo({ center: coords, zoom: 12 });
        const circle = turf.circle(coords, props.rangeKm * 1000, { steps: 64, units: 'meters' });
        map.current.getSource('range-circle').setData(circle);
        new mapboxgl.Popup({ offset: 25 })
          .setLngLat(coords)
          .setHTML(`<strong>${props.name}</strong><br/>${props.frequency}`)
          .addTo(map.current);
      });

      // cluster zoom
      map.current.on('click', 'clusters', (e) => {
        const features = map.current.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0].properties.cluster_id;
        map.current.getSource('stations').getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (!err) map.current.easeTo({ center: features[0].geometry.coordinates, zoom });
        });
      });

      // cursor
      map.current.on('mouseenter', 'unclustered-point', () => map.current.getCanvas().style.cursor = 'pointer');
      map.current.on('mouseleave', 'unclustered-point', () => map.current.getCanvas().style.cursor = '');
    });

  }, [stations]);

  const handleSelect = (s) => {
    if (!map.current) return;
    const point = map.current.project([s.longitude, s.latitude]);
    map.current.fire('click', { point, lngLat: { lng: s.longitude, lat: s.latitude } });
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={mapContainer} className="map-container" />
      </div>
      <div style={{ width: '300px', padding: '1rem', overflowY: 'auto', background: '#fff' }}>
        <input
          type="text"
          placeholder="Szukaj..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ width: '100%', marginBottom: '1rem' }}
        />
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {stations
            .filter((s) => s.name.toLowerCase().includes(filter.toLowerCase()))
            .map((station) => (
              <li key={station.id} style={{ cursor: 'pointer', marginBottom: '0.5rem' }} onClick={() => handleSelect(station)}>
                <strong>{station.name}</strong><br/><small>{station.frequency}</small>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}