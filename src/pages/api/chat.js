const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  const { messages } = req.body;

  const response = await openai.ChatCompletion.create({
    model: "gpt-3.5-turbo",
    messages: messages,
  });

  const reply = response.choices[0].message.content;

  res.status(200).json({ reply });
}
