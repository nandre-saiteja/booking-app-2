import { useContext, useState,useEffect } from "react";
 import {differenceInCalendarDays} from "date-fns";
import axios from "axios";
import { Navigate } from "react-router-dom";
import { UserContext } from "./UserContext";

export default function BookingWidget({place}){
    const [checkIn,setCheckIn]=useState('');
    const [checkOut,setCheckOut]=useState('');
    const [numberOfGuests,setNumberOfGuests]=useState(1);
    const [name,setName]=useState('');
    const [phone,setPhone]=useState('');
    const [redirect,setRedirect]=useState('');
    const {user}=useContext(UserContext);
    useEffect(()=>{
        if(user){
            setName(user.name);
        }
    })
    let numberOfDays=0;
    if(checkIn && checkOut){
        numberOfDays=differenceInCalendarDays(new Date(checkOut),new Date(checkIn))
    }
    async function bookThisPlace(){
        
      const response=await axios.post('/bookings',{
        checkIn,checkOut,numberOfGuests,name,phone,
        place:place._id,
        price:numberOfDays*place.price,
    });
    const bookingId=response.data._id;
    setRedirect(`/account/bookings/${bookingId}`);
    }
    if(redirect){
        return <Navigate to={redirect} />
    }
    return (
        <div className="bg-white shadow p-4 rounded-2xl">
                <div className="text-2xl text-center">
                Price: ${place.price} / per night
                </div>
    <div className="border rounded-2xl mt-4">
    <div className="flex">
          
           <div className="   px-4 py-3 ">
                     <label>Check in:</label>
           
                     <input type="date" 
                     value={checkIn} 
                     onChange={ev=>setCheckIn(ev.target.value)}/>
            </div>
            <div className="  px-4 py-3 border-l">
                    <label>Check out:</label>
           
                    <input type="date" 
                    value={checkOut} 
                    onChange={ev=>setCheckOut(ev.target.value)}/>
            </div>
    </div>
    <div>
    <div className="  px-4 py-3 border-t">
                    <label>Number of guests:</label>
                    <input type="number" 
                    value={numberOfGuests} 
                    onChange={ev=>setNumberOfGuests(ev.target.value)}/>
            </div>
           {numberOfDays>0 &&(
            <div className="  px-4 py-3 border-t">
                    <label>Your full name:</label>
                    <input type="text" 
                    value={name} 
                    onChange={ev=>setName(ev.target.value)}/>
                    <label> phone number:</label>
                    <input type="tel" 
                    value={phone} 
                    onChange={ev=>setPhone(ev.target.value)}/>
            </div>
           )}
    </div>
    </div>
           
           
            <button onClick={bookThisPlace} className="primary mt-4">
            Book this place 
            {numberOfDays>0 &&(
                <span>${numberOfDays*place.price}</span>
            )}
            </button>
          </div>
    )
}