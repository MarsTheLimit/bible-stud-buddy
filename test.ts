import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "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",
});

const response = openai.responses.create({
  model: "gpt-5-nano",
  input: "write a haiku about ai",
  store: true,
});

response.then((result) => console.log(result.output_text));