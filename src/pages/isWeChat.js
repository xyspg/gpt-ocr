import React, {useEffect, useState} from "react";

const isWeixin = () => {
    let ua = navigator.userAgent.toLowerCase();
    if(ua.match(/MicroMessenger/i)=="micromessenger") {
        return true;
    } else {
        return false;
    }
};

const WeixinDetector = () => {
    const [inWeixin, setInWeixin] = useState(false);

    useEffect(() => {
        setInWeixin(isWeixin());
    }, []);

    {inWeixin ? (
        <div className='master-warning'>
            <p>
                您似乎正处于微信内置浏览器中<br />请点击右上角使用系统自带浏览器打开此网页
            </p>
        </div>
    )
        : null}

};

export default WeixinDetector;
