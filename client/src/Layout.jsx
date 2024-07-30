import Head from "./Head";
import { Outlet } from "react-router-dom";

export default function Layout(){
    return(
        <div className="py-4 px-8 flex flex-col min-h-screen">
            <Head />
            <Outlet />
        </div>
    );
}