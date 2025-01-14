import React from "react";

const Messages =((props)=>{

    return (
        <div className="divContainer">
            <div className="userList">
                <b style={{textDecorationLine:'underline'}}><i>Active-Users:</i></b><br/><br />
                {props.users.map((user,idx)=>(
                    <div key={idx}>{user}</div>
                ))}
            </div>
            <div className="container" >
                    {props.messages.map((data, index) => (
                    <div key={index} className={`msg ${data.position}`}>
                        <b>{data.user}</b>: {data.message}
                    </div>
                ))}
            </div>
        </div>
    );
})
export default Messages;