import axios from 'axios'
//创建axios实例
const request=axios.create({
    baseURL:import.meta.env.VITE_API_BASE_URL,
    timeout:5000
})
request.interceptors.request.use(config=>{
    const token=localStorage.getItem('token')
    if(token){
        //如果有 token，就加在请求头 Authorization 里
        config.headers.Authorization=`Bearer ${token}`
    }
    return config
})
request.interceptors.response.use(
    //response是axios完整对象，格式是{data,status,headers,config}
    //把response.data剥离出来，这样在页面里拿到的直接就是后端的json，不用res.data.code，直接res.code
    response=>response.data,
    error => {
        //配合限流
        if (error.response?.status === 429) {
            const msg = error.response.data?.msg || '操作过于频繁，请稍后再试'
            ElMessage.warning(msg)
          }

        //Promise.reject(error) 把错误继续往上传，让页面的 catch 能捕获
        return Promise.reject(error);
      }
)
export default request;