import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// fix icon (marker)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapComponent() {
  return (
    <div style={{ width: "800px", height: "500px" }}>
      <MapContainer
        center={[18.79885, 98.95064]}
        zoom={16}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[18.79885, 98.95064]}>
          <Popup>พิกัดที่คุณต้องการ</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
