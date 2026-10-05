
const OpenAI = require('openai')
require('dotenv').config()


// 1. 初始化客户端，指向阿里云百炼的兼容地址
const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
});

// 2. 定义核心分析函数
const analyzeInspiration = async (title, content, isOriginal) => {
  const systemPrompt = `你是一个专业的灵感估值和内容评价助手。请根据用户提供的灵感信息，给出估值和评价。
  请严格按照以下 JSON 格式输出，不要包含任何额外的解释文字：
  {
    "suggested_price": <一个合理的建议价格，数字，单位元>,
    "originality_score": <原创性评分，0-100的整数>,
    "review": "<一段50字左右的客观评价，概括核心价值和亮点>"
  }`;

  const userPrompt = `灵感标题：${title}
灵感内容：${content}
是否原创：${isOriginal ? '是' : '否'}`;

  try {
    const response = await client.chat.completions.create({
      model: 'qwen-plus', // 使用通义千问 Plus 模型，性价比高
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' }, // 强制 JSON 输出
      temperature: 0.3 // 降低随机性，让估价更稳定
    });

    // 3. 解析返回的 JSON 字符串
    const result = JSON.parse(response.choices[0].message.content);
    return result; // 例如：{ suggested_price: 29.9, originality_score: 85, review: "..." }
  } catch (error) {
    console.error('AI 分析失败：', error);
    // 如果 AI 失败，返回默认值或抛出错误
    return { suggested_price: 0, originality_score: 0, review: 'AI 分析暂不可用' };
  }
};
module.exports = { analyzeInspiration } 