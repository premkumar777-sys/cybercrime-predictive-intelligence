import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { scorePercent } from "@/lib/api";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function LiveMap({ prediction, locations }: { prediction: any, locations: any[] }) {
  if (!prediction) return null;
  
  return (
    <MapContainer center={[12.9716, 77.5946]} zoom={13} style={{ height: "100%", width: "100%", minHeight: "350px" }}>
      <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {prediction.predictions.map((item: any) => {
        const loc = locations.find(l => l.location_id === item.location_id);
        if (!loc) return null;
        return (
          <Marker key={loc.location_id} position={[loc.latitude, loc.longitude]}>
            <Popup>
              <strong>#{item.rank} {loc.name}</strong><br/>
              Risk Score: {scorePercent(item.risk_score)}<br/>
              {item.explanation.join(", ")}
            </Popup>
          </Marker>
        );
      })}
      {prediction.predictions.map((item: any) => {
        const loc = locations.find(l => l.location_id === item.location_id);
        if (!loc) return null;
        return (
          <Circle key={`circle-${loc.location_id}`} center={[loc.latitude, loc.longitude]} pathOptions={{ color: item.rank === 1 ? 'red' : 'blue', fillColor: item.rank === 1 ? 'red' : 'blue' }} radius={item.risk_score * 1000} />
        );
      })}
    </MapContainer>
  );
}
