import React from "react";
import { useNavigate } from "react-router-dom";

interface HomePageProps {
    title?: string;
}
const HomePage: React.FC<HomePageProps> = ({
    title = "Game App"
}) =>{
    const navigate = useNavigate();

    return(
        <div>
            <div>
                <header>
                    <h1>{title}</h1>
                </header>
            </div>
            <div>
                <button onClick={() => navigate("/game")}>Game</button>
            </div>
        </div>
    )
};

export default HomePage;