import { Routes, Route } from "react-router-dom"
import Login from "@/pages/auth/login"
 import Register from "@/pages/auth/register"
import ForgotPassword from "@/pages/auth/ForgotPassword"
import Home from "@/pages/home/home"
import PrivateRoutes from "./privateRoutes"



const AppRoutes = () => {
    return (
        <Routes>
            <Route element={<PrivateRoutes/>}>
                <Route path="/" element={<Home />} />
            </Route>

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
             <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
    )
}

export default AppRoutes;
