import React from "react";

interface NotFoundProps{
    message?: string;
}

const NotFound: React.FC<NotFoundProps> = ({
    message = "Page not found"
}) => {
    return(
        <div>
            <div>
                <h1>{message}</h1>
            </div>
        </div>
    )
}

export default NotFound;