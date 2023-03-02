import React, { useState,useEffect,useRef } from "react";
import Tesseract from "tesseract.js";
import { InboxOutlined } from "@ant-design/icons";
import { message, Upload } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Space, Tooltip } from "antd";
import { Progress } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import { Alert } from 'antd';
import { Card } from "antd";
import { Image } from 'antd';
import { Divider } from 'antd';
import { Modal } from 'antd';
import dynamic from 'next/dynamic';
import IsWeiXin from "@/pages/isWeChat";
import { Input } from 'antd';
import footer from "@/components/footer";
import Footer from "@/components/footer";
const ImgCrop = dynamic(import('antd-img-crop'), { ssr: false });
const { TextArea } = Input;
const { Dragger } = Upload;
const onClose = (e) => {
    console.log(e, 'I was closed.');
};
const antIcon = (
    <LoadingOutlined
        style={{
            fontSize: 24,
        }}
        spin
    />
);

const OCR = () => {
    const [OCRText, setOCRText] = useState("");
    const [answer, setAnswer] = useState("");
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [step, setStep] = useState("");
    const [OCRProcessing, setOCRProcessing] = useState(false);
    const [OCRCompleted, setOCRCompleted] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [value, setValue] = useState('');
    const textAreaRef = useRef(null);
    useEffect(() => {
        textAreaRef.current.focus();
    }, []);

    const handleOk = () => {
        setIsModalOpen(false);
    };
    const handleCancel = () => {
        setIsModalOpen(false);
    };
    // 上传图片并使用 Tesseract.js 进行 OCR
    const handleImageUpload = async (e) => {
        setOCRProcessing(true);
        console.log(e);
        const image = e.originFileObj;
        const {
            data: { text },
        } = await Tesseract.recognize(image, "eng+chi_sim+jpn", {
            logger: (m) => {
                console.log(m);
                setProgress(m.progress);
                setStep(m.status);
            },
        });
        setOCRText(text);
        setOCRCompleted(true);
    };
    // 将json返回的 /n 换行符转换为 <p> 标签
    function lineWrap(text) {
        const textWithLineBreaks = text
            .split("\n")
            .map((item, index) => <p key={index}>{item}</p>);
        return textWithLineBreaks;
    }

    // 上传图片组件
    const ImageUploader = () => (
/*
        <ImgCrop
            aspect={2}
        >
*/

        <Dragger {...props}>
            <p className="ant-upload-drag-icon">
                <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击拍照或将截图拖拽至此以上传</p>
            <p className="ant-upload-hint">支持中文 / 英文识别，请正对题目拍摄</p>
        </Dragger>

        // </ImgCrop>


    );
    const props = {
        name: "file",
        multiple: false,
        onChange: (info) => handleImageUpload(info.file),
        onDrop(e) {
            console.log("Dropped files", e.dataTransfer.files);
        },
    };
    // 使用 OpenAI GPT-3 进行问答
    // API Key 存储于环境变量中


    const handleQuestion = async () => {
        setProcessing(true);
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
            },
            body: JSON.stringify({
                messages: [{role: "user", content: OCRText}],
                model: "gpt-3.5-turbo",
            }),
        });
        const data = await response.json();
       setAnswer(data.choices[0].message.content);
        // setAnswer(data.choices[0].message);
        setProcessing(false);
    };
    console.log(answer);

    // 判断 OCR 进度
    function isOCROver() {
        if (progress === 1) {
            return null;
        }
        return step;
    }
    //示例图片
    function demoImage(src){
        handleImageUpload({originFileObj: src})
    }
    function handleKeyDown(event){
        if(event.key === 'Enter'){
            handleQuestion();
            event.preventDefault()
        }
    }
    return (
        <>
            <div className="main-layout">
                <div className="upload-main">
                    <ImageUploader />
                    <Card
                        title="查看 OCR 结果或直接输入问题"
                        style={{
                            width: "clamp(340px, 48vw, 724px)",
                            marginTop: 10,
                        }}
                    >
                        <TextArea
                            className="OCR-text"
                            value={OCRText}
                            onChange={(event) => setOCRText(event.target.value)}
                            onKeyDown={handleKeyDown}
                            ref={textAreaRef}
                            autoSize={{
                                minRows: 2,
                                maxRows: 6,
                            }}
                            />
                    </Card>
                    <div
                        style={{
                            width: 300,
                        }}
                    >
                        <span className="status">{isOCROver()}</span>
                        {OCRProcessing ? <Progress percent={progress * 100} /> : null}
                    </div>
                </div>
                <div className="response-main">
                    <Button
                        type="primary"
                        icon={<SearchOutlined />}
                        onClick={handleQuestion}
                        disabled={(processing || !OCRCompleted) && OCRText.length === 0}
                    >
                        Ask GPT
                    </Button>
                    {processing ? (
                        <Spin style={{ marginLeft: 10 }} indicator={antIcon} />
                    ) : null}
                    <Card
                        title="GPT返回结果"
                        style={{
                            width: "clamp(340px, 48vw, 724px)",
                            marginTop: 10,
                        }}
                    >
                        <div className="OCR-text">{lineWrap(answer)}</div>
                    </Card>
                </div>
                <Divider />
                {/*示例图片*/}
                <span className='OCR-text demo-text'> Try Demo:</span>
                <div className='demo'>
                    <div className='demo-content'>
                        <Image
                            width={'clamp(340px, 40vw, 724px)'}
                            style={{marginBottom: 10}}
                            src='/chem.png'
                        />
                        <Button onClick={() => demoImage('/chem.png')}>化学会考</Button>
                    </div>
                    <div className='demo-content'>
                        <Image
                            width={'clamp(320px, 20vw, 424px)'}
                            style={{marginBottom: 10}}
                            src='/cs.png'
                        />
                        <Button onClick={() => demoImage('/cs.png')}>AP Computer Science</Button>
                    </div>
                    <br />
                </div>
                <div className='copyright'>
                    <p>Powered by OpenAI and Next.js. View it on
                        <a
                            href='https://github.com/xyspg/gpt-ocr'
                            target='_blank'
                            rel="noreferrer"
                    > Github</a>.</p>
                </div>

            </div>
        </>
    );
};

/*
function WeChatDetector(){
    const isWeiXin = IsWeiXin();
    return (
        <div>
            {isWeiXin ?
                        <div>
                            您似乎正处于微信内置浏览器中<br />请点击右上角使用系统自带浏览器打开此网页
                        </div>
                : null}
        </div>
    );
}

 */


function Main() {
    return (
        <>
            <Alert

                message="回答内容仅供参考。请在系统浏览器内访问本页面"
                type="info"
                closable
                onClose={onClose}
            />
        <OCR />
        </>
    );
}
export default Main;
