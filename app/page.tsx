"use server";
import { LoginButton, LogoutButton } from "@/components/LoginLogout";
import FunctionCards from "@/components/FunctionCards";
import { checkLoggedIn } from "@/lib";
import { cookies } from "next/headers";

const Home: React.FC = async () => {
    const isLoggedIn = (await checkLoggedIn()) || false;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <h1 className="text-4xl font-bold">Welcome</h1>
            {isLoggedIn ? <LogoutButton /> : <LoginButton />}

            <br />
            <FunctionCards />
        </div>
    );
};

export default Home;
