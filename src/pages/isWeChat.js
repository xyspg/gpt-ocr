import React, {useEffect, useState} from "react";

const isWeixin = () => {
    const ua = window.navigator.userAgent.toLowerCase();
    return ua.match(/MicroMessenger/i) === "micromessenger";
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
