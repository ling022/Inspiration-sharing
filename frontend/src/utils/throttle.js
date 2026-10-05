export function throttle(fn,interval=200){
    let last=200
    return function(...args){
        const now=Date.now()
        if(now-last >=interval){
            last=now
            fn.apply(this,args)
        }
    }
}