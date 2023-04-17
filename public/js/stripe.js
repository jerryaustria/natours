/* eslint-disable */
import axios  from 'axios';
import { showAlert } from "./alert";

const stripe = Stripe('pk_test_51Mwfk9DufsejNW6Ff9aW1joaHWaMDua11sUh98f5JFyRd5djz1TisLHViJHrR6lBQwKA86ir2aHM0j4FB6WEb0qJ00PWaMJADV');

export const bookTour = async tourId =>{
//1 get the checkout session from API server
try{
    // const session = await axios(`http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`);
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    await stripe.redirectToCheckout({
        sessionId: session.data.session.id
    });
}catch(Er){
    //console.log(err);
    showAlert('error', err);
}
//2 Create checkout form + charge creadit card


}