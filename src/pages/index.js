import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Tesseract, { createWorker } from "tesseract.js";
import {
  InboxOutlined,
  LoadingOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Divider,
  Image,
  Input,
  Progress,
  Spin,
  Upload,
} from "antd";
import dynamic from "next/dynamic";
import worker from "tesseract.js";

const ImgCrop = dynamic(import("antd-img-crop"), { ssr: false });
const { TextArea } = Input;
const { Dragger } = Upload;
const onClose = (e) => {
  console.log(e, "I was closed.");
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
  const [value, setValue] = useState("");
  const textAreaRef = useRef(null);
  useEffect(() => {
    textAreaRef.current.focus();
  }, []);
  useEffect(() => {
    const startOCR = async () => {
      const { createWorker } = require("tesseract.js");
      const worker = await createWorker({
        logger: (m) => {
          console.log(m);
          setProgress(m.progress);
          setStep(m.status);
        },
      });
      await worker.loadLanguage("eng+chi_sim");
      await worker.initialize("eng+chi_sim");
      console.log("OCR engine initialized!");
    };
    startOCR();
  }, []);
  const handleOk = () => {
    setIsModalOpen(false);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  // 上传图片并使用 Tesseract.js 进行 OCR

  const handleImageUpload = async (e) => {
    const image = e.originFileObj;
    setOCRProcessing(true);
    await (async () => {
      const {
        data: { text },
      } = await worker.recognize(image, "eng+chi_sim", {
        logger: (m) => {
          setProgress(m.progress);
          setStep(m.status);
        },
      });
      console.log(text);
      setOCRText(text);
    })();

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
        messages: [{ role: "user", content: OCRText }],
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
  function demoImage(src) {
    handleImageUpload({ originFileObj: src });
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      handleQuestion();
      event.preventDefault();
    }
  }

  return (
    <>
      <Head>
        <title>ChatOCR</title>
        <meta
          name="description"
          content="Recognize text from image and ask ChatGPT"
        />
      </Head>
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

        <div className="copyright">
          <p>
            Powered by OpenAI and Next.js. View it on
            <a
              href="https://github.com/xyspg/gpt-ocr"
              target="_blank"
              rel="noreferrer"
            >
              {" "}
              Github
            </a>
            .
          </p>
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
        message="自2023年3月3日起，中国大陆封锁了 OpenAI 相关服务的访问，故本网站在大陆地区可能无法正常使用。"
        type="warning"
        closable
        onClose={onClose}
      />
      <OCR />
    </>
  );
}

export default Main;
