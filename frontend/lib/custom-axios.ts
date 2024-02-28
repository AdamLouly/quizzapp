/* import axios, {AxiosStatic} from 'axios';
import {useSession} from "next-auth/react";

// Function to retrieve the JWT from storage; implementation depends on where you store the token
// Function to retrieve the JWT from storage; implementation depends on where you store the token
function getJwtToken(): string | null {
    const { data: session } = useSession();
    const jwtToken = session?.user?.jwtToken; // Adjust the property name as per your actual structure
    return jwtToken;
}

// Create an Axios instance with the JWT token included in the headers
const axiosInstance = axios.create({
    // Configuration
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 8000,
    headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${getJwtToken()}` // Include the JWT token in the headers
    },
});

export default axiosInstance;


 */