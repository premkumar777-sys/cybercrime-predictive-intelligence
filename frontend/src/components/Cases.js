import React from 'react';

export default function Cases({cases, onSelect}){
  return (
    <div className="cases">
      <h3>Cases</h3>
      <ul>
        {cases.map(c=> (
          <li key={c.case_id} onClick={()=>onSelect(c.case_id)}>
            <div className="cid">{c.case_id}</div>
            <div className="meta">{c.fraud_type} • {new Date(c.created_at).toLocaleString()}</div>
            <div className={`status ${c.status.toLowerCase()}`}>{c.status}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
