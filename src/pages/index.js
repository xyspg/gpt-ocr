import React, { useState } from "react";
import Tesseract from "tesseract.js";
import { InboxOutlined } from "@ant-design/icons";
import { message, Upload } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Space, Tooltip } from "antd";
const { Dragger } = Upload;
import { Progress } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import { Card } from "antd";
import { Image } from 'antd';
import { Divider } from 'antd';
import dynamic from 'next/dynamic';
const ImgCrop = dynamic(import('antd-img-crop'), { ssr: false });


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
    const handleImageUpload = async (e) => {
        setOCRProcessing(true);
        console.log(e);
        const image = e.originFileObj;
        const {
            data: { text },
        } = await Tesseract.recognize(image, "eng+chi_sim", {
            logger: (m) => {
                console.log(m);
                setProgress(m.progress);
                setStep(m.status);
            },
        });
        setOCRText(text);
        setOCRCompleted(true);
    };

    function lineWrap(text) {
        const textWithLineBreaks = text
            .split("\n")
            .map((item, index) => <p key={index}>{item}</p>);
        return textWithLineBreaks;
    }

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
    const handleQuestion = async () => {
        setProcessing(true);
        const response = await fetch("https://api.openai.com/v1/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
            },
            body: JSON.stringify({
                prompt: OCRText,
                model: "text-davinci-003",
                max_tokens: 500,
                temperature: 0.5,
            }),
        });
        const data = await response.json();
        console.log(data);
        setAnswer(data.choices[0].text);
        console.log(answer);
        setProcessing(false);
    };
    console.log(answer);
    function isOCROver() {
        if (progress === 1) {
            return null;
        }
        return step;
    }
    function demoImage(src){
        handleImageUpload({originFileObj: src})
    }

    return (
        <>
            <div className="main-layout">
                <div className="upload-main">
                    <ImageUploader />
                    <Card
                        title="OCR 结果"
                        style={{
                            width: "clamp(340px, 40vw, 724px)",
                            marginTop: 10,
                        }}
                    >
                        <div className="OCR-text">{lineWrap(OCRText)}</div>
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
                        disabled={processing || !OCRCompleted}
                    >
                        Ask GPT
                    </Button>
                    {processing ? (
                        <Spin style={{ marginLeft: 10 }} indicator={antIcon} />
                    ) : null}
                    <Card
                        title="GPT返回结果"
                        style={{
                            width: "clamp(340px, 40vw, 724px)",
                            marginTop: 10,
                        }}
                    >
                        <div className="OCR-text">{lineWrap(answer)}</div>
                    </Card>
                </div>
                <Divider />
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

                </div>


            </div>
        </>
    );
};

function Main() {
    return (
        <>
        <OCR />
        </>
    );
}
export default Main;
