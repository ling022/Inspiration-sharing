import {io} from 'socket.io-client'
let socket=null
export function connectSocket(){
    const token =localStorage.getItem('token')
    if(!token) return null
    //已建立连接就不重复建立
    if(socket && socket.connected) return socket
    socket=io('http://localhost:3000',{
        auth:{token},//把token发过去鉴权
        transports:['websocket'],//优先websocket
        reconnection:true,//自动重连
        reconnectionDelay:1000
    })
    socket.on('connect',()=>{
        console.log('websocket已连接')
    })
    socket.on('disconnect',()=>{
        console.log('websocket已断开')
    })
    socket.on('connect_error',(err)=>{
        console.log('websocket连接失败',err.message)
    })
    return socket
}
export function getSocket(){
   // 不重连，只拿实例
    return socket
}
export function disconnectSocket(){
    if(socket){
        socket.disconnect()
        socket=null
    }
}