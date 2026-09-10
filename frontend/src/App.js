import React, {useEffect, useState} from 'react';
import axios from 'axios';
import Cases from './components/Cases';
import CreateCase from './components/CreateCase';
import CaseDetails from './components/CaseDetails';
import './App.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App(){
  const [cases, setCases] = useState([]);
  const [selected, setSelected] = useState(null);

  const loadCases = async ()=>{
    const res = await axios.get(`${API}/cases`);
    setCases(res.data);
  }

  useEffect(()=>{loadCases()},[]);

  return (
    <div className="app">
      <header className="top">Cybercrime Predictive Intelligence</header>
      <div className="container">
        <div className="col left">
          <CreateCase onCreated={loadCases} api={API} />
          <Cases cases={cases} onSelect={setSelected} />
        </div>
        <div className="col right">
          {selected ? <CaseDetails caseId={selected} api={API} /> : <div className="placeholder">Select a case to view details</div>}
        </div>
      </div>
    </div>
  )
}

export default App;
