import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { CircleMarker } from "react-leaflet";
import React from "react";

// fix icon (marker)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type LatLng = [number, number];

const colors: Record<string, string> = {
  "1": "#76218a",
  "2": "#3a8345",
  "3": "#49fd36",
  "4": "#f80512",
  "5": "#f7bc16",
  "6": "#fc2898",
  "7": "#0e16b2",
  "8": "#83c8f9",
  "9": "#7a644e",
};

type BusStop = {
  id: number;
  position: LatLng;
  name?: string;
};

export default function MapComponent() {
  const [busRoutes, setBusRoutes] = useState<
    { line: LatLng[]; color: string; id: string }[]
  >([]);
  const [busStops, setBusStops] = useState<BusStop[]>([]);

  useEffect(() => {
    // Fetch bus routes for refs 1-9
    const fetchRouteByRef = async (ref: string) => {
      const query = `
        [out:json][timeout:25];
        relation
          ["route"="bus"]
          ["network"="SCMC"]
          ["ref"="${ref}"];
        out body;
        >;
        out skel qt;
      `;

      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      });
      const data = await response.json();

      type OsmNode = {
        type: "node";
        id: number;
        lat: number;
        lon: number;
      };

      type OsmWay = {
        type: "way";
        id: number;
        nodes: number[];
      };

      const elements: (OsmNode | OsmWay)[] = data.elements;
      const nodesMap = new Map<number, LatLng>();
      elements
        .filter((el): el is OsmNode => el.type === "node")
        .forEach((node) => {
          nodesMap.set(node.id, [node.lat, node.lon]);
        });

      const lines = elements
        .filter((el): el is OsmWay => el.type === "way")
        .map((way) =>
          way.nodes
            .map((nodeId) => nodesMap.get(nodeId))
            .filter((coord): coord is LatLng => !!coord)
        );

      return lines.map((line) => ({
        line,
        color: colors[ref],
        id: ref,
      }));
    };

    // Fetch bus stops inside bounding box
    const fetchBusStops = async () => {
      const query = `
        [out:json][timeout:50];
        node
          ["highway"="bus_stop"]
          ["network"="SCMC"]; 

        out body;
      `;

      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      });
      const data = await response.json();

      type OsmNode = {
        type: "node";
        id: number;
        lat: number;
        lon: number;
        tags?: {
          name?: string;
        };
      };

      const stops: BusStop[] = data.elements
        .filter((el: any): el is OsmNode => el.type === "node")
        .map((node: OsmNode) => ({
          id: node.id,
          position: [node.lat, node.lon],
          name: node.tags?.name,
        }));

      setBusStops(stops);
    };

    const fetchAll = async () => {
      const refs = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
      const allRoutes = await Promise.all(refs.map(fetchRouteByRef));
      setBusRoutes(allRoutes.flat());

      await fetchBusStops();
    };

    fetchAll();
  }, []);

  return (
    <div style={{ width: "1000px", height: "1000px" }}>
      <MapContainer
        center={[18.79885, 98.95064]}
        zoom={15}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* วาดเส้นของแต่ละสาย */}
        {busRoutes.map((route, idx) => (
          <Polyline
            key={`${route.id}-${idx}`}
            positions={route.line}
            pathOptions={{ color: route.color, weight: 4 }}
          />
        ))}

        {busStops.map((stop) => (
          <React.Fragment key={stop.id}>
            {/* วงกลมใหญ่ สีทองเหลือง ขอบ */}
            <CircleMarker
              center={stop.position}
              radius={4} // ใหญ่กว่า
              color="#eeb34b" // สีขอบทองเหลือง
              fillColor="#eeb34b" // เติมเต็มสีทองเหลือง
              fillOpacity={1}
              stroke={true}
              weight={3} // ความหนาขอบ
            />
            {/* วงกลมเล็ก สีขาว ตรงกลาง */}
            <CircleMarker
              center={stop.position}
              radius={2.5} // เล็กกว่า
              color="#ffffff" // สีขอบขาว (หรือโปร่งใส)
              fillColor="#ffffff" // เติมเต็มสีขาว
              fillOpacity={1}
              stroke={false} // ไม่มีขอบซ้อนอีกที
            >
              <Popup>{stop.name ?? "ป้ายรถเมล์"}</Popup>
            </CircleMarker>
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
}
