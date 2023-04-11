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
        message="由于OpenAI提供的免费API额度已用完，本站从今日起将不限期暂停服务"
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
