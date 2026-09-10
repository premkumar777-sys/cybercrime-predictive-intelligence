import React, {useEffect, useState} from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function CaseDetails({caseId, api}){
  const [caseData, setCaseData] = useState(null);
  const [pred, setPred] = useState(null);
  const [locations, setLocations] = useState([]);

  useEffect(()=>{
    const load = async ()=>{
      const res = await axios.get(`${api}/cases/${caseId}`);
      setCaseData(res.data);
      try{
        const r2 = await axios.get(`${api}/cases/${caseId}/predictions`);
        setPred(r2.data);
      }catch(e){
        setPred(null);
      }
      const locs = await axios.get(`${api}/locations`);
      setLocations(locs.data);
    }
    load();
  },[caseId]);

  const analyze = async ()=>{
    const r = await axios.post(`${api}/cases/${caseId}/analyze`);
    setPred(r.data);
  }

  return (
    <div className="detail">
      <h2>{caseId}</h2>
      {caseData && (
        <div className="caseinfo">
          <div><strong>Fraud</strong>: {caseData.fraud_type}</div>
          <div><strong>Amount</strong>: {caseData.amount}</div>
          <div><strong>Destination</strong>: {caseData.destination_account}</div>
          <div><strong>Status</strong>: {caseData.status}</div>
        </div>
      )}

      <div className="actions">
        <button onClick={analyze}>Analyze Case</button>
      </div>

      {pred && (
        <div className="predictions">
          <h3>Risk Level: {pred.risk_level}</h3>
          <ol>
            {pred.predictions.map(p=> (
              <li key={p.location_id}>
                <div className="pmeta">{p.location_name} — {p.risk_score} — {p.time_window}</div>
                <ul>
                  {p.explanation.map((e,i)=> <li key={i}>{e}</li>)}
                </ul>
              </li>
            ))}
          </ol>

          <div className="mapwrap">
            <MapContainer center={[12.9716,77.5946]} zoom={13} style={{height:300}}>
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {pred.predictions.map(p=>{
                const loc = locations.find(l=>l.location_id===p.location_id);
                if(!loc) return null;
                return (
                  <Marker key={p.location_id} position={[loc.latitude, loc.longitude]}>
                    <Popup>
                      <div><strong>{loc.name}</strong></div>
                      <div>Risk: {p.risk_score}</div>
                      <div>Rank: {p.rank}</div>
                      <div>{p.time_window}</div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          </div>
        </div>
      )}

    </div>
  )
}
