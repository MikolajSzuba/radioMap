/*  RadioMap.jsx – jedno-popupowe wydanie
    • zawsze TYLKO jeden popup na mapie
      (przechowujemy referencję, usuwamy poprzedni przed utworzeniem nowego)
    • panel boczny, filtrowanie, zasięg – bez zmian z poprzedniej wersji
*/

import React, { useEffect, useState, useRef, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as turf from "@turf/turf";

/* — Mapbox token — */
mapboxgl.accessToken =
  "pk.eyJ1IjoibWltaS1tYXAiLCJhIjoiY21iemgwNW1uMDdraDJzc2Y3YjVyNDA0YSJ9.0QsED_8gPux1MRlzVFe_6A";

export default function RadioMap() {
  /* ─────────── STATE & REFS ─────────── */
  const [masts, setMasts]   = useState([]);
  const [filter, setFilter] = useState("");
  const [open,  setOpen]    = useState(new Set());
  const [sel,   setSel]     = useState(null);   // zaznaczenie {locality,name|null}
  const mapRef              = useRef(null);
  const mapDiv              = useRef(null);
  const popupRef            = useRef(null);     // ← referencja do aktualnego popupu

  /* ─────────── FETCH JSON ─────────── */
  useEffect(() => {
    fetch("/radio_stations.json")
      .then(r => r.json())
      .then(setMasts)
      .catch(console.error);
  }, []);

  /* ─────────── AGGREGACJA ─────────── */
  const fullPlaces = useMemo(() => {
    const d = new Map();
    masts.forEach((m) => {
      const key = m.locality || "Nieznana";
      const e   = d.get(key) ?? {
        locality: key,
        lat     : m.latitude,
        lng     : m.longitude,
        rangeKm : 0,
        stations: [],
      };
      e.stations.push(...m.stations);
      e.rangeKm = Math.max(e.rangeKm, m.rangeKm || 0);
      d.set(key, e);
    });
    return [...d.values()];
  }, [masts]);

  /* ─────────── FILTR ─────────── */
  const places = useMemo(() => {
    if (!filter) return fullPlaces;
    const q = filter.toLowerCase();
    return fullPlaces
      .map(p => {
        const hitLoc = p.locality.toLowerCase().includes(q);
        const hitSt  = p.stations.filter(s => s.name.toLowerCase().includes(q));
        if (hitLoc) return p;
        return hitSt.length ? { ...p, stations: hitSt } : null;
      })
      .filter(Boolean);
  }, [filter, fullPlaces]);

  useEffect(() => {
    if (filter) setOpen(new Set(places.map(p => p.locality)));
  }, [filter, places]);

  /* ─────────── MAPA ─────────── */
  useEffect(() => {
    if (mapRef.current || masts.length === 0) return;

    const map = new mapboxgl.Map({
      container: mapDiv.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [19.1451, 51.9194],
      zoom: 5,
    });
    mapRef.current = map;

    map.on("load", () => {
      map.addSource("masts", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: masts.map(m => ({
            type: "Feature",
            properties: {
              locality: m.locality,
              rangeKm : m.rangeKm,
              label   : JSON.stringify(m.stations),
            },
            geometry: { type: "Point", coordinates: [m.longitude, m.latitude] },
          })),
        },
        cluster: true,
        clusterRadius: 50,
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "masts",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#3AB0FF",
          "circle-radius": ["step", ["get", "point_count"], 12, 10, 18, 30, 24],
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "masts",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 12,
          "text-font": ["DIN Offc Pro Medium"],
        },
        paint: { "text-color": "#fff" },
      });

      map.loadImage("https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png",
        (err, img) => {
          if (err) throw err;
          if (!map.hasImage("pin")) map.addImage("pin", img);
          map.addLayer({
            id: "unclustered",
            type: "symbol",
            source: "masts",
            filter: ["!", ["has", "point_count"]],
            layout: { "icon-image": "pin", "icon-size": 0.55 },
          });
        });

      map.addSource("range", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "range-fill", type: "fill", source: "range",
        paint: { "fill-color": "#33C8FF", "fill-opacity": 0.18 } });
      map.addLayer({ id: "range-line", type: "line", source: "range",
        paint: { "line-color": "#33C8FF", "line-width": 2 } });

      map.on("click", "unclustered", (e) => {
        const f = e.features[0];
        showPopup({
          lng      : f.geometry.coordinates[0],
          lat      : f.geometry.coordinates[1],
          locality : f.properties.locality,
          rangeKm  : f.properties.rangeKm,
          stations : JSON.parse(f.properties.label),
        });
      });
      map.on("click", "clusters", (e) => {
        const c = map.queryRenderedFeatures(e.point, { layers: ["clusters"] })[0];
        map.getSource("masts").getClusterExpansionZoom(
          c.properties.cluster_id,
          (_, z) => map.easeTo({ center: c.geometry.coordinates, zoom: z })
        );
      });
    });
  }, [masts]);

  /* ─────────── POPUP helper (jedno na raz) ─────────── */
  const showPopup = ({ lng, lat, locality, rangeKm, stations }) => {
    const map = mapRef.current;

    /* 1. usuń poprzedni popup */
    if (popupRef.current) popupRef.current.remove();

    /* 2. okrąg zasięgu */
    map.getSource("range").setData(
      rangeKm
        ? turf.circle([lng, lat], rangeKm * 1000, { steps: 64, units: "meters" })
        : { type: "FeatureCollection", features: [] }
    );

    /* 3. nowy popup */
    const html = stations
      .map((s) => `<li>${s.name} (${s.freq})</li>`)
      .join("");
    popupRef.current = new mapboxgl.Popup({ offset: 25, closeButton: false })
      .setLngLat([lng, lat])
      .setHTML(
        `<strong>${locality}</strong><br>` +
          (rangeKm ? `Zasięg ≈ ${rangeKm} km<br>` : "") +
          `<ul style="margin:4px 0 0 16px">${html}</ul>`
      )
      .addTo(map);

    map.flyTo({ center: [lng, lat], zoom: 11 });
  };

  /* ─────────── RENDER ─────────── */
  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* mapa */}
      <div ref={mapDiv} style={{ flex: 1 }} />

      {/* PASEK BOCZNY (stylistyka jak wcześniej) */}
      <aside
        style={{
          width: 340,
          padding: "18px 20px",
          background: "#fff",
          borderLeft: "1px solid #e7e7e7",
          boxShadow: "0 0 32px rgba(0,0,0,.05)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="🔍 Szukaj miejscowości lub stacji"
          style={{
            width: "100%",
            padding: "10px 14px",
            fontSize: 14,
            borderRadius: 10,
            border: "1px solid #d0d0d0",
            marginBottom: 20,
          }}
        />

        <ul style={{ listStyle: "none", padding: 0, margin: 0, flex: 1, overflowY: "auto" }}>
          {places.map((p) => (
            <li key={p.locality} style={{ marginBottom: 14 }}>
              {/* locality row */}
              <button
                onClick={() => {
                  const n = new Set(open);
                  n.has(p.locality) ? n.delete(p.locality) : n.add(p.locality);
                  setOpen(n);
                  setSel({ locality: p.locality, name: null });
                  showPopup({ ...p, lng: p.lng, lat: p.lat });
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "transparent",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: "pointer",
                  color: sel?.locality === p.locality && !sel?.name ? "#0077ff" : "#111",
                }}
              >
                <span>{p.locality}</span>
                <span style={{ fontSize: 13, color: "#666" }}>
                  {open.has(p.locality) ? "▲" : "▼"}
                </span>
              </button>

              {open.has(p.locality) && (
                <ul style={{ listStyle: "none", margin: "6px 0 0", padding: 0 }}>
                  {p.stations.map((s, i) => {
                    const active = sel?.locality === p.locality && sel?.name === s.name;
                    return (
                      <li
                        key={i}
                        onClick={() => {
                          setSel({ locality: p.locality, name: s.name });
                          showPopup({ ...p, lng: p.lng, lat: p.lat });
                        }}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 12px",
                          marginBottom: 4,
                          fontSize: 14,
                          borderRadius: 8,
                          cursor: "pointer",
                          background: active ? "#EAF4FF" : "transparent",
                        }}
                      >
                        <span>{s.name}</span>
                        <span style={{ color: "#666" }}>{s.freq}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
