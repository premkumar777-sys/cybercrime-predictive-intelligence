import React, {useState} from 'react';
import axios from 'axios';

export default function CreateCase({onCreated, api}){
  const [fraud_type, setFraud] = useState('UPI_FRAUD');
  const [amount, setAmount] = useState(10000);
  const [transaction_time, setTime] = useState(new Date().toISOString().slice(0,16));
  const [destination_account, setDest] = useState('ACC101');

  const submit = async (e)=>{
    e.preventDefault();
    await axios.post(`${api}/cases`,{
      fraud_type,
      amount: Number(amount),
      transaction_time: new Date(transaction_time).toISOString(),
      destination_account
    });
    setTimeout(()=>onCreated && onCreated(),300);
  }

  return (
    <form className="create" onSubmit={submit}>
      <h3>Create Case</h3>
      <label>Fraud Type
        <input value={fraud_type} onChange={e=>setFraud(e.target.value)} />
      </label>
      <label>Amount
        <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} />
      </label>
      <label>Transaction Time
        <input type="datetime-local" value={transaction_time} onChange={e=>setTime(e.target.value)} />
      </label>
      <label>Destination Account
        <input value={destination_account} onChange={e=>setDest(e.target.value)} />
      </label>
      <button type="submit">Create</button>
    </form>
  )
}
