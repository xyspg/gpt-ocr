import React from "react";
import { Alert } from "antd";
import Footer from "@/components/Footer";
import Interface from "@/components/Interface";
import Head from "next/head";

const onClose = (e) => {
  console.log(e, "I was closed.");
};

function Main() {
  return (
    <>
      <Head>
        <title>ChatOCR</title>
        <meta
          name="description"
          content="Recognize text from image and ask ChatGPT"
        />
      </Head>

      <Alert
        message="自2023年3月3日起，中国大陆封锁了 OpenAI 相关服务的访问，故本网站在大陆地区可能无法正常使用。"
        type="warning"
        closable
        onClose={onClose}
      />
      <Interface />
      <Footer />
    </>
  );
}

export default Main;
