import React, { useEffect, useRef, useState } from "react";
import worker, { createWorker } from "tesseract.js";
import {
  InboxOutlined,
  LoadingOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Card, Input, Progress, Spin, Upload } from "antd";
import dynamic from "next/dynamic";
import mdKatex from "markdown-it-katex";
import mdHighlight from "markdown-it-highlightjs";
import Head from "next/head";
import Script from "next/script";

const ImgCrop = dynamic(import("antd-img-crop"), { ssr: false });
const { TextArea } = Input;
const { Dragger } = Upload;

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

  // 上传图片组件
  const ImageUploader = () => (
    <Dragger {...props}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">点击拍照或将截图拖拽至此以上传</p>
      <p className="ant-upload-hint">支持中文 / 英文识别，请正对题目拍摄</p>
    </Dragger>
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
  const [conversation, setConversation] = useState([
    { role: "system", content: "You are a helpful assistant." },
  ]);
  const handleQuestion = async () => {
    setProcessing(true);
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      },
      body: JSON.stringify({
        messages: conversation.concat({ role: "user", content: OCRText }),
        model: "gpt-3.5-turbo",
      }),
    });
    console.log(conversation.concat({ role: "user", content: OCRText }));
    const data = await response.json();
    const newAnswer = data.choices[0].message.content;
    const newConversation = [
      ...conversation,
      { role: "user", content: OCRText },
      { role: "assistant", content: newAnswer },
    ];
    setConversation(newConversation);
    setAnswer(newAnswer);
    setProcessing(false);
  };

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

  const md = require("markdown-it")().use(mdKatex).use(mdHighlight);
  const prettyAnswer = md.render(answer);
  return (
    <>
      <Script src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></Script>
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
            <div
              className="OCR-text"
              dangerouslySetInnerHTML={{ __html: prettyAnswer }}
            ></div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default OCR;
